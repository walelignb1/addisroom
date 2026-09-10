"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { parseLang, t } from "@/lib/i18n";

function NavIcon({
  name,
  active,
}: {
  name: "home" | "saved" | "post" | "inbox" | "profile";
  active: boolean;
}) {
  const stroke = active ? "var(--brand-700)" : "var(--muted)";
  const fill = active ? "var(--brand-100)" : "none";

  if (name === "home") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "saved") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} aria-hidden>
        <path
          d="M12 20.5 5.5 14A5.5 5.5 0 1 1 12 8.5a5.5 5.5 0 1 1 6.5 5.5c0 1.45-.57 2.84-1.6 3.86L12 20.5Z"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "post") {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="url(#postGrad)" />
        <path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id="postGrad" x1="4" y1="4" x2="20" y2="20">
            <stop stopColor="var(--brand-600)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (name === "inbox") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} aria-hidden>
        <path
          d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
          stroke={stroke}
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke={stroke} strokeWidth="1.75" />
      <path
        d="M6 19c0-3.3 2.7-5 6-5s6 1.7 6 5"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BottomNavInner({ canPost }: { canPost: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = parseLang(searchParams.get("lang"));

  function href(path: string) {
    const params = new URLSearchParams(searchParams.toString());
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  }

  const tabs = [
    { id: "home" as const, href: "/", match: (p: string) => p === "/" },
    { id: "saved" as const, href: "/saved", match: (p: string) => p === "/saved" },
    {
      id: "post" as const,
      href: canPost ? "/listings/new" : "/listings/new/upgrade",
      match: (p: string) => p.startsWith("/listings/new"),
    },
    { id: "inbox" as const, href: "/inbox", match: (p: string) => p === "/inbox" },
    {
      id: "profile" as const,
      href: "/profile",
      match: (p: string) => p === "/profile" || p.startsWith("/profiles/"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_32px_rgba(26,46,66,0.08)] backdrop-blur-xl"
      aria-label={t(lang, "nav.bottomLabel")}
    >
      <div className="mx-auto flex max-w-lg items-end justify-around px-2 pt-2">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const isPost = tab.id === "post";

          if (isPost) {
            return (
              <a
                key={tab.id}
                href={href(tab.href)}
                className="-mt-5 flex flex-col items-center gap-0.5"
                aria-current={active ? "page" : undefined}
              >
                <NavIcon name="post" active={active} />
                <span className="text-[10px] font-semibold text-[var(--brand-700)]">
                  {t(lang, "nav.post")}
                </span>
              </a>
            );
          }

          return (
            <a
              key={tab.id}
              href={href(tab.href)}
              className={[
                "flex min-w-[3.5rem] flex-col items-center gap-1 rounded-xl px-3 py-2 transition",
                active ? "text-[var(--brand-800)]" : "text-[var(--muted)]",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <NavIcon name={tab.id} active={active} />
              <span
                className={[
                  "text-[10px] font-medium",
                  active ? "font-semibold" : "",
                ].join(" ")}
              >
                {t(lang, `nav.bottom.${tab.id}`)}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav({ canPost }: { canPost: boolean }) {
  return (
    <Suspense fallback={null}>
      <BottomNavInner canPost={canPost} />
    </Suspense>
  );
}
