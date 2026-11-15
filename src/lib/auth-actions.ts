"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSession, readSession, clearSession } from "@/lib/session";
import { deliverCode } from "@/lib/auth-delivery";
import { rateLimit } from "@/lib/auth-limits";
import { OtpChannel, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  generateOtpCode,
  hashOtpCode,
  MAX_ATTEMPTS,
  otpExpiresAt,
  parseLoginTarget,
} from "@/lib/otp";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";
import { isProfileComplete } from "@/lib/profile";
import { requireApprovedProfile, getSessionProfileId } from "@/lib/auth";

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
  { ok: true; mode: "password" | "signup" } | { ok: false; error: string };

const setSession = createSession;

async function findProfileByContact(contact: string) {
  const channel = contact.includes("@") ? OtpChannel.EMAIL : OtpChannel.SMS;
  const { target } = parseLoginTarget(channel, contact);
  return channel === OtpChannel.EMAIL
    ? prisma.profile.findUnique({ where: { email: target } })
    : prisma.profile.findUnique({ where: { phone: target } });
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

    if (!contact || !password || password.length > 128) {
      return { ok: false, error: "Email/phone and password are required" };
    }

    const { target: loginTarget } = parseLoginTarget(
      contact.includes("@") ? OtpChannel.EMAIL : OtpChannel.SMS,
      contact,
    );
    await rateLimit("login", loginTarget, 10, 15 * 60 * 1000);
    const profile = await findProfileByContact(contact);
    if (
      !profile?.passwordHash ||
      profile.suspendedAt !== null ||
      !verifyPassword(password, profile.passwordHash)
    ) {
      // Same message either way so a failed attempt can't be used to
      // discover whether an email/phone has an account.
      return { ok: false, error: "Invalid email/phone or password" };
    }

    if (!profile.emailVerifiedAt && !profile.phoneVerifiedAt)
      return {
        ok: false,
        error:
          "Verify your email or phone through registration before signing in.",
      };
    await setSession(profile.id);
    if (profile.isAdmin) redirect("/admin");
    if (profile.identityStatus !== "APPROVED" && profile.profileComplete)
      redirect("/verification");
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
    const name = String(fd.get("name") ?? "").trim();
    const channelRaw = String(fd.get("channel") ?? "EMAIL").toUpperCase();
    const channel = channelRaw === "SMS" ? OtpChannel.SMS : OtpChannel.EMAIL;
    const contact = String(fd.get("contact") ?? "").trim();
    if (!contact) return { ok: false, error: "Contact is required" };

    const { target } = parseLoginTarget(channel, contact);
    if (name.length < 2 || name.length > 100)
      return { ok: false, error: "Enter your full name (2–100 characters)." };
    const ip =
      process.env.TRUST_PROXY === "true"
        ? ((await headers()).get("x-forwarded-for")?.split(",")[0] ?? "local")
        : "local";
    await rateLimit("otp-ip", ip, 20, 60 * 60 * 1000);
    await rateLimit("otp-target", target, 5, 15 * 60 * 1000);
    const recent = await prisma.otpChallenge.findFirst({
      where: { target, createdAt: { gt: new Date(Date.now() - 60000) } },
    });
    if (recent)
      return {
        ok: false,
        error: "Wait 60 seconds before requesting another code.",
      };
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

    try {
      const delivery = await deliverCode(channel, target, code);
      await prisma.otpChallenge.deleteMany({
        where: { target, id: { not: challenge.id } },
      });
      return { ok: true, challengeId: challenge.id, ...delivery };
    } catch (error) {
      await prisma.otpChallenge.deleteMany({ where: { id: challenge.id } });
      throw error;
    }
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

    if (!challengeId || !/^\d{6}$/.test(code)) {
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

    const verifiedContact =
      challenge.channel === OtpChannel.EMAIL
        ? { emailVerifiedAt: new Date() }
        : { phoneVerifiedAt: new Date() };
    // Consume the code atomically: parallel requests cannot reuse a successful OTP.
    profile = await prisma.$transaction(async (tx) => {
      const consumed = await tx.otpChallenge.deleteMany({
        where: {
          id: challengeId,
          codeHash: hashOtpCode(code),
          attempts: { lt: MAX_ATTEMPTS },
          expiresAt: { gt: new Date() },
        },
      });
      if (consumed.count !== 1)
        throw new Error("Code already used or expired.");
      if (profile?.suspendedAt) throw new Error("This account is suspended.");
      if (profile)
        return tx.profile.update({
          where: { id: profile.id },
          data: verifiedContact,
        });
      return tx.profile.create({
        data: {
          name: challenge.name,
          phone: phone ?? null,
          email: email ?? null,
          role: Role.TENANT,
          ...verifiedContact,
        },
      });
    });

    if (!profile.passwordHash) {
      await createSession(profile.id, true);
      return { ok: true, needsPassword: true, profileId: profile.id };
    }

    await setSession(profile.id);
    if (profile.isAdmin) redirect("/admin");
    if (profile.identityStatus !== "APPROVED" && profile.profileComplete)
      redirect("/verification");
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
    const setup = await readSession(true);
    const profileId = setup?.profileId;
    const password = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirmPassword") ?? "");
    const next = String(fd.get("next") ?? "").trim();

    if (!profileId)
      return { ok: false, error: "Session expired. Start again." };
    if (password !== confirm) {
      return { ok: false, error: "Passwords do not match" };
    }

    const validationError = validatePassword(password);
    if (validationError) return { ok: false, error: validationError };

    const changed = await prisma.profile.updateMany({
      where: { id: profileId, passwordHash: null },
      data: { passwordHash: hashPassword(password) },
    });
    if (changed.count !== 1)
      return { ok: false, error: "Password already set. Please sign in." };
    await clearSession(true);

    await setSession(profileId);
    const onboardingNext =
      next.startsWith("/") && !next.startsWith("//") ? next : "/";
    const qs =
      onboardingNext !== "/"
        ? `?next=${encodeURIComponent(onboardingNext)}`
        : "";
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
  await clearSession();
  await clearSession(true);
  redirect("/login");
}

export async function toggleSaveListing(listingId: string) {
  const { id: profileId } = await requireApprovedProfile();

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
  if (!profileId || profileId !== (await getSessionProfileId()))
    return new Set();
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
