import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 100);
  const status = ["PENDING", "APPROVED", "REJECTED", "NOT_SUBMITTED"].includes(
    sp.status ?? "",
  )
    ? sp.status
    : undefined;
  const page = Math.max(1, Math.min(10000, Number(sp.page) || 1));
  const where = {
    ...(status ? { identityStatus: status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };
  const [total, pending, approved, listings, matched, users, audits] =
    await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { identityStatus: "PENDING" } }),
      prisma.profile.count({ where: { identityStatus: "APPROVED" } }),
      prisma.listing.count(),
      prisma.profile.count({ where }),
      prisma.profile.findMany({
        where,
        orderBy: [{ identitySubmittedAt: "desc" }, { createdAt: "desc" }],
        take: 25,
        skip: (page - 1) * 25,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          identityStatus: true,
          emailVerifiedAt: true,
          phoneVerifiedAt: true,
          createdAt: true,
        },
      }),
      prisma.adminAudit.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    ]);
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--brand-600)] font-semibold">
          Trust & account operations
        </p>
        <h1 className="text-3xl font-bold mt-2">Admin overview</h1>
        <p className="text-[var(--muted)] mt-2">
          Review identities, check contact verification, and manage the MVP’s
          user queue.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Registered users", total],
          ["Awaiting review", pending],
          ["Identity approved", approved],
          ["Property listings", listings],
        ].map(([label, count]) => (
          <div className="card p-5" key={label}>
            <p className="text-sm text-[var(--muted)]">{label}</p>
            <p className="text-3xl font-bold mt-3">{count}</p>
          </div>
        ))}
      </div>
      <section className="card overflow-hidden">
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold">Users & verification queue</h2>
          <form className="mt-4 flex flex-wrap gap-3">
            <input
              name="q"
              aria-label="Search users"
              defaultValue={q}
              placeholder="Name, email or phone"
              className="input-field flex-1 min-w-48"
            />
            <select
              name="status"
              aria-label="Identity status"
              defaultValue={status ?? ""}
              className="input-field !w-auto"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Awaiting review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="NOT_SUBMITTED">Not submitted</option>
            </select>
            <button className="btn-primary px-5">Filter users</button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--brand-50)]">
              <tr>
                {["User", "Role", "Contact", "Identity", ""].map((v, i) => (
                  <th key={i} className="p-4 font-medium">
                    {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border)]">
                  <td className="p-4">
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {u.email ?? u.phone ?? "No contact"}
                    </p>
                  </td>
                  <td className="p-4">{u.role}</td>
                  <td className="p-4">
                    {u.emailVerifiedAt
                      ? "Email verified"
                      : u.phoneVerifiedAt
                        ? "Phone verified"
                        : "Unverified"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${u.identityStatus === "APPROVED" ? "bg-green-100 text-green-800" : u.identityStatus === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-50 text-amber-900"}`}
                    >
                      {u.identityStatus.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      className="text-[var(--brand-600)] font-semibold underline"
                      href={`/admin/users/${u.id}`}
                    >
                      View profile →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && (
            <p className="p-8 text-center text-[var(--muted)]">
              No users match these filters.
            </p>
          )}
        </div>
        <div className="p-4 flex gap-5 text-sm border-t border-[var(--border)]">
          <span>
            {matched} users · Page {page}
          </span>
          {page > 1 && (
            <Link
              href={`/admin?${new URLSearchParams({ q, status: status ?? "", page: String(page - 1) })}`}
            >
              Previous
            </Link>
          )}
          {page * 25 < matched && (
            <Link
              href={`/admin?${new URLSearchParams({ q, status: status ?? "", page: String(page + 1) })}`}
            >
              Next
            </Link>
          )}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="font-semibold text-xl">Recent review decisions</h2>
        {audits.length ? (
          <ul className="mt-4 divide-y divide-[var(--border)]">
            {audits.map((a) => (
              <li key={a.id} className="py-3 text-sm">
                <Link
                  className="underline"
                  href={`/admin/users/${a.profileId}`}
                >
                  {a.decision}
                </Link>
                <span className="text-[var(--muted)]">
                  {" "}
                  · {a.createdAt.toLocaleString("en-GB")}
                </span>
                <p className="mt-1">{a.note}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Review decisions will appear here.
          </p>
        )}
      </section>
    </div>
  );
}
