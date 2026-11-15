import { randomBytes, timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { tokenHash, createSession } from "@/lib/session";
import { parseLoginTarget } from "@/lib/otp";
const GOOGLE_COOKIE = "addis_google_state";
export function safeAuthNext(value: string) {
  return value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\\\r\n]/.test(value)
    ? value
    : "/";
}
export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const app = new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  );
  if (!clientId || !clientSecret) throw new Error("GOOGLE_UNAVAILABLE");
  if (process.env.NODE_ENV === "production" && app.protocol !== "https:")
    throw new Error("GOOGLE_UNAVAILABLE");
  return {
    clientId,
    clientSecret,
    callbackUrl: new URL("/api/auth/google/callback", app).href,
  };
}
export async function startGoogleLogin(next: string) {
  const config = googleConfig();
  const state = randomBytes(32).toString("hex");
  const nonce = randomBytes(32).toString("hex");
  const verifier = randomBytes(48).toString("base64url");
  await prisma.oAuthLogin.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await prisma.oAuthLogin.create({
    data: {
      stateHash: tokenHash(state),
      nonce,
      verifier,
      next: safeAuthNext(next),
      expiresAt: new Date(Date.now() + 600000),
    },
  });
  (await cookies()).set(GOOGLE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: Buffer.from(tokenHash(verifier), "hex").toString(
      "base64url",
    ),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.href;
}
export async function finishGoogleLogin(state: string, code: string) {
  const config = googleConfig();
  const store = await cookies();
  const expected = store.get(GOOGLE_COOKIE)?.value;
  store.delete(GOOGLE_COOKIE);
  if (
    !expected ||
    !state ||
    state.length !== expected.length ||
    !timingSafeEqual(Buffer.from(state), Buffer.from(expected))
  )
    throw new Error("GOOGLE_STATE");
  const flow = await prisma.oAuthLogin.findUnique({
    where: { stateHash: tokenHash(state) },
  });
  if (!flow || flow.expiresAt <= new Date()) throw new Error("GOOGLE_STATE");
  const consumed = await prisma.oAuthLogin.deleteMany({
    where: { stateHash: flow.stateHash },
  });
  if (consumed.count !== 1 || !code || code.length > 4096)
    throw new Error("GOOGLE_STATE");
  const client = new OAuth2Client(
    config.clientId,
    config.clientSecret,
    config.callbackUrl,
  );
  const { tokens } = await client.getToken({
    code,
    codeVerifier: flow.verifier,
    redirect_uri: config.callbackUrl,
  });
  if (!tokens.id_token) throw new Error("GOOGLE_TOKEN");
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.clientId,
  });
  const claims = ticket.getPayload();
  if (
    !claims?.sub ||
    claims.nonce !== flow.nonce ||
    claims.email_verified !== true ||
    !claims.email ||
    (claims.azp && claims.azp !== config.clientId)
  )
    throw new Error("GOOGLE_TOKEN");
  const { target: email } = parseLoginTarget("EMAIL", claims.email);
  // Google is authoritative for Gmail/Workspace addresses. Other Google-account
  // email addresses must prove current mailbox ownership through our email-code flow.
  if (!email.endsWith("@gmail.com") && !claims.hd)
    throw new Error("GOOGLE_EMAIL");
  const profile = await prisma.$transaction(async (tx) => {
    const linked = await tx.profile.findUnique({
      where: { googleSubject: claims.sub },
    });
    if (linked) {
      if (linked.suspendedAt) throw new Error("GOOGLE_SUSPENDED");
      return linked;
    }
    const existing = await tx.profile.findUnique({ where: { email } });
    if (existing?.suspendedAt) throw new Error("GOOGLE_SUSPENDED");
    if (existing?.googleSubject && existing.googleSubject !== claims.sub)
      throw new Error("GOOGLE_TOKEN");
    if (existing)
      return tx.profile.update({
        where: { id: existing.id },
        data: { googleSubject: claims.sub, emailVerifiedAt: new Date() },
      });
    return tx.profile.create({
      data: {
        googleSubject: claims.sub,
        email,
        emailVerifiedAt: new Date(),
        name: claims.name?.trim().slice(0, 100) || "Google user",
      },
    });
  });
  await createSession(profile.id);
  if (profile.isAdmin) return "/admin";
  if (!profile.profileComplete) return "/onboarding";
  if (profile.identityStatus !== "APPROVED") return "/verification";
  return safeAuthNext(flow.next);
}
