"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { logout } from "@/lib/auth-actions";
import { parseLang, t } from "@/lib/i18n";

function SignInButton() {
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams.get("lang"));

  function href(path: string) {
    const params = new URLSearchParams(searchParams.toString());
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  return (
    <a href={href("/login")} className="btn-primary px-4 py-2 text-sm">
      {t(lang, "nav.login")}
    </a>
  );
}

function LogOutButton() {
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams.get("lang"));

  return (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]"
      >
        {t(lang, "nav.logout")}
      </button>
    </form>
  );
}

export function AppHeader({ loggedIn = false }: { loggedIn?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)]/80 bg-[var(--surface)]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:py-4">
        <a href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent)] text-sm font-bold text-white shadow-md shadow-blue-300/30">
            AR
          </span>
          <span className="text-lg font-bold tracking-tight text-[var(--brand-900)]">
            AddisRoom
          </span>
        </a>
        <nav className="flex items-center gap-2 text-sm">
          <Suspense
            fallback={
              <div className="h-9 w-24 rounded-lg border border-[var(--border)] bg-[var(--brand-50)]" />
            }
          >
            <LanguageSwitcher />
          </Suspense>
          {!loggedIn ? (
            <Suspense fallback={null}>
              <SignInButton />
            </Suspense>
          ) : (
            <Suspense fallback={null}>
              <LogOutButton />
            </Suspense>
          )}
        </nav>
      </div>
    </header>
  );
}
