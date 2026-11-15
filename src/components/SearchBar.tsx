"use client";
import { useState } from "react";
import {
  ADDIS_CITY_AREAS,
  ADDIS_NEARBY_AREAS,
  BEDROOM_FILTERS,
  PROPERTY_TYPES,
} from "@/lib/addis";
import { RADIUS_OPTIONS } from "@/lib/geo";
import { type Lang, t } from "@/lib/i18n";
import type { SearchFilters } from "@/lib/search-shared";
type Initial = Omit<SearchFilters, "page">;
export const EMPTY_SEARCH: Initial = {
  deal: "RENT",
  propertyType: null,
  neighborhood: "",
  radiusKm: null,
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  rooms: [],
  furnished: false,
  q: "",
  sort: "new",
  view: "list",
};
export function SearchBar({
  lang,
  initial = EMPTY_SEARCH,
  variant = "page",
}: {
  lang: Lang;
  initial?: Initial;
  variant?: "hero" | "page";
}) {
  const [deal, setDeal] = useState(initial.deal);
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood);
  const [propertyType, setPropertyType] = useState(initial.propertyType ?? "");
  const [error, setError] = useState("");
  const [radius, setRadius] = useState(
    initial.radiusKm ? String(initial.radiusKm) : "",
  );
  const isShop = propertyType === "SHOP";
  return (
    <form
      action="/search"
      className={`reference-search ${variant === "page" ? "reference-search-page" : ""}`}
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        for (const [min, max, label] of [
          ["priceMin", "priceMax", t(lang, "search.price")],
          ["areaMin", "areaMax", t(lang, "search.area")],
        ]) {
          const a = Number(fd.get(min)),
            b = Number(fd.get(max));
          if (a > 0 && b > 0 && a > b) {
            e.preventDefault();
            setError(`${label}: minimum must not exceed maximum.`);
            return;
          }
        }
        setError("");
      }}
    >
      <input type="hidden" name="deal" value={deal.toLowerCase()} />
      {lang !== "en" && <input type="hidden" name="lang" value={lang} />}
      <input type="hidden" name="sort" value={initial.sort} />
      <input type="hidden" name="view" value={initial.view} />
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="text-xs uppercase tracking-wider font-semibold text-[var(--muted)]">
          {t(lang, "home.filtersTitle")}
        </p>
        <div className="reference-deal" role="group" aria-label="Rent or buy">
          {(["RENT", "SALE"] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === deal}
              onClick={() => setDeal(d)}
            >
              {t(lang, d === "RENT" ? "search.rent" : "search.buy")}
            </button>
          ))}
        </div>
      </div>
      <label className="sr-only" htmlFor={`keyword-${variant}`}>
        {t(lang, "search.keyword")}
      </label>
      <input
        id={`keyword-${variant}`}
        type="search"
        name="q"
        defaultValue={initial.q}
        maxLength={200}
        placeholder={t(lang, "home.searchPlaceholder")}
        className="home-input h-12 w-full mb-4"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="field-label">{t(lang, "search.location")}</span>
          <select
            name="neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className="home-input h-12 w-full"
          >
            <option value="">{t(lang, "home.allNeighborhoods")}</option>
            <optgroup label="Addis Ababa">
              {ADDIS_CITY_AREAS.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </optgroup>
            <optgroup label="Nearby areas">
              {ADDIS_NEARBY_AREAS.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </optgroup>
          </select>
        </label>
        <label>
          <span className="field-label">{t(lang, "home.radiusKm")}</span>
          <select
            name="radius"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            disabled={!neighborhood}
            className="home-input h-12 w-full disabled:opacity-50"
          >
            <option value="">
              {neighborhood
                ? t(lang, "search.exactArea")
                : t(lang, "home.radiusHint")}
            </option>
            {RADIUS_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                + {t(lang, r.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">{t(lang, "search.rooms")}</span>
          <select
            name="rooms"
            defaultValue={initial.rooms[0] ?? ""}
            disabled={isShop}
            className="home-input h-12 w-full disabled:opacity-50"
          >
            <option value="">{t(lang, "home.anyBedrooms")}</option>
            {BEDROOM_FILTERS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">{t(lang, "home.propertyType")}</span>
          <select
            name="propertyType"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="home-input h-12 w-full"
          >
            <option value="">{t(lang, "home.allPropertyTypes")}</option>
            {PROPERTY_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">
            {t(lang, "search.minPrice")}
            {deal === "RENT" ? ` ${t(lang, "search.perMonth")}` : ""}
          </span>
          <input
            type="number"
            name="priceMin"
            max={2147483647}
            min={0}
            step={1}
            defaultValue={initial.priceMin ?? ""}
            placeholder="0"
            className="home-input h-12 w-full"
          />
        </label>
        <label>
          <span className="field-label">
            {t(lang, "search.maxPrice")}
            {deal === "RENT" ? ` ${t(lang, "search.perMonth")}` : ""}
          </span>
          <input
            type="number"
            name="priceMax"
            max={2147483647}
            min={0}
            step={1}
            defaultValue={initial.priceMax ?? ""}
            placeholder={t(lang, "search.anyPrice")}
            className="home-input h-12 w-full"
          />
        </label>
      </div>
      <details
        className="mt-4"
        open={
          initial.furnished ||
          !!initial.areaMin ||
          !!initial.areaMax ||
          undefined
        }
      >
        <summary className="text-sm font-semibold text-[var(--brand-700)] cursor-pointer">
          {t(lang, "search.more")}
        </summary>
        <div className="grid gap-4 mt-4 sm:grid-cols-2">
          {["Min", "Max"].map((suffix, i) => (
            <label key={suffix}>
              <span className="field-label">
                {t(lang, "search.area")} ·{" "}
                {t(lang, i ? "search.to" : "search.from")}
              </span>
              <input
                type="number"
                min={0}
                max={2147483647}
                name={`area${suffix}`}
                defaultValue={(i ? initial.areaMax : initial.areaMin) ?? ""}
                className="home-input h-12 w-full"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm py-2">
            <input
              name="furnished"
              value="1"
              type="checkbox"
              defaultChecked={initial.furnished}
              className="accent-[var(--brand-600)]"
            />
            {t(lang, "search.furnished")}
          </label>
        </div>
      </details>
      {error && (
        <p role="alert" className="text-red-700 text-sm mt-3">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary h-12 w-full mt-5">
        {t(lang, "search.submit")}
      </button>
      {variant === "page" && (
        <a
          className="block text-center mt-4 text-xs text-[var(--brand-700)] underline"
          href={`/search?deal=${deal.toLowerCase()}${lang !== "en" ? `&lang=${lang}` : ""}`}
        >
          {t(lang, "search.clear")}
        </a>
      )}
    </form>
  );
}
