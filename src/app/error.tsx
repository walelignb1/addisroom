"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--brand-200)] bg-[var(--brand-50)] p-8 text-center">
      <h2 className="text-lg font-semibold text-[var(--brand-900)]">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        The page hit an unexpected error. Try again, or return to the homepage.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-primary px-4 py-2 text-sm">
          Try again
        </button>
        <a
          href="/"
          className="rounded-xl border border-[var(--brand-300)] px-4 py-2 text-sm font-medium text-[var(--brand-800)] hover:bg-[var(--brand-100)]"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
