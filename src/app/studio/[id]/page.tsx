"use client";

import React, { useEffect, useState, useRef, use } from "react";
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  Settings,
  Zap,
  Play,
  Square,
  ArrowUpRight,
  Maximize2,
  Sparkles,
  Shield,
  Layers,
  PhoneOff,
  Copy,
  Check,
  LayoutGrid,
  Columns2,
  Palette,
  Film,
  Type,
  Clock,
  Plus,
  Tv,
  CheckCircle2
} from "lucide-react";

function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

import PreflightLobby from "@/components/studio/PreflightLobby";
import LiveEngagementSidebar from "@/components/engagement/LiveEngagementSidebar";
import LiveCtaBanner from "@/components/engagement/LiveCtaBanner";
import StudioLayoutManager, {
  LayoutMode,
  BACKGROUND_PRESETS,
} from "@/components/studio/StudioLayoutManager";
import {
  LowerThird,
  TickerTape,
  HeadlineBanner,
} from "@/components/studio/LowerThirdsOverlay";
import MediaAssetPlayer from "@/components/studio/MediaAssetPlayer";
import { getLiveRoomState, updateEvent, setLiveCta } from "@/lib/dbActions";
import { HostBroadcaster } from "@/lib/webrtcStreamManager";
import { Room, Track } from "livekit-client";
import { StudioCompositor } from "@/lib/studioCompositor";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ role?: string }>;
}

