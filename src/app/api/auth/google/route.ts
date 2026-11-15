import { NextRequest, NextResponse } from "next/server";
import { startGoogleLogin } from "@/lib/google-auth";
export async function GET(request: NextRequest) {
  try {
    return NextResponse.redirect(
      await startGoogleLogin(request.nextUrl.searchParams.get("next") ?? "/"),
    );
  } catch {
    return NextResponse.redirect(
      new URL("/signup?authError=google_unavailable", request.url),
    );
  }
}
