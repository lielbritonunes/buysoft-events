import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface PeerSession {
  offer?: any;
  answer?: any;
  hostCandidates: any[];
  peerCandidates: any[];
  lastSeen: number;
}

async function getDbRoom(eventId: string) {
  let room = await prisma.streamRoom.findUnique({
    where: { eventId },
  });

  if (!room) {
    room = await prisma.streamRoom.create({
      data: {
        eventId,
        hostId: null,
        isLive: false,
        hasScreen: false,
        hasCamera: true,
        speakerName: "Orador",
        peersJson: "{}",
      },
    });
  }

  let peers: Record<string, PeerSession> = {};
  try {
    if (room.peersJson) {
      peers = JSON.parse(room.peersJson);
    }
  } catch {
    peers = {};
  }

  return { room, peers };
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

  try {
    const { room, peers } = await getDbRoom(eventId);

    if (role === "host") {
      // Return all peer sessions that have offers or candidates for host
      const activePeers: Record<string, any> = {};
      const now = Date.now();
      for (const [pId, pData] of Object.entries(peers)) {
        // Keep peers that either have an offer waiting for an answer, or seen in last 2 mins
        if (!pData.answer || now - (pData.lastSeen || 0) < 120000) {
          activePeers[pId] = {
            offer: pData.offer,
            peerCandidates: pData.peerCandidates || [],
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
    if (peerId && peers[peerId]) {
      const now = Date.now();
      if (now - (peers[peerId].lastSeen || 0) > 10000) {
        peers[peerId].lastSeen = now;
        prisma.streamRoom.update({
          where: { eventId },
          data: { peersJson: JSON.stringify(peers) },
        }).catch(() => {});
      }
    }

    const peerSession = peerId ? peers[peerId] : null;
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
  } catch (err: any) {
    console.error("[STREAM API ERROR GET]:", err);
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}

// POST: Update status, send offer/answer and ICE candidates
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const body = await req.json();
  const { action, role, peerId, payload } = body;

  try {
    const { room, peers } = await getDbRoom(eventId);

    // Host presence & broadcast status
    if (role === "host") {
      if (action === "heartbeat" || action === "update_status") {
        const isLive = typeof payload?.isLive === "boolean" ? payload.isLive : room.isLive;
        const hasScreen = typeof payload?.hasScreen === "boolean" ? payload.hasScreen : room.hasScreen;
        const hasCamera = typeof payload?.hasCamera === "boolean" ? payload.hasCamera : room.hasCamera;
        const speakerName = payload?.speakerName || room.speakerName;

        await prisma.streamRoom.update({
          where: { eventId },
          data: {
            hostId: peerId || "host",
            isLive,
            hasScreen,
            hasCamera,
            speakerName,
            lastHeartbeat: new Date(),
          },
        });
        return NextResponse.json({ success: true });
      }

      if (action === "send_answer") {
        const targetPeerId = payload.targetPeerId;
        if (targetPeerId && peers[targetPeerId]) {
          peers[targetPeerId].answer = payload.answer;
          await prisma.streamRoom.update({
            where: { eventId },
            data: { peersJson: JSON.stringify(peers) },
          });
        }
        return NextResponse.json({ success: true });
      }

      if (action === "send_host_candidate") {
        const targetPeerId = payload.targetPeerId;
        if (targetPeerId && peers[targetPeerId]) {
          if (!peers[targetPeerId].hostCandidates) {
            peers[targetPeerId].hostCandidates = [];
          }
          peers[targetPeerId].hostCandidates.push(payload.candidate);
          await prisma.streamRoom.update({
            where: { eventId },
            data: { peersJson: JSON.stringify(peers) },
          });
        }
        return NextResponse.json({ success: true });
      }
    }

    // Viewer operations
    if (role === "viewer" && peerId) {
      if (!peers[peerId]) {
        peers[peerId] = {
          hostCandidates: [],
          peerCandidates: [],
          lastSeen: Date.now(),
        };
      }
      peers[peerId].lastSeen = Date.now();

      if (action === "send_offer") {
        peers[peerId].offer = payload.offer;
        await prisma.streamRoom.update({
          where: { eventId },
          data: { peersJson: JSON.stringify(peers) },
        });
        return NextResponse.json({ success: true });
      }

      if (action === "send_peer_candidate") {
        if (!peers[peerId].peerCandidates) {
          peers[peerId].peerCandidates = [];
        }
        peers[peerId].peerCandidates.push(payload.candidate);
        await prisma.streamRoom.update({
          where: { eventId },
          data: { peersJson: JSON.stringify(peers) },
        });
        return NextResponse.json({ success: true });
      }

      if (action === "leave") {
        delete peers[peerId];
        await prisma.streamRoom.update({
          where: { eventId },
          data: { peersJson: JSON.stringify(peers) },
        });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[STREAM API ERROR POST]:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
