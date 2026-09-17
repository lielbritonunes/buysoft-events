"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, X, Film, RotateCcw } from "lucide-react";
import {
  getYouTubeVideoId,
  getVimeoVideoId,
  getYouTubeEmbedUrl,
  getVimeoEmbedUrl,
} from "@/lib/videoUrlHelper";

interface Props {
  videoUrl: string | null;
  title?: string;
  loop?: boolean;
  onClose: () => void;
  onEnded?: () => void;
  onStreamReady?: (stream: MediaStream) => void;
}

export default function MediaAssetPlayer({
  videoUrl,
  title,
  loop = false,
  onClose,
  onEnded,
  onStreamReady,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const ytId = getYouTubeVideoId(videoUrl);
  const vimeoId = getVimeoVideoId(videoUrl);

  // Standard HTML5 video playback
  useEffect(() => {
    if (ytId || vimeoId) return;

    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
      videoRef.current.loop = loop;
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
  }, [videoUrl, loop, onStreamReady, ytId, vimeoId]);

  // Keep loop attribute in sync when toggled while playing
  useEffect(() => {
    if (videoRef.current && !ytId && !vimeoId) {
      videoRef.current.loop = loop;
    }
  }, [loop, ytId, vimeoId]);

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

  // 1. YouTube Player
  if (ytId) {
    const embedSrc = getYouTubeEmbedUrl(ytId, {
      autoplay: true,
      mute: isMuted,
      loop: loop,
      controls: true,
    });

    return (
      <div className="relative h-full w-full flex items-center justify-center bg-black overflow-hidden group">
        <iframe
          key={embedSrc}
          src={embedSrc}
          title={title || "Vídeo do Estúdio"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />

        {/* Media Overlay Badge: Top Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-1.5 backdrop-blur-md border border-slate-700 pointer-events-none shadow-lg">
          <Film className="h-3.5 w-3.5 text-[#00b4fb]" />
          <span className="text-xs font-bold text-white max-w-[200px] truncate">
            {title || "Vídeo YouTube"}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-600/90 text-white font-bold uppercase tracking-wider">
            YouTube
          </span>
          {loop && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00b4fb]/20 text-[#38bdf8] font-semibold border border-[#00b4fb]/30">
              Loop
            </span>
          )}
        </div>

        {/* Quick Close Button: Top Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900/90 hover:bg-rose-600 px-3 py-1.5 rounded-xl backdrop-blur-md border border-slate-700 hover:border-rose-500 transition shadow-lg cursor-pointer group-hover:opacity-100"
          title="Remover vídeo do palco"
        >
          <X className="h-3.5 w-3.5" />
          <span>Remover do Palco</span>
        </button>
      </div>
    );
  }

  // 2. Vimeo Player
  if (vimeoId) {
    const embedSrc = getVimeoEmbedUrl(vimeoId, {
      autoplay: true,
      mute: isMuted,
      loop: loop,
      controls: true,
    });

    return (
      <div className="relative h-full w-full flex items-center justify-center bg-black overflow-hidden group">
        <iframe
          key={embedSrc}
          src={embedSrc}
          title={title || "Vídeo Vimeo"}
          allow="accelerometer; autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />

        {/* Media Overlay Badge: Top Left */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-1.5 backdrop-blur-md border border-slate-700 pointer-events-none shadow-lg">
          <Film className="h-3.5 w-3.5 text-[#00b4fb]" />
          <span className="text-xs font-bold text-white max-w-[200px] truncate">
            {title || "Vídeo Vimeo"}
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-600/90 text-white font-bold uppercase tracking-wider">
            Vimeo
          </span>
          {loop && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00b4fb]/20 text-[#38bdf8] font-semibold border border-[#00b4fb]/30">
              Loop
            </span>
          )}
        </div>

        {/* Quick Close Button: Top Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900/90 hover:bg-rose-600 px-3 py-1.5 rounded-xl backdrop-blur-md border border-slate-700 hover:border-rose-500 transition shadow-lg cursor-pointer"
          title="Remover vídeo do palco"
        >
          <X className="h-3.5 w-3.5" />
          <span>Remover do Palco</span>
        </button>
      </div>
    );
  }

  // 3. Direct HTML5 Video File Player
  return (
    <div className="relative h-full w-full flex items-center justify-center bg-black overflow-hidden group">
      <video
        ref={videoRef}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          if (!loop && onEnded) {
            onEnded();
          }
        }}
        className="h-full w-full object-contain"
      />

      {/* Media Overlay Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-1.5 backdrop-blur-md border border-slate-700">
        <Film className="h-3.5 w-3.5 text-[#00b4fb]" />
        <span className="text-xs font-bold text-white max-w-[200px] truncate">
          {title || "Vídeo do Estúdio"}
        </span>
        {loop && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#00b4fb]/20 text-[#38bdf8] font-semibold border border-[#00b4fb]/30">
            Loop
          </span>
        )}
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
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition cursor-pointer"
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleRestart}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title="Reiniciar"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title={isMuted ? "Ativar som" : "Silenciar"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Remover Vídeo do Palco</span>
          </button>
        </div>
      </div>
    </div>
  );
}
