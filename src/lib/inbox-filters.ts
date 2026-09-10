export type MessageBox = "inbox" | "outbox";
export type MessagePeriod = "all" | "yesterday" | "week" | "year";

export function parseMessageBox(v: string | undefined): MessageBox {
  return v === "outbox" ? "outbox" : "inbox";
}

export function parseMessagePeriod(v: string | undefined): MessagePeriod {
  if (v === "yesterday" || v === "week" || v === "year") return v;
  return "all";
}

export function periodToDateRange(period: MessagePeriod): {
  gte?: Date;
  lte?: Date;
} {
  const now = new Date();
  if (period === "all") return {};

  if (period === "yesterday") {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { gte: start, lte: end };
  }

  if (period === "week") {
    const gte = new Date(now);
    gte.setDate(gte.getDate() - 7);
    return { gte };
  }

  const gte = new Date(now);
  gte.setFullYear(gte.getFullYear() - 1);
  return { gte };
}
