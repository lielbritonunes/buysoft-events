"use client";

import React from "react";
import { Mic, MicOff, Monitor, User } from "lucide-react";

export type LayoutMode = "solo" | "grid" | "split" | "pip";

export interface BackgroundPreset {
  id: string;
  name: string;
  className: string;
  style?: React.CSSProperties;
}

function VideoStreamTile({
  videoRef,
  stream,
  className,
  muted = false,
}: {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  stream?: MediaStream | null;
  className?: string;
  muted?: boolean;
}) {
  const localRef = React.useRef<HTMLVideoElement>(null);
  const activeRef = videoRef || localRef;

  React.useEffect(() => {
    if (activeRef.current && stream) {
      activeRef.current.srcObject = stream;
    }
  }, [activeRef, stream]);

  return (
    <video
      ref={activeRef as any}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "streamyard-wave",
    name: "Buysoft Blue Wave",
    className: "bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-950",
    style: {
      backgroundImage: `radial-gradient(ellipse at 70% 30%, rgba(0, 102, 255, 0.45) 0%, transparent 60%), radial-gradient(ellipse at 20% 75%, rgba(0, 180, 251, 0.35) 0%, transparent 55%), linear-gradient(135deg, #071530 0%, #0a2558 50%, #071c3d 100%)`,
    },
  },
  {
    id: "dark-mesh",
    name: "Dark Mesh",
    className: "bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]",
  },
  {
    id: "buysoft-gradient",
    name: "Buysoft Deep Blue",
    className: "bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950",
  },
  {
    id: "midnight",
    name: "Midnight Purple",
    className: "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950",
  },
  {
    id: "corporate-slate",
    name: "Corporate Slate",
    className: "bg-gradient-to-br from-slate-900 to-slate-950",
  },
];

interface ParticipantTile {
  id: string;
  name: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream?: MediaStream | null;
  isMicOn?: boolean;
  isCamOn?: boolean;
  isScreen?: boolean;
}

interface Props {
  layoutMode: LayoutMode;
  backgroundPresetId: string;
  customBackgroundUrl?: string;
  presenter: ParticipantTile;
  screenShare?: ParticipantTile | null;
  mediaVideoElement?: React.ReactNode | null;
  guestSpeakers?: ParticipantTile[];
}

