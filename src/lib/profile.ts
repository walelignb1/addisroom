import { Gender, Role } from "@prisma/client";

export const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
] as const;

export type ProfileFields = {
  age: number | null;
  gender: Gender | null;
  photoUrl: string | null;
  role: Role;
  livesInProperty: boolean | null;
  profileComplete: boolean;
};

export function isProfileComplete(p: ProfileFields): boolean {
  if (p.profileComplete) return true;
  if (!p.age || p.age < 18 || p.age > 100) return false;
  if (!p.gender) return false;
  if (!p.photoUrl?.trim()) return false;
  if (p.role === Role.LANDLORD || p.role === Role.AGENT) {
    if (p.livesInProperty === null || p.livesInProperty === undefined) {
      return false;
    }
  }
  return true;
}

export function genderLabel(gender: Gender | null): string {
  return GENDERS.find((g) => g.value === gender)?.label ?? "—";
}
