import { pickSampleImages } from "@/lib/sample-images";

type ImageRow = { url: string; sortOrder: number };

export function getListingImageUrls(
  listing: { id: string; images?: ImageRow[] },
  fallbackCount = 3,
): string[] {
  const fromDb = (listing.images ?? [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => i.url);
  if (fromDb.length > 0) return fromDb;
  return pickSampleImages(listing.id, fallbackCount);
}

export function isVerifiedBroker(profile: {
  role: string;
  verified: boolean;
}) {
  return profile.role === "AGENT" && profile.verified;
}
