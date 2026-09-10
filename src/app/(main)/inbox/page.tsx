import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth";
import { parseLang, t } from "@/lib/i18n";
import {
  parseMessageBox,
  parseMessagePeriod,
  periodToDateRange,
} from "@/lib/inbox-filters";
import { ViewingRespondButtons } from "@/components/ViewingRespondButtons";
import { BannerAd } from "@/components/BannerAd";

export default async function InboxPage(props: {
  searchParams?: Promise<{
    lang?: string;
    box?: string;
    period?: string;
  }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = parseLang(sp.lang);
  const box = parseMessageBox(sp.box);
  const period = parseMessagePeriod(sp.period);
  const me = await getSessionProfile();

  const dateFilter = periodToDateRange(period);

  type InboxMessage = {
    id: string;
    body: string;
    createdAt: Date;
    listingId: string;
    from: { name: string; role: string };
    to: { name: string; role: string };
    listing: { title: string; neighborhood: string };
  };

  let messages: InboxMessage[] = [];
  let viewings: {
    id: string;
    proposedAt: Date;
    note: string | null;
    listingId: string;
    from: { name: string };
    listing: { title: string; neighborhood: string };
  }[] = [];

  if (me) {
    try {
      messages = await prisma.message.findMany({
        where: {
          ...(box === "inbox"
            ? { toProfileId: me.id }
            : { fromProfileId: me.id }),
          ...(dateFilter.gte || dateFilter.lte
            ? { createdAt: dateFilter }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 80,
        include: {
          from: { select: { name: true, role: true } },
          to: { select: { name: true, role: true } },
          listing: true,
        },
      });
    } catch {
      messages = [];
    }

    try {
      viewings = await prisma.viewingSchedule.findMany({
        where: { toProfileId: me.id, status: "PROPOSED" },
        orderBy: { proposedAt: "asc" },
        take: 20,
        include: {
          from: { select: { name: true } },
          listing: { select: { title: true, id: true, neighborhood: true } },
        },
      });
    } catch {
      viewings = [];
    }
  }

  const langHidden =
    lang !== "en" ? <input type="hidden" name="lang" value={lang} /> : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {t(lang, "inbox.title")}
        </h1>
        {me ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{me.name}</p>
        ) : null}
      </header>

      <BannerAd lang={lang} />

      {viewings.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {t(lang, "inbox.viewings")}
          </h2>
          {viewings.map((v) => (
            <div key={v.id} className="card p-5">
              <p className="text-sm font-semibold">{v.from.name}</p>
              <p className="text-xs text-[var(--muted)]">
                <a
                  href={`/listings/${v.listingId}${lang !== "en" ? `?lang=${lang}` : ""}`}
                  className="link-brand"
                >
                  {v.listing.title}
                </a>{" "}
                • {v.listing.neighborhood}
              </p>
              <p className="mt-2 text-sm">{v.proposedAt.toLocaleString()}</p>
              {v.note ? <p className="mt-1 text-xs">{v.note}</p> : null}
              <ViewingRespondButtons viewingId={v.id} lang={lang} />
            </div>
          ))}
        </section>
      ) : null}

      <form
        action="/inbox"
        className="flex flex-wrap items-end gap-3 card p-4"
      >
        {langHidden}
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">
            {t(lang, "inbox.box")}
          </label>
          <select
            name="box"
            defaultValue={box}
            className="input-field mt-1 h-10 text-sm"
          >
            <option value="inbox">{t(lang, "inbox.inbox")}</option>
            <option value="outbox">{t(lang, "inbox.outbox")}</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--muted)]">
            {t(lang, "inbox.period")}
          </label>
          <select
            name="period"
            defaultValue={period}
            className="input-field mt-1 h-10 text-sm"
          >
            <option value="all">{t(lang, "inbox.periodAll")}</option>
            <option value="yesterday">{t(lang, "inbox.periodYesterday")}</option>
            <option value="week">{t(lang, "inbox.periodWeek")}</option>
            <option value="year">{t(lang, "inbox.periodYear")}</option>
          </select>
        </div>
        <button type="submit" className="btn-primary h-10 px-4 text-sm">
          {t(lang, "inbox.apply")}
        </button>
      </form>

      <section className="space-y-3">
        {messages.length === 0 ? (
          <div className="card p-8 text-center text-sm text-[var(--muted)]">
            {t(lang, "inbox.empty")}
          </div>
        ) : null}

        {messages.map((m) => {
          const peer = box === "inbox" ? m.from : m.to;
          return (
            <div key={m.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">
                    {box === "inbox" ? "From" : "To"}: {peer.name} (
                    {peer.role.toLowerCase()})
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    About:{" "}
                    <a
                      href={`/listings/${m.listingId}${lang !== "en" ? `?lang=${lang}` : ""}`}
                      className="link-brand"
                    >
                      {m.listing.title}
                    </a>{" "}
                    • {m.listing.neighborhood}
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {m.createdAt.toLocaleString()}
                </div>
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-800">
                {m.body}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
