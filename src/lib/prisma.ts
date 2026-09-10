import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function resolveSqliteUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;

  const relative = raw.slice("file:".length).replace(/^\/+/, "");
  const absolute = path.isAbsolute(relative)
    ? relative
    : path.join(process.cwd(), relative);
  return `file:${absolute}`;
}

const sqliteUrl = resolveSqliteUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: sqliteUrl }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
