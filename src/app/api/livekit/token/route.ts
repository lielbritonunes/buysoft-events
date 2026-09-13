import { NextRequest, NextResponse } from "next/server";
import { generateLiveKitToken, LIVEKIT_URL } from "@/lib/livekitService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, participantName, role } = body;

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const name = participantName || (role === "host" ? "Host Organizador" : "Orador Convidado");
    const identity = `${role || "speaker"}_${Math.random().toString(36).substring(2, 9)}`;
    const isHost = role === "host";

    const token = await generateLiveKitToken({
      roomName: `event_${eventId}`,
      participantIdentity: identity,
      participantName: name,
      isHost,
    });

    return NextResponse.json({
      token,
      url: LIVEKIT_URL,
      identity,
      name,
    });
  } catch (err: any) {
    console.error("LiveKit Token Generation Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
