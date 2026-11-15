import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/auth-actions";
import { AdminTabs } from "@/components/AdminTabs";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="admin-header">
        <div className="mx-auto max-w-6xl px-4 flex items-center gap-3 h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-[var(--brand-900)]"
          >
            <span className="logo-mark">AR</span>AddisRoom
          </Link>
          <span className="ml-auto hidden sm:block text-xs text-[var(--muted)]">
            {admin.name} ·{" "}
            {admin.isSuperAdmin ? "Super admin" : "Administrator"}
          </span>
          <Link href="/" className="admin-button">
            Website
          </Link>
          <form action={logout}>
            <button className="admin-button">Sign out</button>
          </form>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <AdminTabs />
      </div>
      <main className="max-w-5xl mx-auto px-4 py-7 pb-16">{children}</main>
    </div>
  );
}
