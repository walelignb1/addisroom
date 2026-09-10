import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAndFinalizePayment } from "@/lib/payments";

/**
 * Chapa redirects the user's browser here (return_url/callback_url) after
 * checkout. The query string (trx_ref/tx_ref, status, ref_id) is untrusted —
 * only used to look up which payment to check — the real status always comes
 * from verifyAndFinalizePayment's call to Chapa's Verify Transaction API.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const txRef = sp.get("tx_ref") ?? sp.get("trx_ref");

  if (!txRef) {
    return NextResponse.redirect(new URL("/?payment=error", req.url));
  }

  try {
    const result = await verifyAndFinalizePayment(txRef);
    const status = result.status.toLowerCase();
    return NextResponse.redirect(
      new URL(`/listings/${result.listingId}?payment=${status}`, req.url),
    );
  } catch (err) {
    console.error("[payments/verify] failed", err);
    return NextResponse.redirect(new URL("/?payment=error", req.url));
  }
}
