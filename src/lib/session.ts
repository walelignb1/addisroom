import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
export const SESSION_COOKIE = "addis_session";
export const SETUP_COOKIE = "addis_password_setup";
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function createSession(profileId: string, setup = false) {
  const token = randomBytes(32).toString("hex");
  const maxAge = setup ? 600 : 60 * 60 * 24 * 7;
  await prisma.session.create({
    data: {
      tokenHash: tokenHash(token),
      profileId,
      purpose: setup ? "PASSWORD_SETUP" : "LOGIN",
      expiresAt: new Date(Date.now() + maxAge * 1000),
    },
  });
  (await cookies()).set(setup ? SETUP_COOKIE : SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}
export async function readSession(setup = false) {
  const token = (await cookies()).get(
    setup ? SETUP_COOKIE : SESSION_COOKIE,
  )?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { profile: true },
  });
  if (
    !session ||
    session.profile.suspendedAt !== null ||
    session.expiresAt <= new Date() ||
    session.purpose !== (setup ? "PASSWORD_SETUP" : "LOGIN")
  )
    return null;
  return session;
}
export async function clearSession(setup = false) {
  const store = await cookies();
  const name = setup ? SETUP_COOKIE : SESSION_COOKIE;
  const token = store.get(name)?.value;
  if (token)
    await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
  store.delete(name);
}
