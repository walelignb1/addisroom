"use client";

import { useState } from "react";
import { type Lang, t } from "@/lib/i18n";

export function ChapaPayButton({
  listingId,
  amountBirr,
  lang,
  status,
}: {
  listingId: string;
  amountBirr: number;
  lang: Lang;
  status?: "PENDING" | "PAID" | "FAILED";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "PAID") {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
        {t(lang, "payment.paid").replace("{amount}", amountBirr.toLocaleString())}
      </p>
    );
  }

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkoutUrl) {
        throw new Error(json.error ?? "Could not start payment");
      }
      window.location.href = json.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setLoading(false);
    }
  }

  const label =
    status === "FAILED"
      ? t(lang, "payment.retry")
      : `${t(lang, "payment.pay")} (${amountBirr.toLocaleString()} birr)`;

  return (
    <div className="space-y-3">
      {status === "FAILED" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {t(lang, "payment.failed")}
        </p>
      ) : status === "PENDING" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t(lang, "payment.pending")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="w-full rounded-xl bg-[#2eab6f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#259a63] disabled:opacity-60"
      >
        {loading ? "…" : label}
      </button>
    </div>
  );
}
