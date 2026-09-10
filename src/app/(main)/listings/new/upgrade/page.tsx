import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getSessionProfile } from "@/lib/auth";
import { canPostListing } from "@/lib/monetization";
import { parseLang, t } from "@/lib/i18n";
import { SwitchToLandlordForm } from "@/components/SwitchToLandlordForm";

export default async function BecomeLandlordPage(props: {
  searchParams?: Promise<{ lang?: string; next?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const nextRaw = (sp.next ?? "").trim();
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/listings/new";

  const me = await getSessionProfile();
  if (!me) redirect(`/login?next=/listings/new/upgrade`);
  if (canPostListing(me.role as Role)) redirect(next);

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {t(lang, "listing.postGateTitle")}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {t(lang, "listing.postGateBody")}
        </p>
        <div className="mt-8">
          <SwitchToLandlordForm lang={lang} next={next} />
        </div>
      </div>
    </div>
  );
}
