"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function AdminTabs() {
  const path = usePathname();
  const tabs = [
    ["/admin", "Overview & identities"],
    ["/admin/agents", "Agent verification"],
    ["/admin/sponsorships", "Sponsorships"],
    ["/admin/users", "Users"],
    ["/admin/listings", "Manage listings"],
  ];
  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      {tabs.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={
            (href === "/admin" ? path === href : path.startsWith(href))
              ? "page"
              : undefined
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
