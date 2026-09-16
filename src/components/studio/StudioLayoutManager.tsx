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
  fallback,
}: {
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  stream?: MediaStream | null;
  className?: string;
  muted?: boolean;
  fallback?: React.ReactNode;
}) {
  const localRef = React.useRef<HTMLVideoElement>(null);
  const activeRef = videoRef || localRef;

  React.useEffect(() => {
    const el = activeRef.current;
    if (el) {
      if (stream) {
        if (el.srcObject !== stream) {
          el.srcObject = stream;
          el.play().catch(() => {});
        }
      } else {
        if (el.srcObject !== null) {
          el.srcObject = null;
        }
      }
    }
  }, [activeRef, stream]);

  return (
    <>
      <video
        ref={activeRef as any}
        autoPlay
        playsInline
        muted={muted}
        className={`${className || ""} ${stream ? "block" : "hidden"}`}
      />
      {!stream && fallback}
    </>
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
  headline?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream?: MediaStream | null;
  isMicOn?: boolean;
  isCamOn?: boolean;
  isScreen?: boolean;
}

function PresenterLowerThird({
  name,
  headline,
  isMicOn,
  isScreen,
  compact = false,
}: {
  name: string;
  headline?: string;
  isMicOn?: boolean;
  isScreen?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`absolute ${
        compact ? "bottom-1.5 left-1.5 px-2 py-0.5" : "bottom-3 left-3 px-3 py-1.5"
      } max-w-[85%] rounded-lg bg-black/85 backdrop-blur-md text-white border-l-4 border-[#00b4fb] shadow-xl flex flex-col justify-center animate-in fade-in duration-200 z-20 pointer-events-none`}
    >
      <div className="flex items-center gap-1.5">
        {isScreen ? (
          <Monitor className="h-3.5 w-3.5 text-[#00b4fb] shrink-0" />
        ) : (
          <User className="h-3 w-3 text-slate-300 shrink-0" />
        )}
        <span
          className={`font-bold tracking-tight text-white leading-tight ${
            compact ? "text-[10px]" : "text-xs sm:text-sm"
          }`}
        >
          {name}
        </span>
        {!isScreen && isMicOn !== undefined && (
          isMicOn ? (
            <Mic className="h-3 w-3 text-emerald-400 shrink-0" />
          ) : (
            <MicOff className="h-3 w-3 text-rose-400 shrink-0" />
          )
        )}
      </div>
      {headline && !isScreen && (
        <span
          className={`font-medium text-slate-300 tracking-normal leading-tight mt-0.5 truncate ${
            compact ? "text-[8px]" : "text-[10px] sm:text-[11px]"
          }`}
        >
          {headline}
        </span>
      )}
    </div>
  );
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
        className={`relative h-full w-full rounded-2xl overflow-hidden p-3 sm:p-4 flex flex-col lg:flex-row items-center justify-center gap-3 sm:gap-4 transition-all duration-300 ${currentBg.className}`}
        style={backgroundStyle}
      >
        {/* Main Content (Screen Share - strictly 16:9 aspect ratio, no vertical letterbox) */}
        <div className="relative flex-1 aspect-video max-h-full max-w-full rounded-2xl border border-slate-800/80 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
          <VideoStreamTile
            videoRef={screenShare.videoRef}
            stream={screenShare.stream}
            className="h-full w-full object-contain aspect-video"
          />
          <div className="absolute top-3 left-3 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1.5 backdrop-blur-xs border border-white/10">
            <Monitor className="h-3.5 w-3.5 text-[#00b4fb]" />
            <span>Apresentação / Tela</span>
          </div>
        </div>

        {/* Presenter Sidebar */}
        <div className="relative w-full lg:w-64 xl:w-72 aspect-video lg:aspect-auto max-h-full flex flex-col justify-center shrink-0">
          <div className="relative aspect-video w-full rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl flex items-center justify-center">
            <VideoStreamTile
              videoRef={presenter.videoRef}
              stream={presenter.stream}
              muted={true}
              className="h-full w-full object-cover aspect-video"
              fallback={
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-xl">
                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                      {presenter.name.charAt(0) || "P"}
                    </div>
                  </div>
                </div>
              }
            />
            <PresenterLowerThird
              name={presenter.name}
              headline={presenter.headline}
              isMicOn={presenter.isMicOn}
            />
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
        {/* Main Content (Strict 16:9 Screen Share, no black bars) */}
        <div className="relative aspect-video max-h-full max-w-full rounded-xl border border-slate-800 bg-black overflow-hidden shadow-2xl flex items-center justify-center">
          <VideoStreamTile
            videoRef={screenShare.videoRef}
            stream={screenShare.stream}
            className="h-full w-full object-contain aspect-video"
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
              fallback={
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-md flex items-center justify-center">
                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-base font-black">
                      {presenter.name.charAt(0) || "P"}
                    </div>
                  </div>
                </div>
              }
            />
            <PresenterLowerThird
              name={presenter.name}
              headline={presenter.headline}
              isMicOn={presenter.isMicOn}
              compact={true}
            />
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
                fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 shadow-xl">
                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black">
                        {tile.name.charAt(0) || "P"}
                      </div>
                    </div>
                  </div>
                }
              />
              <PresenterLowerThird
                name={tile.name}
                headline={tile.headline}
                isMicOn={tile.isMicOn}
                isScreen={tile.isScreen}
              />
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
          fallback={
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-1 shadow-2xl shadow-sky-500/25 animate-pulse">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-3xl sm:text-4xl font-black">
                  {presenter.name.charAt(0) || "P"}
                </div>
              </div>
              <span className="rounded-full bg-slate-800/90 px-3 py-1 text-xs font-bold text-slate-300 border border-slate-700">
                Palestrante Ao Vivo
              </span>
            </div>
          }
        />
        <PresenterLowerThird
          name={presenter.name}
          headline={presenter.headline}
          isMicOn={presenter.isMicOn}
        />
      </div>
    </div>
  );
}
