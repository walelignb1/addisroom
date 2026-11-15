// Pure search helpers: safe to import from client components (no database access).
import type { BedroomCount, DealType, PropertyType } from "@prisma/client";
import {
  ADDIS_NEIGHBORHOODS,
  BEDROOM_FILTERS,
  PROPERTY_TYPES,
} from "@/lib/addis";
import { parseRadiusKm } from "@/lib/geo";

export const PAGE_SIZE = 8;

export const SORT_OPTIONS = [
  "new",
  "price_asc",
  "price_desc",
  "area_desc",
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number];

export type SearchFilters = {
  deal: DealType;
  propertyType: PropertyType | null;
  neighborhood: string;
  radiusKm: number | null;
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  rooms: BedroomCount[];
  furnished: boolean;
  q: string;
  sort: SortKey;
  page: number;
  view: "list" | "map";
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

function all(v: string | string[] | undefined): string[] {
  if (v == null) return [];
  return (Array.isArray(v) ? v : [v]).map((s) => s.trim()).filter(Boolean);
}

function positiveInt(v: string | string[] | undefined): number | null {
  const n = Number(first(v).replace(/[\s,]/g, ""));
  return Number.isSafeInteger(n) && n > 0 && n <= 2147483647 ? n : null;
}

/** Turns the URL query into validated filters; anything unrecognized is ignored. */
export function parseSearchParams(sp: RawSearchParams): SearchFilters {
  const propertyType = first(sp.propertyType);
  const neighborhood = first(sp.neighborhood);
  const sort = first(sp.sort) as SortKey;
  const validRooms = BEDROOM_FILTERS.map((b) => b.value as string);

  return {
    deal: first(sp.deal).toUpperCase() === "SALE" ? "SALE" : "RENT",
    propertyType: PROPERTY_TYPES.some((p) => p.value === propertyType)
      ? (propertyType as PropertyType)
      : null,
    neighborhood: (ADDIS_NEIGHBORHOODS as readonly string[]).includes(
      neighborhood,
    )
      ? neighborhood
      : "",
    radiusKm: parseRadiusKm(first(sp.radius)),
    priceMin: positiveInt(sp.priceMin),
    priceMax: positiveInt(sp.priceMax),
    areaMin: positiveInt(sp.areaMin),
    areaMax: positiveInt(sp.areaMax),
    rooms:
      propertyType === "SHOP"
        ? []
        : ([
            ...new Set(all(sp.rooms).filter((r) => validRooms.includes(r))),
          ] as BedroomCount[]),
    furnished: first(sp.furnished) === "1",
    q: first(sp.q).slice(0, 200),
    sort: SORT_OPTIONS.includes(sort) ? sort : "new",
    page: positiveInt(sp.page) ?? 1,
    view: first(sp.view) === "map" ? "map" : "list",
  };
}

/** Builds a /search URL from filters, leaving out defaults so links stay short. */
export function buildSearchUrl(
  f: SearchFilters,
  overrides: Partial<SearchFilters> = {},
  lang = "en",
): string {
  const m = { ...f, ...overrides };
  const qs = new URLSearchParams();
  qs.set("deal", m.deal.toLowerCase());
  if (m.propertyType) qs.set("propertyType", m.propertyType);
  if (m.neighborhood) qs.set("neighborhood", m.neighborhood);
  if (m.neighborhood && m.radiusKm) qs.set("radius", String(m.radiusKm));
  if (m.priceMin) qs.set("priceMin", String(m.priceMin));
  if (m.priceMax) qs.set("priceMax", String(m.priceMax));
  if (m.areaMin) qs.set("areaMin", String(m.areaMin));
  if (m.areaMax) qs.set("areaMax", String(m.areaMax));
  for (const r of m.rooms) qs.append("rooms", r);
  if (m.furnished) qs.set("furnished", "1");
  if (m.q) qs.set("q", m.q);
  if (m.sort !== "new") qs.set("sort", m.sort);
  if (m.page > 1) qs.set("page", String(m.page));
  if (m.view === "map") qs.set("view", "map");
  if (lang !== "en") qs.set("lang", lang);
  return `/search?${qs}`;
}

/** Plain, serializable listing shape shared by result cards and the map. */
export type ResultItem = {
  id: string;
  title: string;
  description: string;
  deal: DealType;
  priceBirr: number;
  depositBirr: number | null;
  pricePerSqm: number | null;
  neighborhood: string;
  roadName: string | null;
  propertyType: string;
  propertyLabel: string;
  roomsLabel: string | null;
  areaSqm: number | null;
  floor: number | null;
  furnished: boolean;
  images: string[];
  sellerName: string;
  sellerRole: string;
  sellerPhoto: string | null;
  verified: boolean;
  brokerVerified: boolean;
  isNew: boolean;
  lat: number | null;
  lng: number | null;
};

/** "45,000" for rent, "14.5M" for large sale prices — short enough for a map pin. */
export function shortPrice(birr: number): string {
  if (birr >= 1_000_000) return `${+(birr / 1_000_000).toFixed(1)}M`;
  if (birr >= 10_000) return `${Math.round(birr / 1000)}K`;
  return birr.toLocaleString();
}

export function floorLabel(floor: number | null): string | null {
  if (floor == null) return null;
  return floor === 0 ? "Ground floor" : `Floor ${floor}`;
}
