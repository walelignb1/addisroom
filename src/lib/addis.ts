/** Central Addis Ababa neighborhoods */
export const ADDIS_CITY_AREAS = [
  "Bole",
  "Kazanchis",
  "Piazza",
  "CMC",
  "Megenagna",
  "Gerji",
  "Saris",
  "Ayat",
  "Jemo",
  "Gotera",
  "Mexico",
  "Arat Kilo",
  "Sidist Kilo",
  "Lideta",
  "Kirkos",
  "Yeka",
  "Nifas Silk",
  "Gullele",
  "Addis Ketema",
  "Kolfe Keranio",
  "Akaki Kality",
] as const;

/** Major towns / areas near Addis Ababa */
export const ADDIS_NEARBY_AREAS = [
  "Sululta",
  "Sebeta",
  "Koye Feche",
  "Gelan",
  "Burayu",
  "Legetafo",
] as const;

/** All selectable locations (city + nearby) */
export const ADDIS_NEIGHBORHOODS = [
  ...ADDIS_CITY_AREAS,
  ...ADDIS_NEARBY_AREAS,
] as const;

export type AddisArea = (typeof ADDIS_NEIGHBORHOODS)[number];

export const ROOM_TYPES = [
  { value: "ROOM", label: "Room" },
  { value: "STUDIO", label: "Studio" },
  { value: "APARTMENT", label: "Apartment" },
] as const;

export const PROPERTY_TYPES = [
  { value: "CONDOMINIUM", label: "Condominium" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "VILLA", label: "Villa" },
  { value: "HOUSE", label: "House" },
  { value: "SHARED_HOUSE", label: "Shared house" },
  { value: "SHOP", label: "Shop" },
] as const;

/** Bale 1 kifl / Bale 2 kifl bedroom filters */
export const BEDROOM_FILTERS = [
  { value: "ONE", label: "Bale 1 kifl (1 bedroom)" },
  { value: "TWO", label: "Bale 2 kifl (2 bedrooms)" },
  { value: "THREE_PLUS", label: "3+ bedrooms" },
] as const;

export const ROLES = [
  { value: "LANDLORD", label: "Landlord (አከራይ)" },
  { value: "TENANT", label: "Renter (ተከራይ)" },
  { value: "AGENT", label: "Agent" },
] as const;
