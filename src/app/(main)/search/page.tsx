import type { Metadata } from "next";
import { BannerAd } from "@/components/BannerAd";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { SortSelect } from "@/components/SortSelect";
import { PROPERTY_TYPES } from "@/lib/addis";
import { getSessionProfileId } from "@/lib/auth";
import { getSavedListingIds } from "@/lib/auth-actions";
import { parseLang, t } from "@/lib/i18n";
import { searchListings } from "@/lib/search";
import {
  buildSearchUrl,
  PAGE_SIZE,
  parseSearchParams,
  SORT_OPTIONS,
  type RawSearchParams,
  type SortKey,
} from "@/lib/search-shared";

export const metadata: Metadata = {
  title: "Search homes to rent or buy — AddisRoom",
};

export default async function SearchPage(props: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(typeof sp.lang === "string" ? sp.lang : undefined);
  const filters = parseSearchParams(sp);

  const profileId = await getSessionProfileId();
  const [{ items, total, pages, page }, savedIds] = await Promise.all([
    searchListings(filters),
    getSavedListingIds(profileId),
  ]);

  const url = (o: Parameters<typeof buildSearchUrl>[1]) => buildSearchUrl(filters, o, lang);
  const typeLabel =
    PROPERTY_TYPES.find((p) => p.value === filters.propertyType)?.label ??
    t(lang, "search.properties");
  const dealLabel = t(lang, filters.deal === "RENT" ? "search.forRent" : "search.forSale");
  const place = filters.neighborhood || "Addis Ababa";
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = filters.view === "map" ? total : Math.min(page * PAGE_SIZE, total);
  const sortUrls = Object.fromEntries(
    SORT_OPTIONS.map((s) => [s, url({ sort: s, page: 1 })]),
  ) as Record<SortKey, string>;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <a href={lang !== "en" ? `/?lang=${lang}` : "/"} className="underline underline-offset-2 hover:text-[var(--foreground)]">
          AddisRoom
        </a>
        <span aria-hidden>›</span>
        <a
          href={buildSearchUrl({ ...filters, neighborhood: "", radiusKm: null, page: 1 }, {}, lang)}
          className="underline underline-offset-2 hover:text-[var(--foreground)]"
        >
          {typeLabel} {dealLabel}
        </a>
        {filters.neighborhood ? (
          <>
            <span aria-hidden>›</span>
            <span>{filters.neighborhood}</span>
          </>
        ) : null}
      </nav>

      <SearchBar key={JSON.stringify(sp)} lang={lang} initial={filters} variant="page" />

      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            {typeLabel} {dealLabel}: {place}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            {t(lang, "search.count")
              .replace("{from}", String(from))
              .replace("{to}", String(to))
              .replace("{total}", String(total))}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SortSelect lang={lang} value={filters.sort} urls={sortUrls} />
          <div className="view-toggle" role="group" aria-label="View">
            <a href={url({ view: "list" })} data-active={filters.view === "list"}>
              {t(lang, "search.list")}
            </a>
            <a href={url({ view: "map", page: 1 })} data-active={filters.view === "map"}>
              {t(lang, "search.map")}
            </a>
          </div>
        </div>
      </div>

      {total === 0 ? (
        <div className="empty-state">
          <p className="text-lg font-semibold text-[var(--foreground)]">
            {t(lang, "search.emptyTitle")}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{t(lang, "search.emptyBody")}</p>
          <a
            href={`/search?deal=${filters.deal.toLowerCase()}${lang !== "en" ? `&lang=${lang}` : ""}`}
            className="btn-dark mt-6 inline-flex h-11 items-center px-6 text-sm"
          >
            {t(lang, "search.clear")}
          </a>
        </div>
      ) : (
        <SearchResults
          key={`${filters.view}-${page}-${filters.sort}`}
          items={items}
          lang={lang}
          view={filters.view}
          savedIds={[...savedIds]}
          loggedIn={Boolean(profileId)}
          mapUrl={url({ view: "map", page: 1 })}
          sidebar={<BannerAd lang={lang} />}
        />
      )}

      {filters.view === "list" && pages > 1 ? (
        <nav aria-label="Pagination" className="pager">
          {page > 1 ? (
            <a href={url({ page: page - 1 })} rel="prev">
              ‹ {t(lang, "search.prev")}
            </a>
          ) : null}
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <a key={n} href={url({ page: n })} data-active={n === page} aria-current={n === page ? "page" : undefined}>
              {n}
            </a>
          ))}
          {page < pages ? (
            <a href={url({ page: page + 1 })} rel="next">
              {t(lang, "search.next")} ›
            </a>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
