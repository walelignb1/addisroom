"use client";

import { useTransition } from "react";
import { toggleSaveListing } from "@/lib/auth-actions";

export function SaveListingButton({
  listingId,
  saved,
}: {
  listingId: string;
  saved: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={saved ? "Remove from saved" : "Save property"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(() => toggleSaveListing(listingId));
      }}
      className={[
        "absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition",
        saved
          ? "bg-rose-500 text-white hover:bg-rose-600"
          : "bg-white/95 text-slate-400 hover:text-rose-500",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <span className="text-lg leading-none">{saved ? "❤️" : "🤍"}</span>
    </button>
  );
}
