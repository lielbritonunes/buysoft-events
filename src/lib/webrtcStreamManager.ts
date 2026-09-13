"use client";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

// ==========================================
// 1. HOST BROADCASTER
// ==========================================
export class HostBroadcaster {
  private eventId: string;
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private processedCandidates: Set<string> = new Set();
  private channel: BroadcastChannel | null = null;
  private pollingInterval: any = null;
  private isLive: boolean = false;
  private isDestroyed: boolean = false;

  constructor(eventId: string) {
    this.eventId = eventId;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel(`webinar_stream_${eventId}`);
        this.channel.onmessage = this.handleBroadcastMessage.bind(this);
      } catch (e) {
        console.warn("BroadcastChannel not supported or error:", e);
      }
    }
  }

  public setStreams(local: MediaStream | null, screen: MediaStream | null, isLive: boolean) {
    this.localStream = local;
    this.screenStream = screen;
    this.isLive = isLive;

    // Send broadcast update
    this.broadcastStatus();

    // Update existing peer connection tracks
    for (const [, pc] of this.peerConnections.entries()) {
      this.syncTracksForPeer(pc);
    }
  }

  public start() {
    this.isDestroyed = false;
    this.broadcastStatus();

    // Poll signaling API every 1500ms
    this.pollingInterval = setInterval(() => {
      this.pollSignaling();
    }, 1500);
  }

  public stop() {
    this.isDestroyed = true;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    for (const pc of this.peerConnections.values()) {
      pc.close();
    }
    this.peerConnections.clear();
    this.processedCandidates.clear();
    if (this.channel) {
      this.channel.postMessage({ type: "host_stopped" });
    }
  }

  private broadcastStatus() {
    const payload = {
      isLive: this.isLive,
      hasScreen: !!this.screenStream,
      hasCamera: !!this.localStream?.getVideoTracks()?.some((t) => t.enabled),
    };
    if (this.channel) {
      this.channel.postMessage({ type: "status_update", payload });
    }
    // Also inform API
    fetch(`/api/stream/${this.eventId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_status",
        role: "host",
        peerId: "host",
        payload,
      }),
    }).catch(() => {});
  }

  private async pollSignaling() {
    if (this.isDestroyed) return;
    try {
      const res = await fetch(`/api/stream/${this.eventId}?role=host&peerId=host`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.peers) {
        for (const [peerId, peerData] of Object.entries<any>(data.peers)) {
          if (peerData.offer && !this.peerConnections.has(peerId)) {
            await this.handleOffer(peerId, peerData.offer, "http");
          }
          if (peerData.peerCandidates && this.peerConnections.has(peerId)) {
            const pc = this.peerConnections.get(peerId)!;
            for (const c of peerData.peerCandidates) {
              const key = `${peerId}_${JSON.stringify(c)}`;
              if (!this.processedCandidates.has(key)) {
                this.processedCandidates.add(key);
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                } catch (e) {}
              }
            }
          }
        }
      }
    } catch (err) {
      // ignore network blips
    }
  }

  private async handleBroadcastMessage(e: MessageEvent) {
    if (this.isDestroyed) return;
    const msg = e.data;
    if (!msg || !msg.type) return;

    if (msg.type === "viewer_join") {
      this.broadcastStatus();
    } else if (msg.type === "viewer_offer") {
      await this.handleOffer(msg.peerId, msg.offer, "channel");
    } else if (msg.type === "viewer_candidate") {
      const pc = this.peerConnections.get(msg.peerId);
      if (pc && msg.candidate) {
        const key = `${msg.peerId}_${JSON.stringify(msg.candidate)}`;
        if (!this.processedCandidates.has(key)) {
          this.processedCandidates.add(key);
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (err) {}
        }
      }
    }
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit, source: "channel" | "http") {
    let pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }

    pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(peerId, pc);

    // Send host ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (source === "channel" && this.channel) {
          this.channel.postMessage({
            type: "host_candidate",
            peerId,
            candidate: event.candidate.toJSON(),
          });
        }
        fetch(`/api/stream/${this.eventId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_host_candidate",
            role: "host",
            peerId: "host",
            payload: { targetPeerId: peerId, candidate: event.candidate.toJSON() },
          }),
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.peerConnections.delete(peerId);
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      this.syncTracksForPeer(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (source === "channel" && this.channel) {
        this.channel.postMessage({
          type: "host_answer",
          peerId,
          answer: { type: answer.type, sdp: answer.sdp },
        });
      }

      await fetch(`/api/stream/${this.eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_answer",
          role: "host",
          peerId: "host",
          payload: { targetPeerId: peerId, answer: { type: answer.type, sdp: answer.sdp } },
        }),
      }).catch(() => {});
    } catch (err) {
      console.warn("Error handling offer for peer:", peerId, err);
    }
  }

  private syncTracksForPeer(pc: RTCPeerConnection) {
    if (pc.signalingState === "closed") return;

    // Only send tracks to viewers if webinar is LIVE; keep private when in backstage
    const videoTrack = this.isLive
      ? (this.screenStream?.getVideoTracks().find((t) => t.enabled) ||
         this.localStream?.getVideoTracks().find((t) => t.enabled) ||
         null)
      : null;

    if (videoTrack) {
      videoTrack.contentHint = "detail";
    }

    // Pick audio track: presenter microphone (or screen audio if present) when live
    const audioTrack = this.isLive
      ? (this.localStream?.getAudioTracks().find((t) => t.enabled) ||
         this.screenStream?.getAudioTracks().find((t) => t.enabled) ||
         null)
      : null;

    const transceivers = pc.getTransceivers();

    // 1. Video Transceiver
    const videoTransceiver = transceivers.find(
      (t) => t.receiver.track.kind === "video" || t.sender.track?.kind === "video"
    );

    if (videoTransceiver) {
      videoTransceiver.sender.replaceTrack(videoTrack).catch(() => {});
      if (videoTrack) {
        videoTransceiver.direction = "sendonly";
        try {
          const params = videoTransceiver.sender.getParameters();
          if (params.encodings && params.encodings.length > 0) {
            params.encodings[0].maxBitrate = 5_000_000;
            params.encodings[0].maxFramerate = 30;
            videoTransceiver.sender.setParameters(params).catch(() => {});
          }
        } catch (_) {}
      }
    } else if (videoTrack) {
      const stream = this.screenStream || this.localStream;
      if (stream) {
        const sender = pc.addTrack(videoTrack, stream);
        try {
          const params = sender.getParameters();
          if (params.encodings && params.encodings.length > 0) {
            params.encodings[0].maxBitrate = 5_000_000;
            params.encodings[0].maxFramerate = 30;
            sender.setParameters(params).catch(() => {});
          }
        } catch (_) {}
      }
    }

    // 2. Audio Transceiver
    const audioTransceiver = transceivers.find(
      (t) => t.receiver.track.kind === "audio" || t.sender.track?.kind === "audio"
    );

    if (audioTransceiver) {
      audioTransceiver.sender.replaceTrack(audioTrack).catch(() => {});
      if (audioTrack) {
        audioTransceiver.direction = "sendonly";
      }
    } else if (audioTrack) {
      const stream = this.localStream || this.screenStream;
      if (stream) pc.addTrack(audioTrack, stream);
    }
  }
}

// ==========================================
// 2. VIEWER RECEIVER
// ==========================================
export class ViewerReceiver {
  private eventId: string;
  private peerId: string;
  private pc: RTCPeerConnection | null = null;
  private channel: BroadcastChannel | null = null;
  private pollingInterval: any = null;
  private onStreamCallback: (stream: MediaStream) => void;
  private onStatusCallback: (status: { isLive: boolean; hasScreen: boolean; hasCamera: boolean }) => void;
  private isDestroyed: boolean = false;
  private connectedWithAnswer: boolean = false;
  private receivedStream: MediaStream = new MediaStream();
  private processedCandidates: Set<string> = new Set();

  constructor(
    eventId: string,
    onStream: (stream: MediaStream) => void,
    onStatus: (status: { isLive: boolean; hasScreen: boolean; hasCamera: boolean }) => void
  ) {
    this.eventId = eventId;
    this.peerId = "v_" + Math.random().toString(36).substring(2, 9);
    this.onStreamCallback = onStream;
    this.onStatusCallback = onStatus;

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel(`webinar_stream_${eventId}`);
        this.channel.onmessage = this.handleBroadcastMessage.bind(this);
      } catch (e) {
        console.warn("BroadcastChannel not supported:", e);
      }
    }
  }

  public async start() {
    this.isDestroyed = false;
    this.connectedWithAnswer = false;
    this.processedCandidates.clear();

    // Create RTCPeerConnection
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    // Expect receiving audio and video
    this.pc.addTransceiver("video", { direction: "recvonly" });
    this.pc.addTransceiver("audio", { direction: "recvonly" });

    this.pc.ontrack = (event) => {
      if (event.track) {
        // Remove existing tracks of the same kind
        this.receivedStream
          .getTracks()
          .filter((t) => t.kind === event.track.kind)
          .forEach((t) => this.receivedStream.removeTrack(t));

        this.receivedStream.addTrack(event.track);

        event.track.onended = () => {
          this.receivedStream.removeTrack(event.track);
          this.onStreamCallback(new MediaStream(this.receivedStream.getTracks()));
        };

        // Notify with a fresh MediaStream wrapper containing all active tracks
        this.onStreamCallback(new MediaStream(this.receivedStream.getTracks()));
      }
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        if (this.channel) {
          this.channel.postMessage({
            type: "viewer_candidate",
            peerId: this.peerId,
            candidate: event.candidate.toJSON(),
          });
        }
        fetch(`/api/stream/${this.eventId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_peer_candidate",
            role: "viewer",
            peerId: this.peerId,
            payload: { candidate: event.candidate.toJSON() },
          }),
        }).catch(() => {});
      }
    };

    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Send offer via BroadcastChannel
    if (this.channel) {
      this.channel.postMessage({
        type: "viewer_offer",
        peerId: this.peerId,
        offer: { type: offer.type, sdp: offer.sdp },
      });
      // Ping host
      this.channel.postMessage({ type: "viewer_join", peerId: this.peerId });
    }

    // Send offer via HTTP API
    await fetch(`/api/stream/${this.eventId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_offer",
        role: "viewer",
        peerId: this.peerId,
        payload: { offer: { type: offer.type, sdp: offer.sdp } },
      }),
    }).catch(() => {});

    // Polling for answer and host candidates
    this.pollingInterval = setInterval(() => {
      this.pollSignaling();
    }, 1500);
  }

  public stop() {
    this.isDestroyed = true;
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.receivedStream.getTracks().forEach((t) => t.stop());
    this.receivedStream = new MediaStream();
    this.processedCandidates.clear();

    fetch(`/api/stream/${this.eventId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave", role: "viewer", peerId: this.peerId }),
    }).catch(() => {});
  }

  private async pollSignaling() {
    if (this.isDestroyed) return;
    try {
      const res = await fetch(`/api/stream/${this.eventId}?role=viewer&peerId=${this.peerId}`);
      if (!res.ok) return;
      const data = await res.json();

      this.onStatusCallback({
        isLive: !!data.isLive,
        hasScreen: !!data.hasScreen,
        hasCamera: !!data.hasCamera,
      });

      if (!this.connectedWithAnswer && data.answer && this.pc && this.pc.signalingState === "have-local-offer") {
        this.connectedWithAnswer = true;
        await this.pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      if (data.hostCandidates && this.pc && this.pc.remoteDescription) {
        for (const c of data.hostCandidates) {
          const key = JSON.stringify(c);
          if (!this.processedCandidates.has(key)) {
            this.processedCandidates.add(key);
            try {
              await this.pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
  }

  private async handleBroadcastMessage(e: MessageEvent) {
    if (this.isDestroyed) return;
    const msg = e.data;
    if (!msg || !msg.type) return;

    if (msg.type === "status_update" && msg.payload) {
      this.onStatusCallback(msg.payload);
    } else if (msg.type === "host_answer" && msg.peerId === this.peerId && this.pc) {
      if (this.pc.signalingState === "have-local-offer") {
        this.connectedWithAnswer = true;
        await this.pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
      }
    } else if (msg.type === "host_candidate" && msg.peerId === this.peerId && this.pc) {
      if (this.pc.remoteDescription && msg.candidate) {
        const key = JSON.stringify(msg.candidate);
        if (!this.processedCandidates.has(key)) {
          this.processedCandidates.add(key);
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } catch (e) {}
        }
      }
    }
  }
}
