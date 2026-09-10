import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { BannerAd } from "@/components/BannerAd";
import { PaymentToast } from "@/components/PaymentToast";
import { getSessionProfile } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";
import { canPostListing } from "@/lib/monetization";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getSessionProfile();

  if (me && !isProfileComplete(me)) {
    redirect("/onboarding");
  }

  const loggedIn = Boolean(me);
  const canPost = me ? canPostListing(me.role) : false;

  return (
    <div className={loggedIn ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))]" : ""}>
      <Suspense fallback={null}>
        <PaymentToast />
      </Suspense>
      <AppHeader loggedIn={loggedIn} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {children}
      </main>
      {!loggedIn ? (
        <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
            <BannerAd lang="en" />
            <p className="text-sm text-[var(--muted)]">
              Addis Ababa — trusted rooms, verified brokers, local search.
            </p>
          </div>
        </footer>
      ) : (
        <BottomNav canPost={canPost} />
      )}
    </div>
  );
}
