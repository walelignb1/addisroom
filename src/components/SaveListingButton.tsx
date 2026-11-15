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
        "absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition hover:scale-110 active:scale-90",
        saved
          ? "bg-rose-500 text-white hover:bg-rose-600"
          : "bg-white/95 text-slate-400 hover:text-rose-500",
        pending ? "opacity-60" : "",
      ].join(" ")}
    >
      <svg
        key={String(saved)}
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        className="heart-pop h-5 w-5"
        aria-hidden
      >
        <path
          d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
