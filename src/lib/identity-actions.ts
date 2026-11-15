"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionProfile, requireAdmin } from "@/lib/auth";
import { readIdentityImage } from "@/lib/identity-storage";
import { rateLimit } from "@/lib/auth-limits";
export type IdentityResult = { error: string } | null;
export async function submitIdentity(
  _: IdentityResult,
  fd: FormData,
): Promise<IdentityResult> {
  const me = await getSessionProfile();
  if (!me) redirect("/login");
  if (!me.profileComplete) return { error: "Complete your profile before submitting identity documents." };
  if (!me.emailVerifiedAt && !me.phoneVerifiedAt)
    return { error: "Verify your email or phone first." };
  try {
    await rateLimit("identity", me.id, 5, 60 * 60 * 1000);
    const value = (name: string) => String(fd.get(name) ?? "").trim();
    const name = value("legalName"),
      address = value("address"),
      city = value("city"),
      subCity = value("subCity"),
      woreda = value("woreda");
    if (
      name.length < 2 ||
      name.length > 100 ||
      address.length < 5 ||
      address.length > 300 ||
      !city ||
      city.length > 100 ||
      !subCity ||
      subCity.length > 100 ||
      !woreda ||
      woreda.length > 50
    )
      return {
        error: "Enter your legal name and complete residential address.",
      };
    const idType = value("idType");
    if (!["FAYDA_FIN", "FAYDA_FAN", "GOVERNMENT_ID"].includes(idType))
      return { error: "Select an identity document type." };
    const idNumber = value("idNumber").replace(/\s/g, "");
    if (
      (idType === "FAYDA_FIN" && !/^\d{12}$/.test(idNumber)) ||
      (idType === "FAYDA_FAN" && !/^\d{16}$/.test(idNumber)) ||
      (idType === "GOVERNMENT_ID" && !/^[A-Za-z0-9-]{4,40}$/.test(idNumber))
    )
      return {
        error:
          "Enter a 12-digit Fayda FIN, 16-digit FAN, or valid government ID number.",
      };
    if (fd.get("consent") !== "on")
      return { error: "Consent is required for identity review." };
    const id = await readIdentityImage(fd.get("document"));
    const portrait = await readIdentityImage(fd.get("portrait"));
    await prisma.$transaction(async (tx) => {
      const changed = await tx.profile.updateMany({
        where: {
          id: me.id,
          identityStatus: { in: ["NOT_SUBMITTED", "REJECTED"] },
        },
        data: {
          name,
          address,
          city,
          subCity,
          woreda,
          idType,
          idLastFour: idNumber.slice(-4),
          identityStatus: "PENDING",
          verified: false,
          identitySubmittedAt: new Date(),
          identityReviewedAt: null,
          identityReviewNote: null,
        },
      });
      if (changed.count !== 1)
        throw new Error(
          "Your identity submission is already under review or approved.",
        );
      for (const [kind, file] of [
        ["ID", id],
        ["PORTRAIT", portrait],
      ] as const)
        await tx.identityDocument.upsert({
          where: { profileId_kind: { profileId: me.id, kind } },
          create: { profileId: me.id, kind, ...file },
          update: { ...file, createdAt: new Date() },
        });
    });
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not submit identity. Try again.",
    };
  }
  revalidatePath("/verification");
  revalidatePath("/admin");
  redirect("/verification");
}
export async function reviewIdentity(fd: FormData) {
  const admin = await requireAdmin();
  const profileId = String(fd.get("profileId") ?? "");
  const decision = String(fd.get("decision") ?? "");
  const note = String(fd.get("note") ?? "").trim();
  if (
    !["APPROVED", "REJECTED"].includes(decision) ||
    note.length < 5 ||
    note.length > 500
  )
    throw new Error("Provide a review note of 5–500 characters.");
  if (profileId === admin.id)
    throw new Error("You cannot review your own identity.");
  await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUnique({
      where: { id: profileId },
      include: { documents: { select: { kind: true } } },
    });
    if (
      !profile ||
      !profile.profileComplete ||
      profile.identityStatus !== "PENDING" ||
      profile.documents.length !== 2 ||
      (!profile.emailVerifiedAt && !profile.phoneVerifiedAt)
    )
      throw new Error("This submission is not ready for review.");
    const changed = await tx.profile.updateMany({
      where: { id: profileId, identityStatus: "PENDING" },
      data: {
        identityStatus: decision,
        verified: decision === "APPROVED",
        identityReviewedAt: new Date(),
        identityReviewNote: note,
      },
    });
    if (changed.count !== 1)
      throw new Error(
        "Another reviewer has already processed this submission.",
      );
    await tx.adminAudit.create({
      data: { actorId: admin.id, profileId, decision, note },
    });
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/users/${profileId}`);
  revalidatePath("/verification");
}

export async function reviewIdentityForm(
  _: IdentityResult,
  fd: FormData,
): Promise<IdentityResult> {
  await requireAdmin();
  try {
    await reviewIdentity(fd);
    return null;
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not save the review.",
    };
  }
}
