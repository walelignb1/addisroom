import { parseLang, t, type Lang } from "@/lib/i18n";

export function BannerAd({ lang }: { lang: Lang }) {
  return (
    <aside
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--brand-50)] via-[var(--surface)] to-[var(--brand-100)] px-5 py-4 shadow-sm"
      role="complementary"
      aria-label={t(lang, "ads.label")}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[var(--brand-200)]/40 blur-2xl" />
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-600)]">
        {t(lang, "ads.sponsored")}
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
        {t(lang, "ads.headline")}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{t(lang, "ads.body")}</p>
    </aside>
  );
}
