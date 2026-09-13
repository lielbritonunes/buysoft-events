import {
  AccessToken,
  EgressClient,
  EncodingOptionsPreset,
  RoomServiceClient,
  StreamOutput,
  StreamProtocol,
} from "livekit-server-sdk";

export function getLiveKitCredentials() {
  const url = process.env.LIVEKIT_URL || "";
  const apiKey = process.env.LIVEKIT_API_KEY || "";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "";
  return { url, apiKey, apiSecret };
}

export function getLiveKitHttpUrl(url: string) {
  return url.replace("wss://", "https://").replace("ws://", "http://");
}

export const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

// Ensure room exists in LiveKit Cloud
export async function ensureLiveKitRoom(roomName: string) {
  const { url, apiKey, apiSecret } = getLiveKitCredentials();
  if (!url || !apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured in environment variables.");
  }
  const httpUrl = getLiveKitHttpUrl(url);
  const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);
  try {
    const room = await roomService.createRoom({
      name: roomName,
      emptyTimeout: 1800, // 30 minutes empty room timeout
    });
    return room;
  } catch (err: any) {
    // If room already exists, that is fine
    return null;
  }
}

// 1. Generate Room Token for Host, Speaker or Attendee
export async function generateLiveKitToken({
  roomName,
  participantIdentity,
  participantName,
  isHost = false,
  canPublish = true,
  canSubscribe = true,
}: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  isHost?: boolean;
  canPublish?: boolean;
  canSubscribe?: boolean;
}) {
  const { apiKey, apiSecret } = getLiveKitCredentials();
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured in environment variables.");
  }

  // Pre-create room so it's registered
  await ensureLiveKitRoom(roomName).catch(() => {});

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: "8h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe,
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
  const { url, apiKey, apiSecret } = getLiveKitCredentials();
  if (!url || !apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured.");
  }

  // Pre-ensure room exists in LiveKit Cloud to prevent 'requested room does not exist'
  await ensureLiveKitRoom(roomName);

  // Convert wss:// to https:// for Egress API
  const httpUrl = getLiveKitHttpUrl(url);
  const egressClient = new EgressClient(httpUrl, apiKey, apiSecret);

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
      encodingOptions: EncodingOptionsPreset.H264_1080P_30,
    }
  );

  return info.egressId;
}

// 3. Stop LiveKit Egress
export async function stopLiveKitEgress(egressId: string) {
  const { url, apiKey, apiSecret } = getLiveKitCredentials();
  if (!url || !apiKey || !apiSecret) {
    throw new Error("LiveKit credentials not configured.");
  }

  const httpUrl = getLiveKitHttpUrl(url);
  const egressClient = new EgressClient(httpUrl, apiKey, apiSecret);

  return await egressClient.stopEgress(egressId);
}

