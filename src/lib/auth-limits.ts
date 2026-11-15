import { prisma } from "@/lib/prisma";
import { tokenHash } from "@/lib/session";
export async function rateLimit(
  scope: string,
  value: string,
  limit: number,
  windowMs: number,
) {
  const key = tokenHash(`${scope}:${value}`);
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    await tx.authAttempt.deleteMany({ where: { key, resetAt: { lte: now } } });
    const row = await tx.authAttempt.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(Date.now() + windowMs) },
      update: { count: { increment: 1 } },
    });
    if (row.count > limit)
      throw new Error("Too many attempts. Please try again later.");
  });
}
