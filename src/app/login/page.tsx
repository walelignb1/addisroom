import { Suspense } from "react";
import { parseLang, t } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage(props: {
  searchParams?: Promise<{ lang?: string; next?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const next = (sp.next ?? "").trim();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex justify-end">
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/15 bg-[var(--surface)]/95 p-8 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[var(--brand-600)]">
              AddisRoom
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)]">
              {t(lang, "login.title")}
            </h1>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {t(lang, "login.subtitle")}
            </p>
          </div>

          <LoginForm lang={lang} next={next} />
        </div>
      </div>
    </div>
  );
}
