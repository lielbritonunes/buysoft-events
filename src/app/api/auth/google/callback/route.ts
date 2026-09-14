import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, createMfaChallengeToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function processGoogleLoginCallback(req: NextRequest, redirectUri: string) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const rawState = searchParams.get("state");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";

  let state: { type?: string; inviteToken?: string; returnTo?: string } = {};
  if (rawState) {
    try {
      state = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8"));
    } catch {
      state = {};
    }
  }

  if (error || !code) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${protocol}://${host}/login?error=google_auth_failed`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Failed to exchange Google code:", errText);
      return NextResponse.redirect(`${protocol}://${host}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Google profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=profile_fetch_failed`);
    }

    const profile = await profileRes.json();
    const { sub: googleId, email, name, picture } = profile;

    if (!email) {
      return NextResponse.redirect(`${protocol}://${host}/login?error=no_email_provided`);
    }

    // 3. Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email: email.toLowerCase() }],
      },
      include: { organization: true },
    });

    if (!user) {
      // Check if user has an invite token
      let organizationId = "";
      let role = "organizer";

      if (state.inviteToken) {
        const invite = await prisma.inviteToken.findUnique({
          where: { token: state.inviteToken },
        });
        if (invite && invite.expiresAt > new Date()) {
          organizationId = invite.organizationId;
          role = invite.role;
          await prisma.inviteToken.delete({ where: { id: invite.id } });
        }
      }

      // If no invite, attach to existing org or create new one
      if (!organizationId) {
        let defaultOrg = await prisma.organization.findFirst();
        if (!defaultOrg) {
          defaultOrg = await prisma.organization.create({
            data: {
              name: `${name || "Buysoft"}'s Organization`,
              email,
            },
          });
        }
        organizationId = defaultOrg.id;
        role = "admin";
      }

      const initials = name
        ? name
            .split(" ")
            .map((n: string) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : "US";

      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          googleId,
          authProvider: "google",
          avatarUrl: picture || null,
          avatarInitials: initials,
          role,
          organizationId,
          mfaEnabled: false,
        },
        include: { organization: true },
      });
    } else {
      // Link googleId or update avatar
      if (!user.googleId || !user.avatarUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: user.googleId || googleId,
            avatarUrl: user.avatarUrl || picture || null,
          },
          include: { organization: true },
        });
      }
    }

    // 4. Check if MFA is enabled
    if (user.mfaEnabled) {
      const challengeToken = await createMfaChallengeToken({
        userId: user.id,
        email: user.email,
        rememberMe: true,
      });

      return NextResponse.redirect(`${protocol}://${host}/login/mfa?challenge=${challengeToken}`);
    }

    // 5. Issue session cookie and redirect
    const sessionToken = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      avatarInitials: user.avatarInitials,
      avatarUrl: user.avatarUrl,
      mfaEnabled: false,
    });

    const response = NextResponse.redirect(`${protocol}://${host}${state.returnTo || "/"}`);
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err) {
    console.error("Error in Google OAuth callback:", err);
    return NextResponse.redirect(`${protocol}://${host}/login?error=server_error`);
  }
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

  return processGoogleLoginCallback(req, redirectUri);
}
