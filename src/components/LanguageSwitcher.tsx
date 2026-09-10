"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseLang, type Lang } from "@/lib/i18n";

const options: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ" },
  { value: "om", label: "Afaan Oromoo" },
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams.get("lang"));

  function onChange(next: Lang) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "en") params.delete("lang");
    else params.set("lang", next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <select
      value={lang}
      onChange={(e) => onChange(parseLang(e.target.value))}
      aria-label="Language"
      className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm font-medium text-[var(--foreground)] outline-none focus:border-[var(--brand-500)]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
