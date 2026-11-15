import { Suspense } from "react";
import { type Lang } from "@/lib/i18n";
import { BannerAd } from "@/components/BannerAd";
import { FooterLinks } from "@/components/FooterLinks";
export async function SiteFooter({ lang = "en" }: { lang?: Lang }) {
  return (
    <footer className="reference-footer">
      <div className="mx-auto max-w-6xl px-4 py-7">
        <BannerAd lang={lang} />
        <Suspense fallback={null}>
          <FooterLinks />
        </Suspense>
      </div>
    </footer>
  );
}
