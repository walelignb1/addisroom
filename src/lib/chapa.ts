import crypto from "crypto";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

export class ChapaApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChapaApiError";
  }
}

function getSecretKey(): string {
  const key = process.env.CHAPA_SECRET_KEY;
  if (!key || key.includes("REPLACE_ME")) {
    throw new ChapaApiError(
      "CHAPA_SECRET_KEY is not configured. Set it in .env (get a sandbox key from https://dashboard.chapa.co).",
    );
  }
  return key;
}

export type ChapaInitializeParams = {
  amount: number;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  title?: string;
  description?: string;
};

/**
 * Chapa's `customization.title`/`customization.description` only accept
 * letters, numbers, hyphens, underscores, spaces, and dots — anything else
 * (quotes, punctuation from a user-entered listing title, etc.) is rejected.
 */
function sanitizeChapaText(raw: string | undefined, maxLen: number): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^A-Za-z0-9 _.-]/g, "").trim();
  return cleaned.slice(0, maxLen) || undefined;
}

export async function chapaInitialize(
  params: ChapaInitializeParams,
): Promise<{ checkoutUrl: string }> {
  const res = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: "ETB",
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      phone_number: params.phoneNumber,
      customization: {
        title: sanitizeChapaText(params.title, 16),
        description: sanitizeChapaText(params.description, 50),
      },
    }),
  });

  let json: {
    status?: string;
    message?: string;
    data?: { checkout_url?: string };
  } | null = null;
  try {
    json = await res.json();
  } catch {
    // fall through to the generic error below
  }

  const checkoutUrl = json?.data?.checkout_url;
  if (!res.ok || json?.status !== "success" || !checkoutUrl) {
    console.error("[Chapa] initialize failed", {
      httpStatus: res.status,
      status: json?.status,
      message: json?.message,
    });
    throw new ChapaApiError(json?.message ?? "Chapa initialize request failed");
  }

  return { checkoutUrl };
}

export type ChapaVerifyResult = {
  txStatus: "success" | "failed" | "pending";
  amount: number | null;
  currency: string | null;
  reference: string | null;
};

export async function chapaVerify(txRef: string): Promise<ChapaVerifyResult> {
  const res = await fetch(
    `${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${getSecretKey()}` } },
  );

  let json: {
    status?: string;
    message?: string;
    data?: {
      status?: string;
      amount?: number | string;
      currency?: string;
      reference?: string;
    };
  } | null = null;
  try {
    json = await res.json();
  } catch {
    // fall through to the generic error below
  }

  if (!res.ok || json?.status !== "success") {
    console.error("[Chapa] verify failed", {
      httpStatus: res.status,
      status: json?.status,
      message: json?.message,
    });
    throw new ChapaApiError(json?.message ?? "Chapa verify request failed");
  }

  // Chapa returns "failed/cancelled" (and possibly other "failed*" variants)
  // for a cancelled or declined checkout, not a bare "failed".
  const data = json.data ?? {};
  const txStatus: ChapaVerifyResult["txStatus"] =
    data.status === "success"
      ? "success"
      : data.status?.startsWith("failed")
        ? "failed"
        : "pending";

  return {
    txStatus,
    amount: data.amount != null ? Number(data.amount) : null,
    currency: data.currency ?? null,
    reference: data.reference ?? null,
  };
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Chapa signs webhooks two ways (either is sufficient): `x-chapa-signature` is
 * an HMAC-SHA256 of the raw JSON body, `chapa-signature` is an HMAC-SHA256 of
 * the secret key itself. This is defense in depth only — the caller must still
 * re-verify the transaction via chapaVerify() before trusting it either way.
 */
export function isValidChapaWebhookSignature(
  rawBody: string,
  headers: { xChapaSignature?: string | null; chapaSignature?: string | null },
): boolean {
  const secret = process.env.CHAPA_WEBHOOK_SECRET;
  if (!secret) return true; // not configured — skip, rely on verify-by-API instead

  try {
    if (headers.xChapaSignature) {
      const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
      if (timingSafeHexEqual(expected, headers.xChapaSignature)) return true;
    }
    if (headers.chapaSignature) {
      const expected = crypto.createHmac("sha256", secret).update(secret).digest("hex");
      if (timingSafeHexEqual(expected, headers.chapaSignature)) return true;
    }
  } catch {
    return false;
  }
  return false;
}
