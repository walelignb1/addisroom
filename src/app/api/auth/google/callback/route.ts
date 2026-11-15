import { NextRequest, NextResponse } from "next/server";
import { finishGoogleLogin } from "@/lib/google-auth";
export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") ?? "",
    code = request.nextUrl.searchParams.get("code") ?? "";
  try {
    const path = await finishGoogleLogin(state, code);
    return NextResponse.redirect(new URL(path, request.url));
  } catch (error) {
    const reason =
      error instanceof Error && error.message === "GOOGLE_EMAIL"
        ? "google_email"
        : "google_failed";
    return NextResponse.redirect(
      new URL(`/signup?authError=${reason}`, request.url),
    );
  }
}
