import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startRoomEgressToYouTube, stopLiveKitEgress } from "@/lib/livekitService";
import { ensureActiveYouTubeBroadcast } from "@/lib/youtubeService";

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
      // Ensure broadcast is active and not marked complete/closed on YouTube
      const activeEvent = (await ensureActiveYouTubeBroadcast(eventId)) || event;

      if (!activeEvent.youtubeStreamKey) {
        return NextResponse.json(
          { error: "Nenhuma chave de transmissão do YouTube configurada para este evento." },
          { status: 400 }
        );
      }

      const rtmpUrl = activeEvent.youtubeRtmpUrl || "rtmp://a.rtmp.youtube.com/live2";
      const roomName = `event_${eventId}`;

      const startedEgressId = await startRoomEgressToYouTube({
        roomName,
        rtmpUrl,
        streamKey: activeEvent.youtubeStreamKey,
      });

      // Update event status to live in both Event and StreamRoom
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "live" },
      });

      await prisma.streamRoom.upsert({
        where: { eventId },
        update: { isLive: true },
        create: { eventId, isLive: true },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        egressId: startedEgressId,
        isLive: true,
        youtubeBroadcastId: activeEvent.youtubeBroadcastId,
        youtubeStreamKey: activeEvent.youtubeStreamKey,
        youtubeEmbedUrl: activeEvent.youtubeEmbedUrl,
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

      await prisma.streamRoom.upsert({
        where: { eventId },
        update: { isLive: false },
        create: { eventId, isLive: false },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        isLive: false,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("LiveKit Egress Error:", err);
    return NextResponse.json({ error: err.message || "Erro ao comunicar com LiveKit Cloud Egress" }, { status: 500 });
  }
}
