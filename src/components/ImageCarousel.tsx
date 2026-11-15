"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
  /** compact = listing card; full = detail page */
  variant?: "compact" | "full" | "row";
};

export function ImageCarousel({ images, alt, variant = "compact" }: Props) {
  const [index, setIndex] = useState(0);
  const urls = images.length > 0 ? images : [];
  const height =
    variant === "full" ? "h-72 sm:h-96" : variant === "row" ? "h-56 sm:h-full" : "h-56";
  const corners = variant === "row" ? "" : "rounded-t-2xl";

  if (urls.length === 0) {
    return (
      <div
        className={`${height} ${corners} flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-500`}
      >
        No photos
      </div>
    );
  }

  const prev = () => setIndex((i) => (i === 0 ? urls.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === urls.length - 1 ? 0 : i + 1));

  return (
    <div className={`relative ${height} ${corners} overflow-hidden bg-slate-100`}>
      <Image
        key={urls[index]}
        src={urls[index]!}
        alt={`${alt} — photo ${index + 1}`}
        fill
        className="rise-fade object-cover"
        sizes={variant === "full" ? "(max-width: 768px) 100vw, 66vw" : "50vw"}
        priority={index === 0}
      />
      {variant === "row" ? (
        <span className="absolute bottom-2 right-2 z-10 rounded-md bg-black/65 px-2 py-0.5 text-xs font-medium text-white">
          {index + 1} / {urls.length}
        </span>
      ) : null}
      {urls.length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-slate-800 shadow-md hover:bg-white"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-slate-800 shadow-md hover:bg-white"
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={[
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/60",
                ].join(" ")}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
