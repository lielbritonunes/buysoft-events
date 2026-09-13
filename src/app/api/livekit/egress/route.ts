import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startRoomEgressToYouTube, stopLiveKitEgress } from "@/lib/livekitService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, eventId, egressId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (action === "start") {
      if (!event.youtubeStreamKey) {
        return NextResponse.json(
          { error: "Nenhuma chave de transmissão do YouTube configurada para este evento." },
          { status: 400 }
        );
      }

      const rtmpUrl = event.youtubeRtmpUrl || "rtmp://a.rtmp.youtube.com/live2";
      const roomName = `event_${eventId}`;

      const startedEgressId = await startRoomEgressToYouTube({
        roomName,
        rtmpUrl,
        streamKey: event.youtubeStreamKey,
      });

      // Update event status to live
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "live" },
      });

      return NextResponse.json({
        success: true,
        egressId: startedEgressId,
        isLive: true,
      });
    }

    if (action === "stop") {
      if (egressId) {
        try {
          await stopLiveKitEgress(egressId);
        } catch (e) {
          console.warn("Could not stop LiveKit egress (might have already ended):", e);
        }
      }

      await prisma.event.update({
        where: { id: eventId },
        data: { status: "published" },
      });

      return NextResponse.json({
        success: true,
        isLive: false,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("LiveKit Egress Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
