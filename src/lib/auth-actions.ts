"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { OtpChannel, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  generateOtpCode,
  hashOtpCode,
  MAX_ATTEMPTS,
  normalizeEmail,
  normalizePhone,
  otpExpiresAt,
  parseLoginTarget,
} from "@/lib/otp";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";
import { isProfileComplete } from "@/lib/profile";
import { SESSION_COOKIE, getSessionProfileId } from "@/lib/auth";

function redirectAfterAuth(next: string, complete: boolean): never {
  if (!complete) {
    const path =
      next.startsWith("/") && !next.startsWith("//") && next !== "/"
        ? `/onboarding?next=${encodeURIComponent(next)}`
        : "/onboarding";
    redirect(path);
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

async function profileCompleteForId(profileId: string): Promise<boolean> {
  const p = await prisma.profile.findUnique({
    where: { id: profileId },
    select: {
      age: true,
      gender: true,
      photoUrl: true,
      role: true,
      livesInProperty: true,
      profileComplete: true,
    },
  });
  return p ? isProfileComplete(p) : false;
}

export type SendOtpResult =
  | { ok: true; challengeId: string; previewCode?: string }
  | { ok: false; error: string };

export type VerifyOtpResult =
  | { ok: true; needsPassword: boolean; profileId: string }
  | { ok: false; error: string };

export type SetPasswordResult = { ok: true } | { ok: false; error: string };

export type LoginPasswordResult = { ok: true } | { ok: false; error: string };

export type LookupAccountResult =
  | { ok: true; mode: "password" | "signup" }
  | { ok: false; error: string };

async function setSession(profileId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

async function findProfileByContact(contact: string) {
  const trimmed = contact.trim();
  if (trimmed.includes("@")) {
    return prisma.profile.findFirst({
      where: { email: normalizeEmail(trimmed) },
    });
  }
  const phone = normalizePhone(trimmed);
  return prisma.profile.findFirst({ where: { phone } });
}

/** Decide whether user signs in with password or starts OTP signup. */
export async function lookupAccount(
  _prev: LookupAccountResult | null,
  fd: FormData,
): Promise<LookupAccountResult> {
  try {
    const contact = String(fd.get("contact") ?? "").trim();
    if (!contact) return { ok: false, error: "Email or phone is required" };

    const profile = await findProfileByContact(contact);
    if (profile?.passwordHash) {
      return { ok: true, mode: "password" };
    }
    return { ok: true, mode: "signup" };
  } catch (e) {
    console.error("[AddisRoom] lookupAccount failed:", e);
    return { ok: false, error: "Could not look up account. Try again." };
  }
}

export async function loginWithPassword(
  _prev: LoginPasswordResult | null,
  fd: FormData,
): Promise<LoginPasswordResult> {
  try {
    const contact = String(fd.get("contact") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const next = String(fd.get("next") ?? "").trim();

    if (!contact || !password) {
      return { ok: false, error: "Email/phone and password are required" };
    }

    const profile = await findProfileByContact(contact);
    if (
      !profile?.passwordHash ||
      !verifyPassword(password, profile.passwordHash)
    ) {
      // Same message either way so a failed attempt can't be used to
      // discover whether an email/phone has an account.
      return { ok: false, error: "Invalid email/phone or password" };
    }

    await setSession(profile.id);
    const complete = await profileCompleteForId(profile.id);
    redirectAfterAuth(next, complete);
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("[AddisRoom] loginWithPassword failed:", e);
    return { ok: false, error: "Sign-in failed. Please try again." };
  }
}

export async function sendOtpCode(
  _prev: SendOtpResult | null,
  fd: FormData,
): Promise<SendOtpResult> {
  try {
    const name = String(fd.get("name") ?? "").trim() || "Guest";
    const channelRaw = String(fd.get("channel") ?? "EMAIL").toUpperCase();
    const channel =
      channelRaw === "SMS" ? OtpChannel.SMS : OtpChannel.EMAIL;
    const contact = String(fd.get("contact") ?? "").trim();
    if (!contact) return { ok: false, error: "Contact is required" };

    const { target } = parseLoginTarget(channel, contact);
    const code = generateOtpCode();

    await prisma.otpChallenge.deleteMany({
      where: { target, expiresAt: { lt: new Date() } },
    });

    const challenge = await prisma.otpChallenge.create({
      data: {
        channel,
        target,
        codeHash: hashOtpCode(code),
        name,
        expiresAt: otpExpiresAt(),
      },
    });

    console.info(
      `[AddisRoom OTP] ${channel} → ${target}: ${code} (expires in 10 min)`,
    );

    return {
      ok: true,
      challengeId: challenge.id,
      previewCode:
        process.env.NODE_ENV !== "production" ? code : undefined,
    };
  } catch (e) {
    console.error("[AddisRoom] sendOtpCode failed:", e);
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Could not send verification code. Try again.",
    };
  }
}

export async function verifyOtpAndLogin(
  _prev: VerifyOtpResult | null,
  fd: FormData,
): Promise<VerifyOtpResult> {
  try {
    const challengeId = String(fd.get("challengeId") ?? "").trim();
    const code = String(fd.get("code") ?? "").trim();

    if (!challengeId || !code) {
      return { ok: false, error: "Enter the 6-digit verification code" };
    }

    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return { ok: false, error: "Verification expired. Request a new code." };
    }

    if (challenge.expiresAt < new Date()) {
      await prisma.otpChallenge.delete({ where: { id: challengeId } });
      return { ok: false, error: "Code expired. Request a new one." };
    }

    if (challenge.attempts >= MAX_ATTEMPTS) {
      return { ok: false, error: "Too many attempts. Request a new code." };
    }

    if (hashOtpCode(code) !== challenge.codeHash) {
      await prisma.otpChallenge.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false, error: "Incorrect code. Try again." };
    }

    const email =
      challenge.channel === OtpChannel.EMAIL ? challenge.target : undefined;
    const phone =
      challenge.channel === OtpChannel.SMS ? challenge.target : undefined;

    let profile = email
      ? await prisma.profile.findFirst({ where: { email } })
      : phone
        ? await prisma.profile.findUnique({ where: { phone } })
        : null;

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          name: challenge.name,
          phone:
            phone ??
            `otp-${challenge.target.replace(/[^a-z0-9]/gi, "").slice(0, 20)}`,
          email: email ?? null,
          role: Role.TENANT,
          verified: true,
        },
      });
    } else {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: { name: challenge.name, verified: true },
      });
    }

    await prisma.otpChallenge.delete({ where: { id: challengeId } });

    if (!profile.passwordHash) {
      return { ok: true, needsPassword: true, profileId: profile.id };
    }

    await setSession(profile.id);
    const next = String(fd.get("next") ?? "").trim();
    const complete = await profileCompleteForId(profile.id);
    redirectAfterAuth(next, complete);
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("[AddisRoom] verifyOtpAndLogin failed:", e);
    return { ok: false, error: "Sign-in failed. Please try again." };
  }
}

