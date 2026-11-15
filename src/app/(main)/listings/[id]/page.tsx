import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/app/actions";
import { PROPERTY_TYPES, BEDROOM_FILTERS } from "@/lib/addis";
import { getSessionProfile } from "@/lib/auth";
import { getSavedListingIds } from "@/lib/auth-actions";
import { ImageCarousel } from "@/components/ImageCarousel";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { SaveListingButton } from "@/components/SaveListingButton";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { getListingImageUrls, isVerifiedBroker } from "@/lib/listings";
import { isProfileComplete } from "@/lib/profile";
import { formatAvailableFrom } from "@/lib/dates";
import { parseLang, t } from "@/lib/i18n";
import { ChapaPayButton } from "@/components/ChapaPayButton";
import { PaymentLinkButton } from "@/components/PaymentLinkButton";
import { getListingPaymentForUser } from "@/lib/payments";
import { ViewingDateScheduler } from "@/components/ViewingDateScheduler";
import { BannerAd } from "@/components/BannerAd";
import { LISTING_FEE_BIRR, isRenterRole } from "@/lib/monetization";
import { getListingViewings } from "@/lib/viewing-actions";
import { PHONE_BLOCKED_MESSAGE } from "@/lib/message-privacy";
import { ViewingRespondButtons } from "@/components/ViewingRespondButtons";
import { ListingsMap } from "@/components/ListingsMap";
import { listingCoords } from "@/lib/geo";
import { floorLabel, shortPrice } from "@/lib/search-shared";

