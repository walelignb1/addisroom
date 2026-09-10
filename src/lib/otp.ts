import { createHash, randomInt } from "crypto";
import { OtpChannel } from "@prisma/client";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("251")) return `+${digits}`;
  if (digits.startsWith("0")) return `+251${digits.slice(1)}`;
  if (digits.length === 9) return `+251${digits}`;
  return `+${digits}`;
}

export function parseLoginTarget(
  channel: OtpChannel,
  raw: string,
): { target: string; email?: string; phone?: string } {
  const value = raw.trim();
  if (channel === OtpChannel.EMAIL) {
    const email = normalizeEmail(value);
    if (!email.includes("@") || !email.includes(".")) {
      throw new Error("Enter a valid email address");
    }
    return { target: email, email };
  }

  const phone = normalizePhone(value);
  if (phone.length < 12) throw new Error("Enter a valid Ethiopian phone number");
  return { target: phone, phone };
}

export { MAX_ATTEMPTS };
