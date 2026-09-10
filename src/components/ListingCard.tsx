import Link from "next/link";
import { PROPERTY_TYPES, BEDROOM_FILTERS } from "@/lib/addis";
import { formatAvailableFrom } from "@/lib/dates";
import { ImageCarousel } from "@/components/ImageCarousel";
import { SaveListingButton } from "@/components/SaveListingButton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { getListingImageUrls, isVerifiedBroker } from "@/lib/listings";
import { type Lang, t } from "@/lib/i18n";

type ListingWithRelations = {
  id: string;
  title: string;
  description: string;
  neighborhood: string;
  roadName?: string | null;
  roomType: string;
  propertyType?: string;
  bedrooms?: string;
  furnished: boolean;
  priceBirr: number;
  availableFrom: Date;
  images?: { url: string; sortOrder: number }[];
  postedBy: {
    id: string;
    name: string;
    role: string;
    verified: boolean;
    profileComplete?: boolean;
    photoUrl?: string | null;
  };
};

function labelForProperty(value?: string) {
  return PROPERTY_TYPES.find((p) => p.value === value)?.label ?? value;
}

function labelForBedrooms(value?: string) {
  return BEDROOM_FILTERS.find((b) => b.value === value)?.label ?? value;
}

export function ListingCard({
  listing,
  lang,
  href,
  saved = false,
  showSave = false,
}: {
  listing: ListingWithRelations;
  lang: Lang;
  href: string;
  saved?: boolean;
  showSave?: boolean;
}) {
  const images = getListingImageUrls(listing);
  const verified = isVerifiedBroker(listing.postedBy);
  const langQs = lang !== "en" ? `?lang=${lang}` : "";
  const profileHref = listing.postedBy.profileComplete
    ? `/profiles/${listing.postedBy.id}${langQs}`
    : null;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition hover:border-[var(--brand-300)] hover:shadow-lg hover:shadow-blue-200/20">
      {showSave ? (
        <SaveListingButton listingId={listing.id} saved={saved} />
      ) : null}

      <Link href={href} className="block">
        <div className="relative">
          <ImageCarousel images={images} alt={listing.title} variant="compact" />
          <span className="absolute bottom-3 left-3 rounded-lg bg-[var(--surface)]/95 px-3 py-1.5 text-xs font-semibold text-[var(--brand-800)] shadow-sm backdrop-blur">
            {t(lang, "listing.availableFrom")}:{" "}
            {formatAvailableFrom(listing.availableFrom)}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--brand-800)]">
                {listing.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {listing.neighborhood}
                {listing.roadName ? `, ${listing.roadName}` : ""} •{" "}
                {labelForProperty(listing.propertyType)}
                {listing.bedrooms
                  ? ` • ${labelForBedrooms(listing.bedrooms)}`
                  : ""}
                {listing.furnished ? " • furnished" : ""}
              </p>
            </div>
            <div className="shrink-0 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm">
              {listing.priceBirr.toLocaleString()}{" "}
              <span className="text-xs font-medium text-blue-50">birr</span>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-slate-700">
            {listing.description}
          </p>
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] px-5 py-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--muted)]">
          <ProfileAvatar
            name={listing.postedBy.name}
            photoUrl={listing.postedBy.photoUrl}
            size="sm"
          />
          <span className="truncate">
            {listing.postedBy.role.toLowerCase()} • {listing.postedBy.name}
          </span>
          {verified ? <VerifiedBadge lang={lang} /> : null}
        </div>
        {profileHref ? (
          <Link
            href={profileHref}
            className="shrink-0 text-xs font-semibold text-[var(--brand-700)] hover:underline"
          >
            {t(lang, "listing.viewLandlord")}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
