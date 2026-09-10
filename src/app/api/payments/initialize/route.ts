import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionProfileId } from "@/lib/auth";
import { initializeListingPayment } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const profileId = await getSessionProfileId();
  if (!profileId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  let listingId: unknown;
  try {
    ({ listingId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (typeof listingId !== "string" || !listingId) {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 });
  }

  try {
    const { checkoutUrl } = await initializeListingPayment({ listingId, profileId });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[payments/initialize] failed", err);
    const message = err instanceof Error ? err.message : "Could not start payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