export default async function ListingDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string; payment?: string }>;
}) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const langQs = lang !== "en" ? `?lang=${lang}` : "";
  const me = await getSessionProfile();

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      postedBy: true,
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!listing) return notFound();

  const isOwner = me?.id === listing.postedById;
  if (
    (!listing.published ||
      listing.archivedAt ||
      listing.postedBy.suspendedAt) &&
    !isOwner &&
    !me?.isAdmin
  )
    return notFound();

  const payment = await getListingPaymentForUser(id, me?.id ?? null);

  const savedIds = await getSavedListingIds(me?.id ?? null);
  const images = getListingImageUrls(listing, 5);
  const verified = isVerifiedBroker(listing.postedBy);
  const isRenter = me ? isRenterRole(me.role as Role) : true;
  const landlordProfileReady = isProfileComplete(listing.postedBy);

  // Keep showing this card to the owner after publish too, so they see the
  // paid confirmation instead of the card just vanishing.
  const showPayment =
    isOwner &&
    !listing.archivedAt &&
    (!listing.published || payment?.status === "PAID");

  const viewings =
    me && !isRenter && isOwner
      ? await getListingViewings(id, me.id)
      : me && isRenter
        ? await getListingViewings(id, me.id)
        : [];

  const propertyLabel =
    PROPERTY_TYPES.find((p) => p.value === listing.propertyType)?.label ??
    listing.propertyType;
  const bedroomLabel =
    BEDROOM_FILTERS.find((b) => b.value === listing.bedrooms)?.label ??
    listing.bedrooms;

  const isSale = listing.dealType === "SALE";
  const coords = listingCoords(listing);
  const facts: [string, string | null][] = [
    [t(lang, "detail.type"), propertyLabel],
    [t(lang, "detail.area"), listing.areaSqm ? `${listing.areaSqm} m²` : null],
    [
      t(lang, "detail.rooms"),
      listing.propertyType === "SHOP" ? null : bedroomLabel,
    ],
    [t(lang, "detail.floor"), floorLabel(listing.floor)],
    [
      t(lang, "detail.furnished"),
      t(lang, listing.furnished ? "detail.yes" : "detail.no"),
    ],
    [
      t(lang, "detail.availableFrom"),
      formatAvailableFrom(listing.availableFrom),
    ],
    [
      t(lang, "detail.deposit"),
      listing.depositBirr
        ? `${listing.depositBirr.toLocaleString()} birr`
        : null,
    ],
    [
      t(lang, "detail.pricePerSqm"),
      isSale && listing.areaSqm
        ? `${Math.round(listing.priceBirr / listing.areaSqm).toLocaleString()} birr`
        : null,
    ],
    [
      t(lang, "detail.seller"),
      t(
        lang,
        listing.postedBy.role === "AGENT" ? "search.agent" : "search.private",
      ),
    ],
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {listing.archivedAt && (
        <p
          role="status"
          className="lg:col-span-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          This listing was removed by an administrator and is hidden from public
          browsing.
        </p>
      )}
      <a
        href={`/search?deal=${isSale ? "sale" : "rent"}${lang !== "en" ? `&lang=${lang}` : ""}`}
        className="text-sm font-semibold text-[var(--brand-700)] hover:underline lg:col-span-3"
      >
        ← {t(lang, "detail.back")}
      </a>
      <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm lg:col-span-2">
        {me ? (
          <SaveListingButton
            listingId={listing.id}
            saved={savedIds.has(listing.id)}
          />
        ) : null}
        <div className="relative">
          <ImageCarousel images={images} alt={listing.title} variant="full" />
          <span className="absolute bottom-4 left-4 rounded-xl bg-[var(--surface)]/95 px-4 py-2 text-sm font-semibold text-[var(--brand-800)] shadow-md backdrop-blur">
            {t(lang, "listing.availableFrom")}:{" "}
            {formatAvailableFrom(listing.availableFrom)}
          </span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                {listing.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                <span>
                  {listing.neighborhood}
                  {listing.roadName ? `, ${listing.roadName}` : ""} •{" "}
                  {propertyLabel} • {bedroomLabel}
                  {listing.furnished ? " • furnished" : ""} • {listing.city}
                </span>
                {verified ? <VerifiedBadge lang={lang} /> : null}
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent)] px-4 py-3 text-white shadow-md">
              <div className="text-xs text-blue-50">
                {t(lang, isSale ? "detail.price" : "detail.monthly")}
              </div>
              <div className="text-xl font-semibold">
                {listing.priceBirr.toLocaleString()} birr
              </div>
              {listing.depositBirr ? (
                <div className="mt-1 text-xs text-blue-50">
                  Deposit: {listing.depositBirr.toLocaleString()} birr
                </div>
              ) : null}
            </div>
          </div>

          <h2 className="mt-8 text-lg font-semibold tracking-tight text-[var(--foreground)]">
            {t(lang, "detail.facts")}
          </h2>
          <dl className="facts-grid mt-3">
            {facts
              .filter((f): f is [string, string] => Boolean(f[1]))
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>

          <div className="mt-8 whitespace-pre-wrap text-sm leading-7 text-slate-800">
            {listing.description}
          </div>

          {coords ? (
            <>
              <h2 className="mt-8 text-lg font-semibold tracking-tight text-[var(--foreground)]">
                {t(lang, "detail.location")}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {listing.roadName ? `${listing.roadName}, ` : ""}
                {listing.neighborhood}, {listing.city}
              </p>
              <div className="mt-3 h-80 overflow-hidden rounded-2xl border border-[var(--border)]">
                <ListingsMap
                  className="h-full"
                  points={[
                    {
                      id: listing.id,
                      lat: coords.lat,
                      lng: coords.lng,
                      label: shortPrice(listing.priceBirr),
                      title: listing.title,
                      sub: `${listing.priceBirr.toLocaleString()} birr`,
                      href: `/listings/${listing.id}${langQs}`,
                    },
                  ]}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {t(lang, "detail.locationNote")}
              </p>
            </>
          ) : null}
        </div>
      </section>

      <aside className="space-y-4">
        <BannerAd lang={lang} />

        {showPayment ? (
          <section className="card p-6">
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t(lang, "payment.pay")}
            </div>
            {!listing.published ? (
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t(lang, "payment.ownerOnlyNotice")}
              </p>
            ) : null}
            <div className="mt-4 space-y-3">
              <ChapaPayButton
                listingId={listing.id}
                amountBirr={payment?.amountBirr ?? LISTING_FEE_BIRR}
                lang={lang}
                status={payment?.status}
              />
              {payment?.status !== "PAID" &&
              process.env.CHAPA_PAYMENT_LINK_URL ? (
                <PaymentLinkButton
                  href={process.env.CHAPA_PAYMENT_LINK_URL}
                  label={t(lang, "payment.payViaLink")}
                />
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="card p-6">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            {t(lang, "listing.landlord")}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <ProfileAvatar
              name={listing.postedBy.name}
              photoUrl={listing.postedBy.photoUrl}
              size="md"
            />
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)]">
                {listing.postedBy.name}
              </p>
              <p className="text-xs text-[var(--muted)]">
                {listing.postedBy.role.toLowerCase()}
                {verified ? " • verified" : ""}
              </p>
            </div>
          </div>
          {landlordProfileReady ? (
            <Link
              href={`/profiles/${listing.postedById}${langQs}`}
              className="mt-4 inline-block text-sm font-semibold text-[var(--brand-700)] hover:underline"
            >
              {t(lang, "listing.viewLandlord")} →
            </Link>
          ) : null}
        </section>

        <section className="card p-6">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            {t(lang, "viewing.title")}
          </div>
          {me && !isOwner ? (
            <div className="mt-4">
              <ViewingDateScheduler listingId={listing.id} lang={lang} />
            </div>
          ) : me && isOwner ? (
            <div className="mt-4 space-y-3">
              {viewings.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">
                  No viewing requests yet.
                </p>
              ) : (
                viewings.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--brand-50)]/50 p-3 text-sm"
                  >
                    <p className="font-medium">{v.from.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {v.proposedAt.toLocaleString()} — {v.status}
                    </p>
                    {v.note ? <p className="mt-1 text-xs">{v.note}</p> : null}
                    {v.status === "PROPOSED" ? (
                      <ViewingRespondButtons viewingId={v.id} lang={lang} />
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : (
            <a
              href={`/login?next=/listings/${listing.id}`}
              className="mt-3 block text-sm font-medium text-[var(--brand-700)] hover:underline"
            >
              {t(lang, "nav.login")} to schedule a viewing
            </a>
          )}
        </section>

        <section className="card p-6">
          <div className="text-sm font-semibold text-[var(--foreground)]">
            Message the poster
          </div>
          {me ? (
            <>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {t(lang, "viewing.hint")}
              </p>
              <form action={sendMessage} className="mt-4 space-y-3">
                <input type="hidden" name="listingId" value={listing.id} />
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    name="body"
                    required
                    rows={5}
                    placeholder={t(lang, "chat.phoneBlocked")}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  Send message
                </button>
              </form>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {PHONE_BLOCKED_MESSAGE}
              </p>
            </>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--muted)]">
                {t(lang, "profile.loginToMessage")}
              </p>
              <a
                href={`/login?next=/listings/${listing.id}`}
                className="btn-primary block py-2.5 text-center text-sm"
              >
                {t(lang, "nav.login")}
              </a>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
