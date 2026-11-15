import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { t, type Lang } from "@/lib/i18n";
export async function BannerAd({ lang }: { lang: Lang }) {
  const sponsor = await prisma.sponsorship.findUnique({
    where: { activeSlot: 1 },
  });
  if (!sponsor) return null;
  const content = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-700)]">
        {t(lang, "ads.sponsored")}
      </p>
      {sponsor.imageUrl && (
        <div className="relative h-36 my-3">
          <Image
            src={sponsor.imageUrl}
            alt=""
            fill
            sizes="(max-width:640px) 100vw, 900px"
            className="object-cover rounded-lg"
          />
        </div>
      )}
      <h3 className="text-sm font-semibold mt-3">{sponsor.headline}</h3>
      <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
        {sponsor.body}
      </p>
    </>
  );
  return (
    <aside aria-label={t(lang, "ads.label")} className="sponsor-banner">
      {sponsor.linkUrl ? (
        <a
          href={sponsor.linkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block"
        >
          {content}
        </a>
      ) : (
        content
      )}
    </aside>
  );
}