export default function StudioLayoutManager({
  layoutMode,
  backgroundPresetId,
  customBackgroundUrl,
  presenter,
  screenShare,
  mediaVideoElement,
  guestSpeakers = [],
}: Props) {
  const currentBg =
    BACKGROUND_PRESETS.find((p) => p.id === backgroundPresetId) ||
    BACKGROUND_PRESETS[0];

  const backgroundStyle: React.CSSProperties = customBackgroundUrl
    ? {
        backgroundImage: `url(${customBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : currentBg.style || {};

  // If a video asset is currently playing on stage, it takes stage priority
  if (mediaVideoElement) {
    return (
      <div
        className={`relative h-full w-full rounded-2xl overflow-hidden p-3 flex items-center justify-center transition-all duration-300 ${currentBg.className}`}
        style={backgroundStyle}
      >
        <div className="relative h-full w-full rounded-xl overflow-hidden shadow-2xl border border-slate-800">
          {mediaVideoElement}
        </div>
      </div>
    );
  }

  // 1. SPLIT LAYOUT (Screen Share 75% + Presenter Sidebar 25%)
  if (layoutMode === "split" && screenShare) {
    return (
      <div
        className={`relative h-full w-full rounded-2xl overflow-hidden p-4 flex flex-col lg:flex-row items-center gap-4 transition-all duration-300 ${currentBg.className}`}
        style={backgroundStyle}
      >
        {/* Main Content (Screen Share) */}
        <div className="relative flex-1 h-full rounded-2xl border border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
          <VideoStreamTile
            videoRef={screenShare.videoRef}
            stream={screenShare.stream}
            className="h-full w-full object-contain"
          />
          <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10">
            <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
            <span>Apresentação / Tela</span>
          </div>
        </div>

        {/* Presenter Sidebar */}
        <div className="relative w-full lg:w-72 h-48 lg:h-full flex flex-col justify-center">
          <div className="relative h-48 lg:h-56 w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
            <VideoStreamTile
              videoRef={presenter.videoRef}
              stream={presenter.stream}
              muted={true}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/80 px-2 py-1 text-[10px] font-bold text-white flex items-center gap-1 backdrop-blur-xs border border-white/10">
              <span>{presenter.name}</span>
              {presenter.isMicOn ? (
                <Mic className="h-3 w-3 text-emerald-400" />
              ) : (
                <MicOff className="h-3 w-3 text-rose-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. PICTURE-IN-PICTURE LAYOUT (Screen Share Fullscreen + Presenter Bubble in corner)
  if (layoutMode === "pip" && screenShare) {
    return (
      <div
        className={`relative h-full w-full rounded-2xl overflow-hidden p-3 flex items-center justify-center transition-all duration-300 ${currentBg.className}`}
        style={backgroundStyle}
      >
        {/* Main Content */}
        <div className="relative h-full w-full rounded-xl border border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
          <VideoStreamTile
            videoRef={screenShare.videoRef}
            stream={screenShare.stream}
            className="h-full w-full object-contain"
          />
          <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10">
            <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
            <span>Apresentação</span>
          </div>

          {/* Floating Presenter Bubble */}
          <div className="absolute bottom-4 right-4 z-20 h-36 w-52 rounded-xl border-2 border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden backdrop-blur-md">
            <VideoStreamTile
              videoRef={presenter.videoRef}
              stream={presenter.stream}
              muted={true}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-1.5 left-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-1">
              <span>{presenter.name}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. GRID LAYOUT (Equal tiles for presenter + guests or screen)
  if (layoutMode === "grid" || (layoutMode === "solo" && screenShare)) {
    const tiles: ParticipantTile[] = [presenter];
    if (screenShare) tiles.unshift(screenShare);
    guestSpeakers.forEach((g) => tiles.push(g));

    return (
      <div
        className={`relative h-full w-full rounded-2xl overflow-hidden p-4 flex items-center justify-center transition-all duration-300 ${currentBg.className}`}
        style={backgroundStyle}
      >
        <div className={`w-full h-full grid gap-4 items-center justify-center ${
          tiles.length === 1
            ? "grid-cols-1"
            : tiles.length === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        }`}>
          {tiles.map((tile) => (
            <div
              key={tile.id}
              className="relative h-full max-h-[65vh] w-full rounded-2xl border border-slate-800/80 bg-slate-900/90 overflow-hidden shadow-2xl flex items-center justify-center group backdrop-blur-xs"
            >
              <VideoStreamTile
                videoRef={tile.videoRef}
                stream={tile.stream}
                muted={tile.id === presenter.id}
                className={`h-full w-full ${
                  tile.isScreen ? "object-contain" : "object-cover"
                }`}
              />
              <div className="absolute bottom-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10">
                {tile.isScreen ? (
                  <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
                ) : (
                  <User className="h-3.5 w-3.5 text-slate-300" />
                )}
                <span>{tile.name}</span>
                {!tile.isScreen && (
                  tile.isMicOn !== false ? (
                    <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <MicOff className="h-3.5 w-3.5 text-rose-400" />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. SOLO LAYOUT (Single Presenter in Full Glory)
  return (
    <div
      className={`relative h-full w-full rounded-2xl overflow-hidden p-4 flex items-center justify-center transition-all duration-300 ${currentBg.className}`}
      style={backgroundStyle}
    >
      <div className="relative h-full w-full max-w-4xl rounded-2xl border border-slate-800/80 bg-slate-900/90 overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-xs">
        <VideoStreamTile
          videoRef={presenter.videoRef}
          stream={presenter.stream}
          muted={true}
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-3.5 left-3.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10">
          <span>{presenter.name}</span>
          {presenter.isMicOn ? (
            <Mic className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <MicOff className="h-3.5 w-3.5 text-rose-400" />
          )}
        </div>
      </div>
    </div>
  );
}
