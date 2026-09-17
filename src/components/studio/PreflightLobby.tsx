"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  User,
  Info,
  X,
  HelpCircle,
  Radio,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { springs } from "../ui/motion-primitives";

interface Props {
  userName: string;
  userRole: "host" | "speaker";
  onJoin: (stream: MediaStream | null, displayName?: string, headline?: string) => void;
  onRoleChange?: (role: "host" | "speaker") => void;
}

export default function PreflightLobby({
  userName,
  userRole,
  onJoin,
  onRoleChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [hasMicDevice, setHasMicDevice] = useState(true);
  const [showTip, setShowTip] = useState(true);
  const [displayName, setDisplayName] = useState(userName);
  const [headline, setHeadline] = useState("");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initMedia() {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }

        const audioTracks = activeStream.getAudioTracks();
        setHasMicDevice(audioTracks.length > 0);
      } catch (err) {
        console.warn("Dispositivos de mídia não disponíveis ou permissão negada:", err);
        setHasMicDevice(false);
        setIsCameraOn(false);
        setIsMicOn(false);
      }
    }

    initMedia();

    return () => {
      if (activeStream && !joinedRef.current) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleCam = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
      }
    }
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
      }
    }
    setIsMicOn(!isMicOn);
  };

  const handleEnter = () => {
    joinedRef.current = true;
    onJoin(stream, displayName, headline);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/20 to-slate-50 flex flex-col justify-between font-sans selection:bg-[#00b4fb] selection:text-white">
      {/* Top Banner and Navigation */}
      <div>
        {/* Help Tip Banner */}
        <AnimatePresence>
          {showTip && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#00b4fb]/10 border-b border-[#00b4fb]/20 px-4 py-2 text-xs text-[#0084be] flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
                <Info className="h-4 w-4 shrink-0" />
                <span>
                  <strong>Dica Pro:</strong> Para melhor experiência no estúdio, recomendamos o uso de fones de ouvido para evitar microfonia e eco.
                </span>
              </div>
              <button
                onClick={() => setShowTip(false)}
                className="text-slate-400 hover:text-slate-600 p-1 transition cursor-pointer"
                title="Fechar dica"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Brand Bar */}
        <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Buysoft Events"
              width={300}
              height={42}
              className="h-8 sm:h-9 w-auto object-contain"
              priority
            />
          </div>

          {/* Role Switcher (Buysoft Palette — Purple Ban compliant) */}
          {onRoleChange && (
            <div className="flex items-center rounded-2xl bg-white/80 p-1 border border-slate-200/80 shadow-2xs backdrop-blur-xs">
              <button
                type="button"
                onClick={() => onRoleChange("host")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  userRole === "host"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Anfitrião (Host)
              </button>
              <button
                type="button"
                onClick={() => onRoleChange("speaker")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  userRole === "speaker"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Convidado / Orador
              </button>
            </div>
          )}
        </header>
      </div>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          {/* Left Column: Video Preview Frame */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="relative w-full max-w-[520px] aspect-video rounded-3xl bg-slate-900 overflow-hidden shadow-[0_25px_60px_rgba(15,23,42,0.25)] border border-white/20 flex items-center justify-center ring-1 ring-black/10">
              {/* Video Stream */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover -scale-x-100 ${!isCameraOn ? "hidden" : "block"}`}
              />

              {/* Avatar when camera off */}
              {!isCameraOn && (
                <div className="flex flex-col items-center justify-center gap-2 text-slate-300">
                  <div className="h-22 w-22 rounded-full bg-slate-800/90 flex items-center justify-center text-3xl font-bold text-white shadow-inner ring-4 ring-white/10">
                    {displayName ? displayName.charAt(0).toUpperCase() : "E"}
                  </div>
                  <span className="text-xs font-semibold text-slate-400">Câmera desativada</span>
                </div>
              )}

              {/* Audio visualizer bar (top left) */}
              <div className="absolute top-4 left-4 flex items-center gap-1 z-20 rounded-full bg-black/50 backdrop-blur-md px-2.5 py-1 border border-white/10 text-white text-[10px] font-bold">
                {isMicOn ? (
                  <>
                    <div className="flex items-center gap-0.5 h-3">
                      <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="w-1 h-3 bg-emerald-400 rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
                    </div>
                    <span>Áudio Ativo</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-rose-300">Mudo</span>
                  </>
                )}
              </div>

              {/* In-Canvas Bottom Controls (Liquid Glass Pill) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 p-2 shadow-2xl">
                {/* Mic Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={toggleMic}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition cursor-pointer ${
                    isMicOn
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                  }`}
                  title={isMicOn ? "Silenciar microfone" : "Ativar microfone"}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </motion.button>

                {/* Cam Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={toggleCam}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition cursor-pointer ${
                    isCameraOn
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-rose-500 text-white shadow-md shadow-rose-500/30"
                  }`}
                  title={isCameraOn ? "Desativar câmera" : "Ativar câmera"}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </motion.button>

                {/* Settings Gear */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                  title="Configurações de câmera e áudio"
                >
                  <Settings className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right Column: Setup Form */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 sm:p-7 shadow-xs backdrop-blur-xs space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  Vamos configurar seu estúdio
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Entrar no estúdio não iniciará automaticamente a transmissão ao vivo.
                </p>
              </div>

              {/* Warning Alert if Mic Not Found */}
              {(!hasMicDevice || !isMicOn) && (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-800 leading-relaxed backdrop-blur-xs flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Microfone desativado ou não detectado. Você poderá ativá-lo depois no palco.</span>
                </div>
              )}

              {/* Field: Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nome a ser exibido no palco
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="glass-input pr-24"
                  />
                  <span className="absolute right-2.5 rounded-lg bg-[#00b4fb]/10 px-2 py-0.5 text-[10px] font-bold text-[#0084be]">
                    {userRole === "host" ? "Anfitrião" : "Orador"}
                  </span>
                </div>
              </div>

              {/* Field: Headline */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                  <span>Cargo / Especialidade (Lower Third)</span>
                  <span title="Aparecerá abaixo do seu nome na transmissão">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </span>
                </div>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Ex: Diretor de Inovação & Tecnologia"
                  className="glass-input"
                />
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={springs.snappy}
                  type="button"
                  onClick={handleEnter}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00b4fb] to-sky-600 hover:from-[#009ce0] hover:to-sky-700 text-white py-3 px-4 text-sm font-bold shadow-[0_4px_16px_rgba(0,180,251,0.35)] transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Radio className="h-4 w-4 animate-pulse" />
                  <span>
                    {isMicOn && isCameraOn
                      ? "Entrar no Estúdio ao Vivo"
                      : "Entrar sem Microfone/Câmera"}
                  </span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Buysoft Events &bull; Estúdio Broadcast WebRTC Ultrabaixa Latência
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={springs.snappy}
              className="relative w-full max-w-md rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl space-y-4 z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Configurações de Dispositivos</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div>
                  <label className="font-semibold block mb-1">Câmera:</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs">
                    <option>Câmera Integrada / Padrão</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Microfone:</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs">
                    <option>Microfone Padrão do Sistema</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Resolução de Transmissão:</label>
                  <select className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs">
                    <option>1080p (Full HD - 60fps)</option>
                    <option>720p (HD)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-xl bg-[#00b4fb] text-white px-4 py-2 text-xs font-bold hover:bg-[#009ce0] transition shadow-xs cursor-pointer"
                >
                  Salvar e Fechar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
