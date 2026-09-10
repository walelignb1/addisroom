import { Role } from "@prisma/client";

/** Flat one-time listing fee charged via Chapa before a listing can publish. */
export const LISTING_FEE_BIRR = 10;

export function isRenterRole(role: Role): boolean {
  return role === Role.TENANT;
}

/** Only landlords and agents (brokers) may post room listings. */
export function canPostListing(role: Role): boolean {
  return role === Role.LANDLORD || role === Role.AGENT;
}
