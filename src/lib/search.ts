import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PROPERTY_TYPES } from "@/lib/addis";
import { getNeighborhoodCoords, haversineKm, listingCoords } from "@/lib/geo";
import { getListingImageUrls, isVerifiedBroker } from "@/lib/listings";
import {
  PAGE_SIZE,
  type ResultItem,
  type SearchFilters,
} from "@/lib/search-shared";

const ROOMS_SHORT: Record<string, string> = {
  ONE: "1 bedroom",
  TWO: "2 bedrooms",
  THREE_PLUS: "3+ bedrooms",
};

export async function searchListings(f: SearchFilters): Promise<{
  items: ResultItem[];
  total: number;
  pages: number;
  page: number;
}> {
  const useRadius = Boolean(f.neighborhood && f.radiusKm);
  const price: Prisma.IntFilter = {};
  if (f.priceMin) price.gte = f.priceMin;
  if (f.priceMax) price.lte = f.priceMax;
  const area: Prisma.IntNullableFilter = {};
  if (f.areaMin) area.gte = f.areaMin;
  if (f.areaMax) area.lte = f.areaMax;

  const where: Prisma.ListingWhereInput = {
    published: true,
    archivedAt: null,
    postedBy: { suspendedAt: null },
    dealType: f.deal,
    ...(f.propertyType ? { propertyType: f.propertyType } : {}),
    ...(f.neighborhood && !useRadius ? { neighborhood: f.neighborhood } : {}),
    ...(f.priceMin || f.priceMax ? { priceBirr: price } : {}),
    ...(f.areaMin || f.areaMax ? { areaSqm: area } : {}),
    ...(f.rooms.length ? { bedrooms: { in: f.rooms } } : {}),
    ...(f.furnished ? { furnished: true } : {}),
    ...(f.q
      ? {
          OR: [
            { title: { contains: f.q } },
            { description: { contains: f.q } },
            { roadName: { contains: f.q } },
            { neighborhood: { contains: f.q } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    f.sort === "price_asc"
      ? { priceBirr: "asc" }
      : f.sort === "price_desc"
        ? { priceBirr: "desc" }
        : f.sort === "area_desc"
          ? { areaSqm: { sort: "desc", nulls: "last" } }
          : { createdAt: "desc" };

  // Distance is checked in code, so fetch the matching set first and page afterwards.
  let rows = await prisma.listing.findMany({
    where,
    orderBy,
    include: {
      postedBy: {
        select: {
          id: true,
          name: true,
          role: true,
          verified: true,
          brokerVerified: true,
          photoUrl: true,
        },
      },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (useRadius) {
    const center = getNeighborhoodCoords(f.neighborhood);
    if (center) {
      rows = rows.filter((l) => {
        const c = listingCoords(l);
        return c ? haversineKm(center, c) <= f.radiusKm! : false;
      });
    }
  }

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(f.page, pages);
  // The map shows every match; the list shows one page.
  const visible =
    f.view === "map"
      ? rows
      : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const weekAgo = Date.now() - 7 * 86400000;

  const items = visible.map((l): ResultItem => {
    const coords = listingCoords(l);
    return {
      id: l.id,
      title: l.title,
      description: l.description,
      deal: l.dealType,
      priceBirr: l.priceBirr,
      depositBirr: l.depositBirr,
      pricePerSqm: l.areaSqm ? Math.round(l.priceBirr / l.areaSqm) : null,
      neighborhood: l.neighborhood,
      roadName: l.roadName,
      propertyType: l.propertyType,
      propertyLabel:
        PROPERTY_TYPES.find((p) => p.value === l.propertyType)?.label ??
        l.propertyType,
      roomsLabel:
        l.propertyType === "SHOP" ? null : (ROOMS_SHORT[l.bedrooms] ?? null),
      areaSqm: l.areaSqm,
      floor: l.floor,
      furnished: l.furnished,
      images: getListingImageUrls(l),
      sellerName: l.postedBy.name,
      sellerRole: l.postedBy.role,
      sellerPhoto: l.postedBy.photoUrl,
      verified: isVerifiedBroker(l.postedBy),
      brokerVerified: l.postedBy.role === "AGENT" && l.postedBy.brokerVerified,
      isNew: l.createdAt.getTime() > weekAgo,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    };
  });

  return { items, total, pages, page };
}
