import {
  AccessToken,
  EgressClient,
  StreamOutput,
  StreamProtocol,
} from "livekit-server-sdk";

export const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

// 1. Generate Room Token for Host or Speaker
export async function generateLiveKitToken({
  roomName,
  participantIdentity,
  participantName,
  isHost = false,
}: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  isHost?: boolean;
}) {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit credentials not configured in environment variables.");
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    ttl: "8h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
  });

  return await at.toJwt();
}

// 2. Start Room Composite Egress to YouTube RTMP
export async function startRoomEgressToYouTube({
  roomName,
  rtmpUrl,
  streamKey,
}: {
  roomName: string;
  rtmpUrl: string;
  streamKey: string;
}) {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit credentials not configured.");
  }

  // Convert wss:// to https:// for Egress API
  const httpUrl = LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://");
  const egressClient = new EgressClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

  // Full RTMP destination endpoint
  const fullRtmpUrl = rtmpUrl.endsWith("/")
    ? `${rtmpUrl}${streamKey}`
    : `${rtmpUrl}/${streamKey}`;

  const streamOutput = new StreamOutput({
    protocol: StreamProtocol.RTMP,
    urls: [fullRtmpUrl],
  });

  const info = await egressClient.startRoomCompositeEgress(
    roomName,
    streamOutput,
    {
      layout: "grid",
    }
  );

  return info.egressId;
}

// 3. Stop LiveKit Egress
export async function stopLiveKitEgress(egressId: string) {
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit credentials not configured.");
  }

  const httpUrl = LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://");
  const egressClient = new EgressClient(httpUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

  return await egressClient.stopEgress(egressId);
}
