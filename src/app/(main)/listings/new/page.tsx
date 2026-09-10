import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSessionProfile } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";
import { canPostListing, LISTING_FEE_BIRR } from "@/lib/monetization";
import { BannerAd } from "@/components/BannerAd";
import { NewListingForm } from "@/components/NewListingForm";
import { parseLang, t } from "@/lib/i18n";

export default async function NewListingPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const me = await getSessionProfile();

  if (!me) redirect("/login?next=/listings/new");
  if (!isProfileComplete(me)) redirect("/onboarding?next=/listings/new");
  if (!canPostListing(me.role as Role)) {
    redirect("/listings/new/upgrade?next=/listings/new");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Post a room
        </h1>
        <p className="text-sm text-[var(--muted)]">
          Create a listing for Addis Ababa. {t(lang, "payment.requiredNotice")}
        </p>
      </header>

      <BannerAd lang={lang} />

      <NewListingForm lang={lang} feeBirr={LISTING_FEE_BIRR} />
    </div>
  );
}
