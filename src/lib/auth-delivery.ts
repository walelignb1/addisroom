import { OtpChannel } from "@prisma/client";
export async function deliverCode(
  channel: OtpChannel,
  target: string,
  code: string,
) {
  if (
    process.env.AUTH_DELIVERY_MODE === "console" &&
    process.env.NODE_ENV !== "production"
  )
    return { previewCode: code };
  let response: Response;
  if (channel === "EMAIL") {
    if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)
      throw new Error("Email delivery is not configured. Contact support.");
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM,
        to: [target],
        subject: "Your AddisRoom verification code",
        text: `Your AddisRoom code is ${code}. It expires in 10 minutes. If you did not request it, ignore this message.`,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } else {
    const {
      TWILIO_ACCOUNT_SID: sid,
      TWILIO_AUTH_TOKEN: token,
      TWILIO_FROM_NUMBER: from,
    } = process.env;
    if (!sid || !token || !from)
      throw new Error("SMS delivery is not configured. Contact support.");
    response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: target,
          From: from,
          Body: `Your AddisRoom verification code is ${code}. Expires in 10 minutes.`,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
  }
  if (!response.ok)
    throw new Error("Verification delivery failed. Please try again later.");
  return {};
}
