import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminReviewForm } from "@/components/AdminReviewForm";
export default async function UserReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await prisma.profile.findUnique({
    where: { id },
    include: {
      documents: { select: { id: true, kind: true } },
      _count: { select: { listings: true, sentMessages: true } },
    },
  });
  if (!user) notFound();
  const audits = await prisma.adminAudit.findMany({
    where: { profileId: id },
    orderBy: { createdAt: "desc" },
  });
  const fields = [
    ["Account role", user.role],
    ["Email", user.email],
    ["Email verified", user.emailVerifiedAt?.toLocaleString("en-GB") ?? "No"],
    ["Phone", user.phone],
    ["Phone verified", user.phoneVerifiedAt?.toLocaleString("en-GB") ?? "No"],
    ["Age", user.age],
    ["Gender", user.gender],
    ["Address", user.address],
    [
      "City / sub-city / woreda",
      [user.city, user.subCity, user.woreda].filter(Boolean).join(" / "),
    ],
    ["ID type", user.idType],
    ["ID ending", user.idLastFour ? `•••• ${user.idLastFour}` : null],
    ["Profile complete", user.profileComplete ? "Yes" : "No"],
    [
      "Listings / sent messages",
      `${user._count.listings} / ${user._count.sentMessages}`,
    ],
    ["Bio", user.bio],
  ];
  return (
    <div className="space-y-6">
      <Link className="text-sm underline" href="/admin">
        ← All users
      </Link>
      <div>
        <h1 className="text-3xl font-bold">{user.name}</h1>
        <p className="mt-2 text-[var(--muted)]">
          {user.identityStatus.replaceAll("_", " ")} · Joined{" "}
          {user.createdAt.toLocaleDateString("en-GB")}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-5">
            Account & residential details
          </h2>
          <dl className="divide-y divide-[var(--border)]">
            {fields.map(([label, value]) => (
              <div key={String(label)} className="py-3">
                <dt className="text-xs text-[var(--muted)]">{label}</dt>
                <dd className="mt-1 text-sm break-words">
                  {value ?? "Not provided"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-xl font-semibold">
              Private identity documents
            </h2>
            <p className="text-xs text-[var(--muted)] mt-2">
              Compare the name and ID photo with the portrait. This is manual
              review, not official Fayda verification.
            </p>
            <div className="grid gap-4 mt-5">
              {user.documents.map((doc) => (
                <div key={doc.id}>
                  <p className="font-medium text-sm mb-2">
                    {doc.kind === "ID"
                      ? "Identity document"
                      : "Portrait / selfie"}
                  </p>
                  <Image
                    unoptimized
                    width={800}
                    height={600}
                    src={`/api/identity-documents/${doc.id}`}
                    alt={
                      doc.kind === "ID"
                        ? "Private identity document"
                        : "Private portrait"
                    }
                    className="w-full max-h-80 object-contain bg-gray-100 rounded-xl"
                  />
                  <a
                    className="text-xs underline"
                    href={`/api/identity-documents/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open full image
                  </a>
                </div>
              ))}
            </div>
            {!user.documents.length && (
              <p className="mt-4 text-sm">No documents submitted yet.</p>
            )}
          </section>
          {user.identityStatus === "PENDING" && admin.id !== user.id && (
            <section className="card p-6">
              <h2 className="font-semibold text-xl">Review decision</h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                Confirm the document is readable and belongs to this user.
                Rejection notes are shown to the user so they can correct their
                submission.
              </p>
              <AdminReviewForm profileId={user.id} />
            </section>
          )}
          <section className="card p-6">
            <h2 className="font-semibold">Review history</h2>
            {audits.map((a) => (
              <div
                key={a.id}
                className="border-t border-[var(--border)] mt-3 pt-3 text-sm"
              >
                <strong>{a.decision}</strong>
                <p>{a.note}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {a.createdAt.toLocaleString("en-GB")} · Reviewer {a.actorId}
                </p>
              </div>
            ))}
            {!audits.length && (
              <p className="mt-3 text-sm text-[var(--muted)]">
                No decisions yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
