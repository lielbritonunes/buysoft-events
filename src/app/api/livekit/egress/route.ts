import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startRoomEgressToYouTube, stopLiveKitEgress } from "@/lib/livekitService";
import { ensureActiveYouTubeBroadcast, endYouTubeLiveBroadcast } from "@/lib/youtubeService";

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
      const roomName = `event_${eventId}`;
      try {
        await stopLiveKitEgress({
          egressId: egressId || undefined,
          roomName,
        });
      } catch (e) {
        console.warn("Could not stop LiveKit egress:", e);
      }

      // Automatically transition YouTube Live broadcast to 'complete' in YouTube Studio
      try {
        await endYouTubeLiveBroadcast(eventId);
      } catch (e) {
        console.warn("Could not end YouTube live broadcast:", e);
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
    const msg = err?.message || "";
    let friendlyError = msg;

    if (msg.toLowerCase().includes("egress minutes exceeded") || msg.toLowerCase().includes("resource_exhausted")) {
      friendlyError = "Cota de minutos de transmissão do LiveKit Cloud esgotada. A live no palco Buysoft continua ativa para os participantes. Para transmitir simultaneamente para o YouTube via nuvem, adicione créditos no painel cloud.livekit.io ou transmita via OBS usando a chave RTMP abaixo.";
    } else if (msg.toLowerCase().includes("not configured")) {
      friendlyError = "Credenciais do LiveKit não configuradas no servidor.";
    } else if (msg.toLowerCase().includes("requested room does not exist")) {
      friendlyError = "A sala do evento ainda não foi iniciada no LiveKit.";
    }

    return NextResponse.json({ error: friendlyError, rawError: msg }, { status: 500 });
  }
}

