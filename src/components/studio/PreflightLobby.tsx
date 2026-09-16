"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
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
} from "lucide-react";

interface Props {
  userName: string;
  userRole: "host" | "speaker";
  onJoin: (stream: MediaStream | null) => void;
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
    onJoin(stream);
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-800 font-sans flex flex-col justify-between select-none">
      {/* Top Header with Brand */}
      <div className="w-full">
        {/* StreamYard style Tip Banner */}
        {showTip && (
          <div className="w-full bg-[#f0f7ff] border-b border-[#d0e5ff] px-4 py-2.5 flex items-center justify-between text-xs text-[#0055ff]">
            <div className="flex items-center gap-2 max-w-5xl mx-auto flex-1 px-4">
              <Info className="h-4 w-4 shrink-0 text-[#0055ff]" />
              <span>
                <strong>Dica:</strong> Use o botão solo para colocar um convidado em tela cheia durante a transmissão.
              </span>
            </div>
            <button
              onClick={() => setShowTip(false)}
              className="text-slate-400 hover:text-slate-600 p-1 transition"
              title="Fechar dica"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Brand Bar */}
        <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Buysoft Events"
              width={160}
              height={48}
              className="h-8 sm:h-9 w-auto object-contain"
              priority
            />
          </div>

          {/* Optional Role Switcher */}
          {onRoleChange && (
            <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => onRoleChange("host")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  userRole === "host"
                    ? "bg-[#0055ff] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Anfitrião (Host)
              </button>
              <button
                type="button"
                onClick={() => onRoleChange("speaker")}
                className={`rounded-md px-3 py-1 text-xs font-bold transition ${
                  userRole === "speaker"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Convidado
              </button>
            </div>
          )}
        </header>
      </div>

      {/* Main Container: 2-Column StreamYard Style */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          {/* Left Column: Video Preview Box (StreamYard style) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="relative w-full max-w-[500px] aspect-video rounded-xl bg-[#3b4252] overflow-hidden shadow-lg border border-slate-200 flex items-center justify-center">
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
                  <div className="h-20 w-20 rounded-full bg-slate-700/80 flex items-center justify-center text-2xl font-bold text-white shadow-inner">
                    {displayName ? displayName.charAt(0).toUpperCase() : "E"}
                  </div>
                </div>
              )}

              {/* In-Canvas Bottom Controls (StreamYard layout) */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                {/* Mic Toggle Button */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition shadow-md ${
                    isMicOn
                      ? "bg-[#2e3440]/90 hover:bg-[#2e3440] text-white"
                      : "bg-[#fce8e6] hover:bg-[#fad2cf] text-[#d93025]"
                  }`}
                  title={isMicOn ? "Silenciar microfone" : "Ativar microfone"}
                >
                  {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>

                {/* Cam Toggle Button */}
                <button
                  type="button"
                  onClick={toggleCam}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition shadow-md ${
                    isCameraOn
                      ? "bg-[#2e3440]/90 hover:bg-[#2e3440] text-white"
                      : "bg-[#fce8e6] hover:bg-[#fad2cf] text-[#d93025]"
                  }`}
                  title={isCameraOn ? "Desativar câmera" : "Ativar câmera"}
                >
                  {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </button>

                {/* Settings Gear Button */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2e3440]/90 hover:bg-[#2e3440] text-white transition shadow-md"
                  title="Configurações de câmera e áudio"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>

              {/* Bottom Right Avatar Icon (StreamYard style) */}
              <button
                type="button"
                className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#2e3440]/80 hover:bg-[#2e3440] text-white transition shadow-md"
                title="Editar avatar"
              >
                <User className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Setup Form (StreamYard style) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                Vamos configurar seu estúdio
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Entrar no estúdio não iniciará automaticamente a transmissão.
              </p>
            </div>

            {/* Warning Alert if Mic Not Found or Off */}
            {(!hasMicDevice || !isMicOn) && (
              <div className="rounded-lg border border-[#f8b4b4] bg-[#fdf2f2] p-3 text-xs text-[#9b1c1c] leading-relaxed">
                Não foi possível encontrar um microfone. Será que não há um conectado?
              </div>
            )}

            {/* Field: Display Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Nome a ser exibido
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-20 text-sm font-medium text-slate-900 focus:border-[#0055ff] focus:ring-1 focus:ring-[#0055ff] focus:outline-hidden transition"
                />
                <span className="absolute right-2.5 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0055ff] border border-blue-200">
                  {userRole === "host" ? "Anfitrião" : "Convidado"}
                </span>
              </div>
            </div>

            {/* Field: Headline (optional) */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                <span>Manchete (opcional)</span>
                <span title="Aparecerá abaixo do seu nome na transmissão">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                </span>
              </div>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="por exemplo, Founder of Creativity Inc."
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0055ff] focus:ring-1 focus:ring-[#0055ff] focus:outline-hidden transition"
              />
            </div>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleEnter}
                className="w-full rounded-lg bg-[#0055ff] hover:bg-[#0047d4] active:scale-[0.99] text-white py-3 px-4 text-sm font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {isMicOn && isCameraOn
                    ? "Entrar no estúdio"
                    : "Entrar sem microfone/câmera"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Help note */}
      <footer className="py-4 text-center text-xs text-slate-400">
        Buysoft Events • Estúdio de Transmissão Profissional
      </footer>

      {/* Basic Settings Modal if Gear Clicked */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Configurações de Dispositivos</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <label className="font-semibold block mb-1">Câmera:</label>
                <select className="w-full rounded-lg border border-slate-300 p-2 text-xs">
                  <option>Câmera Padrão do Sistema</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Microfone:</label>
                <select className="w-full rounded-lg border border-slate-300 p-2 text-xs">
                  <option>Microfone Padrão do Sistema</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Resolução de Transmissão:</label>
                <select className="w-full rounded-lg border border-slate-300 p-2 text-xs">
                  <option>1080p (Full HD)</option>
                  <option>720p (HD)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="rounded-lg bg-[#0055ff] text-white px-4 py-2 text-xs font-bold hover:bg-[#0047d4]"
              >
                Salvar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
