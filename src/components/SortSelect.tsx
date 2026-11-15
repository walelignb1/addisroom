"use client";

import { useRouter } from "next/navigation";
import { type Lang, t } from "@/lib/i18n";
import { SORT_OPTIONS, type SortKey } from "@/lib/search-shared";

/** Sort dropdown: `urls` holds the ready-made link for each sort order. */
export function SortSelect({
  lang,
  value,
  urls,
}: {
  lang: Lang;
  value: SortKey;
  urls: Record<SortKey, string>;
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2.5 text-sm text-[var(--muted)]">
      {t(lang, "search.sort")}
      <select
        value={value}
        onChange={(e) => router.push(urls[e.target.value as SortKey])}
        className="home-input h-11 min-w-[12rem] font-medium"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {t(lang, `sort.${s}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
