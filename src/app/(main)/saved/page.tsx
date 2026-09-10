import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth";
import { parseLang, t } from "@/lib/i18n";
import { ListingCard } from "@/components/ListingCard";
export default async function SavedPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const me = await getSessionProfile();

  let listings: Parameters<typeof ListingCard>[0]["listing"][] = [];

  if (me) {
    try {
      const saved = await prisma.savedListing.findMany({
        where: { profileId: me.id },
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            include: {
              postedBy: true,
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      });
      listings = saved.map((s) => s.listing);
    } catch {
      listings = [];
    }
  }

  const langQs = lang !== "en" ? `?lang=${lang}` : "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t(lang, "saved.title")}
        </h1>
      </header>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">{t(lang, "saved.empty")}</p>
          <a
            href={`/${langQs}`}
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {t(lang, "saved.browse")}
          </a>
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {listings.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              lang={lang}
              href={`/listings/${l.id}${langQs}`}
              saved
            />
          ))}
        </section>
      )}
    </div>
  );
}
