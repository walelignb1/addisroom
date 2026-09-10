"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseLang, t, type MessageKey } from "@/lib/i18n";

const MESSAGE_KEY: Record<string, MessageKey> = {
  paid: "payment.toastPaid",
  pending: "payment.toastPending",
  failed: "payment.toastFailed",
  error: "payment.toastError",
};

const VARIANT_CLASSES: Record<string, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-900",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  failed: "border-red-200 bg-red-50 text-red-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

/** Reads ?payment= off the URL (set by the Chapa return/verify redirect) and
 * surfaces it as a one-time toast, then strips it so it doesn't reappear on
 * refresh or back-navigation. */
export function PaymentToast() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  const payment = searchParams.get("payment");
  const lang = parseLang(searchParams.get("lang"));

  useEffect(() => {
    if (!payment || !(payment in MESSAGE_KEY)) return;

    setVisible(true);
    const hide = setTimeout(() => setVisible(false), 4000);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("payment");
    const query = nextParams.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });

    return () => clearTimeout(hide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  if (!payment || !(payment in MESSAGE_KEY)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed inset-x-4 top-4 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 sm:left-auto sm:right-4",
        VARIANT_CLASSES[payment],
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
      ].join(" ")}
    >
      {t(lang, MESSAGE_KEY[payment])}
    </div>
  );
}
