"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
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
    <a href={href("/login")} className="header-btn btn-primary btn-shine">
      {t(lang, "nav.login")}
    </a>
  );
}

function MainLinks({ showPost }: { showPost: boolean }) {
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams.get("lang"));
  const amp = lang !== "en" ? `&lang=${lang}` : "";
  const qs = lang !== "en" ? `?lang=${lang}` : "";

  return (
    <div className="mr-auto hidden items-center gap-4 pl-1 sm:flex sm:gap-7 sm:pl-8">
      <a href={`/search?deal=rent${amp}`} className="nav-link">
        {t(lang, "nav.rent")}
      </a>
      <a href={`/search?deal=sale${amp}`} className="nav-link">
        {t(lang, "nav.buy")}
      </a>
      {showPost ? (
        <a href={`/listings/new${qs}`} className="nav-link hidden md:block">
          {t(lang, "nav.post")}
        </a>
      ) : null}
    </div>
  );
}

function LogOutButton() {
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams.get("lang"));

  return (
    <form action={logout}>
      <button
        type="submit"
        className="header-btn border border-[var(--border)] font-medium text-[var(--muted)] transition hover:border-[var(--brand-300)] hover:text-[var(--brand-700)]"
      >
        {t(lang, "nav.logout")}
      </button>
    </form>
  );
}

export function AppHeader({
  loggedIn = false,
  isAdmin = false,
}: {
  loggedIn?: boolean;
  isAdmin?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          aria-label="AddisRoom home"
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="logo-mark">AR</span>
          <span className="hidden text-lg font-bold leading-none tracking-tight text-[var(--brand-900)] sm:block">
            AddisRoom
          </span>
        </Link>
        <nav className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-sm">
          <Suspense fallback={<div className="mr-auto" />}>
            <MainLinks showPost={!loggedIn} />
          </Suspense>
          {isAdmin && (
            <a href="/admin" className="nav-link">
              Admin
            </a>
          )}
          <Suspense
            fallback={
              <div className="h-10 w-28 rounded-xl border border-[var(--border)] bg-[var(--brand-50)]" />
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
