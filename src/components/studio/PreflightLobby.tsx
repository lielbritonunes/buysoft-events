"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, ShieldCheck, Radio, Sparkles } from "lucide-react";

interface Props {
  userName: string;
  userRole: "host" | "speaker";
  onJoin: (stream: MediaStream | null) => void;
  onRoleChange?: (role: "host" | "speaker") => void;
}

export default function PreflightLobby({ userName, userRole, onJoin, onRoleChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [devices, setDevices] = useState<{ video: MediaDeviceInfo[]; audio: MediaDeviceInfo[] }>({
    video: [],
    audio: [],
  });
  const joinedRef = useRef(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationId: number;

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

        // Enumerate devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices({
          video: allDevices.filter((d) => d.kind === "videoinput"),
          audio: allDevices.filter((d) => d.kind === "audioinput"),
        });

        // Audio meter using Web Audio API
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(activeStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkLevel = () => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((average / 128) * 100)));
          }
          animationId = requestAnimationFrame(checkLevel);
        };
        checkLevel();
      } catch (err) {
        console.warn("Media devices permission not granted or available:", err);
      }
    }

    initMedia();

    return () => {
      if (activeStream && !joinedRef.current) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
      cancelAnimationFrame(animationId);
    };
  }, []);

  const toggleCam = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 sm:p-6 text-white font-sans">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b4fb] text-white">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-none">
                Lobby de Teste Pré-Transmissão
              </h2>
              <span className="text-[11px] text-slate-400">Buysoft Events Studio</span>
            </div>
          </div>

          {onRoleChange ? (
            <div className="flex items-center rounded-xl bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => onRoleChange("host")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  userRole === "host"
                    ? "bg-[#00b4fb] text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Host
              </button>
              <button
                type="button"
                onClick={() => onRoleChange("speaker")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  userRole === "speaker"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Palestrante
              </button>
            </div>
          ) : (
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-[#00b4fb] uppercase">
              {userRole === "host" ? "Organizador (Host)" : "Palestrante (Speaker)"}
            </span>
          )}
        </div>

        {/* Video Preview Box */}
        <div className="relative aspect-video w-full rounded-2xl bg-slate-900 overflow-hidden border border-slate-800 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover -scale-x-100 ${!isCameraOn && "hidden"}`}
          />

          {!isCameraOn && (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-300">
                {userName ? userName.substring(0, 2).toUpperCase() : "EU"}
              </div>
              <p className="text-xs">Câmera desativada</p>
            </div>
          )}

          {/* Bottom Floating Device Controls */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2.5">
            <button
              onClick={toggleCam}
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isCameraOn ? "bg-slate-800/80 hover:bg-slate-700 text-white" : "bg-rose-600 text-white"
              }`}
              title="Ligar/Desligar Câmera"
            >
              {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </button>

            <button
              onClick={toggleMic}
              type="button"
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                isMicOn ? "bg-slate-800/80 hover:bg-slate-700 text-white" : "bg-rose-600 text-white"
              }`}
              title="Mutar/Desmutar Microfone"
            >
              {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Live Audio Level Meter (Barra oscilante verde) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-slate-300">
              <Volume2 className="h-4 w-4 text-[#00b4fb]" />
              <span>Teste do Microfone</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {audioLevel > 5 ? "Áudio detectado ✓" : "Fale para testar"}
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#00b4fb] transition-all duration-75 rounded-full"
              style={{ width: `${Math.max(4, audioLevel)}%` }}
            />
          </div>
        </div>

        {/* Participant Name & Join Button */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Entrando como: <strong className="text-white">{userName}</strong></span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Dispositivos prontos
            </span>
          </div>

          <button
            onClick={() => {
              joinedRef.current = true;
              onJoin(stream);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00b4fb] py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 hover:bg-[#009ce0] transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Entrar no Camarim (Backstage)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
