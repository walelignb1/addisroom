import { SearchBar } from "@/components/SearchBar";
import { type Lang, t } from "@/lib/i18n";
export function HomeHero({ lang }: { lang: Lang }) {
  return (
    <section className="reference-hero">
      <div className="relative z-10">
        <p className="reference-eyebrow">
          <span aria-hidden>●</span> {t(lang, "home.eyebrow")}
        </p>
        <h1 className="mt-6 text-3xl sm:text-5xl font-bold tracking-tight text-[var(--foreground)]">
          {t(lang, "home.referenceTitle")}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm sm:text-base leading-relaxed text-[var(--muted)]">
          {t(lang, "home.referenceSubtitle")}
        </p>
        <div className="max-w-3xl mx-auto mt-9 text-left">
          <SearchBar lang={lang} variant="hero" />
        </div>
      </div>
    </section>
  );
}
