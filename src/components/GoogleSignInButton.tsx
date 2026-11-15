"use client";
import { useSearchParams } from "next/navigation";
import { type Lang, t } from "@/lib/i18n";
export function GoogleSignInButton({
  next = "/",
  lang = "en",
}: {
  next?: string;
  lang?: Lang;
}) {
  const error = useSearchParams().get("authError");
  const message =
    error === "google_email"
      ? t(lang, "google.useEmail")
      : error === "google_unavailable"
        ? t(lang, "google.unavailable")
        : error === "google_failed"
          ? t(lang, "google.failed")
          : null;
  return (
    <div className="space-y-3">
      <a
        href={`/api/auth/google?${new URLSearchParams({ next })}`}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white text-sm font-semibold hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.95c1.47 0 2.78.51 3.82 1.52l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59A6 6 0 0 1 12 5.95Z"
          />
        </svg>
        {t(lang, "google.continue")}
      </a>
      {message && (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}
