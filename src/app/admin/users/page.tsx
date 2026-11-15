import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { UserControls } from "@/components/AdminControls";
import { ProfileAvatar } from "@/components/ProfileAvatar";
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams,
    q = (sp.q ?? "").slice(0, 100),
    page = Math.max(1, Math.min(10000, Number(sp.page) || 1));
  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      }
    : {};
  const [users, total] = await Promise.all([
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 25,
      skip: (page - 1) * 25,
    }),
    prisma.profile.count({ where }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Review accounts and suspend or restore users. Admin accounts cannot be
          suspended.{" "}
          {admin.isSuperAdmin
            ? "As super admin, you can also grant or revoke regular admin access."
            : "Admin access is managed by the super admin."}
        </p>
      </div>
      <form className="flex gap-3">
        <input
          className="input-field"
          name="q"
          defaultValue={q}
          aria-label="Search users"
          placeholder="Search name, email or phone"
        />
        <button className="btn-primary px-5">Search</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {["User", "Contact", "Role", "Joined", "Access", "Actions"].map(
                (v) => (
                  <th key={v}>{v}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="flex gap-3 items-center font-medium"
                  >
                    <ProfileAvatar
                      name={u.name}
                      photoUrl={u.photoUrl}
                      size="sm"
                    />
                    {u.name}
                  </Link>
                  <span className="text-xs text-[var(--muted)]">
                    {u.identityStatus.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="break-all">{u.email ?? u.phone}</td>
                <td>{u.role}</td>
                <td>{u.createdAt.toLocaleDateString("en-GB")}</td>
                <td>
                  <span className="status-pill">
                    {u.suspendedAt
                      ? "Suspended"
                      : u.isSuperAdmin
                        ? "Super admin"
                        : u.isAdmin
                          ? "Admin"
                          : "Active"}
                  </span>
                </td>
                <td>
                  <UserControls
                    id={u.id}
                    suspended={!!u.suspendedAt}
                    isAdmin={u.isAdmin}
                    isSuperAdmin={u.isSuperAdmin}
                    canManageAdmin={admin.isSuperAdmin}
                    self={u.id === admin.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && <p className="p-6 text-sm">No matching users.</p>}
      </div>
      <div className="flex gap-5 text-sm">
        <span>
          {total} users · Page {page}
        </span>
        {page > 1 && (
          <Link
            href={`/admin/users?${new URLSearchParams({ q, page: String(page - 1) })}`}
          >
            Previous
          </Link>
        )}
        {page * 25 < total && (
          <Link
            href={`/admin/users?${new URLSearchParams({ q, page: String(page + 1) })}`}
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
