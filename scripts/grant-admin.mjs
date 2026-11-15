import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
const email = process.argv[2]?.trim().toLowerCase();
if (!email)
  throw new Error(
    "Usage: node scripts/grant-admin.mjs verified-admin@example.com",
  );
const databasePath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: `file:${path.resolve(databasePath)}`,
  }),
});
try {
  const user = await db.profile.findUnique({ where: { email } });
  if (!user?.emailVerifiedAt || !user.passwordHash)
    throw new Error(
      "Register this email, verify it, and set a password first.",
    );
  await db.$transaction([
    db.profile.update({ where: { id: user.id }, data: { isAdmin: true, isSuperAdmin: true } }),
    db.adminAudit.create({
      data: {
        actorId: "LOCAL_OPERATOR",
        profileId: user.id,
        decision: "ADMIN_GRANTED",
        note: "Administrator access granted by the local operator.",
      },
    }),
  ]);
  console.log("Administrator access granted. Sign in and open /admin.");
} finally {
  await db.$disconnect();
}
