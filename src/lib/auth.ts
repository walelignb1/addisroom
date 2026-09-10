import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "addis_profile_id";

const profileSelect = {
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
  try {
    const store = await cookies();
    return store.get(SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export async function getSessionProfile() {
  const id = await getSessionProfileId();
  if (!id) return null;
  try {
    return await prisma.profile.findUnique({
      where: { id },
      select: profileSelect,
    });
  } catch {
    return null;
  }
}

export function parseContact(raw: string): { email?: string; phone?: string } {
  const v = raw.trim();
  if (v.includes("@")) return { email: v.toLowerCase() };
  return { phone: v.replace(/\s+/g, "") };
}
