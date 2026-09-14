import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID não configurado" }, { status: 500 });
  }

  // Determine host and protocol
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  // Use the pre-authorized callback URI registered in Google Cloud Console
  const redirectUri = `${protocol}://${host}/api/integrations/youtube/callback`;

  // Preserve invite token or return URL if provided
  const searchParams = req.nextUrl.searchParams;
  const statePayload = {
    type: "login",
    inviteToken: searchParams.get("inviteToken") || "",
    returnTo: searchParams.get("returnTo") || "/",
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", state);

  return NextResponse.redirect(googleAuthUrl.toString());
}
