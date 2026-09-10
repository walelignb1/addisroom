"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginWithPassword, type LoginPasswordResult } from "@/lib/auth-actions";
import { t, type Lang } from "@/lib/i18n";
import { PasswordInput } from "@/components/PasswordInput";

export function LoginForm({
  lang,
  next,
}: {
  lang: Lang;
  next: string;
}) {
  const [loginState, loginAction, loginPending] = useActionState<
    LoginPasswordResult | null,
    FormData
  >(loginWithPassword, null);

  const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-[var(--foreground)] outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/25";

  const signupParams = new URLSearchParams();
  if (lang !== "en") signupParams.set("lang", lang);
  if (next.startsWith("/")) signupParams.set("next", next);
  const signupHref = `/signup${signupParams.toString() ? `?${signupParams}` : ""}`;

  return (
    <form action={loginAction} className="space-y-4">
      {next.startsWith("/") ? (
        <input type="hidden" name="next" value={next} />
      ) : null}
      <div>
        <label htmlFor="contact" className="text-sm font-medium">
          {t(lang, "login.contact")}
        </label>
        <input
          id="contact"
          name="contact"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="09xxxxxxxx or you@email.com"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">
          {t(lang, "login.password")}
        </label>
        <PasswordInput
          lang={lang}
          id="password"
          name="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      {loginState && !loginState.ok ? (
        <p className="text-sm text-red-600" role="alert">
          {loginState.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loginPending}
        className="btn-primary h-12 w-full disabled:opacity-60"
      >
        {loginPending ? "…" : t(lang, "login.signIn")}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        {t(lang, "login.noAccount")}{" "}
        <Link
          href={signupHref}
          className="font-medium text-[var(--brand-600)] hover:underline"
        >
          {t(lang, "login.createAccount")}
        </Link>
      </p>
    </form>
  );
}
