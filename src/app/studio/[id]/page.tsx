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
  CheckCircle2,
  MessageSquare,
  MessagesSquare,
  HelpCircle,
  Edit3,
  Share2,
  LogOut,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sliders,
  MoreVertical,
  ExternalLink,
  Send,
  UserCheck,
  UserX,
  Volume2,
  Smile,
  Star,
  PlusCircle,
  MinusCircle
} from "lucide-react";

import PreflightLobby from "@/components/studio/PreflightLobby";
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
import {
  getLiveRoomState,
  updateEvent,
  setLiveCta,
  sendChatMessage,
  deleteChatMessage,
} from "@/lib/dbActions";
import { HostBroadcaster } from "@/lib/webrtcStreamManager";
import { Room, RoomEvent, Track } from "livekit-client";
import { StudioCompositor } from "@/lib/studioCompositor";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ role?: string }>;
}

type StreamYardRightTab =
  | "media"
  | "banners"
  | "comments"
  | "widgets"
  | "people"
  | "private_chat";

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

  // Studio Customization States (StreamYard Inspired)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("solo");
  const [backgroundPresetId, setBackgroundPresetId] = useState<string>("streamyard-wave");
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string>("");

  // Brand & Overlays
  const [brandColor, setBrandColor] = useState<string>("#0066ff");
  const [logoVisible, setLogoVisible] = useState(true);
  const [logoPosition, setLogoPosition] = useState<"left" | "right">("right");
  const [fadeOverlays, setFadeOverlays] = useState(true);

  // Lower Third & Banners
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

  // Broadcast & Live Status
  const [isBroadcastingLive, setIsBroadcastingLive] = useState(false);
  const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
  const [liveDuration, setLiveDuration] = useState(0);

  // Right Rail Drawer State (StreamYard tabs)
  const [activeRightTab, setActiveRightTab] = useState<StreamYardRightTab | null>("media");

  // Modals & Popovers
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPresentMenu, setShowPresentMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live CTA (Widgets)
  const [ctaTitle, setCtaTitle] = useState("Agende uma Demonstração com nossos Especialistas");
  const [ctaBtnText, setCtaBtnText] = useState("Falar com Consultor");
  const [ctaBtnUrl, setCtaBtnUrl] = useState("https://buysoft.com.br");

  // Chat message input for comments tab
  const [chatInput, setChatInput] = useState("");
  const [displayedComment, setDisplayedComment] = useState<{
    id: string;
    senderName: string;
    message?: string;
    text?: string;
  } | null>(null);
  const [starredCommentIds, setStarredCommentIds] = useState<string[]>([]);
  const [commentsSubTab, setCommentsSubTab] = useState<"live" | "starred">("live");
  const [showCommentsOnStage, setShowCommentsOnStage] = useState(true);
  const [showChatOverlayConfig, setShowChatOverlayConfig] = useState(false);
  const [chatOverlaySize, setChatOverlaySize] = useState<"normal" | "tall" | "wide">("normal");
  const [chatOverlayFontSize, setChatOverlayFontSize] = useState<"small" | "medium" | "large">("small");
  const [showChatOverlayHelp, setShowChatOverlayHelp] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  const [privateChatInput, setPrivateChatInput] = useState("");
  const [privateMessages, setPrivateMessages] = useState<
    Array<{ sender: string; text: string; time: string }>
  >([
    {
      sender: "Sistema",
      text: "Bem-vindo ao chat privado do estúdio! Apenas palestrantes e host têm acesso.",
      time: "Agora",
    },
  ]);

  // Single source of truth for webinar live status
  const isWebinarLive = roomState?.status === "live" || isBroadcastingLive;

  // Video refs & WebRTC Broadcaster
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const broadcasterRef = useRef<HostBroadcaster | null>(null);
  const compositorRef = useRef<StudioCompositor | null>(null);

  // LiveKit Cloud Room Connection & Track Publishing
  const livekitRoomRef = useRef<Room | null>(null);
  const [isLiveKitConnected, setIsLiveKitConnected] = useState(false);

  // Track publish state (to avoid double-publishing)
  const publishedTracksRef = useRef<{ camera: boolean; screen: boolean; mic: boolean; screenAudio: boolean }>(
    { camera: false, screen: false, mic: false, screenAudio: false }
  );

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Initialize and synchronize StudioCompositor (Local preview / canvas helper)
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
  }, [localStream, screenStream, isScreenSharing, isOnStage, isCamOn, isMicOn, layoutMode]);

  // Initialize WebRTC Host Broadcaster (fallback)
  useEffect(() => {
    const broadcaster = new HostBroadcaster(eventId);
    broadcaster.start();
    broadcasterRef.current = broadcaster;
    return () => {
      broadcaster.stop();
    };
  }, [eventId]);

  // Sync composite stream to WebRTC peer broadcaster (fallback only)
  useEffect(() => {
    if (broadcasterRef.current && compositorRef.current) {
      if (isLiveKitConnected) {
        broadcasterRef.current.stop();
      } else {
        broadcasterRef.current.start();
        const compositeStream = compositorRef.current.getCompositeStream();
        broadcasterRef.current.setStreams(compositeStream, null, isWebinarLive);
      }
    }
  }, [localStream, screenStream, isWebinarLive, isOnStage, isScreenSharing, layoutMode, isLiveKitConnected]);

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

        room.on(RoomEvent.ParticipantConnected, () => {
          publishOverlayState();
        });

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

  // Send overlay and composition state to all spectators via LiveKit DataChannel
  const publishOverlayState = React.useCallback(() => {
    const room = livekitRoomRef.current;
    if (!room || !isLiveKitConnected) return;
    try {
      const payload = JSON.stringify({
        type: "overlay",
        layoutMode,
        isScreenSharing,
        isCamOn,
        isOnStage,
        isMicOn,
        backgroundPresetId,
        customBackgroundUrl,
        presenterName: userRole === "host" ? "Eliel Nunes (Host)" : "Palestrante Convidado",
        brandColor,
        lowerThird: {
          visible: lowerThirdVisible,
          name: lowerThirdName,
          role: lowerThirdRole,
          company: lowerThirdCompany,
        },
        ticker: { visible: tickerVisible, text: tickerText },
        banner: { visible: bannerVisible, title: bannerTitle, subtitle: bannerSubtitle },
        displayedComment: displayedComment || null,
        showCommentsOnStage,
        chatOverlaySettings: {
          size: chatOverlaySize,
          fontSize: chatOverlayFontSize,
        },
      });
      room.localParticipant.publishData(
        new TextEncoder().encode(payload),
        { reliable: true }
      );
    } catch (_) {}
  }, [
    isLiveKitConnected,
    layoutMode,
    isScreenSharing,
    isCamOn,
    isOnStage,
    isMicOn,
    backgroundPresetId,
    customBackgroundUrl,
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
    displayedComment,
    showCommentsOnStage,
    chatOverlaySize,
    chatOverlayFontSize,
  ]);

  // Re-broadcast overlay state whenever any layout property changes
  useEffect(() => {
    publishOverlayState();
  }, [publishOverlayState]);

  // Periodic heartbeat broadcast for late spectators
  useEffect(() => {
    if (!isLiveKitConnected || !isWebinarLive) return;
    const interval = setInterval(() => {
      publishOverlayState();
    }, 2500);
    return () => clearInterval(interval);
  }, [isLiveKitConnected, isWebinarLive, publishOverlayState]);

  // Publish/unpublish native tracks directly to LiveKit
  // High-performance hardware encoding directly bypassing canvas
  useEffect(() => {
    const room = livekitRoomRef.current;
    if (!room || !isLiveKitConnected) return;

    const syncNativeTracks = async () => {
      try {
        if (!isWebinarLive) {
          // Backstage: unpublish all stage tracks so audience sees waiting room
          const pubs = Array.from(room.localParticipant.trackPublications.values());
          for (const pub of pubs) {
            const n = pub.trackName;
            if (n === "camera" || n === "screen" || n === "screen-audio" || n === "mic") {
              if (pub.track) await room.localParticipant.unpublishTrack(pub.track).catch(() => {});
            }
          }
          publishedTracksRef.current = { camera: false, screen: false, mic: false, screenAudio: false };
          return;
        }

        // --- Screen track (native hardware encoder, no canvas) ---
        const screenVt = screenStream?.getVideoTracks()[0];
        if (screenVt && isScreenSharing && !publishedTracksRef.current.screen) {
          publishedTracksRef.current.screen = true;
          screenVt.contentHint = "detail";
          try {
            await room.localParticipant.publishTrack(screenVt, {
              name: "screen",
              source: Track.Source.ScreenShare,
              simulcast: false,
              degradationPreference: "maintain-framerate",
              videoEncoding: {
                maxBitrate: 3_000_000,
                maxFramerate: 30,
              },
            });
            console.log("LiveKit: Screen track published via hardware encoder!");
          } catch (e) {
            publishedTracksRef.current.screen = false;
            console.error("LiveKit: Screen publish error:", e);
          }
        } else if (!isScreenSharing && publishedTracksRef.current.screen) {
          publishedTracksRef.current.screen = false;
          const pub = Array.from(room.localParticipant.videoTrackPublications.values()).find(
            (p) => p.trackName === "screen" || p.source === Track.Source.ScreenShare
          );
          if (pub?.track) await room.localParticipant.unpublishTrack(pub.track).catch(() => {});
        }

        // --- Screen audio track ---
        const screenAt = screenStream?.getAudioTracks()[0];
        if (screenAt && isScreenSharing && !publishedTracksRef.current.screenAudio) {
          publishedTracksRef.current.screenAudio = true;
          try {
            await room.localParticipant.publishTrack(screenAt, {
              name: "screen-audio",
              source: Track.Source.ScreenShareAudio,
              audioPreset: { maxBitrate: 128_000 },
            });
            console.log("LiveKit: Screen audio track published!");
          } catch (e) {
            publishedTracksRef.current.screenAudio = false;
            console.warn("LiveKit: Screen audio publish error:", e);
          }
        } else if (!isScreenSharing && publishedTracksRef.current.screenAudio) {
          publishedTracksRef.current.screenAudio = false;
          const pub = Array.from(room.localParticipant.audioTrackPublications.values()).find(
            (p) => p.trackName === "screen-audio" || p.source === Track.Source.ScreenShareAudio
          );
          if (pub?.track) await room.localParticipant.unpublishTrack(pub.track).catch(() => {});
        }

        // --- Camera track (always maintained across all layouts) ---
        const camVt = localStream?.getVideoTracks()[0];
        if (camVt && isCamOn && isOnStage && !publishedTracksRef.current.camera) {
          publishedTracksRef.current.camera = true;
          try {
            await room.localParticipant.publishTrack(camVt, {
              name: "camera",
              source: Track.Source.Camera,
              simulcast: true,
              videoEncoding: {
                maxBitrate: 1_500_000,
                maxFramerate: 30,
              },
            });
            console.log("LiveKit: Camera track published via hardware encoder!");
          } catch (e) {
            publishedTracksRef.current.camera = false;
            console.error("LiveKit: Camera publish error:", e);
          }
        } else if ((!isCamOn || !isOnStage) && publishedTracksRef.current.camera) {
          publishedTracksRef.current.camera = false;
          const pub = Array.from(room.localParticipant.videoTrackPublications.values()).find(
            (p) => p.trackName === "camera" || p.source === Track.Source.Camera
          );
          if (pub?.track) await room.localParticipant.unpublishTrack(pub.track).catch(() => {});
        }

        // --- Microphone audio track ---
        const micAt = localStream?.getAudioTracks()[0];
        if (micAt && isMicOn && !publishedTracksRef.current.mic) {
          publishedTracksRef.current.mic = true;
          try {
            await room.localParticipant.publishTrack(micAt, {
              name: "mic",
              source: Track.Source.Microphone,
              audioPreset: { maxBitrate: 96_000 },
            });
            console.log("LiveKit: Mic track published!");
          } catch (e) {
            publishedTracksRef.current.mic = false;
            console.error("LiveKit: Mic publish error:", e);
          }
        } else if (!isMicOn && publishedTracksRef.current.mic) {
          publishedTracksRef.current.mic = false;
          const pub = Array.from(room.localParticipant.audioTrackPublications.values()).find(
            (p) => p.trackName === "mic" || p.source === Track.Source.Microphone
          );
          if (pub?.track) await room.localParticipant.unpublishTrack(pub.track).catch(() => {});
        }

        publishOverlayState();
      } catch (err) {
        console.warn("Error syncing native tracks to LiveKit:", err);
      }
    };

    syncNativeTracks();
  }, [
    isLiveKitConnected,
    isWebinarLive,
    localStream,
    screenStream,
    isScreenSharing,
    isCamOn,
    isOnStage,
    isMicOn,
    layoutMode,
    hasJoinedLobby,
    publishOverlayState,
  ]);

  // Load and poll live room state
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
    setShowPresentMenu(false);
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

  // Toggle 1-Click Native Transmission (Transmitir ao vivo)
  const handleToggleGoLive = async () => {
    setIsStartingBroadcast(true);
    const isCurrentlyLive = roomState?.status === "live" || isBroadcastingLive;

    if (isCurrentlyLive) {
      try {
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
        fetchState();
        showToast("Transmissão encerrada com sucesso!");
      } catch (err) {
        console.error("Error stopping live stream:", err);
      } finally {
        setIsStartingBroadcast(false);
      }
    } else {
      try {
        await updateEvent(eventId, { status: "live" });
        setIsBroadcastingLive(true);
        fetchState();
        showToast("Você está AO VIVO na plataforma Buysoft!");
      } catch (err: any) {
        console.error("Error starting broadcast:", err);
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
    fetchState();
    showToast("Live CTA disparado para os espectadores!");
  };

  const handleEndCta = async () => {
    await setLiveCta(eventId, {
      title: "",
      buttonText: "",
      buttonUrl: "",
      isActive: false,
    });
    fetchState();
    showToast("Live CTA finalizado.");
  };

  // Send Chat message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput("");
    await sendChatMessage(eventId, userRole === "host" ? "Host (Buysoft)" : "Palestrante", userRole, text);
    fetchState();
  };

  // Send Private Chat message
  const handleSendPrivateChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateChatInput.trim()) return;
    setPrivateMessages((prev) => [
      ...prev,
      {
        sender: userRole === "host" ? "Eliel (Host)" : "Palestrante",
        text: privateChatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setPrivateChatInput("");
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

  const audienceUrl = typeof window !== "undefined" ? `${window.location.origin}/live/${eventId}` : `/live/${eventId}`;

  // If not joined lobby yet, render StreamYard Preflight Lobby
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
    <div className="flex h-screen w-screen flex-col bg-[#f4f5f8] text-slate-800 font-sans overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 border border-slate-700">
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER (StreamYard Style: Clean white, title, actions, Go Live)   */}
      {/* ========================================================================= */}
      <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: StreamYard / Buysoft Duck Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#0066ff] text-white flex items-center justify-center font-black text-sm shadow-xs">
              <span className="tracking-tighter">BE</span>
            </div>
            <div className="hidden sm:flex items-baseline gap-1">
              <span className="text-sm font-black tracking-tight text-slate-900">
                buysoft
              </span>
              <span className="text-sm font-bold text-[#0066ff]">events</span>
            </div>
          </div>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 max-w-[180px] sm:max-w-xs truncate">
              {roomState?.title || "teste"}
            </span>
            <button
              onClick={() => setActiveRightTab("banners")}
              className="text-gray-400 hover:text-slate-600 p-1 rounded-md transition"
              title="Editar título e banners"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Actions, Spectator Link, Status & Go Live Button */}
        <div className="flex items-center gap-3">
          {/* Share with audience button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(audienceUrl);
              setCopiedLink(true);
              showToast("Link da transmissão copiado para a área de transferência!");
              setTimeout(() => setCopiedLink(false), 2500);
            }}
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
            title="Copiar link para convidar espectadores"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Compartilhar com os espectadores</span>
              </>
            )}
          </button>

          {/* Edit schedule / event shortcut */}
          <a
            href={`/live/${eventId}`}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition px-2 py-1 rounded-md hover:bg-gray-100"
            title="Abrir como plateia em nova aba"
          >
            <span>Ver ao vivo</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>

          {/* Programado / Ao Vivo Pill Badge */}
          <div className="flex items-center">
            {isWebinarLive ? (
              <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-bold text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                <span>AO VIVO</span>
                <span className="font-mono text-slate-800 border-l border-red-200 pl-2">
                  {formatDuration(liveDuration)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-md bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs text-slate-600">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-medium">Programação</span>
                <span className="text-slate-400 hidden sm:inline">• É hora do show!</span>
              </div>
            )}
          </div>

          {/* StreamYard Primary Blue Button: Transmitir ao vivo / Encerrar */}
          <button
            onClick={handleToggleGoLive}
            disabled={isStartingBroadcast}
            className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-md transition shadow-xs ${
              isStartingBroadcast
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : isWebinarLive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#0066ff] hover:bg-[#0052cc] text-white"
            }`}
          >
            {isStartingBroadcast ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Conectando...</span>
              </>
            ) : isWebinarLive ? (
              <>
                <Square className="h-3 w-3 fill-current" />
                <span>Encerrar transmissão</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>Transmitir ao vivo</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. STUDIO BODY (Stage Workspace + StreamYard Right Rail / Drawer)         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ======================================================================= */}
        {/* 2.1 MAIN STAGE WORKSPACE (Canvas + Layout Selector + Cards Shelf)       */}
        {/* ======================================================================= */}
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 overflow-y-auto overflow-x-hidden">
          {/* Top Stage Area */}
          <div className="w-full max-w-[1040px] mx-auto flex flex-col items-center">
            {/* 16:9 Stage Canvas */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm bg-black border border-gray-300 flex items-center justify-center">
              {/* Top-Left 1080p Programado/Ao Vivo Badge (StreamYard exact style) */}
              <div className="absolute top-3 left-3 z-30 flex items-center rounded-md overflow-hidden bg-black/60 backdrop-blur-xs text-xs font-semibold shadow-xs">
                <span className="px-2 py-0.5 text-white/90 border-r border-white/20">
                  1080p
                </span>
                <span className={`px-2.5 py-0.5 ${isWebinarLive ? "text-red-400 font-bold" : "text-white"}`}>
                  {isWebinarLive ? "Ao Vivo" : "Programado"}
                </span>
              </div>

              {/* Logo Overlay (if enabled) */}
              {logoVisible && (
                <div
                  className={`absolute top-4 ${
                    logoPosition === "right" ? "right-4" : "left-4"
                  } z-30 pointer-events-none transition-all duration-300`}
                >
                  <div className="rounded-lg bg-black/40 backdrop-blur-xs px-3 py-1 text-xs font-bold text-white tracking-wide border border-white/10 flex items-center gap-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-[#0066ff]" />
                    <span>BUYSOFT</span>
                  </div>
                </div>
              )}

              {/* Studio Stage Renderer with Background and Overlays */}
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

              {/* Overlays: Headline, LowerThird, Ticker */}
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

              {/* StreamYard On-Stage Displayed Comment Banner */}
              {displayedComment && (
                <div className="absolute bottom-6 left-6 z-30 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                  <div className="inline-flex items-center gap-2 bg-[#004bb5] text-white px-3.5 py-1.5 rounded-t-xl font-bold text-xs shadow-md">
                    <div className="h-5 w-5 rounded bg-white text-[#004bb5] flex items-center justify-center text-[10px] font-black">
                      {displayedComment.senderName.slice(0, 1).toUpperCase()}
                    </div>
                    <span>{displayedComment.senderName}</span>
                  </div>
                  <div className="bg-white text-slate-900 px-5 py-3.5 rounded-b-2xl rounded-tr-2xl shadow-2xl border border-gray-100 text-xs sm:text-sm font-medium leading-relaxed">
                    {displayedComment.text || displayedComment.message}
                  </div>
                </div>
              )}

              {/* Chat Overlay Widget on Stage (StreamYard exact replica: live comments streaming on stage) */}
              {showCommentsOnStage && (
                <div
                  className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-25 pointer-events-none transition-all duration-300 ${
                    chatOverlaySize === "tall"
                      ? "w-64 sm:w-72 max-h-64 sm:max-h-80"
                      : chatOverlaySize === "wide"
                      ? "w-80 sm:w-96 max-h-44 sm:max-h-52"
                      : "w-64 sm:w-72 max-h-44 sm:max-h-52"
                  }`}
                >
                  <div className="bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col justify-end gap-2.5 overflow-hidden">
                    {(() => {
                      const count = chatOverlaySize === "tall" ? 6 : 4;
                      const rawList =
                        roomState?.chatMessages && roomState.chatMessages.length > 0
                          ? roomState.chatMessages
                          : [
                              {
                                id: "sample-widget-1",
                                senderName: "Buysoft Events",
                                text: "Os comentários ao vivo aparecem aqui no palco.",
                                message: "Os comentários ao vivo aparecem aqui no palco.",
                                createdAt: new Date().toISOString(),
                              },
                            ];
                      const messagesToDisplay = rawList.slice(-count);

                      const authorSize =
                        chatOverlayFontSize === "large"
                          ? "text-sm"
                          : chatOverlayFontSize === "medium"
                          ? "text-xs"
                          : "text-[11px]";
                      const msgSize =
                        chatOverlayFontSize === "large"
                          ? "text-sm"
                          : chatOverlayFontSize === "medium"
                          ? "text-xs"
                          : "text-[11px]";
                      const timeSize =
                        chatOverlayFontSize === "large"
                          ? "text-[10px]"
                          : chatOverlayFontSize === "medium"
                          ? "text-[9px]"
                          : "text-[8px]";
                      const avatarSize =
                        chatOverlayFontSize === "large"
                          ? "h-7 w-7 text-xs"
                          : chatOverlayFontSize === "medium"
                          ? "h-6 w-6 text-[10px]"
                          : "h-5 w-5 text-[9px]";

                      return messagesToDisplay.map((c: any) => {
                        const timeStr = (() => {
                          try {
                            const d = new Date(c.createdAt || Date.now());
                            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                          } catch (_) {
                            return "";
                          }
                        })();

                        return (
                          <div
                            key={c.id}
                            className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
                          >
                            <div
                              className={`rounded-full bg-[#0066ff] text-white font-bold flex items-center justify-center shrink-0 shadow-xs ${avatarSize}`}
                            >
                              {c.senderName ? c.senderName.slice(0, 1).toUpperCase() : "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-1.5">
                                <span className={`font-bold text-white tracking-tight truncate ${authorSize}`}>
                                  {c.senderName}
                                </span>
                                {timeStr && (
                                  <span className={`text-white/60 font-medium shrink-0 ${timeSize}`}>
                                    {timeStr}
                                  </span>
                                )}
                              </div>
                              <p className={`text-white/95 font-medium leading-relaxed break-words ${msgSize}`}>
                                {c.text || c.message}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Backstage Overlay for presenter if off stage */}
              {!isOnStage && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center z-40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Você está nos bastidores</p>
                    <p className="text-xs text-slate-300 max-w-sm mt-0.5">
                      Seu vídeo e áudio estão ocultos da transmissão. Clique abaixo para entrar no palco.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOnStage(true)}
                    className="flex items-center gap-2 rounded-lg bg-[#0066ff] hover:bg-[#0052cc] px-4 py-2 text-xs font-semibold text-white shadow-md transition"
                  >
                    <Radio className="h-4 w-4" />
                    <span>Adicionar ao palco</span>
                  </button>
                </div>
              )}
            </div>

            {/* =================================================================== */}
            {/* STREAMYARD LAYOUT SELECTOR BAR (Directly under the stage)           */}
            {/* =================================================================== */}
            <div className="flex items-center justify-center gap-2 mt-3 mb-1">
              <div className="flex items-center bg-white rounded-lg border border-gray-300 p-0.5 shadow-2xs">
                {/* 1. Solo */}
                <button
                  type="button"
                  onClick={() => setLayoutMode("solo")}
                  className={`p-2 rounded-md transition ${
                    layoutMode === "solo" && !isScreenSharing
                      ? "bg-[#0066ff] text-white"
                      : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
                  }`}
                  title="Solo: Apresentador único"
                >
                  <Square className="h-4 w-4" />
                </button>

                {/* 2. Dupla (2 participants) */}
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className={`p-2 rounded-md transition ${
                    layoutMode === "grid"
                      ? "bg-[#0066ff] text-white"
                      : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
                  }`}
                  title="Dupla / Grade"
                >
                  <Columns2 className="h-4 w-4" />
                </button>

                {/* 3. Grade (Multiple cameras) */}
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className="p-2 rounded-md text-gray-500 hover:text-slate-800 hover:bg-gray-100 transition"
                  title="Grade balanceada"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>

                {/* 4. Split (Presentation + Camera side) */}
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode("split");
                    if (!isScreenSharing) handleToggleScreenShare();
                  }}
                  className={`p-2 rounded-md transition ${
                    layoutMode === "split"
                      ? "bg-[#0066ff] text-white"
                      : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
                  }`}
                  title="Split: Apresentação com câmera lateral"
                >
                  <div className="flex items-center gap-0.5 h-4">
                    <span className="w-1.5 h-3.5 rounded-xs bg-current" />
                    <span className="w-3.5 h-3.5 rounded-xs bg-current opacity-80" />
                  </div>
                </button>

                {/* 5. Destaque */}
                <button
                  type="button"
                  onClick={() => setLayoutMode("split")}
                  className="p-2 rounded-md text-gray-500 hover:text-slate-800 hover:bg-gray-100 transition"
                  title="Apresentação em destaque"
                >
                  <div className="flex items-center gap-0.5 h-4">
                    <span className="w-3.5 h-3.5 rounded-xs bg-current opacity-80" />
                    <span className="w-1.5 h-3.5 rounded-xs bg-current" />
                  </div>
                </button>

                {/* 6. PiP (Picture in Picture) */}
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode("pip");
                    if (!isScreenSharing) handleToggleScreenShare();
                  }}
                  className={`p-2 rounded-md transition ${
                    layoutMode === "pip"
                      ? "bg-[#0066ff] text-white"
                      : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
                  }`}
                  title="PiP: Apresentação grande com webcam flutuante"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>

                {/* 7. Cinema / Presentation Full */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isScreenSharing) handleToggleScreenShare();
                    setLayoutMode("solo");
                  }}
                  className="p-2 rounded-md text-gray-500 hover:text-slate-800 hover:bg-gray-100 transition"
                  title="Cinema: Apenas apresentação na tela"
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>

              {/* Extra tools beside layout selector */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-300 p-0.5 shadow-2xs">
                <button
                  onClick={() => setActiveRightTab("banners")}
                  className="p-2 rounded-md text-gray-500 hover:text-slate-800 hover:bg-gray-100 transition"
                  title="Editar sobreposições"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowPresentMenu(true)}
                  className="p-2 rounded-md text-gray-500 hover:text-slate-800 hover:bg-gray-100 transition"
                  title="Adicionar mídia ou apresentação"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-md text-gray-500 hover:text-slate-800 hover:bg-gray-100 transition"
                  title="Configurações de vídeo e áudio"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* BOTTOM SHELF: Left cards + Center floating toolbar + Right help    */}
          {/* =================================================================== */}
          <div className="w-full max-w-[1040px] mx-auto flex items-end justify-between gap-3 pt-2">
            {/* Left: Participant & Presentation Cards (StreamYard Tray) */}
            <div className="flex items-center gap-3">
              {/* Card 1: Local User Card */}
              <div className="w-32 sm:w-36 h-20 sm:h-24 rounded-xl border border-gray-300 bg-slate-800 relative overflow-hidden shadow-xs flex flex-col justify-between p-1.5 select-none">
                {/* Video / Cam off thumbnail */}
                {isCamOn && localStream ? (
                  <video
                    ref={(el) => {
                      if (el && localStream) el.srcObject = localStream;
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                    <VideoOff className="h-4 w-4 mb-1 text-slate-400" />
                    <span className="text-[10px] leading-tight font-medium text-slate-300">
                      Dispositivo desativado
                    </span>
                  </div>
                )}

                {/* Top status indicator badge */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      isOnStage
                        ? "bg-emerald-500/90 text-white"
                        : "bg-black/60 text-amber-300"
                    }`}
                  >
                    {isOnStage ? "No palco" : "Bastidores"}
                  </span>
                  {!isMicOn && (
                    <span className="rounded bg-red-600/90 p-0.5 text-white">
                      <MicOff className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                {/* Bottom card bar with name and toggle */}
                <div className="relative z-10 flex items-center justify-between bg-black/60 backdrop-blur-xs rounded-md px-1.5 py-0.5 text-white">
                  <span className="text-[10px] font-semibold truncate max-w-[80px]">
                    {userRole === "host" ? "Eliel Nunes" : "Convidado"}
                  </span>
                  <button
                    onClick={() => setIsOnStage(!isOnStage)}
                    className="text-[9px] font-bold text-[#00b4fb] hover:underline"
                    title={isOnStage ? "Remover do palco" : "Adicionar ao palco"}
                  >
                    {isOnStage ? "Remover" : "Entrar"}
                  </button>
                </div>
              </div>

              {/* Card 2: Apresentar ou convidar card (StreamYard exact style) */}
              <div
                onClick={() => setShowPresentMenu(true)}
                className="w-32 sm:w-36 h-20 sm:h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#0066ff] bg-white hover:bg-blue-50/30 cursor-pointer flex flex-col items-center justify-center text-center p-2 transition shadow-xs select-none"
              >
                <div className="flex items-center gap-1 text-gray-500 mb-1">
                  <Monitor className="h-4 w-4" />
                  <Plus className="h-3 w-3" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700 leading-tight">
                  Apresentar ou convidar
                </span>
              </div>
            </div>

            {/* Center: StreamYard Floating Toolbar */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-2xl border border-gray-200 p-1.5 shadow-md">
              {/* Mic Button */}
              <div className="relative flex items-center">
                <button
                  onClick={handleToggleMic}
                  className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition ${
                    isMicOn
                      ? "bg-gray-100 hover:bg-gray-200 text-slate-700"
                      : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  }`}
                  title={isMicOn ? "Silenciar microfone" : "Ativar microfone"}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
              </div>

              {/* Cam Button */}
              <div className="relative flex items-center">
                <button
                  onClick={handleToggleCam}
                  className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition ${
                    isCamOn
                      ? "bg-gray-100 hover:bg-gray-200 text-slate-700"
                      : "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                  }`}
                  title={isCamOn ? "Desativar câmera" : "Ativar câmera"}
                >
                  {isCamOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>
              </div>

              {/* Present / Screen Button */}
              <button
                onClick={handleToggleScreenShare}
                className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition ${
                  isScreenSharing
                    ? "bg-[#0066ff] text-white shadow-xs"
                    : "bg-gray-100 hover:bg-gray-200 text-slate-700"
                }`}
                title={isScreenSharing ? "Parar de compartilhar tela" : "Compartilhar tela"}
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-4 w-4" />
                ) : (
                  <Monitor className="h-4 w-4" />
                )}
              </button>

              {/* Convidar (Invite Guest) Button */}
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 transition"
                title="Convidar palestrante ou co-host"
              >
                <Users className="h-4 w-4" />
              </button>

              {/* Banners shortcut */}
              <button
                onClick={() => setActiveRightTab("banners")}
                className={`flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl transition ${
                  activeRightTab === "banners"
                    ? "bg-[#0066ff] text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-slate-700"
                }`}
                title="Abrir Banners e Lower Thirds"
              >
                <Type className="h-4 w-4" />
              </button>

              {/* Configurações (Settings) */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 transition"
                title="Configurações de dispositivos"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Sair do estúdio (Red leave button) */}
              <button
                onClick={() => {
                  if (confirm("Deseja sair do estúdio de transmissão?")) {
                    window.location.href = `/events/${eventId}`;
                  }
                }}
                className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-2xs"
                title="Sair do estúdio"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            {/* Right: Help Pill (Precisa de ajuda?) */}
            <div className="hidden lg:block">
              <a
                href="https://buysoft.com.br"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 text-xs font-semibold text-[#0066ff] transition shadow-xs"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Precisa de ajuda?</span>
              </a>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2.2 STREAMYARD RIGHT DRAWER PANEL (Content for active tab)             */}
        {/* ======================================================================= */}
        {activeRightTab && (
          <aside className="w-72 sm:w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden shadow-sm shrink-0 z-10">
            {/* Drawer Header */}
            <div className="h-12 border-b border-gray-200 px-4 flex items-center justify-between shrink-0 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 capitalize">
                  {activeRightTab === "media" && "Ativos de mídia / Marca"}
                  {activeRightTab === "banners" && "Banners & Letreiros"}
                  {activeRightTab === "comments" && "Comentários ao Vivo"}
                  {activeRightTab === "widgets" && "Widgets & Live CTA"}
                  {activeRightTab === "people" && "Pessoas no Estúdio"}
                  {activeRightTab === "private_chat" && "Chat Privado"}
                </span>
              </div>
              <button
                onClick={() => setActiveRightTab(null)}
                className="text-gray-400 hover:text-slate-600 text-xs p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            {activeRightTab === "comments" ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden text-slate-800 text-xs">
                {(() => {
                  const defaultSampleComment = {
                    id: "sample-be-1",
                    senderName: "Buysoft Events",
                    text:
                      "Os comentários do público ao vivo aparecem no Buysoft Events. Este é um exemplo. Clique em um comentário para exibi-lo na tela.",
                    message:
                      "Os comentários do público ao vivo aparecem no Buysoft Events. Este é um exemplo. Clique em um comentário para exibi-lo na tela.",
                    createdAt: new Date().toISOString(),
                  };

                  const allComments =
                    roomState?.chatMessages && roomState.chatMessages.length > 0
                      ? roomState.chatMessages
                      : [defaultSampleComment];

                  const displayedList =
                    commentsSubTab === "starred"
                      ? allComments.filter((c: any) => starredCommentIds.includes(c.id))
                      : allComments;

                  return (
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                      {/* Top Switch & Sub-tabs */}
                      <div className="p-4 pb-3 shrink-0 border-b border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={showCommentsOnStage}
                                onChange={(e) => setShowCommentsOnStage(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#0066ff]"></div>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700">
                              Mostrar comentários no palco
                            </span>
                          </label>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            {/* Help with tooltip (Image 3 exact replica) */}
                            <div className="relative inline-flex items-center">
                              <button
                                type="button"
                                onMouseEnter={() => setShowChatOverlayHelp(true)}
                                onMouseLeave={() => setShowChatOverlayHelp(false)}
                                onClick={() => setShowChatOverlayHelp(!showChatOverlayHelp)}
                                className="p-0.5 text-[#0066ff] hover:text-blue-700 transition"
                                aria-label="Ajuda sobre Chat Overlay"
                              >
                                <HelpCircle className="h-4 w-4" />
                              </button>
                              {showChatOverlayHelp && (
                                <div className="absolute right-0 top-full mt-2 w-64 p-3.5 bg-[#1a1f2c] text-white rounded-xl shadow-2xl z-50 text-xs leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150 border border-slate-700/60">
                                  <div className="absolute -top-1.5 right-2 w-3 h-3 bg-[#1a1f2c] border-t border-l border-slate-700/60 rotate-45" />
                                  <p className="relative z-10 text-white font-normal text-xs leading-relaxed">
                                    O Chat Overlay permite que você exiba comentários ao vivo diretamente na sua transmissão.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Adjustments button (Image 2 exact replica) */}
                            <button
                              type="button"
                              onClick={() => setShowChatOverlayConfig(!showChatOverlayConfig)}
                              className={`p-1 rounded-md transition flex items-center gap-0.5 ${
                                showChatOverlayConfig
                                  ? "text-[#0066ff] bg-blue-50"
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              }`}
                              title="Configurações do Chat Overlay"
                            >
                              <Sliders className="h-3.5 w-3.5" />
                              {showChatOverlayConfig && (
                                <ChevronUp className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Adjustments Panel (Image 2 exact replica: Tamanho & Fonte) */}
                        {showChatOverlayConfig && (
                          <div className="pt-2.5 pb-1 space-y-2.5 border-t border-gray-100 animate-in fade-in slide-in-from-top-1 duration-150">
                            {/* Tamanho */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-gray-600 w-14 shrink-0">
                                Tamanho
                              </span>
                              <div className="grid grid-cols-3 gap-1.5 flex-1">
                                <button
                                  type="button"
                                  onClick={() => setChatOverlaySize("normal")}
                                  className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold border transition ${
                                    chatOverlaySize === "normal"
                                      ? "border-[#0066ff] bg-[#f0f6ff] text-[#0066ff]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  <span className="inline-block w-2.5 h-2.5 border border-current rounded-xs shrink-0" />
                                  <span>NORMAL</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChatOverlaySize("tall")}
                                  className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold border transition ${
                                    chatOverlaySize === "tall"
                                      ? "border-[#0066ff] bg-[#f0f6ff] text-[#0066ff]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  <span className="inline-block w-2 h-3 border border-current rounded-xs shrink-0" />
                                  <span>ALTO</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChatOverlaySize("wide")}
                                  className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold border transition ${
                                    chatOverlaySize === "wide"
                                      ? "border-[#0066ff] bg-[#f0f6ff] text-[#0066ff]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  <span className="inline-block w-3.5 h-2 border border-current rounded-xs shrink-0" />
                                  <span>LARGO</span>
                                </button>
                              </div>
                            </div>

                            {/* Fonte */}
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-gray-600 w-14 shrink-0">
                                Fonte
                              </span>
                              <div className="grid grid-cols-3 gap-1.5 flex-1">
                                <button
                                  type="button"
                                  onClick={() => setChatOverlayFontSize("small")}
                                  className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold border transition ${
                                    chatOverlayFontSize === "small"
                                      ? "border-[#0066ff] bg-[#f0f6ff] text-[#0066ff]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  <span className="font-bold text-[10px] leading-none shrink-0">A</span>
                                  <span>PEQUENA</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChatOverlayFontSize("medium")}
                                  className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold border transition ${
                                    chatOverlayFontSize === "medium"
                                      ? "border-[#0066ff] bg-[#f0f6ff] text-[#0066ff]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  <span className="font-bold text-xs leading-none shrink-0">A</span>
                                  <span>MÉDIA</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChatOverlayFontSize("large")}
                                  className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md text-[10px] font-bold border transition ${
                                    chatOverlayFontSize === "large"
                                      ? "border-[#0066ff] bg-[#f0f6ff] text-[#0066ff]"
                                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  <span className="font-black text-sm leading-none shrink-0">A</span>
                                  <span>GRANDE</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {starredCommentIds.length > 0 && (
                          <div className="flex items-center gap-4 pt-1 border-t border-gray-100 text-xs font-semibold">
                            <button
                              type="button"
                              onClick={() => setCommentsSubTab("live")}
                              className={`pb-1 transition relative ${
                                commentsSubTab === "live"
                                  ? "text-[#0066ff] font-bold border-b-2 border-[#0066ff]"
                                  : "text-gray-500 hover:text-slate-800"
                              }`}
                            >
                              Ao vivo
                            </button>
                            <button
                              type="button"
                              onClick={() => setCommentsSubTab("starred")}
                              className={`pb-1 transition relative ${
                                commentsSubTab === "starred"
                                  ? "text-[#0066ff] font-bold border-b-2 border-[#0066ff]"
                                  : "text-gray-500 hover:text-slate-800"
                              }`}
                            >
                              Favorito ({starredCommentIds.length})
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Comments List (Fills all remaining height) */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-0">
                        {displayedList.length > 0 ? (
                          displayedList.map((msg: any) => {
                            const isSelected = displayedComment?.id === msg.id;
                            const isStarred = starredCommentIds.includes(msg.id);
                            const isHovered = hoveredCommentId === msg.id;

                            return (
                              <div
                                key={msg.id}
                                onMouseEnter={() => setHoveredCommentId(msg.id)}
                                onMouseLeave={() => setHoveredCommentId(null)}
                                onClick={() => {
                                  if (isSelected) {
                                    setDisplayedComment(null);
                                  } else {
                                    setDisplayedComment({
                                      id: msg.id,
                                      senderName: msg.senderName,
                                      text: msg.text || msg.message,
                                      message: msg.text || msg.message,
                                    });
                                  }
                                }}
                                className={`relative p-3 rounded-xl cursor-pointer transition-all duration-150 select-none group ${
                                  isSelected
                                    ? "bg-[#0066ff] text-white shadow-sm"
                                    : "bg-[#f0f2f5] hover:bg-[#e4e6eb] text-slate-800"
                                }`}
                              >
                                <div
                                  className={`transition-opacity ${
                                    isHovered ? "opacity-25" : "opacity-100"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-6 w-6 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                                        isSelected
                                          ? "bg-white text-[#0066ff]"
                                          : "bg-[#0066ff] text-white"
                                      }`}
                                    >
                                      {msg.senderName.slice(0, 1).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-xs truncate max-w-[170px]">
                                      {msg.senderName}
                                    </span>
                                  </div>
                                  <p
                                    className={`text-xs mt-1.5 leading-relaxed ${
                                      isSelected ? "text-white" : "text-slate-600"
                                    }`}
                                  >
                                    {msg.text || msg.message}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setStarredCommentIds((prev) =>
                                      prev.includes(msg.id)
                                        ? prev.filter((id) => id !== msg.id)
                                        : [...prev, msg.id]
                                    );
                                  }}
                                  className={`absolute top-2.5 right-2.5 p-1 rounded-md transition ${
                                    isHovered || isStarred
                                      ? "opacity-100"
                                      : "opacity-0 group-hover:opacity-100"
                                  }`}
                                  title={
                                    isStarred
                                      ? "Remover dos favoritos"
                                      : "Favoritar comentário"
                                  }
                                >
                                  <Star
                                    className={`h-4 w-4 ${
                                      isStarred
                                        ? isSelected
                                          ? "fill-white text-white"
                                          : "fill-[#0066ff] text-[#0066ff]"
                                        : isSelected
                                        ? "text-white/80 hover:text-white"
                                        : "text-gray-400 hover:text-gray-600"
                                    }`}
                                  />
                                </button>

                                {isHovered && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition transform active:scale-95 pointer-events-auto ${
                                        isSelected
                                          ? "bg-white text-slate-900 hover:bg-gray-100"
                                          : "bg-white text-slate-900 hover:bg-gray-50 border border-gray-200"
                                      }`}
                                    >
                                      {isSelected ? (
                                        <>
                                          <MinusCircle className="h-4 w-4 text-red-600" />
                                          <span>Ocultar</span>
                                        </>
                                      ) : (
                                        <>
                                          <PlusCircle className="h-4 w-4 text-[#0066ff]" />
                                          <span>Exibir</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Nenhum comentário favoritado ainda.</p>
                            <p className="text-[10px] mt-1">
                              Clique na estrela de qualquer comentário para favoritá-lo.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Bottom Input Form (Pinned firmly to the base) */}
                      <form
                        onSubmit={handleSendChatMessage}
                        className="shrink-0 p-3 border-t border-gray-200 bg-white flex items-center gap-2"
                      >
                        <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 border border-slate-200">
                          {userRole === "host" ? "EN" : "CO"}
                        </div>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Publicar um comentário"
                          className="flex-1 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs text-slate-800 placeholder:text-gray-400 focus:border-[#0066ff] focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="p-1.5 rounded-full text-[#0066ff] hover:bg-blue-50 disabled:opacity-30 transition shrink-0"
                          title="Publicar comentário"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  );
                })()}
              </div>
            ) : activeRightTab === "private_chat" ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden text-slate-800 text-xs">
                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                  {privateMessages.map((msg, i) => (
                    <div key={i} className="p-2 rounded-xl bg-gray-100 text-xs space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                        <span>{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-slate-800">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleSendPrivateChat}
                  className="shrink-0 p-3 border-t border-gray-200 bg-white flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={privateChatInput}
                    onChange={(e) => setPrivateChatInput(e.target.value)}
                    placeholder="Mensagem para os bastidores..."
                    className="flex-1 rounded-full border border-gray-300 px-3.5 py-1.5 text-xs text-slate-800 placeholder:text-gray-400 focus:border-[#0066ff] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!privateChatInput.trim()}
                    className="p-1.5 rounded-full bg-[#0066ff] hover:bg-[#0052cc] text-white transition shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-800 text-xs min-h-0">
                {/* TAB 1: ATIVOS DE MÍDIA / MARCA (Image 2 exact replica) */}
              {activeRightTab === "media" && (
                <div className="space-y-5">
                  {/* Brand selector dropdown */}
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Palette className="h-4 w-4 text-[#0066ff]" />
                      <span>Marca 1 (Padrão Buysoft)</span>
                    </div>
                    <MoreVertical className="h-4 w-4 text-gray-400 cursor-pointer" />
                  </div>

                  {/* Logotipo Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Logotipo</span>
                      <button
                        onClick={() => setLogoVisible(!logoVisible)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                          logoVisible ? "bg-blue-100 text-[#0066ff]" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {logoVisible ? "Visível" : "Oculto"}
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setLogoVisible(!logoVisible)}
                        className={`h-16 w-20 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center p-2 text-center transition ${
                          logoVisible
                            ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]"
                            : "border-gray-200 bg-gray-50 text-gray-400"
                        }`}
                      >
                        <span className="font-black text-xs">BUYSOFT</span>
                        <span className="text-[9px]">Logo</span>
                      </div>

                      {/* Position switcher: Left / Right */}
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 block">Posição</span>
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                          <button
                            onClick={() => setLogoPosition("left")}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                              logoPosition === "left" ? "bg-white text-[#0066ff] shadow-xs" : "text-gray-500"
                            }`}
                          >
                            Esquerda
                          </button>
                          <button
                            onClick={() => setLogoPosition("right")}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                              logoPosition === "right" ? "bg-white text-[#0066ff] shadow-xs" : "text-gray-500"
                            }`}
                          >
                            Direita
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sobreposição (Overlays) Section */}
                  <div className="space-y-2.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Sobreposição</span>
                      <label className="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fadeOverlays}
                          onChange={(e) => setFadeOverlays(e.target.checked)}
                          className="rounded border-gray-300 text-[#0066ff] focus:ring-0 h-3 w-3"
                        />
                        <span>Desvanecer overlays</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setBannerVisible(true);
                          setBannerTitle("Bem-vindo ao Webinar!");
                          setBannerSubtitle("Buysoft Events • Transmissão ao Vivo");
                        }}
                        className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50/40 hover:border-blue-300 text-left transition"
                      >
                        <span className="font-bold text-slate-800 block text-[11px]">Bem-vindo</span>
                        <span className="text-[9px] text-gray-500">Banner Superior</span>
                      </button>

                      <button
                        onClick={() => {
                          setTickerVisible(true);
                          setTickerText("❓ Envie suas dúvidas e comentários no chat lateral!");
                        }}
                        className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50/40 hover:border-blue-300 text-left transition"
                      >
                        <span className="font-bold text-slate-800 block text-[11px]">Perguntas</span>
                        <span className="text-[9px] text-gray-500">Letreiro Rodapé</span>
                      </button>

                      <button
                        onClick={() => {
                          setLowerThirdVisible(!lowerThirdVisible);
                        }}
                        className={`p-2 rounded-xl border text-left transition ${
                          lowerThirdVisible
                            ? "border-[#0066ff] bg-blue-50/40"
                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <span className="font-bold text-slate-800 block text-[11px]">Identificação</span>
                        <span className="text-[9px] text-gray-500">Lower Third</span>
                      </button>

                      <button
                        onClick={() => {
                          setBannerVisible(false);
                          setLowerThirdVisible(false);
                          setTickerVisible(false);
                        }}
                        className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-left transition"
                      >
                        <span className="font-bold block text-[11px]">Limpar Todos</span>
                        <span className="text-[9px] text-gray-400">Ocultar overlays</span>
                      </button>
                    </div>
                  </div>

                  {/* Videoclipes Section */}
                  <div className="space-y-2.5 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Videoclipes</span>
                      {videoAssetUrl && (
                        <button
                          onClick={() => setVideoAssetUrl(null)}
                          className="text-[10px] font-bold text-red-600 hover:underline"
                        >
                          Parar vídeo
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          setVideoAssetUrl(
                            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                          )
                        }
                        className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50/40 hover:border-blue-300 text-left transition flex flex-col justify-between"
                      >
                        <Film className="h-4 w-4 text-[#0066ff] mb-1" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Vídeo Intro</span>
                          <span className="text-[9px] text-gray-500">15s com áudio</span>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          setVideoAssetUrl(
                            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                          )
                        }
                        className="p-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50/40 hover:border-blue-300 text-left transition flex flex-col justify-between"
                      >
                        <Tv className="h-4 w-4 text-purple-600 mb-1" />
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">Demonstração</span>
                          <span className="text-[9px] text-gray-500">Vídeo Full HD</span>
                        </div>
                      </button>
                    </div>

                    {/* Custom Video input */}
                    <div className="pt-1">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customVideoInput}
                          onChange={(e) => setCustomVideoInput(e.target.value)}
                          placeholder="URL de vídeo MP4..."
                          className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customVideoInput) setVideoAssetUrl(customVideoInput);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0066ff] text-white font-semibold text-xs hover:bg-[#0052cc] transition"
                        >
                          Tocar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Plano de Fundo (Backgrounds) Section */}
                  <div className="space-y-2.5 pt-2 border-t border-gray-100">
                    <span className="font-bold text-slate-800 block">Plano de fundo</span>
                    <div className="grid grid-cols-2 gap-2">
                      {BACKGROUND_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setBackgroundPresetId(preset.id);
                            setCustomBackgroundUrl("");
                          }}
                          className={`h-16 rounded-xl border p-2 flex flex-col justify-end text-left transition ${
                            backgroundPresetId === preset.id && !customBackgroundUrl
                              ? "border-[#0066ff] ring-2 ring-[#0066ff]/40 shadow-xs"
                              : "border-gray-300 hover:border-gray-400"
                          } ${preset.className}`}
                          style={preset.style}
                        >
                          <span className="text-[10px] font-bold text-white drop-shadow-sm">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BANNERS & LETREIROS */}
              {activeRightTab === "banners" && (
                <div className="space-y-4">
                  {/* Lower Third Editor */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Lower Third (Nome)</span>
                      <button
                        onClick={() => setLowerThirdVisible(!lowerThirdVisible)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                          lowerThirdVisible ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {lowerThirdVisible ? "Visível" : "Oculto"}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                          Nome
                        </label>
                        <input
                          type="text"
                          value={lowerThirdName}
                          onChange={(e) => setLowerThirdName(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                          Cargo / Especialidade
                        </label>
                        <input
                          type="text"
                          value={lowerThirdRole}
                          onChange={(e) => setLowerThirdRole(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                          Empresa
                        </label>
                        <input
                          type="text"
                          value={lowerThirdCompany}
                          onChange={(e) => setLowerThirdCompany(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Headline Banner */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Banner Superior</span>
                      <button
                        onClick={() => setBannerVisible(!bannerVisible)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                          bannerVisible ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {bannerVisible ? "Exibindo" : "Oculto"}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                        placeholder="Título do banner..."
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={bannerSubtitle}
                        onChange={(e) => setBannerSubtitle(e.target.value)}
                        placeholder="Subtítulo..."
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Ticker Tape */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Letreiro Rodapé (Ticker)</span>
                      <button
                        onClick={() => setTickerVisible(!tickerVisible)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                          tickerVisible ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {tickerVisible ? "Ativo" : "Oculto"}
                      </button>
                    </div>

                    <textarea
                      value={tickerText}
                      onChange={(e) => setTickerText(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: WIDGETS & LIVE CTA */}
              {activeRightTab === "widgets" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#0066ff]">
                      <Zap className="h-4 w-4 fill-current" />
                      <span>Live CTA (Chamada de Ação)</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Dispare um banner de alta conversão diretamente na tela dos espectadores ao vivo.
                    </p>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                          Título da Oferta
                        </label>
                        <input
                          type="text"
                          value={ctaTitle}
                          onChange={(e) => setCtaTitle(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                          Texto do Botão
                        </label>
                        <input
                          type="text"
                          value={ctaBtnText}
                          onChange={(e) => setCtaBtnText(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">
                          URL de Destino
                        </label>
                        <input
                          type="text"
                          value={ctaBtnUrl}
                          onChange={(e) => setCtaBtnUrl(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#0066ff] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {roomState?.liveCtas && roomState.liveCtas.length > 0 ? (
                        <button
                          onClick={handleEndCta}
                          className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold py-2 text-xs transition"
                        >
                          Encerrar Live CTA
                        </button>
                      ) : (
                        <button
                          onClick={handleLaunchCta}
                          className="flex-1 rounded-lg bg-[#0066ff] hover:bg-[#0052cc] text-white font-semibold py-2 text-xs transition shadow-xs"
                        >
                          Disparar para Espectadores
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PESSOAS NO ESTÚDIO */}
              {activeRightTab === "people" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-slate-800">Participantes no Estúdio</span>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="text-[#0066ff] text-[11px] font-semibold hover:underline"
                    >
                      + Convidar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* User Card */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#0066ff] text-white font-bold flex items-center justify-center text-xs">
                          {userRole === "host" ? "EN" : "CO"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {userRole === "host" ? "Eliel Nunes (Você)" : "Palestrante (Você)"}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {userRole === "host" ? "Anfitrião / Host" : "Palestrante"} •{" "}
                            {isOnStage ? "🟢 No palco" : "🟠 Bastidores"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsOnStage(!isOnStage)}
                        className={`text-[10px] font-bold px-2 py-1 rounded transition ${
                          isOnStage
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-[#0066ff] text-white hover:bg-[#0052cc]"
                        }`}
                      >
                        {isOnStage ? "Mover" : "No palco"}
                      </button>
                    </div>
                  </div>

                  {/* Invite Link Card */}
                  <div className="p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 space-y-2">
                    <span className="font-semibold text-slate-700 block">Link de Convidado</span>
                    <p className="text-[11px] text-gray-500">
                      Envie este link para palestrantes entrarem diretamente nos bastidores do estúdio.
                    </p>
                    <button
                      onClick={() => {
                        const guestUrl = `${window.location.origin}/studio/${eventId}?role=speaker`;
                        navigator.clipboard.writeText(guestUrl);
                        showToast("Link de convidado copiado!");
                      }}
                      className="w-full py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-slate-700 transition"
                    >
                      Copiar link de convidado
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}
          </aside>
        )}

        {/* ======================================================================= */}
        {/* 2.3 STREAMYARD VERTICAL RAIL (Far right toolbar)                        */}
        {/* ======================================================================= */}
        <nav className="w-18 sm:w-20 bg-white border-l border-gray-200 py-3 flex flex-col items-center gap-4 select-none shrink-0 z-20">
          {/* Comentários */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "comments" ? null : "comments")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition w-16 text-center ${
              activeRightTab === "comments"
                ? "text-[#0066ff] bg-blue-50 font-bold"
                : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] leading-tight">Comentários</span>
          </button>

          {/* Banners */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "banners" ? null : "banners")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition w-16 text-center ${
              activeRightTab === "banners"
                ? "text-[#0066ff] bg-blue-50 font-bold"
                : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
            }`}
          >
            <Layers className="h-5 w-5" />
            <span className="text-[10px] leading-tight">Banners</span>
          </button>

          {/* Ativos de mídia / Marca */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "media" ? null : "media")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition w-16 text-center ${
              activeRightTab === "media"
                ? "text-[#0066ff] bg-blue-50 font-bold"
                : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
            }`}
          >
            <Palette className="h-5 w-5" />
            <span className="text-[10px] leading-tight">Ativos de mídia</span>
          </button>

          {/* Widgets */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "widgets" ? null : "widgets")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition w-16 text-center ${
              activeRightTab === "widgets"
                ? "text-[#0066ff] bg-blue-50 font-bold"
                : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
            }`}
          >
            <Zap className="h-5 w-5" />
            <span className="text-[10px] leading-tight">Widgets</span>
          </button>

          {/* Pessoas */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "people" ? null : "people")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition w-16 text-center ${
              activeRightTab === "people"
                ? "text-[#0066ff] bg-blue-50 font-bold"
                : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[10px] leading-tight">Pessoas</span>
          </button>

          {/* Chat Privado */}
          <button
            onClick={() => setActiveRightTab(activeRightTab === "private_chat" ? null : "private_chat")}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition w-16 text-center ${
              activeRightTab === "private_chat"
                ? "text-[#0066ff] bg-blue-50 font-bold"
                : "text-gray-500 hover:text-slate-800 hover:bg-gray-100"
            }`}
          >
            <MessagesSquare className="h-5 w-5" />
            <span className="text-[10px] leading-tight">Chat privado</span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS (Apresentar ou Convidar, Invite Guest, Audio/Video Settings)    */}
      {/* ========================================================================= */}

      {/* Modal: Apresentar Menu */}
      {showPresentMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-bold text-sm text-slate-800">Apresentar no Palco</span>
              <button
                onClick={() => setShowPresentMenu(false)}
                className="text-gray-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleToggleScreenShare}
                className="w-full p-3 rounded-xl border border-gray-200 hover:border-[#0066ff] hover:bg-blue-50/40 flex items-center gap-3 text-left transition"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-100 text-[#0066ff] flex items-center justify-center">
                  <Monitor className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Compartilhar Tela</span>
                  <span className="text-[11px] text-gray-500">Janela, aba do navegador ou tela cheia</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowPresentMenu(false);
                  setActiveRightTab("media");
                }}
                className="w-full p-3 rounded-xl border border-gray-200 hover:border-[#0066ff] hover:bg-blue-50/40 flex items-center gap-3 text-left transition"
              >
                <div className="h-9 w-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Arquivo de Vídeo</span>
                  <span className="text-[11px] text-gray-500">Reproduzir clipe ou vinheta no palco</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowPresentMenu(false);
                  setShowInviteModal(true);
                }}
                className="w-full p-3 rounded-xl border border-gray-200 hover:border-[#0066ff] hover:bg-blue-50/40 flex items-center gap-3 text-left transition"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Convidar Palestrante</span>
                  <span className="text-[11px] text-gray-500">Copiar link de acesso para o estúdio</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Invite Guest / Speaker */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Users className="h-4 w-4 text-[#0066ff]" />
                <span>Convidar Palestrantes para o Estúdio</span>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Os palestrantes entrarão diretamente no camarim (bastidores) com microfone e câmera. Você pode colocá-los no palco quando a transmissão começar.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">
                Link de Acesso do Convidado
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${typeof window !== "undefined" ? window.location.origin : ""}/studio/${eventId}?role=speaker`}
                  className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-xs text-slate-700 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => {
                    const guestUrl = `${window.location.origin}/studio/${eventId}?role=speaker`;
                    navigator.clipboard.writeText(guestUrl);
                    showToast("Link de convidado copiado!");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0066ff] hover:bg-[#0052cc] text-white font-semibold text-xs transition"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Audio / Video Settings */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Settings className="h-4 w-4 text-[#0066ff]" />
                <span>Configurações do Estúdio</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Qualidade da Transmissão</label>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-semibold flex items-center justify-between">
                  <span>1080p Full HD (Nativo WebRTC SFU)</span>
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Transmissão nativa de alta fidelidade e baixa latência sem intermediários.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Papel no Estúdio</label>
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setUserRole("host")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                      userRole === "host" ? "bg-white text-[#0066ff] shadow-xs" : "text-gray-500"
                    }`}
                  >
                    Host (Organizador)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserRole("speaker")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                      userRole === "speaker" ? "bg-white text-[#0066ff] shadow-xs" : "text-gray-500"
                    }`}
                  >
                    Palestrante Convidado
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 rounded-xl bg-[#0066ff] hover:bg-[#0052cc] text-white font-semibold text-xs transition shadow-xs"
              >
                Salvar & Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
