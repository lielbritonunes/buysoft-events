import { NextRequest, NextResponse } from "next/server";
import { getRedirectUri, getYouTubeAuthUrl } from "@/lib/youtubeService";

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || undefined;
  const redirectUri = getRedirectUri(host);
  const authUrl = getYouTubeAuthUrl(redirectUri);

  return NextResponse.redirect(authUrl);
}
