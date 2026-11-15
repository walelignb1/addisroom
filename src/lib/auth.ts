import { redirect, notFound } from "next/navigation";
import { readSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export { SESSION_COOKIE } from "@/lib/session";

const profileSelect = {
  isAdmin: true,
  isSuperAdmin: true,
  suspendedAt: true,
  identityStatus: true,
  emailVerifiedAt: true,
  phoneVerifiedAt: true,
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  age: true,
  gender: true,
  photoUrl: true,
  bio: true,
  livesInProperty: true,
  smokingOk: true,
  petsOk: true,
  profileComplete: true,
  verified: true,
} as const;

export async function getSessionProfileId(): Promise<string | null> {
  return (await readSession())?.profileId ?? null;
}
export async function getSessionProfile() {
  const id = await getSessionProfileId();
  if (!id) return null;
  return prisma.profile.findUnique({ where: { id }, select: profileSelect });
}
export async function requireApprovedProfile() {
  const me = await getSessionProfile();
  if (!me) redirect("/login");
  if (!me.emailVerifiedAt && !me.phoneVerifiedAt) redirect("/signup");
  if (!me.profileComplete) redirect("/onboarding");
  if (me.identityStatus !== "APPROVED") redirect("/verification");
  return me;
}
export async function requireAdmin() {
  const me = await getSessionProfile();
  if (!me) redirect("/login?next=/admin");
  if (!me.isAdmin || (!me.emailVerifiedAt && !me.phoneVerifiedAt)) notFound();
  return me;
}

export function parseContact(raw: string): { email?: string; phone?: string } {
  const v = raw.trim();
  if (v.includes("@")) return { email: v.toLowerCase() };
  return { phone: v.replace(/\s+/g, "") };
}
