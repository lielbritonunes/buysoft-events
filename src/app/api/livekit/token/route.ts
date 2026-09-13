import { NextRequest, NextResponse } from "next/server";
import { generateLiveKitToken, getLiveKitCredentials, LIVEKIT_URL } from "@/lib/livekitService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, participantName, role } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const isHost = role === "host";
    const isAttendee = role === "attendee";
    const defaultName = isHost
      ? "Host Organizador"
      : isAttendee
      ? "Participante Convidado"
      : "Orador Convidado";
    const name = participantName || defaultName;
    const identity = `${role || "viewer"}_${Math.random().toString(36).substring(2, 9)}`;

    const token = await generateLiveKitToken({
      roomName: `event_${eventId}`,
      participantIdentity: identity,
      participantName: name,
      isHost,
      canPublish: !isAttendee,
      canSubscribe: true,
    });

    const { url } = getLiveKitCredentials();

    return NextResponse.json({
      token,
      url: url || LIVEKIT_URL,
      identity,
      name,
    });
  } catch (err: any) {
    console.error("LiveKit Token Generation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

