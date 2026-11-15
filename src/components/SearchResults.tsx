"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ListingsMap, type MapPoint } from "@/components/ListingsMap";
import { SaveListingButton } from "@/components/SaveListingButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { type Lang, t } from "@/lib/i18n";
import { floorLabel, shortPrice, type ResultItem } from "@/lib/search-shared";

const ICONS = {
  rooms:
    "M4 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M4 15h16M7 10V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3",
  area: "M5 5h5M5 5v5M5 5l6 6m8 8h-5m5 0v-5m0 5-6-6",
  floor: "M4 20h4v-4h4v-4h4V8h4",
};

function Fact({
  icon,
  children,
}: {
  icon: keyof typeof ICONS;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-[18px] w-[18px] text-[var(--muted)]"
        aria-hidden
      >
        <path
          d={ICONS[icon]}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </span>
  );
}

function ResultCard({
  item,
  lang,
  href,
  saved,
  showSave,
  active,
  compact,
  onHover,
}: {
  item: ResultItem;
  lang: Lang;
  href: string;
  saved: boolean;
  showSave: boolean;
  active: boolean;
  compact: boolean;
  onHover: (id: string | null) => void;
}) {
  const floor = floorLabel(item.floor);
  const seller =
    item.sellerRole === "AGENT"
      ? t(lang, "search.agent")
      : t(lang, "search.private");

  return (
    <article
      className={`result-card ${compact ? "result-card-compact" : ""}`}
      data-active={active}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
    >
      {showSave ? (
        <SaveListingButton listingId={item.id} saved={saved} />
      ) : null}

      <div className="result-photo">
        <ImageCarousel images={item.images} alt={item.title} variant="row" />
        {item.isNew ? (
          <span className="result-badge">{t(lang, "search.new")}</span>
        ) : null}
      </div>

      <Link href={href} className="result-body">
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pr-12">
          <span className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {item.priceBirr.toLocaleString()} birr
          </span>
          {item.deal === "RENT" ? (
            <span className="text-sm text-[var(--muted)]">
              {t(lang, "search.perMonth")}
              {item.depositBirr
                ? ` · ${t(lang, "search.deposit")}: ${item.depositBirr.toLocaleString()}`
                : ""}
            </span>
          ) : item.pricePerSqm ? (
            <span className="text-sm text-[var(--muted)]">
              {item.pricePerSqm.toLocaleString()} birr/m²
            </span>
          ) : null}
        </p>

        <h3 className="mt-2 line-clamp-2 text-base font-medium text-[var(--foreground)]">
          {item.title}
        </h3>
        <p className="mt-1 truncate text-sm text-[var(--muted)]">
          {item.roadName ? `${item.roadName}, ` : ""}
          {item.neighborhood}, Addis Ababa
        </p>

        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[var(--foreground)]">
          {item.roomsLabel ? <Fact icon="rooms">{item.roomsLabel}</Fact> : null}
          {item.areaSqm ? <Fact icon="area">{item.areaSqm} m²</Fact> : null}
          {floor ? <Fact icon="floor">{floor}</Fact> : null}
        </p>

        <p className="mt-auto flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">
            {item.propertyLabel}
          </span>
          <span aria-hidden>·</span>
          <span>
            {seller}: {item.sellerName}
          </span>
          {item.verified ? <VerifiedBadge lang={lang} /> : null}
          {item.brokerVerified && (
            <span className="status-pill">Agent approved</span>
          )}
        </p>
      </Link>
    </article>
  );
}

export function SearchResults({
  items,
  lang,
  view,
  savedIds,
  loggedIn,
  mapUrl,
  sidebar,
}: {
  items: ResultItem[];
  lang: Lang;
  view: "list" | "map";
  savedIds: string[];
  loggedIn: boolean;
  mapUrl: string;
  sidebar?: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const langQs = lang !== "en" ? `?lang=${lang}` : "";
  const saved = useMemo(() => new Set(savedIds), [savedIds]);

  const points = useMemo<MapPoint[]>(
    () =>
      items
        .filter((i) => i.lat != null && i.lng != null)
        .map((i) => ({
          id: i.id,
          lat: i.lat!,
          lng: i.lng!,
          label: shortPrice(i.priceBirr),
          title: i.title,
          sub: `${i.priceBirr.toLocaleString()} birr${i.deal === "RENT" ? ` ${t(lang, "search.perMonth")}` : ""}`,
          href: `/listings/${i.id}${langQs}`,
          image: i.images[0],
        })),
    [items, lang, langQs],
  );

  const cards = items.map((item, i) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: Math.min(i, 8) * 0.06,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      <ResultCard
        item={item}
        lang={lang}
        href={`/listings/${item.id}${langQs}`}
        saved={saved.has(item.id)}
        showSave={loggedIn}
        active={activeId === item.id}
        compact={view === "map"}
        onHover={setActiveId}
      />
    </motion.div>
  ));

  if (view === "map") {
    return (
      <div className="map-split">
        <div className="map-split-list">{cards}</div>
        <div className="map-split-map">
          <ListingsMap
            points={points}
            activeId={activeId}
            onActive={setActiveId}
            className="h-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-4">{cards}</div>
      <aside className="space-y-4">
        <div className="map-teaser">
          <ListingsMap points={points} interactive={false} className="h-full" />
          <a href={mapUrl} className="map-teaser-button">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden
            >
              <path
                d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"
                stroke="currentColor"
                strokeWidth="1.9"
              />
              <circle
                cx="12"
                cy="10"
                r="2.5"
                stroke="currentColor"
                strokeWidth="1.9"
              />
            </svg>
            {t(lang, "search.seeOnMap")}
          </a>
        </div>
        {sidebar}
      </aside>
    </div>
  );
}
