import { NextRequest, NextResponse } from "next/server";
import {
  getYouTubeIntegrationStatus,
  disconnectYouTubeIntegration,
  createYouTubeLiveBroadcastForEvent,
} from "@/lib/youtubeService";

export async function GET() {
  try {
    const status = await getYouTubeIntegrationStatus();
    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ isConnected: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, eventId } = body;

    if (action === "disconnect") {
      await disconnectYouTubeIntegration();
      return NextResponse.json({ success: true, isConnected: false });
    }

    if (action === "sync_event" && eventId) {
      const updated = await createYouTubeLiveBroadcastForEvent(eventId);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: "Não foi possível criar a live. Verifique se o canal está conectado e autorizado." },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, event: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