export async function setPasswordAfterOtp(
  _prev: SetPasswordResult | null,
  fd: FormData,
): Promise<SetPasswordResult> {
  try {
    const profileId = String(fd.get("profileId") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirmPassword") ?? "");
    const next = String(fd.get("next") ?? "").trim();

    if (!profileId) return { ok: false, error: "Session expired. Start again." };
    if (password !== confirm) {
      return { ok: false, error: "Passwords do not match" };
    }

    const validationError = validatePassword(password);
    if (validationError) return { ok: false, error: validationError };

    await prisma.profile.update({
      where: { id: profileId },
      data: { passwordHash: hashPassword(password) },
    });

    await setSession(profileId);
    const onboardingNext =
      next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const qs = onboardingNext !== "/" ? `?next=${encodeURIComponent(onboardingNext)}` : "";
    redirect(`/onboarding${qs}`);
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }
    console.error("[AddisRoom] setPasswordAfterOtp failed:", e);
    return { ok: false, error: "Could not save password. Try again." };
  }
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function toggleSaveListing(listingId: string) {
  const profileId = await getSessionProfileId();
  if (!profileId) redirect("/login");

  const existing = await prisma.savedListing.findUnique({
    where: {
      profileId_listingId: { profileId, listingId },
    },
  });

  if (existing) {
    await prisma.savedListing.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedListing.create({
      data: { profileId, listingId },
    });
  }

  revalidatePath("/");
  revalidatePath("/saved");
}

export async function getSavedListingIds(
  profileId: string | null,
): Promise<Set<string>> {
  if (!profileId) return new Set();
  try {
    const rows = await prisma.savedListing.findMany({
      where: { profileId },
      select: { listingId: true },
    });
    return new Set(rows.map((r) => r.listingId));
  } catch {
    return new Set();
  }
}
