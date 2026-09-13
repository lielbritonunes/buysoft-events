"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, X, Film, RotateCcw } from "lucide-react";

interface Props {
  videoUrl: string | null;
  onClose: () => void;
  onStreamReady?: (stream: MediaStream) => void;
}

export default function MediaAssetPlayer({ videoUrl, onClose, onStreamReady }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});

      // Extract canvas stream if available
      try {
        const stream = (videoRef.current as any).captureStream
          ? (videoRef.current as any).captureStream()
          : (videoRef.current as any).mozCaptureStream
          ? (videoRef.current as any).mozCaptureStream()
          : null;

        if (stream && onStreamReady) {
          onStreamReady(stream);
        }
      } catch (e) {
        console.warn("Could not capture video stream:", e);
      }
    }
  }, [videoUrl, onStreamReady]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  if (!videoUrl) return null;

  return (
    <div className="relative h-full w-full flex items-center justify-center bg-black overflow-hidden group">
      <video
        ref={videoRef}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="h-full w-full object-contain"
      />

      {/* Media Overlay Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-1.5 backdrop-blur-md border border-slate-700">
        <Film className="h-3.5 w-3.5 text-[#00b4fb]" />
        <span className="text-xs font-bold text-white">Vídeo do Estúdio</span>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-4 inset-x-6 z-20 flex flex-col gap-2 rounded-2xl bg-slate-950/80 p-3 backdrop-blur-md border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#00b4fb] h-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition"
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
              title="Reiniciar"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
              title={isMuted ? "Ativar som" : "Silenciar"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-3.5 w-3.5" />
            <span>Remover Vídeo do Palco</span>
          </button>
        </div>
      </div>
    </div>
  );
}
