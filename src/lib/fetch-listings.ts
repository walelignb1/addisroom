import { BedroomCount, PropertyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getNeighborhoodCoords,
  listingCoords,
  haversineKm,
} from "@/lib/geo";

/** Shape required by homepage listing cards */
export type HomeListing = {
  id: string;
  title: string;
  description: string;
  neighborhood: string;
  roadName: string | null;
  roomType: string;
  propertyType: string;
  bedrooms: string;
  furnished: boolean;
  priceBirr: number;
  availableFrom: Date;
  latitude: number | null;
  longitude: number | null;
  images: { url: string; sortOrder: number }[];
  postedBy: {
    id: string;
    name: string;
    role: string;
    verified: boolean;
    profileComplete: boolean;
    photoUrl: string | null;
  };
};

export type ListingSearchFilters = {
  q?: string;
  neighborhood?: string;
  radiusKm?: number | null;
  bedrooms?: BedroomCount | null;
  propertyType?: PropertyType | null;
};

export const FALLBACK_LISTINGS: HomeListing[] = [];

function normalizeListing(raw: {
  id: string;
  title: string;
  description: string;
  neighborhood: string;
  roadName?: string | null;
  roomType: string;
  propertyType?: string;
  bedrooms?: string;
  furnished: boolean;
  priceBirr: number;
  availableFrom?: Date;
  latitude?: number | null;
  longitude?: number | null;
  images?: { url: string; sortOrder: number }[];
  postedBy: {
    id: string;
    name: string;
    role: string;
    verified?: boolean;
    profileComplete?: boolean;
    photoUrl?: string | null;
  };
}): HomeListing {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    neighborhood: raw.neighborhood,
    roadName: raw.roadName ?? null,
    roomType: raw.roomType,
    propertyType: raw.propertyType ?? "APARTMENT",
    bedrooms: raw.bedrooms ?? "ONE",
    furnished: raw.furnished,
    priceBirr: raw.priceBirr,
    availableFrom: raw.availableFrom ?? new Date(),
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    images: raw.images ?? [],
    postedBy: {
      id: raw.postedBy.id,
      name: raw.postedBy.name,
      role: raw.postedBy.role,
      verified: Boolean(raw.postedBy.verified),
      profileComplete: Boolean(raw.postedBy.profileComplete),
      photoUrl: raw.postedBy.photoUrl ?? null,
    },
  };
}

function applyClientFilters(
  listings: HomeListing[],
  filters: ListingSearchFilters,
): HomeListing[] {
  let result = [...listings];
  const q = filters.q?.trim();
  const neighborhood = filters.neighborhood?.trim();

  if (q) {
    const lower = q.toLowerCase();
    result = result.filter(
      (l) =>
        l.title.toLowerCase().includes(lower) ||
        l.description.toLowerCase().includes(lower) ||
        (l.roadName?.toLowerCase().includes(lower) ?? false),
    );
  }

  if (neighborhood && !filters.radiusKm) {
    result = result.filter((l) => l.neighborhood === neighborhood);
  }

  if (filters.bedrooms) {
    result = result.filter((l) => l.bedrooms === filters.bedrooms);
  }

  if (filters.propertyType) {
    result = result.filter((l) => l.propertyType === filters.propertyType);
  }

  if (filters.radiusKm && neighborhood) {
    const center = getNeighborhoodCoords(neighborhood);
    if (center) {
      result = result.filter((l) => {
        const coords = listingCoords(l);
        if (!coords) return false;
        return haversineKm(center, coords) <= filters.radiusKm!;
      });
    }
  }

  return result.slice(0, 30);
}

export async function fetchHomeListings(
  filters: ListingSearchFilters,
): Promise<{ listings: HomeListing[]; usedFallback: boolean }> {
  const q = filters.q?.trim();
  const neighborhood = filters.neighborhood?.trim();
  const radiusKm = filters.radiusKm ?? null;

  const where = {
    published: true,
    ...(neighborhood && !radiusKm ? { neighborhood } : {}),
    ...(filters.bedrooms ? { bedrooms: filters.bedrooms } : {}),
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { roadName: { contains: q } },
          ],
        }
      : {}),
  };

  const postedBySelect = {
    id: true,
    name: true,
    role: true,
    verified: true,
    profileComplete: true,
    photoUrl: true,
  };

  try {
    const rows = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        postedBy: { select: postedBySelect },
        images: { orderBy: { sortOrder: "asc" } },
      },
    });

    let listings = rows.map((r) => normalizeListing(r));

    if (radiusKm && neighborhood) {
      const center = getNeighborhoodCoords(neighborhood);
      if (center) {
        listings = listings.filter((l) => {
          const coords = listingCoords(l);
          if (!coords) return false;
          return haversineKm(center, coords) <= radiusKm;
        });
      }
    }

    return { listings: listings.slice(0, 30), usedFallback: false };
  } catch (fullError) {
    console.error("[AddisRoom] listing findMany (full) failed:", fullError);

    try {
      const rows = await prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 60,
        include: { postedBy: { select: postedBySelect } },
      });

      let listings = rows.map((r) => normalizeListing({ ...r, images: [] }));

      if (radiusKm && neighborhood) {
        const center = getNeighborhoodCoords(neighborhood);
        if (center) {
          listings = listings.filter((l) => {
            const coords = listingCoords(l);
            if (!coords) return false;
            return haversineKm(center, coords) <= radiusKm;
          });
        }
      }

      return { listings: listings.slice(0, 30), usedFallback: true };
    } catch (minimalError) {
      console.error("[AddisRoom] listing findMany (minimal) failed:", minimalError);
      const fallback = applyClientFilters(FALLBACK_LISTINGS, filters);
      return { listings: fallback, usedFallback: true };
    }
  }
}
