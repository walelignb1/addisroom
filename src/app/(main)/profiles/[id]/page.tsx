import { notFound } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionProfileId } from "@/lib/auth";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { genderLabel, isProfileComplete } from "@/lib/profile";
import { isVerifiedBroker } from "@/lib/listings";
import { parseLang, t } from "@/lib/i18n";

export default async function PublicProfilePage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}) {
  const { id } = await props.params;
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const sessionId = await getSessionProfileId();

  const profile = await prisma.profile.findUnique({
    where: { id },
    include: {
      listings: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      },
    },
  });

  if (!profile || !isProfileComplete(profile)) return notFound();

  const verified = isVerifiedBroker(profile);
  const isLandlord =
    profile.role === Role.LANDLORD || profile.role === Role.AGENT;
  const langQs = lang !== "en" ? `?lang=${lang}` : "";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/${langQs}`}
          className="text-sm font-medium text-[var(--brand-700)] hover:underline"
        >
          ← {t(lang, "profile.backHome")}
        </Link>
        {!sessionId ? (
          <Link
            href={`/login?next=/profiles/${id}`}
            className="btn-primary px-4 py-2 text-sm"
          >
            {t(lang, "nav.login")}
          </Link>
        ) : null}
      </div>

      <section className="card flex flex-col items-center p-8 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        <ProfileAvatar name={profile.name} photoUrl={profile.photoUrl} size="lg" />
        <div className="mt-4 flex-1 sm:mt-0">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              {profile.name}
            </h1>
            {verified ? <VerifiedBadge lang={lang} /> : null}
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {profile.role.toLowerCase()} • {profile.age}{" "}
            {t(lang, "profile.yearsOld")}
            {profile.gender ? ` • ${genderLabel(profile.gender)}` : ""}
          </p>
          {profile.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              {profile.bio}
            </p>
          ) : null}

          <dl className="mt-6 grid gap-3 text-left text-sm sm:grid-cols-2">
            {isLandlord && profile.livesInProperty !== null ? (
              <div className="rounded-xl bg-[var(--brand-50)] px-4 py-3">
                <dt className="text-xs font-medium text-[var(--muted)]">
                  {t(lang, "profile.livesInLabel")}
                </dt>
                <dd className="mt-1 font-medium text-[var(--foreground)]">
                  {profile.livesInProperty
                    ? t(lang, "profile.livesInYes")
                    : t(lang, "profile.livesInNo")}
                </dd>
              </div>
            ) : null}
            {profile.smokingOk !== null ? (
              <div className="rounded-xl bg-[var(--brand-50)] px-4 py-3">
                <dt className="text-xs font-medium text-[var(--muted)]">
                  {t(lang, "profile.smokingOk")}
                </dt>
                <dd className="mt-1 font-medium">
                  {profile.smokingOk
                    ? t(lang, "profile.yes")
                    : t(lang, "profile.no")}
                </dd>
              </div>
            ) : null}
            {profile.petsOk !== null ? (
              <div className="rounded-xl bg-[var(--brand-50)] px-4 py-3">
                <dt className="text-xs font-medium text-[var(--muted)]">
                  {t(lang, "profile.petsOk")}
                </dt>
                <dd className="mt-1 font-medium">
                  {profile.petsOk
                    ? t(lang, "profile.yes")
                    : t(lang, "profile.no")}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      {profile.listings.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {t(lang, "profile.listings")}
          </h2>
          <ul className="mt-4 space-y-2">
            {profile.listings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listings/${l.id}${langQs}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm hover:border-[var(--brand-300)]"
                >
                  <span className="font-medium">{l.title}</span>
                  <span className="text-[var(--muted)]">
                    {" "}
                    — {l.neighborhood}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!sessionId ? (
        <p className="rounded-xl border border-[var(--brand-200)] bg-[var(--brand-50)] px-4 py-3 text-center text-sm text-[var(--brand-800)]">
          {t(lang, "profile.loginToMessage")}
        </p>
      ) : null}
    </div>
  );
}
