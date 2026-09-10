import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth";
import { isProfileComplete } from "@/lib/profile";
import { parseLang, t } from "@/lib/i18n";
import { ProfileOnboardingForm } from "@/components/ProfileOnboardingForm";
import { OnboardingSignOutButton } from "@/components/OnboardingSignOutButton";

export default async function OnboardingPage(props: {
  searchParams?: Promise<{ lang?: string; next?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const next = (sp.next ?? "").trim();
  const me = await getSessionProfile();

  if (!me) redirect("/login");
  if (isProfileComplete(me)) {
    redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="card p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {t(lang, "profile.onboardingTitle")}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {t(lang, "profile.onboardingSubtitle")}
              </p>
            </div>
            <OnboardingSignOutButton lang={lang} />
          </div>
          <div className="mt-8">
            <ProfileOnboardingForm
              lang={lang}
              next={next}
              defaultRole={me.role}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
