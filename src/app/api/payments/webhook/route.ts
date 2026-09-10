import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidChapaWebhookSignature } from "@/lib/chapa";
import { verifyAndFinalizePayment } from "@/lib/payments";

/**
 * Server-to-server webhook Chapa calls when a transaction's status changes
 * (configured under Chapa Dashboard > Settings > Webhooks). The payload and
 * signature headers are only used to find which tx_ref to check — the actual
 * status always comes from a fresh call to Chapa's Verify Transaction API in
 * verifyAndFinalizePayment, never from this request body.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signatureOk = isValidChapaWebhookSignature(rawBody, {
    xChapaSignature: req.headers.get("x-chapa-signature"),
    chapaSignature: req.headers.get("chapa-signature"),
  });
  if (!signatureOk) {
    console.warn("[payments/webhook] signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let txRef: unknown;
  try {
    ({ tx_ref: txRef } = JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof txRef !== "string" || !txRef) {
    return NextResponse.json({ error: "tx_ref missing from payload" }, { status: 400 });
  }

  try {
    const result = await verifyAndFinalizePayment(txRef);
    return NextResponse.json({ received: true, status: result.status });
  } catch (err) {
    console.error("[payments/webhook] finalize failed", err);
    // 500 so Chapa retries — the handler is idempotent and safe to re-run.
    return NextResponse.json({ error: "Could not process webhook" }, { status: 500 });
  }
}
