import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = `file:${path.join(process.cwd(), "dev.db")}`;
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url }),
});

const count = await prisma.profile.count();
console.log("OK — profile count:", count);
await prisma.$disconnect();
