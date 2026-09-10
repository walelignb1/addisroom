import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { PaymentPurpose, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LISTING_FEE_BIRR } from "@/lib/monetization";
import { chapaInitialize, chapaVerify } from "@/lib/chapa";

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? name, lastName: parts.slice(1).join(" ") || parts[0] };
}

/** Ethiopian local mobile format Chapa expects: 09XXXXXXXX / 07XXXXXXXX. */
function normalizeEthiopianPhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  const local = digits.startsWith("251")
    ? `0${digits.slice(3)}`
    : digits.startsWith("0")
      ? digits
      : digits.length === 9
        ? `0${digits}`
        : digits;
  return /^0[97]\d{8}$/.test(local) ? local : undefined;
}

/** Chapa rejects tx_ref longer than 50 chars, so keep only a short hint of the listing id. */
function buildTxRef(listingId: string): string {
  const random = crypto.randomBytes(4).toString("hex");
  const shortId = listingId.slice(0, 10);
  return `ar-${shortId}-${Date.now().toString(36)}-${random}`;
}

export async function initializeListingPayment({
  listingId,
  profileId,
}: {
  listingId: string;
  profileId: string;
}): Promise<{ checkoutUrl: string }> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { postedBy: true },
  });
  if (!listing) throw new Error("Listing not found");
  if (listing.postedById !== profileId) throw new Error("This is not your listing");
  if (listing.published) throw new Error("Listing is already paid and published");

  const txRef = buildTxRef(listingId);
  const payment = await prisma.payment.create({
    data: {
      profileId,
      listingId,
      amountBirr: LISTING_FEE_BIRR,
      status: PaymentStatus.PENDING,
      purpose: PaymentPurpose.LISTING_FEE,
      txRef,
    },
  });

  const { firstName, lastName } = splitName(listing.postedBy.name);
  // Chapa's browser return redirect doesn't reliably append tx_ref itself, so
  // bake it into the return_url we hand Chapa — that's a URL we control, and
  // it comes back to us unchanged.
  const verifyUrl = `${getAppUrl()}/api/payments/verify?tx_ref=${encodeURIComponent(txRef)}`;

  try {
    const { checkoutUrl } = await chapaInitialize({
      amount: LISTING_FEE_BIRR,
      txRef,
      callbackUrl: verifyUrl,
      returnUrl: verifyUrl,
      email: listing.postedBy.email ?? undefined,
      firstName,
      lastName,
      phoneNumber: normalizeEthiopianPhone(listing.postedBy.phone),
      title: "AddisRoom fee",
      description: `Listing fee for "${listing.title}"`,
    });
    return { checkoutUrl };
  } catch (err) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    throw err;
  }
}

/**
 * Source of truth for whether a payment succeeded. Always re-checks with
 * Chapa's Verify Transaction API rather than trusting the webhook payload or
 * the browser return redirect — either of those can be spoofed or stale.
 * Idempotent: safe to call repeatedly (webhook retries, plus the user's
 * browser landing on the same return URL) once a payment reaches a terminal
 * status.
 */
export async function verifyAndFinalizePayment(
  txRef: string,
): Promise<{ status: PaymentStatus; listingId: string }> {
  const payment = await prisma.payment.findUnique({ where: { txRef } });
  if (!payment) throw new Error(`Unknown payment tx_ref: ${txRef}`);

  if (payment.status !== PaymentStatus.PENDING) {
    return { status: payment.status, listingId: payment.listingId };
  }

  const result = await chapaVerify(txRef);

  if (result.txStatus === "success") {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          chapaReference: result.reference,
          completedAt: new Date(),
        },
      }),
      prisma.listing.update({
        where: { id: payment.listingId },
        data: { published: true },
      }),
    ]);
    revalidatePath("/");
    revalidatePath(`/listings/${payment.listingId}`);
    return { status: PaymentStatus.PAID, listingId: payment.listingId };
  }

  if (result.txStatus === "failed") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });
    return { status: PaymentStatus.FAILED, listingId: payment.listingId };
  }

  return { status: PaymentStatus.PENDING, listingId: payment.listingId };
}

export async function getListingPaymentForUser(listingId: string, profileId: string | null) {
  if (!profileId) return null;
  try {
    return await prisma.payment.findFirst({
      where: { listingId, profileId },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return null;
  }
}
