"use client";

import { useActionState } from "react";
import { Role } from "@prisma/client";
import { completeProfile, type CompleteProfileResult } from "@/lib/profile-actions";
import { GENDERS } from "@/lib/profile";
import { ROLES } from "@/lib/addis";
import { AgentVerifiedField } from "@/components/AgentVerifiedField";
import { type Lang, t } from "@/lib/i18n";

export function ProfileOnboardingForm({
  lang,
  next,
  defaultRole,
}: {
  lang: Lang;
  next: string;
  defaultRole?: Role;
}) {
  const [state, action, pending] = useActionState<
    CompleteProfileResult | null,
    FormData
  >(completeProfile, null);

  const inputClass = "input-field mt-2";

  return (
    <form action={action} className="space-y-5">
      {next.startsWith("/") ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <label className="text-sm font-medium">{t(lang, "profile.role")}</label>
        <select
          name="role"
          required
          defaultValue={defaultRole ?? "TENANT"}
          className={inputClass}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">{t(lang, "profile.age")}</label>
          <input
            name="age"
            type="number"
            required
            min={18}
            max={100}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t(lang, "profile.gender")}</label>
          <select name="gender" required className={inputClass} defaultValue="">
            <option value="" disabled>
              {t(lang, "profile.selectGender")}
            </option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">{t(lang, "profile.photo")}</label>
        <input
          name="photoUrl"
          type="url"
          required
          placeholder="https://example.com/photo.jpg"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--muted)]">{t(lang, "profile.photoHint")}</p>
      </div>

      <div>
        <label className="text-sm font-medium">{t(lang, "profile.bio")}</label>
        <textarea name="bio" rows={3} className={`${inputClass} w-full`} />
      </div>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-1 text-sm font-semibold">
          {t(lang, "profile.landlordPrefs")}
        </legend>
        <p className="mb-3 text-xs text-[var(--muted)]">
          {t(lang, "profile.landlordPrefsHint")}
        </p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="livesInProperty" value="yes" />
            {t(lang, "profile.livesInYes")}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="livesInProperty" value="no" />
            {t(lang, "profile.livesInNo")}
          </label>
        </div>
        <div className="mt-4">
          <AgentVerifiedField />
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-[var(--border)] p-4">
        <legend className="px-1 text-sm font-semibold">
          {t(lang, "profile.renterPrefs")}
        </legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="smokingOk" />
            {t(lang, "profile.smokingOk")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="petsOk" />
            {t(lang, "profile.petsOk")}
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
        {pending ? "…" : t(lang, "profile.finish")}
      </button>
    </form>
  );
}
