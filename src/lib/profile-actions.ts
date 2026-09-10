"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Gender, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionProfileId } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";

export type CompleteProfileResult = { ok: true } | { ok: false; error: string };

export async function completeProfile(
  _prev: CompleteProfileResult | null,
  fd: FormData,
): Promise<CompleteProfileResult> {
  try {
    const profileId = await getSessionProfileId();
    if (!profileId) redirect("/login");

    const role = String(fd.get("role") ?? "").trim() as Role;
    if (!["LANDLORD", "TENANT", "AGENT"].includes(role)) {
      return { ok: false, error: "Select whether you are a landlord or renter" };
    }

    const age = Number(String(fd.get("age") ?? "").trim());
    if (!Number.isInteger(age) || age < 18 || age > 100) {
      return { ok: false, error: "Enter a valid age (18–100)" };
    }

    const genderRaw = String(fd.get("gender") ?? "").trim();
    if (!["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"].includes(genderRaw)) {
      return { ok: false, error: "Select your gender" };
    }
    const gender = genderRaw as Gender;

    const photoUrl = String(fd.get("photoUrl") ?? "").trim();
    if (!photoUrl.startsWith("http")) {
      return { ok: false, error: "Enter a valid profile photo URL (https://…)" };
    }

    const bio = String(fd.get("bio") ?? "").trim() || null;
    const smokingOk =
      fd.get("smokingOk") === "on" ? true : fd.get("smokingOk") === "off" ? false : null;
    const petsOk =
      fd.get("petsOk") === "on" ? true : fd.get("petsOk") === "off" ? false : null;

    let livesInProperty: boolean | null = null;
    if (role === Role.LANDLORD || role === Role.AGENT) {
      const livesRaw = String(fd.get("livesInProperty") ?? "").trim();
      if (livesRaw !== "yes" && livesRaw !== "no") {
        return {
          ok: false,
          error: "Please say whether you live in the property",
        };
      }
      livesInProperty = livesRaw === "yes";
    }

    const verifiedBroker =
      role === Role.AGENT && fd.get("verifiedBroker") === "on";

    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: {
        role,
        age,
        gender,
        photoUrl,
        bio,
        livesInProperty,
        smokingOk,
        petsOk,
        verified: role === Role.AGENT ? verifiedBroker : false,
        profileComplete: true,
      },
      select: {
        age: true,
        gender: true,
        photoUrl: true,
        role: true,
        livesInProperty: true,
        profileComplete: true,
      },
    });

    if (!isProfileComplete(updated)) {
      return { ok: false, error: "Profile is incomplete. Check all required fields." };
    }

    revalidatePath("/");
    revalidatePath(`/profiles/${profileId}`);

    const next = String(fd.get("next") ?? "").trim();
    redirect(
      next.startsWith("/") && !next.startsWith("//") ? next : "/",
    );
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("[AddisRoom] completeProfile failed:", e);
    return { ok: false, error: "Could not save profile. Try again." };
  }
}

export type SwitchToLandlordResult = { ok: true } | { ok: false; error: string };

/** Upgrades the current profile to LANDLORD so it can post room listings. */
export async function switchToLandlord(
  _prev: SwitchToLandlordResult | null,
  fd: FormData,
): Promise<SwitchToLandlordResult> {
  try {
    const profileId = await getSessionProfileId();
    if (!profileId) redirect("/login");

    const livesRaw = String(fd.get("livesInProperty") ?? "").trim();
    if (livesRaw !== "yes" && livesRaw !== "no") {
      return { ok: false, error: "Please say whether you live in the property" };
    }

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        role: Role.LANDLORD,
        livesInProperty: livesRaw === "yes",
        profileComplete: true,
      },
    });

    revalidatePath("/");
    revalidatePath(`/profiles/${profileId}`);

    const next = String(fd.get("next") ?? "").trim();
    redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/listings/new");
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("[AddisRoom] switchToLandlord failed:", e);
    return { ok: false, error: "Could not switch to landlord. Try again." };
  }
}
