import { Suspense } from "react";
import { parseLang, t } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignupForm } from "@/components/SignupForm";

export default async function SignupPage(props: {
  searchParams?: Promise<{ lang?: string; next?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const next = (sp.next ?? "").trim();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <a
          href={lang !== "en" ? `/?lang=${lang}` : "/"}
          className="flex items-center gap-2.5"
        >
          <span className="logo-mark">AR</span>
          <span className="text-lg font-bold leading-none tracking-tight text-[var(--brand-900)]">
            AddisRoom
          </span>
        </a>
        <Suspense fallback={null}>
          <LanguageSwitcher />
        </Suspense>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 pb-16 pt-6">
        <div className="w-full max-w-md">

        <div className="rise-in overflow-hidden rounded-3xl border border-white/15 bg-[var(--surface)]/95 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-600)]">
              AddisRoom
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {t(lang, "signup.title")}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t(lang, "signup.subtitle")}
            </p>
          </div>

          <SignupForm lang={lang} next={next} />
        </div>
        </div>
      </main>
    </div>
  );
}
