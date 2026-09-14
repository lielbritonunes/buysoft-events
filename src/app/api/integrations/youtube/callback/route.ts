import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getRedirectUri,
  getYouTubeChannelInfo,
  saveYouTubeIntegration,
} from "@/lib/youtubeService";
import { processGoogleLoginCallback } from "@/app/api/auth/google/callback/route";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const rawState = searchParams.get("state");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || undefined;
  const protocol = host && host.includes("localhost") ? "http" : "https";
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_APP_URL || "https://buysoft-events.vercel.app";

  let stateObj: any = {};
  if (rawState) {
    try {
      stateObj = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8"));
    } catch {
      stateObj = {};
    }
  }

  // If this OAuth callback was initiated for Google Login SSO
  if (stateObj?.type === "login") {
    const redirectUri = getRedirectUri(host);
    return processGoogleLoginCallback(req, redirectUri);
  }

  if (error || !code) {
    console.error("OAuth error or cancelled:", error);
    return NextResponse.redirect(
      `${baseUrl}?youtube_error=${encodeURIComponent(error || "access_denied")}`
    );
  }

  try {
    const redirectUri = getRedirectUri(host);
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const channelInfo = await getYouTubeChannelInfo(tokens.access_token);
    await saveYouTubeIntegration(tokens, channelInfo);

    return NextResponse.redirect(`${baseUrl}?youtube_connected=true`);
  } catch (err: any) {
    console.error("Error in YouTube OAuth callback:", err);
    return NextResponse.redirect(
      `${baseUrl}?youtube_error=${encodeURIComponent(err.message || "token_exchange_failed")}`
    );
  }
}
