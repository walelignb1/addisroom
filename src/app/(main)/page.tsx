import { BedroomCount, PropertyType } from "@prisma/client";
import { fetchHomeListings } from "@/lib/fetch-listings";
import { getSavedListingIds } from "@/lib/auth-actions";
import { getSessionProfileId } from "@/lib/auth";
import { parseRadiusKm } from "@/lib/geo";
import { parseLang, t } from "@/lib/i18n";
import { ListingCard } from "@/components/ListingCard";
import { BannerAd } from "@/components/BannerAd";
import { HomeHero } from "@/components/HomeHero";

function parseBedrooms(value: string | undefined): BedroomCount | null {
  if (value === "ONE" || value === "TWO" || value === "THREE_PLUS") return value;
  return null;
}

function parsePropertyType(value: string | undefined): PropertyType | null {
  const valid: PropertyType[] = [
    "CONDOMINIUM",
    "APARTMENT",
    "VILLA",
    "HOUSE",
    "SHARED_HOUSE",
    "SHOP",
  ];
  return valid.includes(value as PropertyType) ? (value as PropertyType) : null;
}

export default async function Home(props: {
  searchParams?: Promise<{
    q?: string;
    neighborhood?: string;
    radius?: string;
    bedrooms?: string;
    propertyType?: string;
    lang?: string;
  }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const neighborhood = (sp.neighborhood ?? "").trim();
  const radiusRaw = (sp.radius ?? "").trim();
  const radiusKm = parseRadiusKm(radiusRaw);
  const bedrooms = parseBedrooms(sp.bedrooms?.trim());
  const propertyType = parsePropertyType(sp.propertyType?.trim());
  const lang = parseLang(sp.lang);

  const profileId = await getSessionProfileId();
  const savedIds = await getSavedListingIds(profileId);

  const { listings, usedFallback } = await fetchHomeListings({
    q,
    neighborhood,
    radiusKm,
    bedrooms,
    propertyType,
  });

  const langHidden =
    lang !== "en" ? <input type="hidden" name="lang" value={lang} /> : null;

  return (
    <div className="-mx-4 space-y-10 sm:mx-0">
      <HomeHero
        lang={lang}
        langHidden={langHidden}
        q={q}
        neighborhood={neighborhood}
        radiusRaw={radiusRaw}
        bedrooms={sp.bedrooms ?? ""}
        propertyType={sp.propertyType ?? ""}
      />

      <div className="space-y-6 px-0 sm:px-0">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              {t(lang, "home.resultsTitle")}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {listings.length > 0
                ? t(lang, "home.resultsCount").replace(
                    "{n}",
                    String(listings.length),
                  )
                : t(lang, "home.empty")}
            </p>
          </div>
          {neighborhood && radiusKm ? (
            <span className="rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-medium text-[var(--brand-800)]">
              {t(lang, "home.radiusActive").replace("{km}", String(radiusKm))}
            </span>
          ) : null}
        </div>

        <BannerAd lang={lang} />

        {usedFallback ? (
          <p
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            Listings are loading in limited mode. You can still browse and post new
            rooms.
          </p>
        ) : null}

        <section className="grid gap-6 md:grid-cols-2">
          {listings.length === 0 ? (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-12 text-center">
              <p className="text-sm text-[var(--muted)]">
                {t(lang, "home.empty")}{" "}
                <a href="/listings/new" className="link-brand">
                  {t(lang, "home.postLink")}
                </a>
              </p>
            </div>
          ) : null}

          {listings.map((l) => {
            const qs = new URLSearchParams();
            if (lang !== "en") qs.set("lang", lang);
            const suffix = qs.toString() ? `?${qs}` : "";
            return (
              <ListingCard
                key={l.id}
                listing={l}
                lang={lang}
                href={`/listings/${l.id}${suffix}`}
                saved={savedIds.has(l.id)}
                showSave={Boolean(profileId)}
              />
            );
          })}
        </section>
      </div>
    </div>
  );
}
