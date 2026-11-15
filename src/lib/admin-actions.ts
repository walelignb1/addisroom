"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export type AdminResult = { error?: string; success?: string } | null;
function refresh() {
  for (const path of [
    "/admin",
    "/admin/users",
    "/admin/agents",
    "/admin/sponsorships",
    "/admin/listings",
    "/",
    "/search",
  ])
    revalidatePath(path, "layout");
}
function httpsUrl(raw: FormDataEntryValue | null) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Use an HTTPS URL without credentials.");
  return url.href;
}
export async function manageUser(
  _: AdminResult,
  fd: FormData,
): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = String(fd.get("id") ?? "");
    const command = String(fd.get("command") ?? "");
    await prisma.$transaction(async (tx) => {
      const target = await tx.profile.findUniqueOrThrow({ where: { id } });
      if (id === admin.id)
        throw new Error("You cannot change your own access here.");
      if (command === "suspend" || command === "restore") {
        if (target.isAdmin || target.isSuperAdmin)
          throw new Error("Administrator accounts cannot be suspended.");
        await tx.profile.update({
          where: { id },
          data: { suspendedAt: command === "suspend" ? new Date() : null },
        });
        if (command === "suspend")
          await tx.session.deleteMany({ where: { profileId: id } });
      } else if (command === "grant-admin" || command === "revoke-admin") {
        if (!admin.isSuperAdmin)
          throw new Error(
            "Only the super admin can change administrator access.",
          );
        if (target.isSuperAdmin)
          throw new Error(
            "Super admin access is managed by the server operator.",
          );
        if (
          target.suspendedAt ||
          (!target.emailVerifiedAt && !target.phoneVerifiedAt)
        )
          throw new Error(
            "The account must be active with a verified contact.",
          );
        await tx.profile.update({
          where: { id },
          data: { isAdmin: command === "grant-admin" },
        });
        await tx.session.deleteMany({ where: { profileId: id } });
      } else throw new Error("Unknown account action.");
      await tx.adminAudit.create({
        data: {
          actorId: admin.id,
          profileId: id,
          decision: command.toUpperCase().replaceAll("-", "_"),
          note: `Account action: ${command}`,
        },
      });
    });
    refresh();
    return { success: "Account updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update account.",
    };
  }
}
export async function verifyBroker(
  _: AdminResult,
  fd: FormData,
): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = String(fd.get("id") ?? "");
    const approve = fd.get("approve") === "true";
    if (id === admin.id)
      throw new Error("You cannot verify your own broker account.");
    await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUniqueOrThrow({ where: { id } });
      if (profile.role !== "AGENT")
        throw new Error("This account is not an agent.");
      if (
        approve &&
        (profile.identityStatus !== "APPROVED" || profile.suspendedAt)
      )
        throw new Error(
          "Approve identity and restore the account before verifying the agent.",
        );
      await tx.profile.update({
        where: { id },
        data: { brokerVerified: approve },
      });
      await tx.adminAudit.create({
        data: {
          actorId: admin.id,
          profileId: id,
          decision: approve ? "BROKER_APPROVED" : "BROKER_REVOKED",
          note: approve
            ? "Agent badge approved by staff following identity review."
            : "Agent badge revoked by staff.",
        },
      });
    });
    refresh();
    return { success: approve ? "Agent verified." : "Agent badge revoked." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not update agent.",
    };
  }
}
export async function manageSponsorship(
  _: AdminResult,
  fd: FormData,
): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const command = String(fd.get("command") ?? "create");
    const id = String(fd.get("id") ?? "");
    await prisma.$transaction(async (tx) => {
      if (command === "create") {
        const headline = String(fd.get("headline") ?? "").trim();
        const body = String(fd.get("body") ?? "").trim();
        if (
          headline.length < 3 ||
          headline.length > 120 ||
          !body ||
          body.length > 500
        )
          throw new Error(
            "Enter a headline (3–120 characters) and body (1–500 characters).",
          );
        const imageUrl = httpsUrl(fd.get("imageUrl"));
        const linkUrl = httpsUrl(fd.get("linkUrl"));
        await tx.sponsorship.updateMany({
          where: { activeSlot: 1 },
          data: { activeSlot: null },
        });
        const sponsor = await tx.sponsorship.create({
          data: { headline, body, imageUrl, linkUrl, activeSlot: 1 },
        });
        await tx.adminAudit.create({
          data: {
            actorId: admin.id,
            profileId: sponsor.id,
            decision: "SPONSOR_CREATED",
            note: headline,
          },
        });
      } else {
        const sponsor = await tx.sponsorship.findUniqueOrThrow({
          where: { id },
        });
        if (command === "activate") {
          await tx.sponsorship.updateMany({
            where: { activeSlot: 1 },
            data: { activeSlot: null },
          });
          await tx.sponsorship.update({
            where: { id },
            data: { activeSlot: 1 },
          });
        } else if (command === "deactivate")
          await tx.sponsorship.update({
            where: { id },
            data: { activeSlot: null },
          });
        else if (command === "delete")
          await tx.sponsorship.delete({ where: { id } });
        else throw new Error("Unknown sponsorship action.");
        await tx.adminAudit.create({
          data: {
            actorId: admin.id,
            profileId: id,
            decision: `SPONSOR_${command.toUpperCase()}`,
            note: sponsor.headline,
          },
        });
      }
    });
    refresh();
    return { success: "Sponsorship updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not update sponsorship.",
    };
  }
}
export async function moderateListing(
  _: AdminResult,
  fd: FormData,
): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = String(fd.get("id") ?? "");
    const command = String(fd.get("command") ?? "");
    if (!["archive", "restore"].includes(command))
      throw new Error("Unknown listing action.");
    const note = String(fd.get("note") ?? "").trim();
    if (note.length < 5 || note.length > 300)
      throw new Error("Provide a moderation reason (5–300 characters).");
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.update({
        where: { id },
        data: { archivedAt: command === "archive" ? new Date() : null },
      });
      await tx.adminAudit.create({
        data: {
          actorId: admin.id,
          profileId: listing.postedById,
          decision: `LISTING_${command.toUpperCase()}`,
          note: `${listing.id}: ${note}`,
        },
      });
    });
    refresh();
    revalidatePath(`/listings/${id}`);
    return {
      success:
        command === "archive"
          ? "Listing removed from public browsing."
          : "Listing restored to its previous publication state.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update listing.",
    };
  }
}
