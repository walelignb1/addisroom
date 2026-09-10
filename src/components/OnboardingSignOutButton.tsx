"use client";

import { logout } from "@/lib/auth-actions";
import { type Lang, t } from "@/lib/i18n";

export function OnboardingSignOutButton({ lang }: { lang: Lang }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]"
      >
        {t(lang, "nav.logout")}
      </button>
    </form>
  );
}
