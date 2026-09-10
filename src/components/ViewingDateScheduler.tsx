"use client";

import { useActionState } from "react";
import { proposeViewing, type ViewingActionResult } from "@/lib/viewing-actions";
import { type Lang, t } from "@/lib/i18n";

export function ViewingDateScheduler({
  listingId,
  lang,
}: {
  listingId: string;
  lang: Lang;
}) {
  const [state, action, pending] = useActionState<
    ViewingActionResult | null,
    FormData
  >(proposeViewing, null);

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + 30);
  const minLocal = minDate.toISOString().slice(0, 16);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--muted)]">{t(lang, "viewing.hint")}</p>
      <form action={action} className="space-y-3">
        <input type="hidden" name="listingId" value={listingId} />
        <div>
          <label className="text-sm font-medium">{t(lang, "viewing.datetime")}</label>
          <input
            name="proposedAt"
            type="datetime-local"
            required
            min={minLocal}
            className="input-field mt-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t(lang, "viewing.note")}</label>
          <textarea
            name="note"
            rows={2}
            placeholder={t(lang, "viewing.notePlaceholder")}
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-500)]/20"
          />
        </div>
        {state && !state.ok ? (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="text-sm text-[var(--success)]" role="status">
            {t(lang, "viewing.sent")}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
        >
          {pending ? "…" : t(lang, "viewing.submit")}
        </button>
      </form>
    </div>
  );
}
