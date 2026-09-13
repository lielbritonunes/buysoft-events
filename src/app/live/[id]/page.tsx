"use client";

import React, { useEffect, useState, useRef, use } from "react";
import {
  Radio,
  Users,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sparkles,
  Calendar,
  Clock,
  MessageSquare,
  HelpCircle,
  BarChart2,
  Share2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Play,
  Download,
  Star,
  Flame,
  Award,
  ChevronRight,
  Info,
  Zap
} from "lucide-react";
import LiveEngagementSidebar from "@/components/engagement/LiveEngagementSidebar";
import LiveCtaBanner from "@/components/engagement/LiveCtaBanner";
import FloatingReactions from "@/components/engagement/FloatingReactions";
import { getLiveRoomState } from "@/lib/dbActions";
import { ViewerReceiver } from "@/lib/webrtcStreamManager";
import { Room, RoomEvent, Track, RemoteTrack } from "livekit-client";

function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ name?: string; email?: string; token?: string }>;
}

export default function AttendeeLivePage({ params, searchParams }: Props) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const resolvedSearchParams = searchParams ? use(searchParams) : {};

  // State
  const [roomState, setRoomState] = useState<any>(null);
  const isLive = roomState?.status === "live";
  const isCompleted = roomState?.status === "completed";
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>(() => {
    if (resolvedSearchParams?.name) return resolvedSearchParams.name;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`attendee_name_${eventId}`);
      if (stored) return stored;
    }
    return "Participante Convidado";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  // Real WebRTC Live Stream
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [streamStatus, setStreamStatus] = useState<{ isLive: boolean; hasScreen: boolean; hasCamera: boolean }>({
    isLive: false,
    hasScreen: false,
    hasCamera: false,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video & audio player state
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"chat" | "qa" | "polls">("chat");
  const [copiedLink, setCopiedLink] = useState(false);

  // Stream Source Selection: WebRTC vs YouTube Live
  const [selectedSource, setSelectedSource] = useState<"webrtc" | "youtube">("webrtc");

  // LiveKit Cloud Subscriber for Attendee
  const livekitRoomRef = useRef<Room | null>(null);
  const [hasLiveKitTracks, setHasLiveKitTracks] = useState(false);

  // Initialize WebRTC Viewer Receiver
  useEffect(() => {
    const viewer = new ViewerReceiver(
      eventId,
      (stream) => {
        setRemoteStream(stream);
      },
      (status) => {
        setStreamStatus(status);
      }
    );
    viewer.start();
    return () => {
      viewer.stop();
    };
  }, [eventId]);

  // Connect to LiveKit Cloud as Attendee subscriber
  useEffect(() => {
    if (!eventId) return;

    let isSubscribed = true;
    const connectLiveKit = async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            role: "attendee",
            participantName: userName,
          }),
        });
        if (!res.ok) return;
        const { token, url } = await res.json();
        if (!token || !url || !isSubscribed) return;

        const room = new Room({
          adaptiveStream: false, // Ensures full 1080p resolution without downscaling
          dynacast: false,
        });

        const handleAttachTrack = (track: RemoteTrack) => {
          if (track.kind === Track.Kind.Video) {
            setHasLiveKitTracks(true);
            if (videoRef.current && isLive) {
              track.attach(videoRef.current);
              videoRef.current.play().catch(() => {});
            }
          }
          if (track.kind === Track.Kind.Audio) {
            if (isLive) {
              const el = track.attach();
              el.setAttribute("data-livekit-audio", "true");
              el.setAttribute("data-livekit-audio-id", track.sid || "audio");
              document.body.appendChild(el);
            }
          }
        };

        room.on(RoomEvent.TrackSubscribed, handleAttachTrack);

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
        });

        await room.connect(url, token);
        if (!isSubscribed) {
          room.disconnect();
          return;
        }

        livekitRoomRef.current = room;

        // Check for tracks that were already published before connecting
        for (const p of room.remoteParticipants.values()) {
          for (const pub of p.trackPublications.values()) {
            if (pub.track) {
              handleAttachTrack(pub.track);
            }
          }
        }
      } catch (err) {
        console.warn("LiveKit attendee subscriber warning:", err);
      }
    };

    connectLiveKit();

    return () => {
      isSubscribed = false;
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
      }
      document.querySelectorAll("[data-livekit-audio]").forEach((el) => el.remove());
    };
  }, [eventId, userName]);

  // Sync LiveKit video & audio tracks when transitioning between waiting room and live stage
  useEffect(() => {
    const room = livekitRoomRef.current;
    if (!room) return;

    if (!isLive) {
      // Detach all audio elements when not live to prevent green room audio leakage
      document.querySelectorAll("[data-livekit-audio]").forEach((el) => el.remove());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    // When LIVE, attach video to videoRef and audio to DOM
    for (const p of room.remoteParticipants.values()) {
      for (const pub of p.trackPublications.values()) {
        if (pub.track) {
          if (pub.track.kind === Track.Kind.Video && videoRef.current) {
            pub.track.attach(videoRef.current);
            videoRef.current.play().catch(() => {});
            setHasLiveKitTracks(true);
          } else if (pub.track.kind === Track.Kind.Audio) {
            const sid = pub.track.sid || "audio";
            const existing = document.querySelector(`[data-livekit-audio-id="${sid}"]`);
            if (!existing) {
              const el = pub.track.attach();
              el.setAttribute("data-livekit-audio", "true");
              el.setAttribute("data-livekit-audio-id", sid);
              document.body.appendChild(el);
            }
          }
        }
      }
    }
  }, [isLive, selectedSource, hasLiveKitTracks]);

  // Bind remote WebRTC stream to HTML5 video element with autoplay fallback when live (and not using LiveKit tracks)
  useEffect(() => {
    if (!isLive) {
      if (videoRef.current && !hasLiveKitTracks) {
        videoRef.current.srcObject = null;
      }
      return;
    }

    if (videoRef.current && remoteStream && !hasLiveKitTracks) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay with sound blocked by browser, trying muted:", err);
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().catch(() => {});
        }
      });
    }
  }, [isLive, remoteStream, hasLiveKitTracks]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Survey state for completed webinar
  const [rating, setRating] = useState(5);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch live room state periodically
  const fetchRoom = async () => {
    try {
      const state = await getLiveRoomState(eventId);
      setRoomState(state);
    } catch (err) {
      console.error("Error loading room state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 2500);
    return () => clearInterval(interval);
  }, [eventId]);

  // Save attendee name to localStorage
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setUserName(tempName.trim());
    if (typeof window !== "undefined") {
      localStorage.setItem(`attendee_name_${eventId}`, tempName.trim());
    }
    setIsEditingName(false);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Play audio test sound using Web Audio API
  const playSoundCheck = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
      setSoundTested(true);
      setTimeout(() => setSoundTested(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading && !roomState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-[#00b4fb]" />
          <p className="text-sm font-semibold text-slate-400">Conectando à sala do webinar...</p>
        </div>
      </div>
    );
  }

  const activeCta = roomState?.liveCtas?.[0] || null;

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* Top Navigation Bar */}
      <header className="flex h-14 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 sm:px-6 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00b4fb] text-white shadow-md shadow-sky-500/25">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold tracking-tight text-white">
                Buysoft <span className="text-[#00b4fb]">Events</span>
              </span>
              {isLive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  AO VIVO
                </span>
              ) : isCompleted ? (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 border border-slate-700">
                  ENCERRADO (REPLAY)
                </span>
              ) : (
                <span className="rounded-full bg-[#00b4fb]/20 px-2 py-0.5 text-[10px] font-bold text-[#00b4fb] border border-[#00b4fb]/30">
                  EM BREVE
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-md">
              {roomState?.title || "Webinar Corporativo"}
            </p>
          </div>
        </div>

        {/* User Identity & Utility Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Check Quick Test */}
          <button
            onClick={playSoundCheck}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Testar saída de áudio"
          >
            <Volume2 className="h-3.5 w-3.5 text-[#00b4fb]" />
            <span>{soundTested ? "Som OK! ✓" : "Testar Áudio"}</span>
          </button>

          {/* Attendee Name Pill */}
          <div className="relative">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Seu nome..."
                  className="rounded-lg border border-[#00b4fb] bg-slate-800 px-2.5 py-1 text-xs text-white focus:outline-none w-32"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#00b4fb] px-2 py-1 text-xs font-bold text-white hover:bg-[#009ce0]"
                >
                  OK
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setTempName(userName);
                  setIsEditingName(true);
                }}
                className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition"
                title="Clique para alterar seu nome no chat"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="font-semibold max-w-[120px] truncate">{userName}</span>
                <span className="text-[10px] text-slate-400 underline">editar</span>
              </button>
            )}
          </div>

          {/* Share webinar link */}
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            title="Copiar link da transmissão"
          >
            {copiedLink ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center: Stage Screen Player */}
        <main className={`flex flex-col flex-1 bg-slate-950 p-2 sm:p-4 transition-all duration-300 ${isTheater ? "lg:pr-4" : ""}`}>
          
          {/* Active CTA Banner (Shows at top of stage if triggered by host) */}
          {activeCta && (
            <div className="mb-3">
              <LiveCtaBanner cta={activeCta} />
            </div>
          )}

          {/* Stream Source Selector (Direct WebRTC vs YouTube Live) */}
          {roomState?.youtubeBroadcastId && isLive && (
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setSelectedSource("webrtc")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedSource === "webrtc"
                      ? "bg-[#00b4fb] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Zap className="h-3 w-3 fill-current" />
                  <span>Transmissão Direta (&lt;300ms)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSource("youtube")}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    selectedSource === "youtube"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <YouTubeIcon className="h-3.5 w-3.5" />
                  <span>YouTube Live (HD)</span>
                </button>
              </div>

              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                {selectedSource === "webrtc" ? "⚡ Ultrabaixa latência em tempo real" : "▶️ Transmissão oficial via YouTube"}
              </span>
            </div>
          )}

          {/* Video / Stage Area */}
          <div className="relative flex-1 flex items-center justify-center rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl min-h-[320px] sm:min-h-[480px]">
            {selectedSource === "youtube" && roomState?.youtubeBroadcastId && isLive ? (
              /* YOUTUBE LIVE UNLISTED EMBEDDED STREAM */
              <div className="relative h-full w-full flex items-center justify-center bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${roomState.youtubeBroadcastId}?autoplay=1&playsinline=1&modestbranding=1&rel=0`}
                  title={roomState?.title || "Transmissão Ao Vivo"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full border-0 absolute inset-0"
                />

                {/* Switch to direct WebRTC if YouTube has no signal */}
                <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedSource("webrtc")}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md transition"
                  >
                    <Zap className="h-3.5 w-3.5 text-[#00b4fb]" />
                    <span>Tela preta no YouTube? Assistir Direto no Buysoft ⚡</span>
                  </button>
                </div>

                {/* Stream Watermark & Status Overlay */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                  <span className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    YOUTUBE AO VIVO
                  </span>
                  <span className="rounded-lg bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#00b4fb]" />
                    <span>Transmissão Oficial</span>
                  </span>
                </div>

                {/* Floating Reactions overlay */}
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
                  <FloatingReactions />
                </div>
              </div>
            ) : isLive ? (
              /* LIVE STAGE SCREEN WITH REAL WEBRTC / LIVEKIT VIDEO */
              <div className="relative h-full w-full flex items-center justify-center bg-black">
                {/* HTML5 WebRTC / LiveKit Video Player */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  className="h-full w-full object-contain block"
                />

                {/* Floating Unmute Prompt if audio is muted */}
                {(hasLiveKitTracks || remoteStream) && isMuted && (
                  <button
                    onClick={() => setIsMuted(false)}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-white shadow-2xl backdrop-blur-md transition transform hover:scale-105 active:scale-95"
                  >
                    <VolumeX className="h-4 w-4 text-rose-400 animate-pulse" />
                    <span>Clique para Ativar Som 🔊</span>
                  </button>
                )}

                {/* Direct Stream Watermark Overlay */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                  <span className="flex items-center gap-1.5 rounded-lg bg-[#00b4fb] backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3 fill-current" />
                    TRANSMISSÃO DIRETA
                  </span>
                  <span className="rounded-lg bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>&lt;300ms Latência</span>
                  </span>
                </div>

                {/* Floating Reactions overlay */}
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
                  <FloatingReactions />
                </div>

                {/* Fallback / Audio-only Stage Visualizer when video track is pending */}
                {!hasLiveKitTracks && (!remoteStream || remoteStream.getVideoTracks().length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40">
                    <div className="text-center space-y-4 p-6 z-10">
                      <div className="relative inline-block">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-1 shadow-2xl shadow-sky-500/25 animate-pulse">
                          <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold">
                            {roomState?.speakers?.[0]?.name ? roomState.speakers[0].name.charAt(0) : "B"}
                          </div>
                        </div>
                        <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-slate-900 text-white text-[10px] font-bold">
                          HD
                        </span>
                      </div>

                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 backdrop-blur-md px-3 py-1 border border-slate-700">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-xs font-bold text-slate-200">
                            {roomState?.speakers?.[0]?.name || "Palestrante Principal"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({roomState?.speakers?.[0]?.company || "Buysoft"})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Sessão Ao Vivo • Conectando áudio e vídeo do estúdio...
                        </p>
                      </div>

                      {/* Animated Audio Equalizer */}
                      <div className="flex items-center justify-center gap-1 pt-2">
                        {[32, 48, 24, 56, 40, 60, 36, 52, 28, 44].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 rounded-full bg-[#00b4fb] transition-all duration-150 animate-pulse"
                            style={{
                              height: `${h}px`,
                              animationDelay: `${i * 80}ms`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stream Watermark & Status Overlay */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg bg-rose-600/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    TRANSMISSÃO AO VIVO
                  </span>
                  <span className="rounded-lg bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#00b4fb]" />
                    <span>Ao vivo com você</span>
                  </span>
                </div>

                {/* Floating Reactions overlay */}
                <div className="absolute bottom-4 right-4 z-20">
                  <FloatingReactions />
                </div>
              </div>
            ) : isCompleted ? (
              /* COMPLETED / REPLAY SCREEN */
              <div className="relative h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-5 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xl">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div className="max-w-md space-y-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    Webinar Concluído!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Obrigado por sua presença em <strong>{roomState?.title}</strong>. A gravação oficial e o material complementar já estão disponíveis abaixo.
                  </p>
                </div>

                {/* Feedback Card */}
                {!feedbackSent ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 max-w-sm w-full space-y-3">
                    <span className="text-xs font-bold text-slate-300">
                      Como você avalia o conteúdo deste evento?
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`p-1 transition hover:scale-125 ${
                            star <= rating ? "text-amber-400" : "text-slate-600"
                          }`}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setFeedbackSent(true)}
                      className="w-full rounded-xl bg-[#00b4fb] py-2 text-xs font-bold text-white shadow hover:bg-[#009ce0] transition"
                    >
                      Enviar Avaliação
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 px-4 py-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Obrigado pelo seu feedback! Ele foi registrado.</span>
                  </div>
                )}

                {/* Material Download Button */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Download dos slides em PDF iniciado!");
                    }}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-lg hover:bg-slate-100 transition"
                  >
                    <Download className="h-4 w-4 text-[#00b4fb]" />
                    <span>Baixar Apresentação (PDF)</span>
                  </a>
                </div>
              </div>
            ) : (
              /* WAITING ROOM SCREEN (Scheduled / Draft / Published) */
              <div className="relative h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-6 bg-gradient-to-b from-slate-900 via-slate-950 to-black">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#00b4fb]/10 px-3.5 py-1.5 text-xs font-bold text-[#00b4fb] border border-[#00b4fb]/20">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Sala de Espera Ativa</span>
                </div>

                <div className="max-w-lg space-y-2">
                  <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
                    {roomState?.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    O apresentador está preparando a sala no estúdio. A transmissão começará automaticamente assim que a sessão for iniciada.
                  </p>
                </div>

                {/* Speakers Preview */}
                {roomState?.speakers && roomState.speakers.length > 0 && (
                  <div className="w-full max-w-md pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 block">
                      Palestrantes Confirmados
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {roomState.speakers.map((spk: any) => (
                        <div
                          key={spk.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00b4fb] to-sky-400 text-sm font-bold text-white">
                            {spk.name.charAt(0)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate">{spk.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{spk.role || "Especialista"}</p>
                            <p className="text-[10px] text-[#00b4fb] truncate">{spk.company || "Buysoft"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pre-event Sound Check & Prompt */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={playSoundCheck}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                  >
                    <Volume2 className="h-4 w-4 text-[#00b4fb]" />
                    <span>{soundTested ? "Som Verificado ✓" : "Testar seu Áudio"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Floating Stage Controls */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition"
                title={isMuted ? "Ativar som" : "Silenciar áudio"}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setIsTheater(!isTheater)}
                className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition"
                title="Modo Teatro"
              >
                <span>{isTheater ? "Normal" : "Teatro"}</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition"
                title="Tela Cheia"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </main>

        {/* Right Column: Live Engagement Sidebar (Chat, Q&A, Polls) */}
        {!isTheater && (
          <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 flex flex-col h-[480px] lg:h-auto">
            <LiveEngagementSidebar
              eventId={eventId}
              userName={userName}
              userRole="attendee"
              roomState={roomState}
              onRefresh={fetchRoom}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
