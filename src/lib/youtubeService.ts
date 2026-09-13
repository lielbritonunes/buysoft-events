import { prisma } from "./prisma";

// Google OAuth 2.0 Credentials (loaded from environment variables)
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

// Build redirect URI based on environment or request
export function getRedirectUri(requestHost?: string): string {
  if (requestHost) {
    const protocol = requestHost.includes("localhost") ? "http" : "https";
    return `${protocol}://${requestHost}/api/integrations/youtube/callback`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buysoft-events.vercel.app";
  return `${appUrl.replace(/\/$/, "")}/api/integrations/youtube/callback`;
}

// 1. Generate Google OAuth consent URL
export function getYouTubeAuthUrl(redirectUri: string): string {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.force-ssl",
    access_type: "offline",
    prompt: "consent",
  });
  return `${rootUrl}?${params.toString()}`;
}

// 2. Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to exchange code for tokens: ${errText}`);
  }

  return await tokenRes.json();
}

// 3. Fetch YouTube Channel info
export async function getYouTubeChannelInfo(accessToken: string) {
  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const channel = data.items[0];
      return {
        channelId: channel.id,
        channelTitle: channel.snippet?.title || "Canal do YouTube",
        channelThumbnail: channel.snippet?.thumbnails?.default?.url || null,
      };
    }
  } catch (err) {
    console.error("Error fetching channel info:", err);
  }
  return null;
}

// 4. Save YouTube integration to database
export async function saveYouTubeIntegration(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}, channelInfo: { channelId?: string; channelTitle?: string; channelThumbnail?: string } | null) {
  // Get default organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Buysoft Organization",
        email: "eventos@buysoft.com.br",
      },
    });
  }

  const expiryDate = tokens.expires_in
    ? BigInt(Date.now() + tokens.expires_in * 1000)
    : null;

  return await prisma.youTubeIntegration.upsert({
    where: { organizationId: org.id },
    create: {
      organizationId: org.id,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      tokenType: tokens.token_type || "Bearer",
      scope: tokens.scope || null,
      expiryDate,
      channelId: channelInfo?.channelId || null,
      channelTitle: channelInfo?.channelTitle || "Canal Conectado",
      channelThumbnail: channelInfo?.channelThumbnail || null,
    },
    update: {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      tokenType: tokens.token_type || "Bearer",
      scope: tokens.scope || null,
      expiryDate,
      channelId: channelInfo?.channelId || undefined,
      channelTitle: channelInfo?.channelTitle || undefined,
      channelThumbnail: channelInfo?.channelThumbnail || undefined,
    },
  });
}

// 5. Get valid access token (refreshes if needed)
export async function getValidYouTubeAccessToken(): Promise<string | null> {
  const integration = await prisma.youTubeIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!integration || !integration.refreshToken) {
    return null;
  }

  // Check if current access token is still fresh (with 60s buffer)
  const now = BigInt(Date.now());
  if (
    integration.accessToken &&
    integration.expiryDate &&
    integration.expiryDate > now + BigInt(60000)
  ) {
    return integration.accessToken;
  }

  // Refresh token
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Failed to refresh YouTube token:", err);
      return integration.accessToken || null;
    }

    const data = await res.json();
    const newAccessToken = data.access_token;
    const newExpiry = data.expires_in
      ? BigInt(Date.now() + data.expires_in * 1000)
      : null;

    await prisma.youTubeIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: newAccessToken,
        expiryDate: newExpiry,
      },
    });

    return newAccessToken;
  } catch (e) {
    console.error("Error refreshing token:", e);
    return integration.accessToken || null;
  }
}

// 6. Get status of YouTube Integration
export async function getYouTubeIntegrationStatus() {
  const integration = await prisma.youTubeIntegration.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!integration) {
    return { isConnected: false };
  }

  return {
    isConnected: true,
    channelId: integration.channelId,
    channelTitle: integration.channelTitle || "Canal do YouTube",
    channelThumbnail: integration.channelThumbnail,
    connectedAt: integration.updatedAt,
  };
}

// 7. Disconnect YouTube Integration
export async function disconnectYouTubeIntegration() {
  await prisma.youTubeIntegration.deleteMany();
  return { success: true };
}

