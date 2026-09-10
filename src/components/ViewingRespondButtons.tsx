"use client";

import { useActionState } from "react";
import { respondToViewing, type ViewingActionResult } from "@/lib/viewing-actions";
import { type Lang, t } from "@/lib/i18n";

export function ViewingRespondButtons({
  viewingId,
  lang,
}: {
  viewingId: string;
  lang: Lang;
}) {
  const [state, action, pending] = useActionState<
    ViewingActionResult | null,
    FormData
  >(respondToViewing, null);

  return (
    <div className="mt-2 flex gap-2">
      <form action={action}>
        <input type="hidden" name="viewingId" value={viewingId} />
        <input type="hidden" name="decision" value="ACCEPTED" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--success)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {t(lang, "inbox.accept")}
        </button>
      </form>
      <form action={action}>
        <input type="hidden" name="viewingId" value={viewingId} />
        <input type="hidden" name="decision" value="DECLINED" />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--brand-50)] disabled:opacity-60"
        >
          {t(lang, "inbox.decline")}
        </button>
      </form>
      {state && !state.ok ? (
        <p className="w-full text-xs text-red-600">{state.error}</p>
      ) : null}
    </div>
  );
}
