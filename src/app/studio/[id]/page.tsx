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
  PhoneOff
} from "lucide-react";
import PreflightLobby from "@/components/studio/PreflightLobby";
import LiveEngagementSidebar from "@/components/engagement/LiveEngagementSidebar";
import LiveCtaBanner from "@/components/engagement/LiveCtaBanner";
import { getLiveRoomState, updateEvent, setLiveCta } from "@/lib/dbActions";
import { HostBroadcaster } from "@/lib/webrtcStreamManager";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ role?: string }>;
}

export default function StudioPage({ params, searchParams }: Props) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  const initialRole: "host" | "speaker" = resolvedSearchParams?.role === "speaker" ? "speaker" : "host";
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
  const [isOnStage, setIsOnStage] = useState(true); // in stage vs backstage

  // Video refs & WebRTC Broadcaster
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const broadcasterRef = useRef<HostBroadcaster | null>(null);

  // Initialize WebRTC Host Broadcaster
  useEffect(() => {
    const broadcaster = new HostBroadcaster(eventId);
    broadcaster.start();
    broadcasterRef.current = broadcaster;
    return () => {
      broadcaster.stop();
    };
  }, [eventId]);

  // Sync streams and live status with WebRTC broadcaster
  useEffect(() => {
    if (broadcasterRef.current) {
      broadcasterRef.current.setStreams(
        isOnStage ? localStream : null,
        screenStream,
        roomState?.status === "live"
      );
    }
  }, [localStream, screenStream, roomState?.status, isOnStage]);

  // Host CTA Launcher modal
  const [showCtaModal, setShowCtaModal] = useState(false);
  const [ctaTitle, setCtaTitle] = useState("Agende uma Demonstração com nossos Especialistas");
  const [ctaBtnText, setCtaBtnText] = useState("Falar com Consultor");
  const [ctaBtnUrl, setCtaBtnUrl] = useState("https://buysoft.com.br");

  // Load and poll live state every 2 seconds
  const fetchState = async () => {
    try {
      const state = await getLiveRoomState(eventId);
      setRoomState(state);
    } catch (err) {
      console.error("Error fetching live room state:", err);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2500);
    return () => clearInterval(interval);
  }, [eventId]);

  // Bind local stream to video element once joined
  useEffect(() => {
    if (hasJoinedLobby && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [hasJoinedLobby, localStream]);

  // Bind screen share stream
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Toggle Camera
  const handleToggleCam = () => {
    if (localStream) {
      const vt = localStream.getVideoTracks()[0];
      if (vt) {
        vt.enabled = !isCamOn;
        setIsCamOn(!isCamOn);
      }
    }
  };

  // Toggle Mic
  const handleToggleMic = () => {
    if (localStream) {
      const at = localStream.getAudioTracks()[0];
      if (at) {
        at.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
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
    } else {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(sStream);
        setIsScreenSharing(true);

        sStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  // Toggle Go Live (Host only)
  const handleToggleGoLive = async () => {
    const nextStatus = roomState?.status === "live" ? "published" : "live";
    await updateEvent(eventId, { status: nextStatus });
    fetchState();
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

  const isWebinarLive = roomState?.status === "live";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-white font-sans">
      {/* Main Studio Area (Left) */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Top Control Bar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/70 px-4 sm:px-6 backdrop-blur-md">
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

            {/* Live Badge */}
            <div className="ml-3 hidden sm:flex items-center gap-1.5">
              {isWebinarLive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  NO AR (AO VIVO)
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                  EM BASTIDORES (BACKSTAGE)
                </span>
              )}
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
              className={`flex items-center gap-2 rounded-xl px-4 py-1.5 text-xs font-extrabold shadow-lg transition transform active:scale-95 ${
                isWebinarLive
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse"
                  : "bg-gradient-to-r from-rose-600 via-rose-500 to-[#00b4fb] hover:from-rose-500 hover:to-[#009ce0] text-white shadow-rose-500/25"
              }`}
            >
              {isWebinarLive ? (
                <>
                  <Square className="h-3 w-3 fill-current" />
                  <span>Encerrar Transmissão</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span>Entrar ao Vivo</span>
                </>
              )}
            </button>

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
        <div className="relative flex-1 p-4 sm:p-6 overflow-hidden flex flex-col justify-center items-center">
          {/* Active Live CTA Banner (if launched) */}
          {roomState?.liveCtas && roomState.liveCtas.length > 0 && (
            <div className="absolute top-4 inset-x-6 z-30 max-w-2xl mx-auto">
              <LiveCtaBanner cta={roomState.liveCtas[0]} />
            </div>
          )}

          {/* Notice Banner when in Backstage (Bastidores) */}
          {!isWebinarLive && (
            <div className="w-full max-w-3xl mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 backdrop-blur-md z-20">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Radio className="h-4 w-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-200">Você está no Backstage (Bastidores)</span>
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-300 uppercase">
                      Privado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    A plateia na sala de espera ainda não vê nem ouve o estúdio. Clique ao lado quando estiver pronto para transmitir.
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleGoLive}
                className="shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 transition transform active:scale-95"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Iniciar Transmissão Ao Vivo</span>
              </button>
            </div>
          )}

          {/* Video Layout Grid */}
          <div className="w-full h-full max-h-[70vh] flex items-center justify-center gap-4">
            {/* Screen Share Tile (if sharing) */}
            {isScreenSharing && (
              <div className="relative h-full flex-1 rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
                <span className="absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs flex items-center gap-1.5 z-20">
                  <Monitor className="h-3 w-3 text-[#00b4fb]" /> Tela Compartilhada
                </span>
              </div>
            )}

            {/* Local Presenter Video Tile */}
            <div
              className={`relative rounded-2xl border overflow-hidden shadow-2xl flex items-center justify-center bg-slate-900 transition-all ${
                isScreenSharing ? "w-64 h-48 self-end" : "w-full max-w-3xl aspect-video"
              } ${isOnStage ? "border-slate-800 ring-2 ring-emerald-500/20" : "border-amber-500/60 ring-2 ring-amber-500/30"}`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover -scale-x-100 ${!isCamOn && "hidden"}`}
              />

              {!isCamOn && (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-white">
                    {userRole === "host" ? "EN" : "SP"}
                  </div>
                  <p className="text-xs">Câmera desativada</p>
                </div>
              )}

              {/* If off-stage (In Camarim), show prominent overlay to put on stage */}
              {!isOnStage && (
                <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center z-10 animate-in fade-in">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Você está no Camarim (Bastidores)</p>
                    <p className="text-xs text-slate-300 max-w-sm mt-0.5">
                      Seu vídeo e áudio estão ocultos da plateia. Clique abaixo para entrar no palco ao vivo.
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

              {/* Badges on Tile */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                <span className="rounded-md bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                  {userRole === "host" ? "Eliel Nunes (Host)" : "Palestrante Convidado"}
                </span>

                {isOnStage ? (
                  <span className="rounded-md bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white flex items-center gap-1 shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    No Palco (Ao Vivo)
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    No Camarim
                  </span>
                )}
              </div>

              {/* Quick Mover to Backstage Button if on Stage */}
              {isOnStage && (
                <div className="absolute top-3 right-3 z-20">
                  <button
                    onClick={() => setIsOnStage(false)}
                    className="rounded-lg bg-black/70 hover:bg-black/90 px-2.5 py-1 text-[10px] font-bold text-amber-300 border border-amber-500/30 backdrop-blur-xs transition"
                    title="Mover de volta para os bastidores"
                  >
                    Mover para Camarim
                  </button>
                </div>
              )}

              {/* Audio Status */}
              <div className="absolute bottom-3 right-3 z-20">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-xs ${
                    isMicOn ? "bg-black/60 text-white" : "bg-rose-600 text-white"
                  }`}
                >
                  {isMicOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Backstage Strip */}
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 backdrop-blur-xs w-full max-w-3xl">
            <div className="flex items-center gap-1.5 px-2">
              <Layers className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bastidores / Camarim
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 rounded-xl bg-slate-800 p-1.5 pr-3 border border-slate-700">
                <div className="h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                  {userRole === "host" ? "EN" : "SP"}
                </div>
                <div className="text-[11px]">
                  <p className="font-bold text-slate-200">Você ({userRole === "host" ? "Host" : "Speaker"})</p>
                  <p className="text-[9px] text-slate-400">
                    {isOnStage ? "🟢 Transmitindo no Palco" : "🟠 Privado no Camarim"}
                  </p>
                </div>
                <button
                  onClick={() => setIsOnStage(!isOnStage)}
                  className={`ml-2 rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition shadow-xs ${
                    isOnStage
                      ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                      : "bg-[#00b4fb] text-white hover:bg-[#009ce0] shadow-sky-500/20"
                  }`}
                >
                  {isOnStage ? "Mover para Camarim" : "Colocar no Palco (Ao Vivo)"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <footer className="flex h-16 items-center justify-center gap-3 border-t border-slate-800 bg-slate-900/80 px-6">
          <button
            onClick={handleToggleCam}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              isCamOn ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
            }`}
          >
            {isCamOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            <span>{isCamOn ? "Câmera Ativa" : "Câmera Desligada"}</span>
          </button>

          <button
            onClick={handleToggleMic}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              isMicOn ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
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
            <span>{isOnStage ? "Mover para Bastidores" : "Colocar no Palco (Ao Vivo)"}</span>
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
