import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { BrokerControl } from "@/components/AdminControls";
import { ProfileAvatar } from "@/components/ProfileAvatar";
export default async function AgentsPage() {
  await requireAdmin();
  const agents = await prisma.profile.findMany({
    where: { role: "AGENT" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { listings: true } } },
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent verification</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Approve or revoke the staff-reviewed agent badge. Agents must have an
          approved identity and active account. This badge is separate from
          government authentication or a broker license.
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {["Agent", "Contact", "Listings", "Identity", "Agent badge"].map(
                (v) => (
                  <th key={v}>{v}</th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link
                    href={`/admin/users/${a.id}`}
                    className="flex items-center gap-3 font-medium"
                  >
                    <ProfileAvatar
                      name={a.name}
                      photoUrl={a.photoUrl}
                      size="sm"
                    />
                    {a.name}
                  </Link>
                </td>
                <td>{a.email ?? a.phone}</td>
                <td>{a._count.listings}</td>
                <td>
                  <span className="status-pill">
                    {a.suspendedAt
                      ? "Suspended"
                      : a.identityStatus.replaceAll("_", " ")}
                  </span>
                </td>
                <td>
                  <BrokerControl
                    id={a.id}
                    verified={a.brokerVerified}
                    eligible={a.identityStatus === "APPROVED" && !a.suspendedAt}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!agents.length && (
          <p className="p-8 text-center text-sm text-[var(--muted)]">
            No agent accounts yet. Registered agents will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
