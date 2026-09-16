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
  Zap,
  Monitor,
  Mic,
  MicOff,
  User,
} from "lucide-react";
import LiveEngagementSidebar from "@/components/engagement/LiveEngagementSidebar";
import LiveCtaBanner from "@/components/engagement/LiveCtaBanner";
import FloatingReactions from "@/components/engagement/FloatingReactions";
import { getLiveRoomState } from "@/lib/dbActions";
import { ViewerReceiver } from "@/lib/webrtcStreamManager";
import { Room, RoomEvent, Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from "livekit-client";
import { BACKGROUND_PRESETS } from "@/components/studio/StudioLayoutManager";



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
  const [isMuted, setIsMuted] = useState(true); // Default to muted for guaranteed autoplay without browser blocking
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"chat" | "qa" | "polls">("chat");
  const [copiedLink, setCopiedLink] = useState(false);



  // LiveKit Cloud Subscriber for Attendee
  const livekitRoomRef = useRef<Room | null>(null);
  const [hasLiveKitTracks, setHasLiveKitTracks] = useState(false);

  // Separate tracks for camera and screen — composed via CSS, not canvas
  const [cameraTrack, setCameraTrack] = useState<RemoteTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<RemoteTrack | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Overlay state sent via LiveKit DataChannel from host
  interface OverlayState {
    layoutMode: "solo" | "split" | "pip" | "grid";
    isScreenSharing: boolean;
    isCamOn: boolean;
    isOnStage: boolean;
    isMicOn?: boolean;
    backgroundPresetId?: string;
    customBackgroundUrl?: string;
    presenterName: string;
    brandColor: string;
    lowerThird: { visible: boolean; name: string; role: string; company: string };
    ticker: { visible: boolean; text: string };
    banner: { visible: boolean; title: string; subtitle: string };
  }
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  // Ticker animation offset
  const tickerOffsetRef = useRef(0);
  const tickerRafRef = useRef<number | null>(null);

  // Unmute helper: unmutes both LiveKit audio elements and fallback video
  const handleUnmute = () => {
    setIsMuted(false);
    document.querySelectorAll<HTMLAudioElement>("[data-livekit-audio]").forEach((el) => {
      el.muted = false;
      el.play().catch(() => {});
    });
    if (videoRef.current) {
      if (!hasLiveKitTracks) {
        videoRef.current.muted = false;
      }
      videoRef.current.play().catch(() => {});
    }
  };

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
          body: JSON.stringify({ eventId, role: "attendee", participantName: userName }),
        });
        if (!res.ok) return;
        const { token, url } = await res.json();
        if (!token || !url || !isSubscribed) return;

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        // Subscribe to camera and screen tracks separately
        const handleTrackSubscribed = (track: RemoteTrack, publication?: RemoteTrackPublication) => {
          setHasLiveKitTracks(true);
          if (track.kind === Track.Kind.Video) {
            const isScreen = track.source === Track.Source.ScreenShare || publication?.trackName === "screen";
            if (isScreen) {
              setScreenTrack(track);
            } else {
              setCameraTrack(track);
            }
          }
          if (track.kind === Track.Kind.Audio) {
            // Audio is handled via attach() to DOM audio elements below
            const audioEl = track.attach() as HTMLAudioElement;
            audioEl.setAttribute("data-livekit-audio", "true");
            audioEl.setAttribute("data-livekit-audio-id", track.sid || "audio");
            audioEl.muted = true; // Start muted; user clicks to unmute
            document.body.appendChild(audioEl);
          }
        };

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, pub: RemoteTrackPublication) => {
          handleTrackSubscribed(track, pub);
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, pub: RemoteTrackPublication) => {
          track.detach();
          if (track.kind === Track.Kind.Video) {
            const isScreen = track.source === Track.Source.ScreenShare || pub?.trackName === "screen";
            if (isScreen) {
              setScreenTrack((curr) => curr?.sid === track.sid ? null : curr);
            } else {
              setCameraTrack((curr) => curr?.sid === track.sid ? null : curr);
            }
          }
        });

        // Receive overlay state from host via DataChannel
        room.on(RoomEvent.DataReceived, (data: Uint8Array) => {
          try {
            const msg = JSON.parse(new TextDecoder().decode(data));
            if (msg.type === "overlay") {
              setOverlayState(msg as OverlayState);
            }
          } catch (_) {}
        });

        await room.connect(url, token);
        if (!isSubscribed) { room.disconnect(); return; }

        livekitRoomRef.current = room;

        // Handle tracks already published before we connected
        for (const p of room.remoteParticipants.values()) {
          for (const pub of p.trackPublications.values()) {
            if (pub.track) handleTrackSubscribed(pub.track, pub);
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

  // Attach camera track to its dedicated video element
  useEffect(() => {
    const el = cameraVideoRef.current;
    if (!el || !cameraTrack) return;
    cameraTrack.attach(el);
    el.muted = true;
    el.play().catch(() => {});
    return () => { cameraTrack.detach(el); };
  }, [cameraTrack]);

  // Attach screen track to its dedicated video element
  useEffect(() => {
    const el = screenVideoRef.current;
    if (!el || !screenTrack) return;
    screenTrack.attach(el);
    el.muted = true;
    el.play().catch(() => {});
    return () => { screenTrack.detach(el); };
  }, [screenTrack]);

  // Unmute all LiveKit audio elements when user clicks unmute
  useEffect(() => {
    document.querySelectorAll<HTMLAudioElement>("[data-livekit-audio]").forEach((el) => {
      el.muted = isMuted;
      if (!isMuted) el.play().catch(() => {});
    });
  }, [isMuted]);

  // Fallback WebRTC remoteStream attach
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (remoteStream && !hasLiveKitTracks) {
      el.srcObject = remoteStream;
      el.muted = isMuted;
      el.play().catch(() => {});
    }
  }, [remoteStream, hasLiveKitTracks, isMuted]);

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

          {/* Video / Stage Area */}
          <div className="relative flex-1 flex items-center justify-center rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-2xl min-h-[320px] sm:min-h-[480px]">
            {isLive ? (
              /* LIVE STAGE SCREEN WITH DUAL TRACKS (CAMERA + SCREEN) & HTML OVERLAYS */
              <div
                className="relative h-full w-full flex items-center justify-center bg-black cursor-pointer select-none overflow-hidden"
                onClick={() => {
                  if (isMuted) handleUnmute();
                }}
              >
                {/* Embedded CSS animations for ticker marquee and smooth transitions */}
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes tickerMarquee {
                    0% { transform: translate3d(100%, 0, 0); }
                    100% { transform: translate3d(-100%, 0, 0); }
                  }
                  .animate-ticker-marquee {
                    display: inline-block;
                    white-space: nowrap;
                    animation: tickerMarquee 25s linear infinite;
                    will-change: transform;
                  }
                `}} />

                {/* --- VIDEO LAYER (CSS COMPOSITION) --- */}
                {(() => {
                  const layoutMode = overlayState?.layoutMode || (screenTrack && cameraTrack ? "split" : "solo");
                  const isScreenActive = Boolean(screenTrack);
                  const isPresenterOnStage = overlayState ? overlayState.isOnStage : true;
                  const presenterName = overlayState?.presenterName || roomState?.speakers?.[0]?.name || "Eliel Nunes (Host)";
                  const isMicOn = overlayState?.isMicOn ?? true;
                  const currentBg = BACKGROUND_PRESETS.find((p) => p.id === overlayState?.backgroundPresetId) || BACKGROUND_PRESETS[0];
                  const backgroundStyle: React.CSSProperties = overlayState?.customBackgroundUrl
                    ? {
                        backgroundImage: `url(${overlayState.customBackgroundUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : currentBg.style || {};

                  if (!screenTrack && !cameraTrack) {
                    if (remoteStream && remoteStream.getVideoTracks().length > 0) {
                      return (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted={isMuted}
                          className="h-full w-full object-contain block pointer-events-none"
                        />
                      );
                    }
                    return (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40">
                        <div className="text-center space-y-4 p-6 z-10">
                          <div className="relative inline-block">
                            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-1 shadow-2xl shadow-sky-500/25 animate-pulse">
                              <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold">
                                {presenterName.charAt(0) || "B"}
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
                                {presenterName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({roomState?.speakers?.[0]?.company || "Buysoft"})
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              Sessão Ao Vivo • Sincronizando transmissão em tempo real...
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
                    );
                  }

                  return (
                    <div className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${currentBg.className}`} style={backgroundStyle}>
                      {/* Mode 1: SPLIT LAYOUT (Screen Share + Presenter Sidebar) */}
                      {layoutMode === "split" && isScreenActive ? (
                        <div className="relative h-full w-full rounded-2xl overflow-hidden p-3 sm:p-4 flex flex-col lg:flex-row items-center gap-3 sm:gap-4 transition-all duration-300">
                          {/* Main Screen Share Tile */}
                          <div className="relative flex-1 w-full h-full min-h-0 rounded-2xl border border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
                            <video
                              ref={screenVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className="h-full w-full object-contain pointer-events-none"
                            />
                            <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                              <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                              <span>Apresentação / Tela</span>
                            </div>
                          </div>

                          {/* Presenter Sidebar */}
                          {isPresenterOnStage && (
                            <div className="relative w-full lg:w-72 h-48 lg:h-full flex flex-col justify-center shrink-0">
                              <div className="relative h-48 lg:h-56 w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
                                <video
                                  ref={cameraVideoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className={`h-full w-full object-cover pointer-events-none ${cameraTrack ? "block" : "hidden"}`}
                                />
                                {!cameraTrack && (
                                  <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                    <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-xl shadow-sky-500/25">
                                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                                        {presenterName.charAt(0) || "P"}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                                  <span>{presenterName}</span>
                                  {isMicOn ? (
                                    <Mic className="h-3 w-3 text-emerald-400" />
                                  ) : (
                                    <MicOff className="h-3 w-3 text-rose-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : layoutMode === "pip" && isScreenActive ? (
                        /* Mode 2: PICTURE-IN-PICTURE (Screen Share Full + Floating Presenter) */
                        <div className="relative h-full w-full rounded-2xl overflow-hidden p-3 flex items-center justify-center transition-all duration-300">
                          <div className="relative h-full w-full rounded-xl border border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
                            <video
                              ref={screenVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className="h-full w-full object-contain pointer-events-none"
                            />
                            <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                              <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                              <span>Apresentação</span>
                            </div>

                            {/* Floating Presenter Bubble */}
                            {isPresenterOnStage && (
                              <div className="absolute bottom-4 right-4 z-20 h-36 w-52 rounded-xl border-2 border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden backdrop-blur-md flex items-center justify-center">
                                <video
                                  ref={cameraVideoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className={`h-full w-full object-cover pointer-events-none ${cameraTrack ? "block" : "hidden"}`}
                                />
                                {!cameraTrack && (
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-md flex items-center justify-center pointer-events-none">
                                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-base font-black">
                                      {presenterName.charAt(0) || "P"}
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-1.5 left-1.5 rounded bg-black/80 px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-1 pointer-events-none">
                                  <span>{presenterName}</span>
                                  {isMicOn ? (
                                    <Mic className="h-2.5 w-2.5 text-emerald-400" />
                                  ) : (
                                    <MicOff className="h-2.5 w-2.5 text-rose-400" />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : layoutMode === "grid" && isScreenActive ? (
                        /* Mode 3: GRID LAYOUT */
                        <div className="relative h-full w-full rounded-2xl overflow-hidden p-4 flex items-center justify-center transition-all duration-300">
                          <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-4 items-center justify-center">
                            <div className="relative h-full max-h-[65vh] w-full rounded-2xl border border-slate-800/80 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
                              <video
                                ref={screenVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-full w-full object-contain pointer-events-none"
                              />
                              <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                                <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                                <span>Apresentação / Tela</span>
                              </div>
                            </div>
                            {isPresenterOnStage && (
                              <div className="relative h-full max-h-[65vh] w-full rounded-2xl border border-slate-800/80 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
                                <video
                                  ref={cameraVideoRef}
                                  autoPlay
                                  playsInline
                                  muted
                                  className={`h-full w-full object-cover pointer-events-none ${cameraTrack ? "block" : "hidden"}`}
                                />
                                {!cameraTrack && (
                                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-xl pointer-events-none">
                                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black">
                                      {presenterName.charAt(0) || "P"}
                                    </div>
                                  </div>
                                )}
                                <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                                  <span>{presenterName}</span>
                                  {isMicOn ? <Mic className="h-3 w-3 text-emerald-400" /> : <MicOff className="h-3 w-3 text-rose-400" />}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Mode 4: SOLO LAYOUT */
                        <div className="relative h-full w-full rounded-2xl overflow-hidden p-4 flex items-center justify-center transition-all duration-300">
                          {isScreenActive ? (
                            <div className="relative h-full w-full rounded-2xl border border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
                              <video
                                ref={screenVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-full w-full object-contain pointer-events-none"
                              />
                              <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                                <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                                <span>Apresentação / Tela</span>
                              </div>
                              <video ref={cameraVideoRef} autoPlay playsInline muted className="hidden" />
                            </div>
                          ) : (
                            <div className="relative h-full w-full max-w-4xl rounded-2xl border border-slate-800/80 bg-slate-900/90 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-xs">
                              <video
                                ref={cameraVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`h-full w-full object-cover pointer-events-none ${cameraTrack ? "block" : "hidden"}`}
                              />
                              {!cameraTrack && (
                                <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                                  <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-1 shadow-2xl shadow-sky-500/25 animate-pulse">
                                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl sm:text-4xl font-black">
                                      {presenterName.charAt(0) || "P"}
                                    </div>
                                  </div>
                                  <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-bold text-slate-300 border border-slate-700">
                                    Palestrante Ao Vivo
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-3.5 left-3.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                                <span>{presenterName}</span>
                                {isMicOn ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-rose-400" />}
                              </div>
                              <video ref={screenVideoRef} autoPlay playsInline muted className="hidden" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* --- OVERLAYS LAYER (HTML/CSS VIA DATACHANNEL) --- */}

                {/* Banner Overlay */}
                {overlayState?.banner?.visible && overlayState.banner.title && (
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 max-w-xl px-4 w-full pointer-events-none transition-all duration-300">
                    <div className="rounded-2xl bg-slate-900/95 border border-slate-700/80 px-6 py-2.5 shadow-2xl backdrop-blur-xl text-center mx-auto w-fit">
                      <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight block">
                        {overlayState.banner.title}
                      </span>
                      {overlayState.banner.subtitle && (
                        <span className="text-[11px] sm:text-xs text-slate-300 mt-0.5 font-medium block">
                          {overlayState.banner.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Lower Third Overlay */}
                {overlayState?.lowerThird?.visible && (
                  <div className="absolute bottom-12 left-6 z-30 transition-all duration-300 pointer-events-none">
                    <div className="flex items-stretch overflow-hidden rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl">
                      <div
                        className="w-2.5 shrink-0"
                        style={{ backgroundColor: overlayState.brandColor || "#00b4fb" }}
                      />
                      <div className="py-2.5 px-4 pr-6">
                        <div className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                          <span>{overlayState.lowerThird.name || overlayState.presenterName}</span>
                          {overlayState.lowerThird.company && (
                            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                              {overlayState.lowerThird.company}
                            </span>
                          )}
                        </div>
                        {overlayState.lowerThird.role && (
                          <div className="text-xs font-medium text-[#00b4fb] mt-0.5">
                            {overlayState.lowerThird.role}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ticker Overlay */}
                {overlayState?.ticker?.visible && overlayState.ticker.text && (
                  <div className="absolute bottom-0 inset-x-0 z-30 bg-slate-950/95 border-t border-slate-800/90 py-1.5 px-4 overflow-hidden backdrop-blur-md flex items-center pointer-events-none">
                    <div className="shrink-0 mr-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#00b4fb] text-[10px] font-black uppercase tracking-wider text-white shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Notícias
                    </div>
                    <div className="overflow-hidden whitespace-nowrap flex-1">
                      <span className="animate-ticker-marquee text-xs font-semibold text-slate-200">
                        {overlayState.ticker.text}
                      </span>
                    </div>
                  </div>
                )}

                {/* Direct Stream Watermark Overlay */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                  <span className="flex items-center gap-1.5 rounded-lg bg-[#00b4fb] backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                    <Zap className="h-3 w-3 fill-current" />
                    TRANSMISSÃO DIRETA
                  </span>
                  <span className="rounded-lg bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>&lt;200ms Hardware Sync</span>
                  </span>
                </div>

                {/* Floating Unmute Prompt if audio is muted */}
                {(hasLiveKitTracks || cameraTrack || screenTrack || remoteStream) && isMuted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnmute();
                    }}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-sky-500 to-[#00b4fb] hover:from-sky-400 hover:to-[#00a3e3] px-6 py-3 text-xs font-black text-white shadow-2xl shadow-sky-500/50 backdrop-blur-md transition transform hover:scale-105 active:scale-95 animate-bounce border border-white/20"
                  >
                    <Volume2 className="h-4 w-4 fill-current" />
                    <span>Clique para Ativar Som 🔊</span>
                  </button>
                )}

                {/* Floating Reactions overlay */}
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
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
                onClick={() => {
                  if (isMuted) {
                    handleUnmute();
                  } else {
                    setIsMuted(true);
                    document.querySelectorAll<HTMLAudioElement>("[data-livekit-audio]").forEach((el) => {
                      el.muted = true;
                    });
                    if (videoRef.current && !hasLiveKitTracks) {
                      videoRef.current.muted = true;
                    }
                  }
                }}
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