export default function StudioPage({ params, searchParams }: Props) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  const initialRole: "host" | "speaker" =
    resolvedSearchParams?.role === "speaker" ? "speaker" : "host";
  const [userRole, setUserRole] = useState<"host" | "speaker">(initialRole);

  // State
  const [hasJoinedLobby, setHasJoinedLobby] = useState(false);
  const [roomState, setRoomState] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Local media controls
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isOnStage, setIsOnStage] = useState(true);
  const [copiedRtmp, setCopiedRtmp] = useState(false);

  // Studio Customization States
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("solo");
  const [backgroundPresetId, setBackgroundPresetId] = useState<string>("dark-mesh");
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>("");

  // Brand & Overlays
  const [brandColor, setBrandColor] = useState<string>("#00b4fb");
  const [lowerThirdVisible, setLowerThirdVisible] = useState(false);
  const [lowerThirdName, setLowerThirdName] = useState(
    initialRole === "host" ? "Eliel Nunes" : "Palestrante Especialista"
  );
  const [lowerThirdRole, setLowerThirdRole] = useState("Líder de Tecnologia & Inovação");
  const [lowerThirdCompany, setLowerThirdCompany] = useState("Buysoft");

  const [tickerVisible, setTickerVisible] = useState(false);
  const [tickerText, setTickerText] = useState(
    "🚀 Bem-vindo ao Buysoft Events! Deixe suas dúvidas no chat ao lado • buysoft.com.br"
  );

  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("Buysoft Executive Webinar");
  const [bannerSubtitle, setBannerSubtitle] = useState(
    "Transformação Digital, Nuvem e Soluções Avançadas"
  );

  // Video Asset Player (Direct studio media clip)
  const [videoAssetUrl, setVideoAssetUrl] = useState<string | null>(null);
  const [customVideoInput, setCustomVideoInput] = useState("");

  const [isBroadcastingLive, setIsBroadcastingLive] = useState(false);
  const [currentEgressId, setCurrentEgressId] = useState<string | null>(null);
  const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
  const [liveDuration, setLiveDuration] = useState(0);

  // Single source of truth for webinar live status
  const isWebinarLive = roomState?.status === "live" || isBroadcastingLive;

  // Modals
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [customizationTab, setCustomizationTab] = useState<
    "brand" | "ticker" | "background" | "media"
  >("brand");
  const [showCtaModal, setShowCtaModal] = useState(false);
  const [ctaTitle, setCtaTitle] = useState("Agende uma Demonstração com nossos Especialistas");
  const [ctaBtnText, setCtaBtnText] = useState("Falar com Consultor");
  const [ctaBtnUrl, setCtaBtnUrl] = useState("https://buysoft.com.br");

  // Video refs & WebRTC Broadcaster
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const broadcasterRef = useRef<HostBroadcaster | null>(null);

  // 1080p Stage Compositor (Composes layout, camera, screen, lower thirds, tickers & banners)
  const compositorRef = useRef<StudioCompositor | null>(null);

  // LiveKit Cloud Room Connection & Track Publishing
  const livekitRoomRef = useRef<Room | null>(null);
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);
  const [egressError, setEgressError] = useState<string | null>(null);

  // Initialize and synchronize StudioCompositor (1080p Stage Composite Stream)
  useEffect(() => {
    if (!hasJoinedLobby) return;

    const compositor = new StudioCompositor({
      layoutMode,
      isOnStage,
      isCamOn,
      isMicOn,
      isScreenSharing,
      presenterName: userRole === "host" ? "Eliel Nunes (Host)" : "Palestrante Convidado",
      brandColor,
      lowerThird: {
        visible: lowerThirdVisible,
        name: lowerThirdName,
        role: lowerThirdRole,
        company: lowerThirdCompany,
      },
      ticker: {
        visible: tickerVisible,
        text: tickerText,
      },
      banner: {
        visible: bannerVisible,
        title: bannerTitle,
        subtitle: bannerSubtitle,
      },
    });

    compositorRef.current = compositor;

    return () => {
      compositor.destroy();
      compositorRef.current = null;
    };
  }, [hasJoinedLobby]);

  // Sync state changes into compositor in real time
  useEffect(() => {
    if (compositorRef.current) {
      compositorRef.current.updateState({
        layoutMode,
        isOnStage,
        isCamOn,
        isMicOn,
        isScreenSharing,
        presenterName: userRole === "host" ? "Eliel Nunes (Host)" : "Palestrante Convidado",
        brandColor,
        lowerThird: {
          visible: lowerThirdVisible,
          name: lowerThirdName,
          role: lowerThirdRole,
          company: lowerThirdCompany,
        },
        ticker: {
          visible: tickerVisible,
          text: tickerText,
        },
        banner: {
          visible: bannerVisible,
          title: bannerTitle,
          subtitle: bannerSubtitle,
        },
      });
    }
  }, [
    layoutMode,
    isOnStage,
    isCamOn,
    isMicOn,
    isScreenSharing,
    userRole,
    brandColor,
    lowerThirdVisible,
    lowerThirdName,
    lowerThirdRole,
    lowerThirdCompany,
    tickerVisible,
    tickerText,
    bannerVisible,
    bannerTitle,
    bannerSubtitle,
  ]);

  // Sync video elements and audio streams into compositor
  useEffect(() => {
    if (compositorRef.current) {
      compositorRef.current.setVideoElements(localVideoRef.current, screenVideoRef.current);
      compositorRef.current.updateAudioSources(localStream, screenStream);
    }
  }, [localStream, screenStream, isScreenSharing, isOnStage, isCamOn, isMicOn]);

  // Initialize WebRTC Host Broadcaster
  useEffect(() => {
    const broadcaster = new HostBroadcaster(eventId);
    broadcaster.start();
    broadcasterRef.current = broadcaster;
    return () => {
      broadcaster.stop();
    };
  }, [eventId]);

  // Sync composite stream to WebRTC peer broadcaster
  useEffect(() => {
    if (broadcasterRef.current && compositorRef.current) {
      const compositeStream = compositorRef.current.getCompositeStream();
      broadcasterRef.current.setStreams(
        compositeStream,
        null,
        isWebinarLive
      );
    }
  }, [localStream, screenStream, isWebinarLive, isOnStage, isScreenSharing, layoutMode]);

  // Connect to LiveKit Room once joined lobby
  useEffect(() => {
    if (!hasJoinedLobby || !eventId) return;

    let isSubscribed = true;
    const connectLiveKit = async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            role: userRole,
            participantName: userRole === "host" ? "Host Organizador" : "Orador Convidado",
          }),
        });
        if (!res.ok) return;
        const { token, url } = await res.json();
        if (!token || !url || !isSubscribed) return;

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        await room.connect(url, token);
        if (!isSubscribed) {
          room.disconnect();
          return;
        }

        livekitRoomRef.current = room;
        setIsLiveKitConnected(true);
      } catch (err) {
        console.warn("LiveKit Studio connection warning:", err);
      }
    };

    connectLiveKit();

    return () => {
      isSubscribed = false;
      if (livekitRoomRef.current) {
        livekitRoomRef.current.disconnect();
        livekitRoomRef.current = null;
        setIsLiveKitConnected(false);
      }
    };
  }, [hasJoinedLobby, eventId, userRole]);

  // Ensure composite tracks are published ONLY when live and in 1080p crystal clear quality
  useEffect(() => {
    const room = livekitRoomRef.current;
    if (!room || !isLiveKitConnected || !compositorRef.current) return;

    const syncLiveKitCompositeTracks = async () => {
      try {
        if (!isWebinarLive) {
          // In backstage/camarim: unpublish any public stage tracks so audience cannot view private backstage
          const videoPub = Array.from(room.localParticipant.videoTrackPublications.values()).find(
            (p) => p.trackName === "stage-composite"
          );
          if (videoPub?.track) {
            await room.localParticipant.unpublishTrack(videoPub.track).catch(() => {});
          }
          const audioPub = Array.from(room.localParticipant.audioTrackPublications.values()).find(
            (p) => p.trackName === "stage-audio"
          );
          if (audioPub?.track) {
            await room.localParticipant.unpublishTrack(audioPub.track).catch(() => {});
          }
          return;
        }

        // Live webinar active: publish pristine 1080p Full HD composite stream (5 Mbps, simulcast disabled)
        const compositeStream = compositorRef.current!.getCompositeStream();
        const cVt = compositeStream.getVideoTracks()[0];
        const cAt = compositeStream.getAudioTracks()[0];

        const existingVideoPub = Array.from(room.localParticipant.videoTrackPublications.values()).find(
          (p) => p.trackName === "stage-composite"
        );
        if (cVt && !existingVideoPub) {
          cVt.contentHint = "detail";
          await room.localParticipant.publishTrack(cVt, {
            name: "stage-composite",
            source: Track.Source.ScreenShare, // High-priority detail mode for text and presentations
            simulcast: false, // Disables potato-quality 360p downscaling
            degradationPreference: "maintain-resolution",
            videoEncoding: {
              maxBitrate: 5_000_000, // 5 Mbps Full HD
              maxFramerate: 30,
            },
            videoCodec: "h264",
          }).catch((err) => console.warn("Error publishing 1080p composite video:", err));
        }

        const existingAudioPub = Array.from(room.localParticipant.audioTrackPublications.values()).find(
          (p) => p.trackName === "stage-audio"
        );
        if (cAt && !existingAudioPub) {
          await room.localParticipant.publishTrack(cAt, {
            name: "stage-audio",
            source: Track.Source.Microphone,
            audioPreset: {
              maxBitrate: 96_000,
            },
          }).catch((err) => console.warn("Error publishing composite audio:", err));
        }
      } catch (err) {
        console.warn("Error synchronizing composite tracks in LiveKit:", err);
      }
    };

    syncLiveKitCompositeTracks();
  }, [isLiveKitConnected, isWebinarLive, hasJoinedLobby]);

  // Load and poll live state
  const fetchState = async () => {
    try {
      const state = await getLiveRoomState(eventId);
      setRoomState(state);
      if (state?.status === "live") {
        setIsBroadcastingLive(true);
      } else {
        setIsBroadcastingLive(false);
      }
    } catch (err) {
      console.error("Error fetching live room state:", err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2500);
    return () => clearInterval(interval);
  }, [eventId]);

  // Timer counter when live
  useEffect(() => {
    let timer: any = null;
    if (roomState?.status === "live") {
      timer = setInterval(() => {
        setLiveDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setLiveDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [roomState?.status]);

  // Bind local stream to video element
  useEffect(() => {
    if (hasJoinedLobby && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [hasJoinedLobby, localStream, layoutMode]);

  // Bind screen share stream
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, layoutMode]);

  // Toggle Camera
  const handleToggleCam = () => {
    if (localStream) {
      const vt = localStream.getVideoTracks()[0];
      if (vt) {
        const nextState = !isCamOn;
        vt.enabled = nextState;
        setIsCamOn(nextState);
        if (livekitRoomRef.current) {
          const pub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values()).find(
            (p) => p.source === Track.Source.Camera || p.trackName === "camera"
          );
          if (pub?.track) {
            if (!nextState) pub.track.mute();
            else pub.track.unmute();
          }
        }
      }
    }
  };

  // Toggle Mic
  const handleToggleMic = () => {
    if (localStream) {
      const at = localStream.getAudioTracks()[0];
      if (at) {
        const nextState = !isMicOn;
        at.enabled = nextState;
        setIsMicOn(nextState);
        if (livekitRoomRef.current) {
          const pub = Array.from(livekitRoomRef.current.localParticipant.audioTrackPublications.values()).find(
            (p) => p.source === Track.Source.Microphone || p.trackName === "microphone"
          );
          if (pub?.track) {
            if (!nextState) pub.track.mute();
            else pub.track.unmute();
          }
        }
      }
    }
  };

  // Toggle Screen Share
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      if (layoutMode === "split" || layoutMode === "pip") {
        setLayoutMode("solo");
      }
    } else {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
          },
          audio: true,
        });
        const vTrack = sStream.getVideoTracks()[0];
        if (vTrack) {
          vTrack.contentHint = "detail";
        }
        setScreenStream(sStream);
        setIsScreenSharing(true);
        if (layoutMode === "solo") {
          setLayoutMode("split");
        }

        sStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          setLayoutMode("solo");
        };
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  // Toggle 1-Click LiveKit Egress & Broadcast
  const handleToggleGoLive = async () => {
    setIsStartingBroadcast(true);
    setEgressError(null);
    const isCurrentlyLive = roomState?.status === "live" || isBroadcastingLive;

    if (isCurrentlyLive) {
      try {
        await fetch("/api/livekit/egress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "stop",
            eventId,
            egressId: currentEgressId || undefined,
          }),
        }).catch(() => {});

        // Unpublish tracks immediately from LiveKit room
        if (livekitRoomRef.current) {
          const room = livekitRoomRef.current;
          const pubs = Array.from(room.localParticipant.trackPublications.values());
          for (const pub of pubs) {
            if (pub.track) {
              await room.localParticipant.unpublishTrack(pub.track).catch(() => {});
            }
          }
        }

        await updateEvent(eventId, { status: "published" });
        setIsBroadcastingLive(false);
        setCurrentEgressId(null);
        fetchState();
      } catch (err) {
        console.error("Error stopping live stream:", err);
      } finally {
        setIsStartingBroadcast(false);
      }
    } else {
      try {
        // Trigger LiveKit Cloud Egress & ensure active YouTube live broadcast
        const res = await fetch("/api/livekit/egress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            eventId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.warn("Egress warning:", data.error);
          setEgressError(data.error || "Aviso: Transmissão no YouTube não pôde ser iniciada.");
        } else if (data.egressId) {
          setCurrentEgressId(data.egressId);
          if (data.youtubeBroadcastId) {
            setRoomState((prev: any) => ({
              ...prev,
              youtubeBroadcastId: data.youtubeBroadcastId,
              youtubeStreamKey: data.youtubeStreamKey,
              youtubeEmbedUrl: data.youtubeEmbedUrl,
            }));
          }
        }

        // Set event status to live in database so viewers receive room state
        await updateEvent(eventId, { status: "live" });
        setIsBroadcastingLive(true);
        fetchState();
      } catch (err: any) {
        console.error("Error starting broadcast:", err);
        setEgressError(err.message || "Erro ao conectar transmissão.");
        await updateEvent(eventId, { status: "live" });
        setIsBroadcastingLive(true);
        fetchState();
      } finally {
        setIsStartingBroadcast(false);
      }
    }
  };

  // Launch CTA (Host only)
  const handleLaunchCta = async () => {
    await setLiveCta(eventId, {
      title: ctaTitle,
      buttonText: ctaBtnText,
      buttonUrl: ctaBtnUrl,
      isActive: true,
    });
    setShowCtaModal(false);
    fetchState();
  };

  const handleEndCta = async () => {
    await setLiveCta(eventId, {
      title: "",
      buttonText: "",
      buttonUrl: "",
      isActive: false,
    });
    fetchState();
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Show Lobby if not joined
  if (!hasJoinedLobby) {
    return (
      <PreflightLobby
        userName={userRole === "host" ? "Eliel Nunes (Host)" : "Palestrante Convidado"}
        userRole={userRole}
        onRoleChange={setUserRole}
        onJoin={(st) => {
          setLocalStream(st);
          setHasJoinedLobby(true);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-white font-sans">
      {/* Main Studio Area (Left) */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Top Control Bar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 sm:px-6 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00b4fb] text-white shadow-xs">
              <Radio className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-xs font-bold text-white leading-tight">
                {roomState?.title || "Buysoft Events Studio"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-400">
                  {userRole === "host" ? "Painel do Organizador" : "Camarim do Palestrante"}
                </span>

                {/* Role Switcher */}
                <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setUserRole("host")}
                    className={`rounded-md px-2 py-0.5 text-[9px] font-bold transition ${
                      userRole === "host"
                        ? "bg-[#00b4fb] text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Host
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole("speaker")}
                    className={`rounded-md px-2 py-0.5 text-[9px] font-bold transition ${
                      userRole === "speaker"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Palestrante
                  </button>
                </div>
              </div>
            </div>

            {/* Live Badge with Duration Timer */}
            <div className="ml-3 hidden sm:flex items-center gap-2">
              {isWebinarLive ? (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500/40 px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[11px] font-extrabold text-rose-400 tracking-wider uppercase">
                    AO VIVO
                  </span>
                  <span className="text-xs font-mono font-bold text-white pl-2 border-l border-rose-500/30">
                    {formatDuration(liveDuration)}
                  </span>
                </div>
              ) : (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-400">
                  EM BASTIDORES (BACKSTAGE)
                </span>
              )}

              {/* LiveKit Cloud Status Badge */}
              <span
                className={`hidden lg:flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold border transition ${
                  isLiveKitConnected
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
                title={isLiveKitConnected ? "Servidor LiveKit Cloud conectado com sucesso" : "Conectando ao LiveKit Cloud..."}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isLiveKitConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <span>{isLiveKitConnected ? "LiveKit Nuvem OK" : "Conectando Nuvem..."}</span>
              </span>
            </div>
          </div>

          {/* Top Right: Host Controls */}
          <div className="flex items-center gap-2">
            {/* Live CTA Button (Host only) */}
            {userRole === "host" && (
              <>
                {roomState?.liveCtas && roomState.liveCtas.length > 0 ? (
                  <button
                    onClick={handleEndCta}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-900/40 transition"
                  >
                    <Square className="h-3 w-3 fill-current" />
                    <span className="hidden sm:inline">Encerrar CTA</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCtaModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/30 px-3 py-1.5 text-xs font-bold text-[#00b4fb] hover:bg-sky-900/40 transition"
                  >
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span className="hidden sm:inline">Lançar Live CTA</span>
                  </button>
                )}
              </>
            )}

            {/* Go Live / End Broadcast */}
            <button
              onClick={handleToggleGoLive}
              disabled={isStartingBroadcast}
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-lg transition transform active:scale-95 ${
                isStartingBroadcast
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : isWebinarLive
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse"
                  : "bg-gradient-to-r from-rose-600 via-rose-500 to-[#00b4fb] hover:from-rose-500 hover:to-[#009ce0] text-white shadow-rose-500/25"
              }`}
            >
              {isStartingBroadcast ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : isWebinarLive ? (
                <>
                  <Square className="h-3 w-3 fill-current" />
                  <span>Encerrar Transmissão</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Iniciar Transmissão Ao Vivo</span>
                </>
              )}
            </button>

            {roomState?.youtubeBroadcastId && (
              <a
                href={`https://studio.youtube.com/video/${roomState.youtubeBroadcastId}/livestreaming`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-900/50 transition"
                title="Abrir a Sala de Controle ao Vivo no YouTube Studio"
              >
                <YouTubeIcon className="h-3.5 w-3.5 text-red-500" />
                <span className="hidden md:inline">YouTube Studio</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}

            <a
              href={`/live/${eventId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              <span className="hidden sm:inline">Ver como Plateia</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </header>

        {/* Studio Stage Video Canvas */}
        <div className="relative flex-1 p-3 sm:p-5 overflow-hidden flex flex-col justify-center items-center">
          {/* Egress Warning Banner if any */}
          {egressError && (
            <div className="w-full max-w-4xl mb-3 flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/70 p-3 text-xs text-amber-200 backdrop-blur-md z-30">
              <div className="flex items-center gap-2">
                <span className="font-bold">⚠️ Transmissão:</span>
                <span>{egressError}</span>
              </div>
              <button
                onClick={() => setEgressError(null)}
                className="rounded-lg bg-amber-900/60 hover:bg-amber-800 px-2.5 py-1 text-[11px] font-semibold text-amber-100 transition"
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Active Live CTA Banner (if launched) */}
          {roomState?.liveCtas && roomState.liveCtas.length > 0 && (
            <div className="absolute top-4 inset-x-6 z-30 max-w-2xl mx-auto">
              <LiveCtaBanner cta={roomState.liveCtas[0]} />
            </div>
          )}

          {/* YouTube Live Ingest Status */}
          {roomState?.youtubeBroadcastId && (
            <div className="w-full max-w-4xl mb-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-2.5 sm:px-4 backdrop-blur-md z-20">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <YouTubeIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-200">
                      YouTube Live Integrado (Transmissão Direta Buysoft)
                    </span>
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.2 text-[9px] font-bold text-rose-300 uppercase">
                      LiveKit Egress
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    O codificador do estúdio envia o stream automaticamente para a sua transmissão não listada.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomState.youtubeStreamKey || "");
                    setCopiedRtmp(true);
                    setTimeout(() => setCopiedRtmp(false), 2000);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white transition"
                  title="Copiar Chave de Transmissão"
                >
                  {copiedRtmp ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Chave RTMP</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://studio.youtube.com/video/${roomState.youtubeBroadcastId}/livestreaming`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-xs transition"
                >
                  <span>Abrir YouTube Studio</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Notice Banner when in Backstage (Bastidores) */}
          {!isWebinarLive && (
            <div className="w-full max-w-4xl mb-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-2.5 sm:px-4 backdrop-blur-md z-20">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Radio className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-200">
                      Você está no Camarim / Backstage
                    </span>
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.2 text-[9px] font-bold text-amber-300 uppercase">
                      Privado
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300">
                    A audiência ainda não vê o estúdio. Quando estiver pronto, clique ao lado para iniciar a live.
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleGoLive}
                disabled={isStartingBroadcast}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 transition transform active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Iniciar Transmissão Ao Vivo</span>
              </button>
            </div>
          )}

          {/* MAIN STAGE CANVAS: StudioLayoutManager with Overlays */}
          <div className="relative w-full flex-1 max-h-[66vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-slate-800/80">
            <StudioLayoutManager
              layoutMode={layoutMode}
              backgroundPresetId={backgroundPresetId}
              customBackgroundUrl={customBackgroundUrl}
              presenter={{
                id: "local_presenter",
                name: userRole === "host" ? "Eliel Nunes (Host)" : "Palestrante Convidado",
                videoRef: localVideoRef,
                stream: isOnStage && isCamOn ? localStream : null,
                isMicOn: isMicOn,
                isCamOn: isCamOn,
              }}
              screenShare={
                isScreenSharing
                  ? {
                      id: "screen_share",
                      name: "Apresentação / Tela",
                      videoRef: screenVideoRef,
                      stream: screenStream,
                      isScreen: true,
                    }
                  : null
              }
              mediaVideoElement={
                videoAssetUrl ? (
                  <MediaAssetPlayer
                    videoUrl={videoAssetUrl}
                    onClose={() => setVideoAssetUrl(null)}
                  />
                ) : null
              }
            />

            {/* Overlays */}
            <HeadlineBanner
              isVisible={bannerVisible}
              title={bannerTitle}
              subtitle={bannerSubtitle}
              themeColor={brandColor}
            />
            <LowerThird
              isVisible={lowerThirdVisible}
              name={lowerThirdName}
              role={lowerThirdRole}
              company={lowerThirdCompany}
              themeColor={brandColor}
            />
            <TickerTape
              isVisible={tickerVisible}
              text={tickerText}
              themeColor={brandColor}
            />

            {/* Backstage Overlay for Off-Stage Presenter */}
            {!isOnStage && (
              <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center z-40">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Você está no Camarim (Bastidores)</p>
                  <p className="text-xs text-slate-300 max-w-sm mt-0.5">
                    Seu vídeo e áudio estão ocultos da transmissão. Clique abaixo para entrar no palco.
                  </p>
                </div>
                <button
                  onClick={() => setIsOnStage(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00b4fb] to-sky-500 hover:from-[#009ce0] hover:to-sky-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-xl shadow-sky-500/30 transition transform active:scale-95"
                >
                  <Radio className="h-4 w-4 animate-pulse" />
                  <span>Colocar no Palco (Ao Vivo)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Layout & Personalization Bar */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5 w-full max-w-4xl">
            {/* Layout Mode Buttons */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1 backdrop-blur-md">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">
                Layout:
              </span>
              <button
                type="button"
                onClick={() => setLayoutMode("solo")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  layoutMode === "solo"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Solo: Apresentador único"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Solo</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  layoutMode === "grid"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Grade: Câmeras em grid balanceado"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grade</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("split")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  layoutMode === "split"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Split: Apresentação grande + Apresentador na lateral"
              >
                <Columns2 className="h-3.5 w-3.5" />
                <span>Split</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("pip")}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  layoutMode === "pip"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
                title="PiP: Apresentador flutuando no canto"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>PiP</span>
              </button>
            </div>

            {/* Personalization Drawer Button */}
            <div className="flex items-center gap-2">
              {videoAssetUrl && (
                <button
                  onClick={() => setVideoAssetUrl(null)}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-900/40 transition"
                >
                  <Film className="h-3.5 w-3.5" />
                  <span>Parar Vídeo no Palco</span>
                </button>
              )}

              <button
                onClick={() => setShowCustomizationModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/50 px-3 py-1.5 text-xs font-bold text-[#00b4fb] transition backdrop-blur-md shadow-xs"
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Personalizar Estúdio (Marca & Mídia)</span>
              </button>
            </div>
          </div>

          {/* Bottom Backstage Strip */}
          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-2 sm:px-3 backdrop-blur-xs w-full max-w-4xl">
            <div className="flex items-center gap-1.5 px-1">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bastidores / Camarim
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-slate-800 p-1.5 pr-3 border border-slate-700">
                <div className="h-6 w-6 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                  {userRole === "host" ? "EN" : "SP"}
                </div>
                <div className="text-[11px]">
                  <p className="font-bold text-slate-200">Você ({userRole === "host" ? "Host" : "Speaker"})</p>
                  <p className="text-[9px] text-slate-400">
                    {isOnStage ? "🟢 No Palco (Ao Vivo)" : "🟠 No Camarim"}
                  </p>
                </div>
                <button
                  onClick={() => setIsOnStage(!isOnStage)}
                  className={`ml-2 rounded-lg px-2 py-0.5 text-[10px] font-extrabold transition shadow-xs ${
                    isOnStage
                      ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                      : "bg-[#00b4fb] text-white hover:bg-[#009ce0] shadow-sky-500/20"
                  }`}
                >
                  {isOnStage ? "Mover para Camarim" : "Colocar no Palco"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <footer className="flex h-16 items-center justify-center gap-3 border-t border-slate-800 bg-slate-900/80 px-6 z-30">
          <button
            onClick={handleToggleCam}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              isCamOn
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {isCamOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            <span>{isCamOn ? "Câmera Ativa" : "Câmera Desligada"}</span>
          </button>

          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              isMicOn
                ? "bg-slate-800 hover:bg-slate-700 text-white"
                : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            <span>{isMicOn ? "Microfone Ativo" : "Mutado"}</span>
          </button>

          <button
            onClick={handleToggleScreenShare}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              isScreenSharing
                ? "bg-[#00b4fb] text-white shadow-md shadow-sky-500/20"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
          >
            {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            <span>{isScreenSharing ? "Parar Compartilhamento" : "Compartilhar Tela"}</span>
          </button>

          {/* Stage / Backstage Action */}
          <button
            onClick={() => setIsOnStage(!isOnStage)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              isOnStage
                ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            }`}
          >
            <Radio className="h-4 w-4" />
            <span>{isOnStage ? "Mover para Bastidores" : "Colocar no Palco"}</span>
          </button>
        </footer>
      </div>

      {/* Right Engagement Sidebar (Chat, Q&A, Polls) */}
      <LiveEngagementSidebar
        eventId={eventId}
        userName={userRole === "host" ? "Eliel Nunes (Host)" : "Palestrante"}
        userRole={userRole}
        roomState={roomState}
        onRefresh={fetchState}
      />

      {/* STUDIO CUSTOMIZATION MODAL (Brand, Banners, Backgrounds, Video Clips) */}
      {showCustomizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#00b4fb]">
                <Palette className="h-4 w-4" />
                <span>Personalização do Estúdio (StreamYard / OBS Mode)</span>
              </div>
              <button
                onClick={() => setShowCustomizationModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setCustomizationTab("brand")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  customizationTab === "brand"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                <span>Lower Third & Faixas</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomizationTab("ticker")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  customizationTab === "ticker"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Letreiro Rodapé & Banner</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomizationTab("background")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  customizationTab === "background"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Palette className="h-3.5 w-3.5" />
                <span>Plano de Fundo</span>
              </button>
              <button
                type="button"
                onClick={() => setCustomizationTab("media")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  customizationTab === "media"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>Vídeos & Vinhetas</span>
              </button>
            </div>

            {/* TAB CONTENT 1: LOWER THIRDS */}
            {customizationTab === "brand" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Exibir Lower Third no Palco
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Identificação com nome, cargo e empresa no canto inferior.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLowerThirdVisible(!lowerThirdVisible)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      lowerThirdVisible
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {lowerThirdVisible ? "Visível no Palco" : "Oculto"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome do Palestrante
                    </label>
                    <input
                      type="text"
                      value={lowerThirdName}
                      onChange={(e) => setLowerThirdName(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={lowerThirdCompany}
                      onChange={(e) => setLowerThirdCompany(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cargo ou Especialidade
                    </label>
                    <input
                      type="text"
                      value={lowerThirdRole}
                      onChange={(e) => setLowerThirdRole(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Cor da Marca (Brand Accent)
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        { label: "Azul Buysoft", color: "#00b4fb" },
                        { label: "Roxo", color: "#8b5cf6" },
                        { label: "Esmeralda", color: "#10b981" },
                        { label: "Coral", color: "#f43f5e" },
                        { label: "Âmbar", color: "#f59e0b" },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setBrandColor(item.color)}
                          className={`h-7 w-7 rounded-lg border-2 transition ${
                            brandColor === item.color
                              ? "border-white scale-110 shadow-md"
                              : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: item.color }}
                          title={item.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: TICKER & HEADLINE BANNER */}
            {customizationTab === "ticker" && (
              <div className="space-y-4">
                {/* Ticker Tape */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Letreiro Rodapé Rolante (Ticker Tape)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Mensagem contínua estilo jornal/webinar no rodapé da tela.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTickerVisible(!tickerVisible)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        tickerVisible
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {tickerVisible ? "Ativo no Rodapé" : "Oculto"}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={tickerText}
                    onChange={(e) => setTickerText(e.target.value)}
                    placeholder="Texto a correr no rodapé..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                  />
                </div>

                {/* Headline Banner */}
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Banner de Destaque Superior
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Título fixado no topo da transmissão para introduzir temas ou tópicos.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBannerVisible(!bannerVisible)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        bannerVisible
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {bannerVisible ? "Exibindo no Topo" : "Oculto"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder="Título do Banner..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={bannerSubtitle}
                      onChange={(e) => setBannerSubtitle(e.target.value)}
                      placeholder="Subtítulo descritivo..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-850 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: BACKGROUND */}
            {customizationTab === "background" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Escolha o fundo que envelopa as câmeras e janelas de apresentação no estúdio:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setBackgroundPresetId(preset.id);
                        setCustomBackgroundUrl("");
                      }}
                      className={`h-24 rounded-xl border p-2 flex flex-col justify-end text-left transition ${
                        backgroundPresetId === preset.id && !customBackgroundUrl
                          ? "border-[#00b4fb] ring-2 ring-[#00b4fb]/40"
                          : "border-slate-700 hover:border-slate-500"
                      } ${preset.className}`}
                    >
                      <span className="text-[11px] font-bold text-white drop-shadow-md">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ou Imagem de Fundo Personalizada (URL)
                  </label>
                  <input
                    type="text"
                    value={customBackgroundUrl}
                    onChange={(e) => setCustomBackgroundUrl(e.target.value)}
                    placeholder="https://exemplo.com/fundo-estudio.jpg"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: MEDIA VIDEOS */}
            {customizationTab === "media" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Exiba vídeos institucionais, vinhetas de contagem regressiva ou clipes gravados
                  diretamente no estúdio sem precisar de compartilhamento de tela:
                </p>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300">Vídeos Rápidos de Exemplo:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoAssetUrl(
                          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                        );
                        setShowCustomizationModal(false);
                      }}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-left transition"
                    >
                      <Film className="h-4 w-4 text-[#00b4fb] shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">Vinheta Institucional (15s)</p>
                        <p className="text-[10px] text-slate-400">Reproduzir no Palco com Áudio</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setVideoAssetUrl(
                          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        );
                        setShowCustomizationModal(false);
                      }}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-left transition"
                    >
                      <Tv className="h-4 w-4 text-purple-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">Vídeo de Demonstração</p>
                        <p className="text-[10px] text-slate-400">Exibir clipe em Full HD</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Adicionar Vídeo por URL (MP4 / WebM)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customVideoInput}
                      onChange={(e) => setCustomVideoInput(e.target.value)}
                      placeholder="https://meuservidor.com/video.mp4"
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customVideoInput) {
                          setVideoAssetUrl(customVideoInput);
                          setShowCustomizationModal(false);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-[#00b4fb] text-white text-xs font-bold hover:bg-[#009ce0] transition"
                    >
                      Reproduzir no Palco
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomizationModal(false)}
                className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] px-5 py-2 text-xs font-bold text-white hover:bg-[#009ce0] shadow-md shadow-sky-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Salvar & Aplicar no Estúdio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Host CTA Launcher Modal */}
      {showCtaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#00b4fb]">
                <Zap className="h-4 w-4 fill-current" />
                <span>Lançar Live CTA (Chamada de Ação)</span>
              </div>
              <button
                onClick={() => setShowCtaModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Dispare um banner destacado na tela de todos os espectadores ao vivo para converter vendas ou agendar reuniões.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título da Oferta / Chamada
                </label>
                <input
                  type="text"
                  value={ctaTitle}
                  onChange={(e) => setCtaTitle(e.target.value)}
                  placeholder="Ex: Agende uma demonstração gratuita..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Texto do Botão
                </label>
                <input
                  type="text"
                  value={ctaBtnText}
                  onChange={(e) => setCtaBtnText(e.target.value)}
                  placeholder="Ex: Agendar Agora"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Link de Destino (URL)
                </label>
                <input
                  type="text"
                  value={ctaBtnUrl}
                  onChange={(e) => setCtaBtnUrl(e.target.value)}
                  placeholder="https://suaempresa.com.br/agenda"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white focus:border-[#00b4fb] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCtaModal(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleLaunchCta}
                className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] px-5 py-2 text-xs font-bold text-white hover:bg-[#009ce0] shadow-md shadow-sky-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Disparar para a Plateia</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
