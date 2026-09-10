"use client";

import { useState } from "react";
import { createListing } from "@/app/actions";
import {
  ADDIS_CITY_AREAS,
  ADDIS_NEARBY_AREAS,
  BEDROOM_FILTERS,
  PROPERTY_TYPES,
  ROOM_TYPES,
} from "@/lib/addis";
import { type Lang, t } from "@/lib/i18n";

const disabledFieldClass = "disabled:cursor-not-allowed disabled:opacity-50";

export function NewListingForm({
  lang,
  feeBirr,
}: {
  lang: Lang;
  feeBirr: number;
}) {
  const [propertyType, setPropertyType] = useState("CONDOMINIUM");
  const isShop = propertyType === "SHOP";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      t(lang, "listing.payConfirm").replace("{amount}", feeBirr.toLocaleString()),
    );
    if (!confirmed) {
      e.preventDefault();
    }
  }

  return (
    <form action={createListing} onSubmit={handleSubmit} className="card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Neighborhood</label>
          <select
            name="neighborhood"
            required
            className="input-field mt-2"
            defaultValue="Bole"
          >
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
          <label className="text-sm font-medium">
            Road / street name (optional)
          </label>
          <input
            name="roadName"
            placeholder="e.g. Cameroon Street"
            className="input-field mt-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            {t(lang, "home.propertyType")}
          </label>
          <select
            name="propertyType"
            required
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="input-field mt-2"
          >
            {PROPERTY_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">
            {t(lang, "home.bedrooms")}
          </label>
          <select
            name="bedrooms"
            required={!isShop}
            disabled={isShop}
            defaultValue="ONE"
            className={`input-field mt-2 ${disabledFieldClass}`}
          >
            {BEDROOM_FILTERS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isShop ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          {t(lang, "listing.shopFieldsHint")}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Title</label>
          <input name="title" required className="input-field mt-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Room type</label>
          <select
            name="roomType"
            required={!isShop}
            disabled={isShop}
            defaultValue="ROOM"
            className={`input-field mt-2 ${disabledFieldClass}`}
          >
            {ROOM_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label
            className={`flex items-center gap-2 text-sm font-medium ${isShop ? "opacity-50" : ""}`}
          >
            <input
              type="checkbox"
              name="furnished"
              disabled={isShop}
              className="h-4 w-4 rounded border-[var(--border)] text-[var(--brand-600)] disabled:cursor-not-allowed"
            />
            Furnished
          </label>
        </div>
        <div>
          <label className="text-sm font-medium">
            {t(lang, "listing.moveInDate")} *
          </label>
          <input
            name="availableFrom"
            type="date"
            required
            className="input-field mt-2"
          />
          <p className="mt-1 text-xs text-[var(--muted)]">
            {t(lang, "listing.moveInHint")}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Monthly price (birr)</label>
          <input
            name="priceBirr"
            required
            inputMode="numeric"
            className="input-field mt-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Deposit (optional, birr)
          </label>
          <input
            name="depositBirr"
            inputMode="numeric"
            className="input-field mt-2"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="description"
            required
            rows={5}
            className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">
            Photo URLs (optional, one per line)
          </label>
          <textarea
            name="imageUrls"
            rows={3}
            className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 font-mono text-xs outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20"
          />
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--brand-50)] px-4 py-3 text-sm text-[var(--brand-800)]">
        {t(lang, "listing.feeNotice").replace("{amount}", feeBirr.toLocaleString())}
      </p>

      <div className="mt-4 flex justify-end gap-3">
        <a
          href="/"
          className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--brand-50)]"
        >
          Cancel
        </a>
        <button type="submit" className="btn-primary px-4 py-2 text-sm">
          {t(lang, "listing.publishAndPay").replace("{amount}", feeBirr.toLocaleString())}
        </button>
      </div>
    </form>
  );
}
