"use client";

import { useState } from "react";
import { ADDIS_CITY_AREAS, ADDIS_NEARBY_AREAS, BEDROOM_FILTERS, PROPERTY_TYPES } from "@/lib/addis";
import { RADIUS_OPTIONS } from "@/lib/geo";
import { type Lang, t } from "@/lib/i18n";

export function HomeHero({
  lang,
  langHidden,
  q,
  neighborhood,
  radiusRaw,
  bedrooms,
  propertyType,
}: {
  lang: Lang;
  langHidden: React.ReactNode;
  q: string;
  neighborhood: string;
  radiusRaw: string;
  bedrooms: string;
  propertyType: string;
}) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(neighborhood);
  const [selectedPropertyType, setSelectedPropertyType] = useState(propertyType);
  const isShop = selectedPropertyType === "SHOP";

  return (
    <section className="home-hero relative overflow-hidden">
      <div className="home-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-[var(--brand-200)]/40 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-1 pt-4 pb-2 text-center sm:pt-8">
        <p className="home-hero-badge inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-800)] backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />
          Addis Ababa & nearby
        </p>
        <h1 className="home-hero-title mt-6 text-4xl font-bold tracking-tight text-[var(--brand-900)] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
          {t(lang, "home.title")}
        </h1>
        <p className="home-hero-subtitle mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--brand-800)]/85 sm:text-lg">
          {t(lang, "home.subtitle")}
        </p>
      </div>

      <div className="relative mx-auto mt-8 max-w-4xl px-1 sm:mt-10">
        <form action="/" className="home-search-card rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-blue-900/8 backdrop-blur-md sm:p-6">
          {langHidden}

          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {t(lang, "home.searchFilters")}
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="sr-only">{t(lang, "home.searchPlaceholder")}</label>
              <input
                name="q"
                defaultValue={q}
                placeholder={t(lang, "home.searchPlaceholder")}
                className="home-input h-12 w-full sm:h-[3.25rem]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t(lang, "home.allNeighborhoods")}
              </label>
              <select
                name="neighborhood"
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="home-input h-12 w-full"
              >
                <option value="">{t(lang, "home.allNeighborhoods")}</option>
                <optgroup label="Addis Ababa">
                  {ADDIS_CITY_AREAS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Nearby areas">
                  {ADDIS_NEARBY_AREAS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t(lang, "home.radiusKm")}
              </label>
              <select
                name="radius"
                defaultValue={radiusRaw}
                disabled={!selectedNeighborhood}
                title={!selectedNeighborhood ? t(lang, "home.radiusHint") : undefined}
                className="home-input h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>
                  {selectedNeighborhood
                    ? t(lang, "home.radiusSelect")
                    : t(lang, "home.radiusHint")}
                </option>
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {t(lang, r.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t(lang, "home.bedrooms")}
              </label>
              <select
                name="bedrooms"
                defaultValue={bedrooms}
                disabled={isShop}
                title={isShop ? t(lang, "home.bedroomsShopHint") : undefined}
                className="home-input h-12 w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{t(lang, "home.allBedrooms")}</option>
                {BEDROOM_FILTERS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              {isShop ? (
                <p className="mt-1.5 text-xs text-[var(--muted)]">
                  {t(lang, "home.bedroomsShopHint")}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                {t(lang, "home.propertyType")}
              </label>
              <select
                name="propertyType"
                value={selectedPropertyType}
                onChange={(e) => setSelectedPropertyType(e.target.value)}
                className="home-input h-12 w-full"
              >
                <option value="">{t(lang, "home.allPropertyTypes")}</option>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!neighborhood && radiusRaw ? (
            <p className="mt-3 text-sm text-amber-800">{t(lang, "home.radiusHint")}</p>
          ) : null}

          <button type="submit" className="btn-primary mt-5 h-12 w-full text-base sm:h-[3.25rem]">
            {t(lang, "home.search")}
          </button>
        </form>
      </div>
    </section>
  );
}
