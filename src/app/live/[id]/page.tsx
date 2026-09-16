"use client";

import React, { useEffect, useState, useRef, use } from "react";
import Image from "next/image";
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
  ChevronDown,
  Info,
  Zap,
  Monitor,
  Mic,
  MicOff,
  User,
  X,
  Send,
  Smile,
} from "lucide-react";
import LiveCtaBanner from "@/components/engagement/LiveCtaBanner";
import { getLiveRoomState, sendChatMessage } from "@/lib/dbActions";
import { ViewerReceiver } from "@/lib/webrtcStreamManager";
import { Room, RoomEvent, Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from "livekit-client";
import { BACKGROUND_PRESETS } from "@/components/studio/StudioLayoutManager";
import { FixedBanner, TickerTape } from "@/components/studio/LowerThirdsOverlay";

export interface AttendeeProfile {
  firstName: string;
  lastName: string;
  fullName: string;
}

const AVATAR_PALETTE = [
  { bg: "bg-[#e8f0fe]", text: "text-[#1967d2]", border: "border-[#d2e3fc]" }, // blue
  { bg: "bg-[#fce8e6]", text: "text-[#c5221f]", border: "border-[#fad2cf]" }, // red
  { bg: "bg-[#e6f4ea]", text: "text-[#137333]", border: "border-[#ceead6]" }, // green
  { bg: "bg-[#fef7e0]", text: "text-[#b06000]", border: "border-[#feefc3]" }, // yellow/orange
  { bg: "bg-[#f3e8fd]", text: "text-[#7627bb]", border: "border-[#e9d2fd]" }, // purple/violet
  { bg: "bg-[#f5e6e8]", text: "text-[#8a3b4d]", border: "border-[#ecccd1]" }, // soft pink
  { bg: "bg-[#e0f2f1]", text: "text-[#00695c]", border: "border-[#b2dfdb]" }, // teal
];

function getAvatarColors(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// LiveTrackVideo: self-contained tile at module scope
// Stays mounted stably across parent re-renders and attaches tracks cleanly without blinking
interface LiveTrackVideoProps {
  track: RemoteTrack | null;
  className?: string;
  muted?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const LiveTrackVideo = React.memo(function LiveTrackVideo({
  track,
  className = "",
  muted = true,
  fallback,
  showFallback = false,
}: LiveTrackVideoProps) {
  const videoElRef = useRef<HTMLVideoElement>(null);
  const attachedTrackSidRef = useRef<string | null | undefined>(null);

  useEffect(() => {
    const el = videoElRef.current;
    if (!el || !track) return;

    if (attachedTrackSidRef.current !== track.sid) {
      if (attachedTrackSidRef.current) {
        try {
          track.detach(el);
        } catch (_) {}
      }
      attachedTrackSidRef.current = track.sid;
      try {
        track.attach(el);
        el.muted = muted;
        el.play().catch(() => {
          el.muted = true;
          el.play().catch(() => {});
        });
      } catch (err) {
        console.warn("LiveTrackVideo attach warning:", err);
      }
    } else {
      if (el.muted !== muted) {
        el.muted = muted;
      }
    }

    return () => {
      if (track && el && attachedTrackSidRef.current === track.sid) {
        try {
          track.detach(el);
        } catch (_) {}
        attachedTrackSidRef.current = null;
      }
    };
  }, [track, track?.sid, muted]);

  const shouldShowVideo = Boolean(track && !showFallback);

  return (
    <>
      <video
        ref={videoElRef}
        autoPlay
        playsInline
        muted={muted}
        className={`${className} ${shouldShowVideo ? "block" : "hidden"}`}
      />
      {!shouldShowVideo && fallback}
    </>
  );
});

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

  // Attendee profile: must enter First Name & Last Name to chat
  const [attendeeProfile, setAttendeeProfile] = useState<AttendeeProfile | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "info">("chat");

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
  // Dedicated Video Stage Ref for Fullscreen (so only video goes fullscreen)
  const videoStageRef = useRef<HTMLDivElement>(null);

  // Floating reactions state and emoji picker
  interface FloatingReaction {
    id: number;
    emoji: string;
    left: number;
    duration: number;
  }
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const triggerFloatingReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = 25 + Math.random() * 55;
    const duration = 2.2 + Math.random() * 0.6;
    setFloatingReactions((prev) => [...prev.slice(-30), { id, emoji, left, duration }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2600);
  };

  const handleSendReaction = (emoji: string) => {
    triggerFloatingReaction(emoji);
    if (livekitRoomRef.current?.localParticipant) {
      try {
        const payload = JSON.stringify({
          type: "reaction",
          emoji,
          timestamp: Date.now(),
        });
        livekitRoomRef.current.localParticipant.publishData(
          new TextEncoder().encode(payload),
          { reliable: false }
        );
      } catch (err) {
        console.warn("Failed to publish reaction to LiveKit:", err);
      }
    }
  };

  // Video & audio player state
  const [isMuted, setIsMuted] = useState(true); // Default to muted for guaranteed autoplay without browser blocking
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [soundTested, setSoundTested] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"chat" | "qa" | "polls">("chat");
  const [copiedLink, setCopiedLink] = useState(false);
  const livekitRoomRef = useRef<Room | null>(null);
  const [hasLiveKitTracks, setHasLiveKitTracks] = useState(false);

  // Separate tracks for camera and screen — composed via CSS, not canvas
  const [cameraTrack, setCameraTrack] = useState<RemoteTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<RemoteTrack | null>(null);
  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

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
    presenterHeadline?: string;
    brandColor: string;
    activeBanner?: {
      id: string;
      text: string;
      isTicker: boolean;
      position?: "top" | "bottom";
      speed?: "slow" | "normal" | "fast";
    } | null;
    lowerThird: { visible: boolean; name: string; role: string; company: string };
    ticker: { visible: boolean; text: string };
    banner: { visible: boolean; title: string; subtitle: string };
    displayedComment?: { id: string; senderName: string; message?: string; text?: string } | null;
    showCommentsOnStage?: boolean;
    chatOverlaySettings?: {
      size: "normal" | "tall" | "wide";
      fontSize: "small" | "medium" | "large";
    };
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
            audioEl.muted = isMutedRef.current;
            document.body.appendChild(audioEl);
            if (!isMutedRef.current) {
              audioEl.play().catch(() => {});
            }
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

        // Receive overlay state and real-time floating reactions from DataChannel
        room.on(RoomEvent.DataReceived, (data: Uint8Array) => {
          try {
            const msg = JSON.parse(new TextDecoder().decode(data));
            if (msg.type === "overlay") {
              setOverlayState(msg as OverlayState);
            } else if (msg.type === "reaction" && msg.emoji) {
              triggerFloatingReaction(msg.emoji);
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

  // Load attendee profile from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`buysoft_attendee_profile_${eventId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.firstName && parsed?.lastName) {
            setAttendeeProfile({
              firstName: parsed.firstName,
              lastName: parsed.lastName,
              fullName: `${parsed.firstName} ${parsed.lastName}`,
            });
            setUserName(`${parsed.firstName} ${parsed.lastName}`);
            return;
          }
        } catch (_) {}
      }

      // Check legacy name or searchParams if already provided
      const legacyName = resolvedSearchParams?.name || localStorage.getItem(`attendee_name_${eventId}`);
      if (legacyName && legacyName !== "Participante Convidado") {
        const parts = legacyName.trim().split(/\s+/);
        if (parts.length >= 2) {
          const fName = parts[0];
          const lName = parts.slice(1).join(" ");
          const prof = { firstName: fName, lastName: lName, fullName: `${fName} ${lName}` };
          setAttendeeProfile(prof);
          setUserName(prof.fullName);
          localStorage.setItem(`buysoft_attendee_profile_${eventId}`, JSON.stringify(prof));
        }
      }
    }
  }, [eventId, resolvedSearchParams?.name]);

  // Auto-scroll chat messages when new messages arrive
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomState?.chatMessages]);

  // Save Attendee Profile (First Name & Last Name)
  const handleSaveAttendeeProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const fName = firstNameInput.trim();
    const lName = lastNameInput.trim();
    if (!fName || !lName) return;

    const prof: AttendeeProfile = {
      firstName: fName,
      lastName: lName,
      fullName: `${fName} ${lName}`,
    };

    setAttendeeProfile(prof);
    setUserName(prof.fullName);
    if (typeof window !== "undefined") {
      localStorage.setItem(`buysoft_attendee_profile_${eventId}`, JSON.stringify(prof));
      localStorage.setItem(`attendee_name_${eventId}`, prof.fullName);
    }
    setShowNameModal(false);
  };

  // Send Chat Message with entered Name and Surname
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!attendeeProfile) {
      setShowNameModal(true);
      return;
    }

    const text = chatInput.trim();
    setChatInput("");
    setIsSendingMessage(true);
    try {
      await sendChatMessage(eventId, attendeeProfile.fullName, "attendee", text);
      await fetchRoom();
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Save attendee name to localStorage (legacy)
  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setUserName(tempName.trim());
    if (typeof window !== "undefined") {
      localStorage.setItem(`attendee_name_${eventId}`, tempName.trim());
    }
    setIsEditingName(false);
  };

  // Fullscreen toggle (Targets strictly the 16:9 video stage element)
  const toggleFullscreen = () => {
    const el = videoStageRef.current || containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Sync fullscreen state with ESC / browser events
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

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
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#00b4fb]" />
          <p className="text-sm font-semibold text-slate-500">Conectando à sala do webinar...</p>
        </div>
      </div>
    );
  }

  const renderChatBody = () => (
    <>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(!roomState?.chatMessages || roomState.chatMessages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <MessageSquare className="h-8 w-8 text-slate-300 stroke-[1.5] mb-2" />
            <p className="text-xs font-medium text-slate-600">Nenhum comentário ainda.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Participe enviando uma mensagem no chat!</p>
          </div>
        ) : (
          roomState.chatMessages.map((msg: any) => {
            const timeStr = (() => {
              try {
                const d = new Date(msg.createdAt || Date.now());
                return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              } catch (_) {
                return "";
              }
            })();

            const colors = getAvatarColors(msg.senderName || "Participante");
            const initials = getInitials(msg.senderName || "Participante");

            return (
              <div key={msg.id} className="flex items-start gap-3 group animate-in fade-in duration-150">
                <div
                  className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border shadow-2xs ${colors.bg} ${colors.text} ${colors.border}`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-800 tracking-tight truncate">
                      {msg.senderName}
                    </span>
                    {timeStr && (
                      <span className="text-[11px] text-slate-400 font-normal shrink-0">
                        {timeStr}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed break-words mt-0.5 whitespace-pre-wrap">
                    {msg.text || msg.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatMessagesEndRef} />
      </div>

      {/* Chat Footer: [ Entrar no chat ] OR [ User Avatar + Message Input ] */}
      {!attendeeProfile ? (
        <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={() => {
              setFirstNameInput("");
              setLastNameInput("");
              setShowNameModal(true);
            }}
            className="w-full py-2.5 px-4 rounded-lg border-2 border-[#00b4fb] text-[#00b4fb] hover:bg-[#e6f7fe]/50 font-bold text-xs tracking-wide transition shadow-xs flex items-center justify-center cursor-pointer"
          >
            Entrar no chat
          </button>
        </div>
      ) : (
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            {/* Profile Pill with Dropdown Chevron */}
            <button
              type="button"
              onClick={() => {
                setFirstNameInput(attendeeProfile.firstName);
                setLastNameInput(attendeeProfile.lastName);
                setShowNameModal(true);
              }}
              title="Clique para alterar seu nome no chat"
              className="flex items-center gap-1 hover:opacity-80 transition group shrink-0 cursor-pointer"
            >
              <div
                className={`h-8 w-8 rounded-full font-bold text-xs flex items-center justify-center border shadow-2xs ${
                  getAvatarColors(attendeeProfile.fullName).bg
                } ${getAvatarColors(attendeeProfile.fullName).text} ${
                  getAvatarColors(attendeeProfile.fullName).border
                }`}
              >
                {getInitials(attendeeProfile.fullName)}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition" />
            </button>

            {/* Message Input Form */}
            <form onSubmit={handleSendChatMessage} className="flex-1 flex items-center relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escrever uma mensagem..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-800 placeholder:text-gray-400 focus:outline-none focus:border-[#00b4fb] focus:ring-1 focus:ring-[#00b4fb] transition shadow-2xs"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSendingMessage}
                className="absolute right-2 text-slate-400 hover:text-[#00b4fb] disabled:opacity-30 transition p-1 cursor-pointer"
                title="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );

  const activeCta = roomState?.liveCtas?.[0] || null;

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col bg-white text-slate-900 font-sans select-none overflow-x-hidden"
    >
      {/* Top Navigation Bar - Clean StreamYard Spectator Style */}
      <header className="h-14 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        {/* Left: Buysoft Events Logo */}
        <div className="flex items-center">
          <Image
            src="/logo.png"
            alt="Buysoft Events"
            width={140}
            height={42}
            className="h-7 sm:h-8 w-auto object-contain"
            priority
          />
        </div>

        {/* Right: Live pill & Share */}
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              AO VIVO
            </span>
          )}
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 hover:text-slate-900 transition shadow-2xs cursor-pointer"
            title="Copiar link da transmissão"
          >
            {copiedLink ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
        {/* Left Column: Stage & Details */}
        <main className={`flex flex-col flex-1 overflow-y-auto bg-white p-3 sm:p-5 lg:p-6 transition-all duration-300 ${isTheater ? "lg:pr-6" : ""}`}>
          <div className="w-full max-w-5xl mx-auto flex flex-col">
            {/* Active CTA Banner (Shows at top of stage if triggered by host) */}
            {activeCta && (
              <div className="mb-3">
                <LiveCtaBanner cta={activeCta} />
              </div>
            )}

            {/* Video / Stage Area (16:9 Aspect Ratio) */}
            <div
              ref={videoStageRef}
              className={`relative w-full bg-black overflow-hidden flex items-center justify-center transition-all ${
                isFullscreen
                  ? "h-full rounded-none border-none shadow-none"
                  : "aspect-video rounded-xl border border-gray-200 shadow-xl"
              }`}
            >
            {isLive ? (
              /* LIVE STAGE SCREEN WITH DUAL TRACKS (CAMERA + SCREEN) & HTML OVERLAYS */
              <div
                className="relative h-full w-full flex items-center justify-center bg-black cursor-pointer select-none overflow-hidden"
                onClick={() => {
                  if (isMuted) handleUnmute();
                  if (showEmojiPicker) setShowEmojiPicker(false);
                }}
              >
                {/* Embedded CSS animations for ticker marquee, reactions, and smooth transitions */}
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
                  @keyframes reactionFloatUp {
                    0% {
                      opacity: 0;
                      transform: translateY(10px) scale(0.6) rotate(0deg);
                    }
                    15% {
                      opacity: 1;
                      transform: translateY(-30px) scale(1.25) rotate(-6deg);
                    }
                    65% {
                      opacity: 0.95;
                      transform: translateY(-180px) scale(1.1) rotate(8deg);
                    }
                    100% {
                      opacity: 0;
                      transform: translateY(-340px) scale(0.85) rotate(-12deg);
                    }
                  }
                `}} />

                {/* --- VIDEO LAYER (CSS COMPOSITION) --- */}
                {(() => {
                  const layoutMode = overlayState?.layoutMode || (screenTrack && cameraTrack ? "split" : "solo");
                  const isScreenActive = Boolean(screenTrack);
                  const isPresenterOnStage = overlayState ? overlayState.isOnStage : true;
                  const presenterName = overlayState?.presenterName || roomState?.speakers?.[0]?.name || "Eliel Nunes (Host)";
                  const isMicOn = overlayState?.isMicOn ?? true;
                  const isCustomBg = Boolean(overlayState?.customBackgroundUrl);
                  const currentBg = BACKGROUND_PRESETS.find((p) => p.id === overlayState?.backgroundPresetId) || BACKGROUND_PRESETS[0];
                  const backgroundStyle: React.CSSProperties = isCustomBg
                    ? {
                        backgroundImage: `url(${overlayState?.customBackgroundUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
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
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                          isCustomBg ? "bg-slate-950" : currentBg.className
                        }`}
                        style={backgroundStyle}
                      >
                        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs pointer-events-none" />
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
                    <div
                      className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${
                        isCustomBg ? "bg-slate-950" : currentBg.className
                      }`}
                      style={backgroundStyle}
                    >
                      {/* Mode 1: SPLIT LAYOUT (Screen Share + Presenter Sidebar) */}
                      {layoutMode === "split" && isScreenActive ? (
                        <div className="relative h-full w-full rounded-2xl overflow-hidden p-3 sm:p-4 flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-300">
                          {/* Main Screen Share Tile (strictly 16:9, no vertical letterbox) */}
                          <div className="relative flex-1 aspect-video max-h-full max-w-full rounded-2xl border border-slate-800/80 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
                            <LiveTrackVideo
                              track={screenTrack}
                              className="h-full w-full object-contain aspect-video pointer-events-none"
                            />
                            <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                              <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                              <span>Apresentação / Tela</span>
                            </div>
                          </div>

                          {/* Presenter Sidebar */}
                          {isPresenterOnStage && (
                            <div className="relative w-full lg:w-64 xl:w-72 aspect-video lg:aspect-auto max-h-full flex flex-col justify-center shrink-0">
                              <div className="relative aspect-video w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
                                <LiveTrackVideo
                                  track={cameraTrack}
                                  showFallback={overlayState?.isCamOn === false}
                                  className="h-full w-full object-cover aspect-video pointer-events-none"
                                  fallback={
                                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                      <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-xl shadow-sky-500/25">
                                        <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                                          {presenterName.charAt(0) || "P"}
                                        </div>
                                      </div>
                                    </div>
                                  }
                                />
                                <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/85 px-3 py-1.5 text-white flex flex-col justify-center backdrop-blur-xs border-l-4 border-[#00b4fb] shadow-xl pointer-events-none">
                                  <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <span>{presenterName}</span>
                                    {isMicOn ? (
                                      <Mic className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <MicOff className="h-3 w-3 text-rose-400" />
                                    )}
                                  </div>
                                  {overlayState?.presenterHeadline && (
                                    <span className="text-[10px] font-medium text-slate-300 mt-0.5">
                                      {overlayState.presenterHeadline}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : layoutMode === "pip" && isScreenActive ? (
                        /* Mode 2: PICTURE-IN-PICTURE (Screen Share Full + Floating Presenter) */
                        <div className="relative h-full w-full rounded-2xl overflow-hidden p-3 flex items-center justify-center transition-all duration-300">
                          <div className="relative aspect-video max-h-full max-w-full rounded-xl border border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
                            <LiveTrackVideo
                              track={screenTrack}
                              className="h-full w-full object-contain aspect-video pointer-events-none"
                            />
                            <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                              <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                              <span>Apresentação</span>
                            </div>

                            {/* Floating Presenter Bubble */}
                            {isPresenterOnStage && (
                              <div className="absolute bottom-4 right-4 z-20 h-36 w-52 rounded-xl border-2 border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden backdrop-blur-md flex items-center justify-center">
                                <LiveTrackVideo
                                  track={cameraTrack}
                                  showFallback={overlayState?.isCamOn === false}
                                  className="h-full w-full object-cover pointer-events-none"
                                  fallback={
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-md flex items-center justify-center pointer-events-none">
                                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-base font-black">
                                        {presenterName.charAt(0) || "P"}
                                      </div>
                                    </div>
                                  }
                                />
                                <div className="absolute bottom-1.5 left-1.5 rounded bg-black/85 px-2 py-1 text-white flex flex-col justify-center border-l-2 border-[#00b4fb] pointer-events-none">
                                  <div className="flex items-center gap-1 text-[9px] font-bold">
                                    <span>{presenterName}</span>
                                    {isMicOn ? (
                                      <Mic className="h-2.5 w-2.5 text-emerald-400" />
                                    ) : (
                                      <MicOff className="h-2.5 w-2.5 text-rose-400" />
                                    )}
                                  </div>
                                  {overlayState?.presenterHeadline && (
                                    <span className="text-[8px] font-medium text-slate-300 truncate max-w-[140px]">
                                      {overlayState.presenterHeadline}
                                    </span>
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
                              <LiveTrackVideo
                                track={screenTrack}
                                className="h-full w-full object-contain pointer-events-none"
                              />
                              <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                                <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                                <span>Apresentação / Tela</span>
                              </div>
                            </div>
                            {isPresenterOnStage && (
                              <div className="relative h-full max-h-[65vh] w-full rounded-2xl border border-slate-800/80 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
                                <LiveTrackVideo
                                  track={cameraTrack}
                                  showFallback={overlayState?.isCamOn === false}
                                  className="h-full w-full object-cover pointer-events-none"
                                  fallback={
                                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-xl pointer-events-none">
                                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black">
                                        {presenterName.charAt(0) || "P"}
                                      </div>
                                    </div>
                                  }
                                />
                                <div className="absolute bottom-3 left-3 rounded-lg bg-black/85 px-3 py-1.5 text-white flex flex-col justify-center backdrop-blur-xs border-l-4 border-[#00b4fb] shadow-xl pointer-events-none">
                                  <div className="flex items-center gap-1.5 text-xs font-bold">
                                    <span>{presenterName}</span>
                                    {isMicOn ? <Mic className="h-3 w-3 text-emerald-400" /> : <MicOff className="h-3 w-3 text-rose-400" />}
                                  </div>
                                  {overlayState?.presenterHeadline && (
                                    <span className="text-[10px] font-medium text-slate-300 mt-0.5">
                                      {overlayState.presenterHeadline}
                                    </span>
                                  )}
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
                              <LiveTrackVideo
                                track={screenTrack}
                                className="h-full w-full object-contain pointer-events-none"
                              />
                              <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10 pointer-events-none">
                                <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                                <span>Apresentação / Tela</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative h-full w-full max-w-4xl rounded-2xl border border-slate-800/80 bg-slate-900/90 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-xs">
                              <LiveTrackVideo
                                track={cameraTrack}
                                showFallback={overlayState?.isCamOn === false}
                                className="h-full w-full object-cover pointer-events-none"
                                fallback={
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
                                }
                              />
                              <div className="absolute bottom-3.5 left-3.5 rounded-lg bg-black/85 px-3 py-1.5 text-white flex flex-col justify-center backdrop-blur-xs border-l-4 border-[#00b4fb] shadow-xl pointer-events-none">
                                <div className="flex items-center gap-1.5 text-xs font-bold">
                                  <span>{presenterName}</span>
                                  {isMicOn ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-rose-400" />}
                                </div>
                                {overlayState?.presenterHeadline && (
                                  <span className="text-[10px] font-medium text-slate-300 mt-0.5">
                                    {overlayState.presenterHeadline}
                                  </span>
                                )}
                              </div>
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

                {/* StreamYard Banners on Spectator Stage */}
                {overlayState?.activeBanner && !overlayState.activeBanner.isTicker && (
                  <FixedBanner
                    isVisible={true}
                    text={overlayState.activeBanner.text}
                    themeColor={overlayState.brandColor || "#00b4fb"}
                  />
                )}
                {overlayState?.activeBanner && overlayState.activeBanner.isTicker && (
                  <TickerTape
                    isVisible={true}
                    text={overlayState.activeBanner.text}
                    themeColor={overlayState.brandColor || "#00b4fb"}
                    position={overlayState.activeBanner.position || "bottom"}
                    speed={overlayState.activeBanner.speed || "normal"}
                  />
                )}
                {!overlayState?.activeBanner && overlayState?.ticker?.visible && overlayState.ticker.text && (
                  <TickerTape
                    isVisible={true}
                    text={overlayState.ticker.text}
                    themeColor={overlayState.brandColor || "#00b4fb"}
                    position="bottom"
                    speed="normal"
                  />
                )}

                {/* Displayed Comment Banner (StreamYard Highlight) */}
                {overlayState?.displayedComment && (
                  <div className="absolute bottom-6 left-6 z-30 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
                    <div className="inline-flex items-center gap-2 bg-[#004bb5] text-white px-3.5 py-1.5 rounded-t-xl font-bold text-xs shadow-md">
                      <div className="h-5 w-5 rounded bg-white text-[#004bb5] flex items-center justify-center text-[10px] font-black">
                        {overlayState.displayedComment.senderName.slice(0, 1).toUpperCase()}
                      </div>
                      <span>{overlayState.displayedComment.senderName}</span>
                    </div>
                    <div className="bg-white text-slate-900 px-5 py-3.5 rounded-b-2xl rounded-tr-2xl shadow-2xl border border-gray-100 text-xs sm:text-sm font-medium leading-relaxed">
                      {overlayState.displayedComment.text || overlayState.displayedComment.message}
                    </div>
                  </div>
                )}

                {/* Chat Overlay Widget on Stage (Audience Spectator View) */}
                {Boolean(overlayState?.showCommentsOnStage) && (
                  <div
                    className={`absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-25 pointer-events-none transition-all duration-300 ${
                      overlayState?.chatOverlaySettings?.size === "tall"
                        ? "w-64 sm:w-72 max-h-64 sm:max-h-80"
                        : overlayState?.chatOverlaySettings?.size === "wide"
                        ? "w-80 sm:w-96 max-h-44 sm:max-h-52"
                        : "w-64 sm:w-72 max-h-44 sm:max-h-52"
                    }`}
                  >
                    <div className="bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl p-3 shadow-2xl flex flex-col justify-end gap-2.5 overflow-hidden">
                      {(() => {
                        const count = overlayState?.chatOverlaySettings?.size === "tall" ? 6 : 4;
                        const messagesToDisplay = (roomState?.chatMessages || []).slice(-count);

                        const fontSize = overlayState?.chatOverlaySettings?.fontSize || "small";
                        const authorSize =
                          fontSize === "large"
                            ? "text-sm"
                            : fontSize === "medium"
                            ? "text-xs"
                            : "text-[11px]";
                        const msgSize =
                          fontSize === "large"
                            ? "text-sm"
                            : fontSize === "medium"
                            ? "text-xs"
                            : "text-[11px]";
                        const timeSize =
                          fontSize === "large"
                            ? "text-[10px]"
                            : fontSize === "medium"
                            ? "text-[9px]"
                            : "text-[8px]";
                        const avatarSize =
                          fontSize === "large"
                            ? "h-7 w-7 text-xs"
                            : fontSize === "medium"
                            ? "h-6 w-6 text-[10px]"
                            : "h-5 w-5 text-[9px]";

                        if (messagesToDisplay.length === 0) return null;

                        return messagesToDisplay.map((c: any) => {
                          const timeStr = (() => {
                            try {
                              const d = new Date(c.createdAt || Date.now());
                              return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                            } catch (_) {
                              return "";
                            }
                          })();

                          const colors = getAvatarColors(c.senderName || "U");
                          const initials = getInitials(c.senderName || "U");

                          return (
                            <div
                              key={c.id}
                              className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
                            >
                              <div
                                className={`rounded-full ${colors.bg} ${colors.text} ${colors.border} border font-bold flex items-center justify-center shrink-0 shadow-xs ${avatarSize}`}
                              >
                                {initials}
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

                {/* Floating Unmute Prompt if audio is muted */}
                {(hasLiveKitTracks || cameraTrack || screenTrack || remoteStream) && isMuted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnmute();
                    }}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-sky-500 to-[#00b4fb] hover:from-sky-400 hover:to-[#00a3e3] px-6 py-3 text-xs font-black text-white shadow-2xl shadow-sky-500/50 backdrop-blur-md transition transform hover:scale-105 active:scale-95 animate-bounce border border-white/20 cursor-pointer"
                  >
                    <Volume2 className="h-4 w-4 fill-current" />
                    <span>Clique para Ativar Som 🔊</span>
                  </button>
                )}

                {/* Floating Reactions Particles (Broadcasted to all participants) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
                  {floatingReactions.map((r) => (
                    <span
                      key={r.id}
                      className="absolute text-3xl sm:text-4xl select-none will-change-transform pointer-events-none"
                      style={{
                        left: `${r.left}%`,
                        bottom: "10%",
                        animation: `reactionFloatUp ${r.duration}s cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                      }}
                    >
                      {r.emoji}
                    </span>
                  ))}
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
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition cursor-pointer"
                title={isMuted ? "Ativar som" : "Silenciar áudio"}
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setIsTheater(!isTheater)}
                className="hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition cursor-pointer"
                title="Modo Teatro"
              >
                <span>{isTheater ? "Normal" : "Teatro"}</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition cursor-pointer"
                title="Tela Cheia"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </button>
            </div>

            {/* Minimized Emoji Reaction Trigger & Expandable Popover (Right) */}
            {isLive && (
              <div className="absolute bottom-3 right-3 z-30 flex items-center">
                <div className="relative">
                  {showEmojiPicker && (
                    <div
                      className="absolute bottom-full right-0 mb-2 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {["👏", "❤️", "🔥", "🎉", "💡", "🚀", "👍", "😂"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSendReaction(emoji)}
                          className="h-9 w-9 flex items-center justify-center rounded-xl text-xl hover:bg-white/15 active:scale-90 transition transform hover:scale-125 cursor-pointer select-none"
                          title={`Reagir com ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all shadow-lg backdrop-blur-md cursor-pointer select-none ${
                      showEmojiPicker
                        ? "bg-[#00b4fb] text-white border border-[#00b4fb] shadow-sky-500/30"
                        : "bg-slate-900/85 text-slate-200 border border-slate-700 hover:bg-slate-800 hover:text-white"
                    }`}
                    title="Reações Rápidas"
                  >
                    <Smile className="h-4 w-4 text-amber-300" />
                    <span className="hidden sm:inline">Reagir</span>
                  </button>
                </div>
              </div>
            )}
          </div>

            {/* Mobile Navigation Tabs (Chat vs Info) */}
            <div className="flex lg:hidden items-center border-b border-gray-200 mt-3 bg-white sticky top-0 z-20">
              <button
                type="button"
                onClick={() => setMobileTab("chat")}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  mobileTab === "chat"
                    ? "border-[#00b4fb] text-[#00b4fb]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat ao Vivo</span>
                {roomState?.chatMessages?.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sky-50 text-[10px] text-[#00b4fb] font-black border border-sky-100">
                    {roomState.chatMessages.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("info")}
                className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  mobileTab === "info"
                    ? "border-[#00b4fb] text-[#00b4fb]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Info className="h-4 w-4" />
                <span>Detalhes</span>
              </button>
            </div>

            {/* Mobile Chat Box (visible only on mobile when mobileTab === 'chat') */}
            <div className={`lg:hidden flex-col h-[400px] border border-gray-200 rounded-xl overflow-hidden mt-3 bg-white shadow-xs ${mobileTab === "chat" ? "flex" : "hidden"}`}>
              {renderChatBody()}
            </div>

            {/* Video Footer Info (StreamYard Spectator Style - always visible on desktop, tabbed on mobile) */}
            <div className={`mt-3 flex-col ${mobileTab === "info" ? "flex" : "hidden lg:flex"}`}>
              {/* Troubleshooting Link (Aligned to Right) */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-xs text-[#00b4fb] hover:underline font-semibold cursor-pointer transition"
                >
                  Está tendo problemas?
                </button>
              </div>

              {/* Event Title */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {roomState?.title || "Buysoft Event"}
              </h1>

              {/* Viewer Count */}
              <p className="text-xs font-semibold text-slate-500 mt-1">
                1 assistindo agora
              </p>

              {/* Event Description */}
              {roomState?.description && (
                <div className="text-sm text-slate-700 mt-3 whitespace-pre-wrap leading-relaxed">
                  {roomState.description}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Column: Chat Sidebar (Desktop Clean White) */}
        {!isTheater && (
          <aside className="hidden lg:flex w-full lg:w-80 xl:w-96 border-l border-gray-200 bg-white flex-col lg:h-[calc(100vh-3.5rem)] shrink-0">
            {renderChatBody()}
          </aside>
        )}
      </div>

      {/* Modal: Entrar no chat (Exact StreamYard Style) */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Entrar no chat</h3>
              <button
                type="button"
                onClick={() => setShowNameModal(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendeeProfile}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={firstNameInput}
                    onChange={(e) => setFirstNameInput(e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#00b4fb] focus:ring-1 focus:ring-[#00b4fb] transition"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={lastNameInput}
                    onChange={(e) => setLastNameInput(e.target.value)}
                    placeholder="Digite seu sobrenome"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#00b4fb] focus:ring-1 focus:ring-[#00b4fb] transition"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowNameModal(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-md transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!firstNameInput.trim() || !lastNameInput.trim()}
                  className="text-xs font-bold bg-[#00b4fb] hover:bg-[#009ce0] disabled:opacity-50 text-white px-4 py-2 rounded-md transition shadow-xs cursor-pointer"
                >
                  Entrar no chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Está tendo problemas? */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#00b4fb]" />
                <h3 className="text-base font-bold text-slate-900">Está tendo problemas?</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-md cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-lg bg-[#e6f7fe]/70 border border-[#bae6fd]">
                <p className="font-bold text-slate-800 mb-1">🔊 Sem som no vídeo?</p>
                <p>
                  Por padrão, navegadores bloqueiam o áudio automático.
                  Clique no botão <strong>&quot;Clique para Ativar Som 🔊&quot;</strong> exibido na tela da transmissão.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 mb-1">🔄 Imagem travando ou atrasada?</p>
                <p>
                  Atualize a página pressionando <strong>F5</strong> (ou <strong>Ctrl+R</strong>) para restabelecer a conexão de baixa latência em tempo real.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-800 mb-1">🌐 Conexão e Navegador</p>
                <p>
                  Para melhor estabilidade, recomendamos utilizar <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> atualizados e conexão cabeada ou Wi-Fi estável.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-xs font-bold bg-[#00b4fb] hover:bg-[#009ce0] text-white px-4 py-2 rounded-md transition cursor-pointer shadow-xs"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
