import { NextRequest, NextResponse } from "next/server";

interface PeerSession {
  offer?: any;
  answer?: any;
  hostCandidates: any[];
  peerCandidates: any[];
  lastSeen: number;
}

interface StreamRoom {
  hostId: string | null;
  isLive: boolean;
  hasScreen: boolean;
  hasCamera: boolean;
  speakerName: string;
  peers: Record<string, PeerSession>;
  lastUpdated: number;
}

// Global in-memory room store (preserved across API requests in Node runtime)
const globalRooms: Record<string, StreamRoom> =
  (global as any).__STREAM_ROOMS || ((global as any).__STREAM_ROOMS = {});

function getRoom(eventId: string): StreamRoom {
  if (!globalRooms[eventId]) {
    globalRooms[eventId] = {
      hostId: null,
      isLive: false,
      hasScreen: false,
      hasCamera: true,
      speakerName: "Orador",
      peers: {},
      lastUpdated: Date.now(),
    };
  }
  return globalRooms[eventId];
}

// GET: Query room status & pending signaling data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "viewer"; // "host" | "viewer"
  const peerId = searchParams.get("peerId") || "";

  const room = getRoom(eventId);

  if (role === "host") {
    // Return all peer sessions that have offers or candidates for host
    const activePeers: Record<string, any> = {};
    const now = Date.now();
    for (const [pId, pData] of Object.entries(room.peers)) {
      // Keep peers seen in last 30s
      if (now - pData.lastSeen < 30000) {
        activePeers[pId] = {
          offer: pData.offer,
          peerCandidates: pData.peerCandidates,
        };
      }
    }
    return NextResponse.json({
      status: "ok",
      isLive: room.isLive,
      hasScreen: room.hasScreen,
      hasCamera: room.hasCamera,
      speakerName: room.speakerName,
      peers: activePeers,
    });
  }

  // Viewer role
  const peerSession = peerId ? room.peers[peerId] : null;
  return NextResponse.json({
    status: "ok",
    isLive: room.isLive,
    hasScreen: room.hasScreen,
    hasCamera: room.hasCamera,
    speakerName: room.speakerName,
    hasHost: !!room.hostId,
    answer: peerSession?.answer || null,
    hostCandidates: peerSession?.hostCandidates || [],
  });
}

// POST: Update status, send offer/answer and ICE candidates
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const body = await req.json();
  const { action, role, peerId, payload } = body;

  const room = getRoom(eventId);
  room.lastUpdated = Date.now();

  // Host presence & broadcast status
  if (role === "host") {
    if (action === "heartbeat" || action === "update_status") {
      room.hostId = peerId || "host";
      if (typeof payload?.isLive === "boolean") room.isLive = payload.isLive;
      if (typeof payload?.hasScreen === "boolean") room.hasScreen = payload.hasScreen;
      if (typeof payload?.hasCamera === "boolean") room.hasCamera = payload.hasCamera;
      if (payload?.speakerName) room.speakerName = payload.speakerName;
      return NextResponse.json({ success: true, room });
    }

    if (action === "send_answer") {
      const targetPeerId = payload.targetPeerId;
      if (targetPeerId && room.peers[targetPeerId]) {
        room.peers[targetPeerId].answer = payload.answer;
      }
      return NextResponse.json({ success: true });
    }

    if (action === "send_host_candidate") {
      const targetPeerId = payload.targetPeerId;
      if (targetPeerId && room.peers[targetPeerId]) {
        room.peers[targetPeerId].hostCandidates.push(payload.candidate);
      }
      return NextResponse.json({ success: true });
    }
  }

  // Viewer operations
  if (role === "viewer" && peerId) {
    if (!room.peers[peerId]) {
      room.peers[peerId] = {
        hostCandidates: [],
        peerCandidates: [],
        lastSeen: Date.now(),
      };
    }
    room.peers[peerId].lastSeen = Date.now();

    if (action === "send_offer") {
      room.peers[peerId].offer = payload.offer;
      return NextResponse.json({ success: true });
    }

    if (action === "send_peer_candidate") {
      room.peers[peerId].peerCandidates.push(payload.candidate);
      return NextResponse.json({ success: true });
    }

    if (action === "leave") {
      delete room.peers[peerId];
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ success: true });
}
