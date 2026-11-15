import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ListingModeration } from "@/components/AdminControls";
export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams,
    q = (sp.q ?? "").slice(0, 100),
    page = Math.max(1, Math.min(10000, Number(sp.page) || 1));
  const where = q
    ? { OR: [{ title: { contains: q } }, { neighborhood: { contains: q } }] }
    : {};
  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 25,
      skip: (page - 1) * 25,
      include: { postedBy: { select: { id: true, name: true } } },
    }),
    prisma.listing.count({ where }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manage listings</h1>
        <p className="text-sm text-[var(--muted)] mt-2">
          Remove inappropriate listings from browsing, or restore them. Removal
          preserves messages, payments, and the audit trail.
        </p>
      </div>
      <form className="flex gap-3">
        <input
          className="input-field"
          name="q"
          defaultValue={q}
          placeholder="Search title or neighborhood"
          aria-label="Search listings"
        />
        <button className="btn-primary px-5">Search</button>
      </form>
      <div className="space-y-3">
        {listings.map((l) => (
          <article
            key={l.id}
            className="card p-5 grid gap-4 sm:grid-cols-[1fr_260px]"
          >
            <div>
              <h2 className="font-semibold">
                <Link href={`/listings/${l.id}`}>{l.title}</Link>
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {l.neighborhood} · {l.priceBirr.toLocaleString()} birr ·{" "}
                {l.dealType}
              </p>
              <p className="mt-2 text-xs">
                Posted by{" "}
                <Link
                  className="underline"
                  href={`/admin/users/${l.postedBy.id}`}
                >
                  {l.postedBy.name}
                </Link>
              </p>
              <span className="status-pill inline-block mt-3">
                {l.archivedAt
                  ? "Removed"
                  : l.published
                    ? "Published"
                    : "Unpublished"}
              </span>
            </div>
            <ListingModeration id={l.id} archived={!!l.archivedAt} />
          </article>
        ))}
        {!listings.length && (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            No listings found.
          </div>
        )}
      </div>
      <div className="text-sm flex gap-5">
        <span>
          {total} listings · Page {page}
        </span>
        {page > 1 && (
          <Link
            href={`/admin/listings?${new URLSearchParams({ q, page: String(page - 1) })}`}
          >
            Previous
          </Link>
        )}
        {page * 25 < total && (
          <Link
            href={`/admin/listings?${new URLSearchParams({ q, page: String(page + 1) })}`}
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
