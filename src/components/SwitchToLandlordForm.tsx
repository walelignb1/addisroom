"use client";

import { useActionState } from "react";
import {
  switchToLandlord,
  type SwitchToLandlordResult,
} from "@/lib/profile-actions";
import { type Lang, t } from "@/lib/i18n";

export function SwitchToLandlordForm({
  lang,
  next,
}: {
  lang: Lang;
  next: string;
}) {
  const [state, action, pending] = useActionState<
    SwitchToLandlordResult | null,
    FormData
  >(switchToLandlord, null);

  return (
    <form action={action} className="space-y-5">
      {next.startsWith("/") ? (
        <input type="hidden" name="next" value={next} />
      ) : null}

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-1 text-sm font-semibold">
          {t(lang, "profile.landlordPrefs")}
        </legend>
        <p className="mb-3 text-xs text-[var(--muted)]">
          {t(lang, "profile.landlordPrefsHint")}
        </p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="livesInProperty" value="yes" required />
            {t(lang, "profile.livesInYes")}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="livesInProperty" value="no" />
            {t(lang, "profile.livesInNo")}
          </label>
        </div>
      </fieldset>

      {state && !state.ok ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary h-12 w-full disabled:opacity-60"
      >
        {pending ? "…" : t(lang, "listing.postGateCta")}
      </button>
    </form>
  );
}
