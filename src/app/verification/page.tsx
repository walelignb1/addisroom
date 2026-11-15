import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth";
import { IdentityForm } from "@/components/IdentityForm";
import { logout } from "@/lib/auth-actions";
export default async function VerificationPage() {
  const me = await getSessionProfile();
  if (!me) redirect("/login");
  if (me.isAdmin) redirect("/admin");
  if (!me.profileComplete) redirect("/onboarding");
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: me.id },
  });
  const pending = profile.identityStatus === "PENDING";
  const approved = profile.identityStatus === "APPROVED";
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="font-bold text-xl">
          AddisRoom
        </Link>
        <form action={logout}>
          <button className="text-sm underline">Sign out</button>
        </form>
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-600)]">
        Your account · Identity verification
      </p>
      <h1 className="text-3xl font-bold mt-3">
        {approved
          ? "You’re verified"
          : pending
            ? "Your identity is under review"
            : "Let’s verify it’s you"}
      </h1>
      <p className="text-[var(--muted)] mt-3 mb-8">
        {approved
          ? "Your account is ready. You can now contact owners and use AddisRoom."
          : pending
            ? "Your documents were submitted securely. An administrator will review your details. Refresh this page to see the latest decision."
            : "Complete your residential details and upload your identity document and portrait to activate your account."}
      </p>
      <div className="grid grid-cols-3 gap-2 text-xs mb-8">
        {[
          "1 · Contact verified",
          "2 · Profile completed",
          approved ? "3 · Identity approved" : "3 · Identity review",
        ].map((label) => (
          <div key={label} className="rounded-xl bg-[var(--brand-50)] p-3">
            {label}
          </div>
        ))}
      </div>
      {profile.identityReviewNote && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold">Administrator’s note</h2>
          <p className="mt-2 text-sm">{profile.identityReviewNote}</p>
        </div>
      )}
      {approved ? (
        <Link className="btn-primary inline-block px-6 py-3" href="/">
          Find a home
        </Link>
      ) : pending ? (
        <div className="card p-6">
          <p className="font-semibold">Pending manual review</p>
          <p className="text-sm mt-2">
            Submitted {profile.identitySubmittedAt?.toLocaleDateString("en-GB")}
            . You don’t need to upload again.
          </p>
          <Link href="/verification" className="inline-block underline mt-4">
            Refresh status
          </Link>
        </div>
      ) : (
        <div className="card p-6">
          <IdentityForm
            name={me.name}
            address={profile.address ?? ""}
            city={profile.city ?? "Addis Ababa"}
            subCity={profile.subCity ?? ""}
            woreda={profile.woreda ?? ""}
          />
        </div>
      )}
    </main>
  );
}
