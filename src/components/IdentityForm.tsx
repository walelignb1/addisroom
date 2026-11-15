"use client";
import { useActionState, useState } from "react";
import { submitIdentity } from "@/lib/identity-actions";
export function IdentityForm({
  name,
  address = "",
  city = "Addis Ababa",
  subCity = "",
  woreda = "",
}: {
  name: string;
  address?: string;
  city?: string;
  subCity?: string;
  woreda?: string;
}) {
  const [state, action, pending] = useActionState(submitIdentity, null);
  const [type, setType] = useState("FAYDA_FIN");
  return (
    <form action={action} onReset={(event) => event.preventDefault()} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["legalName", "Full legal name", name],
          ["city", "City", city],
          ["subCity", "Sub-city", subCity],
          ["woreda", "Woreda", woreda],
          ["address", "Residential address / house number", address],
        ].map(([field, label, initial]) => (
          <label key={field} className="block text-sm font-medium">
            {label}
            <input
              className="input-field mt-2"
              name={field}
              defaultValue={initial}
              required
              maxLength={field === "address" ? 300 : 100}
            />
          </label>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--border)] p-5 space-y-4">
        <h2 className="font-semibold">Identity document</h2>
        <label className="block text-sm">
          Document type
          <select
            className="input-field mt-2"
            name="idType"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="FAYDA_FIN">Fayda — 12-digit FIN</option>
            <option value="FAYDA_FAN">Fayda — 16-digit FAN</option>
            <option value="GOVERNMENT_ID">Other government photo ID</option>
          </select>
        </label>
        <label className="block text-sm">
          {type === "GOVERNMENT_ID" ? "ID number" : "Fayda number"}
          <input
            className="input-field mt-2"
            name="idNumber"
            required
            autoComplete="off"
            maxLength={40}
            inputMode={type === "GOVERNMENT_ID" ? "text" : "numeric"}
          />
        </label>
        <p className="text-xs text-[var(--muted)]">
          Only the last four characters of the entered number are stored.
          Document images are encrypted and available only to you and authorized
          administrators.
        </p>
        <label className="block text-sm font-medium">
          Clear photo of your ID
          <input
            className="input-field mt-2"
            type="file"
            name="document"
            accept="image/jpeg,image/png"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Your recent portrait / selfie
          <input
            className="input-field mt-2"
            type="file"
            name="portrait"
            accept="image/jpeg,image/png"
            required
          />
        </label>
        <p className="text-xs text-[var(--muted)]">
          JPEG or PNG, up to 3 MB each. Your name and photo must be readable.
          This is a manual document review, not official Fayda authentication or
          automated face matching.
        </p>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          I confirm these details and documents are mine, and consent to
          AddisRoom administrators reviewing them to verify my account. My
          address and ID will not appear on my public profile.
        </span>
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        className="btn-primary w-full py-3 disabled:opacity-50"
        disabled={pending}
      >
        {pending ? "Uploading securely…" : "Submit for identity review"}
      </button>
    </form>
  );
}
