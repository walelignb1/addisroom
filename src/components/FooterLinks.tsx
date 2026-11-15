"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { parseLang, t } from "@/lib/i18n";
export function FooterLinks() {
  const sp = useSearchParams(),
    lang = parseLang(sp.get("lang")),
    qs = lang === "en" ? "" : `?lang=${lang}`;
  return (
    <div className="flex flex-wrap justify-between gap-4 mt-5 text-xs text-[var(--muted)]">
      <p>Addis Ababa — {t(lang, "footer.tagline")}</p>
      <nav className="flex gap-4">
        <Link href={`/search${qs}`}>{t(lang, "footer.browse")}</Link>
        <Link href={`/signup${qs}`}>{t(lang, "footer.signup")}</Link>
      </nav>
    </div>
  );
}