// 8. Create Unlisted Live Broadcast & RTMP Stream for an Event
export async function createYouTubeLiveBroadcastForEvent(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) return null;

  const accessToken = await getValidYouTubeAccessToken();
  if (!accessToken) {
    console.warn("YouTube integration not connected. Skipping auto live creation.");
    return null;
  }

  try {
    // Format scheduled time (ensure future or fallback to now + 5 min)
    let scheduledTime = new Date(event.startDate);
    if (isNaN(scheduledTime.getTime()) || scheduledTime.getTime() < Date.now()) {
      scheduledTime = new Date(Date.now() + 5 * 60 * 1000);
    }

    // Step A: Create Live Broadcast (Unlisted)
    const broadcastBody = {
      snippet: {
        title: `${event.title} • Buysoft Events`,
        description: `${event.description || "Transmissão ao vivo do webinar."}\n\nTransmissão oficial via Buysoft Events.`,
        scheduledStartTime: scheduledTime.toISOString(),
      },
      status: {
        privacyStatus: "unlisted",
        selfDeclaredMadeForKids: false,
      },
      contentDetails: {
        enableAutoStart: true,
        enableAutoStop: true,
        enableDvr: true,
        recordFromStart: true,
      },
    };

    const broadcastRes = await fetch(
      "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(broadcastBody),
      }
    );

    if (!broadcastRes.ok) {
      const errText = await broadcastRes.text();
      console.error("YouTube Live Broadcast Creation Error:", errText);
      return null;
    }

    const broadcastData = await broadcastRes.json();
    const broadcastId = broadcastData.id;

    // Step B: Create Live Stream (RTMP ingestion endpoint)
    const streamBody = {
      snippet: {
        title: `Ingestão: ${event.title}`,
      },
      cdn: {
        frameRate: "variable",
        ingestionType: "rtmp",
        resolution: "variable",
      },
    };

    const streamRes = await fetch(
      "https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(streamBody),
      }
    );

    if (!streamRes.ok) {
      const errText = await streamRes.text();
      console.error("YouTube Live Stream Creation Error:", errText);
      return null;
    }

    const streamData = await streamRes.json();
    const streamId = streamData.id;
    const rtmpUrl = streamData.cdn?.ingestionInfo?.ingestionAddress || "rtmp://a.rtmp.youtube.com/live2";
    const streamKey = streamData.cdn?.ingestionInfo?.streamName || "";

    // Step C: Bind Broadcast to Stream
    await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastId}&part=id,contentDetails&streamId=${streamId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const embedUrl = `https://www.youtube.com/embed/${broadcastId}`;

    // Step D: Update Event in DB
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        youtubeBroadcastId: broadcastId,
        youtubeStreamId: streamId,
        youtubeStreamKey: streamKey,
        youtubeRtmpUrl: rtmpUrl,
        youtubeEmbedUrl: embedUrl,
      },
    });

    console.log(`[YOUTUBE LIVE CREATED] Broadcast ID: ${broadcastId} for event ${event.title}`);
    return updatedEvent;
  } catch (err) {
    console.error("Error creating YouTube Live broadcast:", err);
    return null;
  }
}

// 9. Ensure active YouTube Broadcast (auto-recreates if previously completed/closed)
export async function ensureActiveYouTubeBroadcast(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) return null;

  const accessToken = await getValidYouTubeAccessToken();
  if (!accessToken) {
    // If YouTube is not connected, return current event record
    return event;
  }

  // If missing broadcast ID or stream key, create one
  if (!event.youtubeBroadcastId || !event.youtubeStreamKey) {
    return await createYouTubeLiveBroadcastForEvent(eventId);
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=status&id=${event.youtubeBroadcastId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      console.warn("Could not query YouTube broadcast status, regenerating broadcast...");
      return await createYouTubeLiveBroadcastForEvent(eventId);
    }

    const data = await res.json();
    const item = data.items?.[0];
    const lifeCycleStatus = item?.status?.lifeCycleStatus;

    // If completed, abandoned or revoked, create a fresh one!
    if (!item || lifeCycleStatus === "complete" || lifeCycleStatus === "revoked") {
      console.log(
        `[YOUTUBE RENEW] Event ${eventId} broadcast ${event.youtubeBroadcastId} status is '${lifeCycleStatus || "not found"}'. Recreating active broadcast...`
      );
      return await createYouTubeLiveBroadcastForEvent(eventId);
    }

    return event;
  } catch (err) {
    console.error("Error in ensureActiveYouTubeBroadcast:", err);
    return event;
  }
}

// 10. End YouTube Live Broadcast (transitions broadcast to 'complete' in YouTube Studio)
export async function endYouTubeLiveBroadcast(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event || !event.youtubeBroadcastId) {
    return null;
  }

  const accessToken = await getValidYouTubeAccessToken();
  if (!accessToken) {
    console.warn("Cannot end YouTube live broadcast: YouTube integration token not found.");
    return null;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=complete&id=${event.youtubeBroadcastId}&part=id,status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[YOUTUBE END BROADCAST ERROR] Status ${res.status}:`, errText);
    } else {
      const data = await res.json();
      console.log(`[YOUTUBE LIVE ENDED] Broadcast ${event.youtubeBroadcastId} transitioned to complete:`, data.status?.lifeCycleStatus);
    }

    return true;
  } catch (err) {
    console.error("Error transitioning YouTube live broadcast to complete:", err);
    return null;
  }
}
