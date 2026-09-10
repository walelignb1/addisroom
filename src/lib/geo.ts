/** Approximate centers for Addis Ababa neighborhoods (lat/lng). */
export const NEIGHBORHOOD_COORDS: Record<
  string,
  { lat: number; lng: number }
> = {
  Bole: { lat: 8.997, lng: 38.79 },
  Kazanchis: { lat: 9.015, lng: 38.765 },
  Piazza: { lat: 9.034, lng: 38.746 },
  CMC: { lat: 9.05, lng: 38.81 },
  Megenagna: { lat: 9.02, lng: 38.83 },
  Gerji: { lat: 8.985, lng: 38.81 },
  Saris: { lat: 8.955, lng: 38.76 },
  Ayat: { lat: 8.92, lng: 38.88 },
  Jemo: { lat: 8.935, lng: 38.72 },
  Gotera: { lat: 9.0, lng: 38.74 },
  Mexico: { lat: 9.01, lng: 38.735 },
  "Arat Kilo": { lat: 9.032, lng: 38.762 },
  "Sidist Kilo": { lat: 9.04, lng: 38.76 },
  Lideta: { lat: 9.025, lng: 38.735 },
  Kirkos: { lat: 9.01, lng: 38.75 },
  Yeka: { lat: 9.05, lng: 38.79 },
  "Nifas Silk": { lat: 8.99, lng: 38.72 },
  Gullele: { lat: 9.05, lng: 38.72 },
  "Addis Ketema": { lat: 9.03, lng: 38.72 },
  "Kolfe Keranio": { lat: 9.04, lng: 38.7 },
  "Akaki Kality": { lat: 8.88, lng: 38.78 },
  Sululta: { lat: 9.18, lng: 38.72 },
  Sebeta: { lat: 8.91, lng: 38.62 },
  "Koye Feche": { lat: 8.75, lng: 38.85 },
  Gelan: { lat: 8.85, lng: 38.78 },
  Burayu: { lat: 8.95, lng: 38.68 },
  Legetafo: { lat: 9.02, lng: 38.88 },
};

/** Kilometer radius filter options (no "any distance"). */
export const RADIUS_KM_OPTIONS = [1, 2, 5, 10, 20] as const;

export type RadiusKm = (typeof RADIUS_KM_OPTIONS)[number];

export const RADIUS_OPTIONS: {
  value: string;
  labelKey:
    | "home.radius1"
    | "home.radius2"
    | "home.radius5"
    | "home.radius10"
    | "home.radius20plus";
}[] = [
  { value: "1", labelKey: "home.radius1" },
  { value: "2", labelKey: "home.radius2" },
  { value: "5", labelKey: "home.radius5" },
  { value: "10", labelKey: "home.radius10" },
  { value: "20", labelKey: "home.radius20plus" },
];

export function parseRadiusKm(raw: string | undefined): RadiusKm | null {
  const v = raw?.trim();
  if (v === "1") return 1;
  if (v === "2") return 2;
  if (v === "5") return 5;
  if (v === "10") return 10;
  if (v === "20") return 20;
  return null;
}

export function getNeighborhoodCoords(name: string) {
  return NEIGHBORHOOD_COORDS[name] ?? null;
}

/** Haversine distance in kilometers between two points. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function listingCoords(listing: {
  latitude: number | null;
  longitude: number | null;
  neighborhood: string;
}) {
  if (listing.latitude != null && listing.longitude != null) {
    return { lat: listing.latitude, lng: listing.longitude };
  }
  return getNeighborhoodCoords(listing.neighborhood);
}

export function withinRadiusKm(
  listing: {
    latitude: number | null;
    longitude: number | null;
    neighborhood: string;
  },
  center: { lat: number; lng: number },
  radiusKm: number,
) {
  const coords = listingCoords(listing);
  if (!coords) return false;
  return haversineKm(center, coords) <= radiusKm;
}
