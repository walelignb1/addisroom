import { ADDIS_NEIGHBORHOODS } from "@/lib/addis";
import { type Lang, t } from "@/lib/i18n";

/** Endless strip of neighborhood chips; each one filters the listings. */
export function AreaMarquee({ lang }: { lang: Lang }) {
  const langQs = lang !== "en" ? `&lang=${lang}` : "";
  const row = (hidden: boolean) => (
    <ul className="marquee-row" aria-hidden={hidden || undefined}>
      {ADDIS_NEIGHBORHOODS.map((n) => (
        <li key={n}>
          <a
            href={`/search?deal=rent&neighborhood=${encodeURIComponent(n)}${langQs}`}
            tabIndex={hidden ? -1 : undefined}
            className="area-chip"
          >
            <span className="area-chip-dot" />
            {n}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <section aria-label={t(lang, "home.popular")} className="full-bleed marquee">
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
