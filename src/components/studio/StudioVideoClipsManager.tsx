"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Film,
  Plus,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Upload,
  X,
  Clapperboard,
  Play,
  Square,
  Trash2,
  Check,
  Video,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  Link2,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import {
  getYouTubeVideoId,
  getVimeoVideoId,
  getVideoThumbnail,
} from "@/lib/videoUrlHelper";

export interface VideoClipItem {
  id: string;
  title: string;
  durationFormatted: string;
  durationSeconds: number;
  url: string;
  thumbnailUrl?: string | null;
  previewLabel?: string;
  isDefault?: boolean;
}

// Initial empty clips list as requested by user
const INITIAL_DEFAULT_CLIPS: VideoClipItem[] = [];

interface Props {
  eventId: string;
  activeVideoUrl: string | null;
  repeatVideo: boolean;
  onToggleRepeat: (repeat: boolean) => void;
  onPlayVideo: (clip: VideoClipItem) => void;
  onStopVideo: () => void;
  introClip: VideoClipItem | null;
  outroClip: VideoClipItem | null;
  onSetIntroClip: (clip: VideoClipItem | null) => void;
  onSetOutroClip: (clip: VideoClipItem | null) => void;
}

export default function StudioVideoClipsManager({
  eventId,
  activeVideoUrl,
  repeatVideo,
  onToggleRepeat,
  onPlayVideo,
  onStopVideo,
  introClip,
  outroClip,
  onSetIntroClip,
  onSetOutroClip,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [clips, setClips] = useState<VideoClipItem[]>(INITIAL_DEFAULT_CLIPS);

  // Modals
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showOutroModal, setShowOutroModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload modal tab: default to 'url' per user request
  const [uploadTab, setUploadTab] = useState<"url" | "file">("url");
  const [urlInput, setUrlInput] = useState("");
  const [urlTitleInput, setUrlTitleInput] = useState("");

  // Temp selection inside modals
  const [selectedIntroId, setSelectedIntroId] = useState<string | null>(
    introClip?.id || null
  );
  const [selectedOutroId, setSelectedOutroId] = useState<string | null>(
    outroClip?.id || null
  );

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fallbackFile, setFallbackFile] = useState<File | null>(null);
  const [fallbackDuration, setFallbackDuration] = useState<number>(15);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load saved clips from localStorage and enrich with thumbnails
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`buysoft_clips_${eventId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out legacy default clips and enrich any YouTube clips with thumbnails
          const userOnlyClips = parsed
            .filter(
              (c: VideoClipItem) => !c.isDefault && !c.id?.startsWith("default-")
            )
            .map((c: VideoClipItem) => {
              const ytId = getYouTubeVideoId(c.url);
              const vimeoId = getVimeoVideoId(c.url);
              return {
                ...c,
                thumbnailUrl:
                  c.thumbnailUrl ||
                  (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null),
                previewLabel:
                  c.previewLabel || (ytId ? "YOUTUBE" : vimeoId ? "VIMEO" : undefined),
              };
            });

          setClips(userOnlyClips);
          localStorage.setItem(`buysoft_clips_${eventId}`, JSON.stringify(userOnlyClips));
          return;
        }
      }
      setClips([]);
    } catch (e) {
      console.warn("Could not load saved videoclips:", e);
      setClips([]);
    }
  }, [eventId]);

  // Persist custom clips to localStorage
  const saveClips = (updated: VideoClipItem[]) => {
    setClips(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`buysoft_clips_${eventId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save videoclips:", e);
      }
    }
  };

  // Helper to format seconds to M:SS
  const formatDuration = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Handle video upload from local computer
  const handleUploadFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      setUploadError("Por favor, selecione um arquivo de vídeo válido (MP4, WebM, MOV).");
      return;
    }

    setUploadError(null);
    setFallbackFile(null);
    setIsUploading(true);

    try {
      // 1. Extract duration locally using video element metadata
      const objectUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement("video");
      tempVideo.preload = "metadata";
      tempVideo.src = objectUrl;

      const duration: number = await new Promise((resolve) => {
        tempVideo.onloadedmetadata = () => {
          resolve(tempVideo.duration || 15);
        };
        tempVideo.onerror = () => {
          resolve(15);
        };
      });

      setFallbackDuration(duration);
      URL.revokeObjectURL(objectUrl);

      // 2. Upload file to backend with safe error decoding
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      let data: any = null;
      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      }

      if (!res.ok || !data?.success) {
        let errorMsg = data?.error;
        if (!errorMsg) {
          const text = await res.text().catch(() => "");
          if (
            res.status === 413 ||
            text.includes("Request Entity Too Large") ||
            text.includes("Payload Too Large")
          ) {
            setFallbackFile(file);
            errorMsg =
              "O arquivo excedeu o limite do servidor de hospedagem (Vercel Serverless). Recomendamos usar a aba 'Link de vídeo (URL)' com links do YouTube, ou clicar no botão abaixo para usar localmente no estúdio.";
          } else {
            errorMsg =
              text.slice(0, 120) || `Falha no envio do vídeo (Status HTTP ${res.status}).`;
          }
        }
        throw new Error(errorMsg);
      }

      // 3. Create clip item
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
      const newClip: VideoClipItem = {
        id: `custom_${Date.now()}`,
        title: cleanTitle,
        durationFormatted: formatDuration(duration),
        durationSeconds: Math.round(duration),
        previewLabel: cleanTitle.slice(0, 10).toUpperCase(),
        url: data.url,
        isDefault: false,
      };

      const updated = [...clips, newClip];
      saveClips(updated);
      setIsUploading(false);
      setShowUploadModal(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Falha no envio do arquivo. Tente novamente.");
      setIsUploading(false);
    }
  };

  // Fallback: use file directly in browser via ObjectURL if cloud serverless rejected large file
  const handleUseFileLocally = () => {
    if (!fallbackFile) return;
    try {
      const localUrl = URL.createObjectURL(fallbackFile);
      const cleanTitle = fallbackFile.name.replace(/\.[^/.]+$/, "");
      const newClip: VideoClipItem = {
        id: `local_${Date.now()}`,
        title: cleanTitle,
        durationFormatted: formatDuration(fallbackDuration || 15),
        durationSeconds: Math.round(fallbackDuration || 15),
        previewLabel: cleanTitle.slice(0, 10).toUpperCase(),
        url: localUrl,
        isDefault: false,
      };
      const updated = [...clips, newClip];
      saveClips(updated);
      setShowUploadModal(false);
      setUploadError(null);
      setFallbackFile(null);
    } catch (e: any) {
      setUploadError("Não foi possível carregar o arquivo localmente: " + e.message);
    }
  };

  // Add clip via direct video link (YouTube, Vimeo, MP4, WebM)
  const handleAddClipViaUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const ytId = getYouTubeVideoId(url);
    const vimeoId = getVimeoVideoId(url);

    let thumbnail: string | null = null;
    let label = "URL";

    if (ytId) {
      thumbnail = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
      label = "YOUTUBE";
    } else if (vimeoId) {
      label = "VIMEO";
    }

    const cleanTitle =
      urlTitleInput.trim() ||
      (ytId ? "Vídeo YouTube" : vimeoId ? "Vídeo Vimeo" : `Videoclipe ${clips.length + 1}`);

    const newClip: VideoClipItem = {
      id: `url_${Date.now()}`,
      title: cleanTitle,
      durationFormatted: "Vídeo",
      durationSeconds: 60,
      previewLabel: label,
      thumbnailUrl: thumbnail,
      url: url,
      isDefault: false,
    };

    const updated = [...clips, newClip];
    saveClips(updated);
    setUrlInput("");
    setUrlTitleInput("");
    setShowUploadModal(false);
  };

  const handleDeleteClip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = clips.find((c) => c.id === id);
    if (!target) return;

    if (activeVideoUrl === target.url) {
      onStopVideo();
    }
    if (introClip?.id === id) {
      onSetIntroClip(null);
    }
    if (outroClip?.id === id) {
      onSetOutroClip(null);
    }

    const updated = clips.filter((c) => c.id !== id);
    saveClips(updated);
  };

  // Active detected YouTube ID inside modal for live preview
  const activeYtId = getYouTubeVideoId(urlInput);

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100">
      {/* ─────────────────────────────────────────────────────────────
          SECTION HEADER: Videoclipes (StreamYard exact style)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 font-bold text-slate-800 text-xs hover:text-slate-900 transition cursor-pointer select-none"
        >
          <span>Videoclipes</span>
          {isCollapsed ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        <a
          href="https://support.streamyard.com/hc/en-us/articles/360049449831-Video-Clips"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-slate-600 transition"
          title="Saiba como usar videoclipes, introduções e encerramentos"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </a>
      </div>

      {!isCollapsed && (
        <div className="space-y-3">
          {/* ─────────────────────────────────────────────────────────────
              TWO TOP CARDS: Vídeo de introdução & Vídeo de encerramento
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2">
            {/* Card 1: Introdução */}
            <button
              type="button"
              onClick={() => {
                setSelectedIntroId(introClip?.id || null);
                setShowIntroModal(true);
              }}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between min-h-[64px] cursor-pointer group shadow-2xs ${
                introClip
                  ? "border-[#00b4fb] bg-sky-50/50 hover:bg-sky-50"
                  : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-slate-800 line-clamp-1">
                  Vídeo de introdução
                </span>
                {introClip ? (
                  <Check className="h-3 w-3 text-[#00b4fb] shrink-0" />
                ) : (
                  <Clapperboard className="h-3 w-3 text-slate-400 group-hover:text-slate-600 shrink-0" />
                )}
              </div>
              <span className="text-[9px] text-slate-500 truncate block mt-1">
                {introClip ? introClip.title : "Definir introdução"}
              </span>
            </button>

            {/* Card 2: Encerramento */}
            <button
              type="button"
              onClick={() => {
                setSelectedOutroId(outroClip?.id || null);
                setShowOutroModal(true);
              }}
              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between min-h-[64px] cursor-pointer group shadow-2xs ${
                outroClip
                  ? "border-[#00b4fb] bg-sky-50/50 hover:bg-sky-50"
                  : "border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-bold text-slate-800 line-clamp-1">
                  Vídeo de encerramento
                </span>
                {outroClip ? (
                  <Check className="h-3 w-3 text-[#00b4fb] shrink-0" />
                ) : (
                  <Clapperboard className="h-3 w-3 text-slate-400 group-hover:text-slate-600 shrink-0" />
                )}
              </div>
              <span className="text-[9px] text-slate-500 truncate block mt-1">
                {outroClip ? outroClip.title : "Definir encerramento"}
              </span>
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              CHECKBOX: Repetir (Loop)
              ───────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={repeatVideo}
                onChange={(e) => onToggleRepeat(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-[#00b4fb] focus:ring-[#00b4fb] cursor-pointer accent-[#00b4fb]"
              />
              <span className="text-xs font-semibold text-slate-700">Repetir</span>
            </label>

            {activeVideoUrl && (
              <button
                type="button"
                onClick={onStopVideo}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Square className="h-2.5 w-2.5 fill-rose-600" />
                <span>Parar vídeo</span>
              </button>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              VIDEOCLIPS GRID (Custom items + "+ Mais" button)
              ───────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {clips.map((clip) => {
              const isPlaying = activeVideoUrl === clip.url;

              return (
                <div key={clip.id} className="group relative flex flex-col">
                  {/* Video Tile Box */}
                  <div
                    onClick={() => {
                      if (isPlaying) {
                        onStopVideo();
                      } else {
                        onPlayVideo(clip);
                      }
                    }}
                    className={`relative aspect-[16/10] w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border flex items-center justify-center ${
                      isPlaying
                        ? "border-[#00b4fb] ring-2 ring-[#00b4fb]/40 bg-slate-950 shadow-md shadow-[#00b4fb]/20"
                        : "border-slate-800 bg-[#171b26] hover:border-[#00b4fb]/80 hover:shadow-sm"
                    }`}
                  >
                    {/* Visual Center Preview Graphic or Real Thumbnail */}
                    {clip.thumbnailUrl ? (
                      <img
                        src={clip.thumbnailUrl}
                        alt={clip.title}
                        className="h-full w-full object-cover pointer-events-none"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-1 text-center select-none pointer-events-none">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800/80 text-white/80 group-hover:text-[#00b4fb] group-hover:scale-105 transition">
                          <Clapperboard className="h-4 w-4 text-[#00b4fb]" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-300 tracking-wider mt-1 truncate max-w-[80px]">
                          {clip.previewLabel || clip.title.slice(0, 10).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* YouTube/Video Type Badge: Top-left if YouTube */}
                    {clip.previewLabel === "YOUTUBE" && (
                      <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-red-600/90 text-[7px] font-black text-white uppercase tracking-tight pointer-events-none">
                        YouTube
                      </div>
                    )}

                    {/* Duration Badge: Bottom-left */}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[9px] font-mono font-bold text-white pointer-events-none">
                      {clip.durationFormatted}
                    </div>

                    {/* Active on stage indicator */}
                    {isPlaying && (
                      <div className="absolute top-1 right-1 flex items-center gap-1 rounded bg-[#00b4fb] px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-wider shadow-sm animate-pulse z-10">
                        Ao Vivo
                      </div>
                    )}

                    {/* Hover Overlay with Action */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 z-10">
                      {isPlaying ? (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-rose-300 bg-rose-950/80 px-2 py-1 rounded-lg border border-rose-600/40 shadow-xs">
                          <Square className="h-2.5 w-2.5 fill-rose-400" />
                          <span>Remover</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-white bg-[#00b4fb] px-2 py-1 rounded-lg shadow-sm">
                          <Play className="h-2.5 w-2.5 fill-white" />
                          <span>Exibir</span>
                        </div>
                      )}
                    </div>

                    {/* Delete button on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClip(clip.id, e)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/70 text-slate-300 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition cursor-pointer z-20"
                      title="Excluir videoclipe"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Title Below Tile */}
                  <span
                    className="text-[10px] font-medium text-slate-700 truncate mt-1 text-left px-0.5"
                    title={clip.title}
                  >
                    {clip.title}
                  </span>
                </div>
              );
            })}

            {/* "+ Mais" Card Button (Always visible) */}
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  setFallbackFile(null);
                  setUploadTab("url");
                  setShowUploadModal(true);
                }}
                className="aspect-[16/10] w-full rounded-xl border border-slate-300 hover:border-[#00b4fb] bg-white hover:bg-sky-50/30 flex items-center justify-center gap-1.5 text-slate-700 hover:text-[#0084be] transition cursor-pointer group shadow-2xs"
                title="Importar ou adicionar videoclipes"
              >
                <div className="relative">
                  <Layers className="h-4 w-4 text-slate-500 group-hover:text-[#00b4fb] transition" />
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-700 group-hover:bg-[#00b4fb] text-[7px] font-bold text-white leading-none">
                    +
                  </span>
                </div>
                <span className="text-xs font-bold">Mais</span>
              </button>
              <span className="text-[10px] text-transparent mt-1 select-none">.</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: Definir Vídeo de Introdução (Mounted via React Portal)
          ───────────────────────────────────────────────────────────── */}
      {mounted && showIntroModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-3 flex items-start justify-between border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Definir vídeo de introdução
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  O vídeo de introdução é reproduzido automaticamente quando você transmite ao vivo ou começa a gravar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowIntroModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video List */}
            <div className="p-6 pt-4 max-h-[340px] overflow-y-auto space-y-2.5">
              {clips.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum vídeo importado ainda. Clique em &quot;+ Mais&quot; para adicionar um vídeo.
                </div>
              ) : (
                clips.map((clip) => {
                  const isSelected = selectedIntroId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedIntroId(clip.id)}
                      className={`flex items-center gap-3.5 p-2 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-[#00b4fb] bg-sky-50/50 shadow-2xs"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Left Thumbnail Tile */}
                      <div className="w-24 aspect-[16/10] rounded-lg bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center overflow-hidden">
                        {clip.thumbnailUrl ? (
                          <img
                            src={clip.thumbnailUrl}
                            alt={clip.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            {clip.previewLabel || "00:15"}
                          </span>
                        )}
                        <Clapperboard className="absolute bottom-1 left-1.5 h-3 w-3 text-white/70" />
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {clip.title}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                          {clip.durationFormatted}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#00b4fb] text-white flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-gray-100 flex items-center justify-between">
              {introClip ? (
                <button
                  type="button"
                  onClick={() => {
                    onSetIntroClip(null);
                    setShowIntroModal(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Remover introdução
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowIntroModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={!selectedIntroId}
                  onClick={() => {
                    const found = clips.find((c) => c.id === selectedIntroId);
                    onSetIntroClip(found || null);
                    setShowIntroModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#00b4fb] hover:bg-[#009edc] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition cursor-pointer"
                >
                  Definir como vídeo de introdução
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: Definir Vídeo de Encerramento (Mounted via React Portal)
          ───────────────────────────────────────────────────────────── */}
      {mounted && showOutroModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-3 flex items-start justify-between border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Definir vídeo de encerramento
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  O vídeo de encerramento é reproduzido automaticamente antes do final da transmissão ou gravação.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowOutroModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video List */}
            <div className="p-6 pt-4 max-h-[340px] overflow-y-auto space-y-2.5">
              {clips.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum vídeo importado ainda. Clique em &quot;+ Mais&quot; para adicionar um vídeo.
                </div>
              ) : (
                clips.map((clip) => {
                  const isSelected = selectedOutroId === clip.id;

                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedOutroId(clip.id)}
                      className={`flex items-center gap-3.5 p-2 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-[#00b4fb] bg-sky-50/50 shadow-2xs"
                          : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Left Thumbnail Tile */}
                      <div className="w-24 aspect-[16/10] rounded-lg bg-slate-950 border border-slate-800 shrink-0 relative flex items-center justify-center overflow-hidden">
                        {clip.thumbnailUrl ? (
                          <img
                            src={clip.thumbnailUrl}
                            alt={clip.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-slate-400">
                            {clip.previewLabel || "00:15"}
                          </span>
                        )}
                        <Clapperboard className="absolute bottom-1 left-1.5 h-3 w-3 text-white/70" />
                      </div>

                      {/* Right Details */}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {clip.title}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                          {clip.durationFormatted}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-[#00b4fb] text-white flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-gray-100 flex items-center justify-between">
              {outroClip ? (
                <button
                  type="button"
                  onClick={() => {
                    onSetOutroClip(null);
                    setShowOutroModal(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Remover encerramento
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOutroModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={!selectedOutroId}
                  onClick={() => {
                    const found = clips.find((c) => c.id === selectedOutroId);
                    onSetOutroClip(found || null);
                    setShowOutroModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#00b4fb] hover:bg-[#009edc] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition cursor-pointer"
                >
                  Definir como vídeo de encerramento
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: Videoclipes Upload / URL Modal (Mounted via React Portal)
          ───────────────────────────────────────────────────────────── */}
      {mounted && showUploadModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Videoclipes
              </h3>

              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setShowUploadModal(false);
                    setUploadError(null);
                    setFallbackFile(null);
                  }
                }}
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-100 px-6 pt-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setUploadTab("url")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  uploadTab === "url"
                    ? "border-[#00b4fb] text-[#0084be]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>Link de vídeo (URL)</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadTab("file")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                  uploadTab === "file"
                    ? "border-[#00b4fb] text-[#0084be]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Arquivo do computador</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {uploadError && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>

                  {fallbackFile && (
                    <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-rose-700 font-medium truncate max-w-[200px]">
                        {fallbackFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleUseFileLocally}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1 shrink-0"
                      >
                        <HardDrive className="h-3 w-3" />
                        <span>Usar localmente no estúdio</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {uploadTab === "url" ? (
                <div className="space-y-4">
                  {/* Supported Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                      YouTube
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
                      Vimeo
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      MP4 / WebM
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Título do videoclipe
                    </label>
                    <input
                      type="text"
                      value={urlTitleInput}
                      onChange={(e) => setUrlTitleInput(e.target.value)}
                      placeholder="Ex: Copilot, Demonstração do Produto..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-slate-800 placeholder:text-gray-400 focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      URL do vídeo
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-slate-800 placeholder:text-gray-400 focus:border-[#00b4fb] focus:outline-none font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Cole links de vídeos do YouTube, Vimeo ou link direto MP4.
                    </p>
                  </div>

                  {/* YouTube Detected Preview Box */}
                  {activeYtId && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-red-200 bg-red-50/50 animate-in fade-in duration-200">
                      <div className="w-20 aspect-video rounded-lg overflow-hidden shrink-0 border border-red-200 relative bg-black">
                        <img
                          src={`https://img.youtube.com/vi/${activeYtId}/mqdefault.jpg`}
                          alt="Prévia YouTube"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-red-900 block flex items-center gap-1">
                          <span>✓ Vídeo do YouTube detectado</span>
                        </span>
                        <span className="text-[10px] text-red-700 font-mono truncate block mt-0.5">
                          ID: {activeYtId}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={!urlInput.trim()}
                    onClick={handleAddClipViaUrl}
                    className="w-full py-2.5 rounded-xl bg-[#00b4fb] hover:bg-[#009edc] text-white font-bold text-xs shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Adicionar videoclipe
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4, video/webm, video/quicktime, video/x-matroska, video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFile(file);
                    }}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleUploadFile(file);
                    }}
                    className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center transition ${
                      isDragOver
                        ? "border-[#00b4fb] bg-sky-50/50"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
                    }`}
                  >
                    {isUploading ? (
                      <div className="py-4 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 text-[#00b4fb] animate-spin" />
                        <span className="text-xs font-bold text-slate-700">
                          Enviando e processando vídeo...
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Extraindo metadados de áudio e resolução...
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-slate-600 mb-3" />

                        <p className="text-sm font-semibold text-slate-700 mb-1.5">
                          Arraste e solte um arquivo para enviar
                        </p>

                        <p className="text-xs text-slate-400 mb-3">ou</p>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2 rounded-xl border-2 border-[#00b4fb] text-[#0084be] font-bold text-xs hover:bg-[#00b4fb] hover:text-white transition shadow-2xs cursor-pointer"
                        >
                          Adicionar arquivo
                        </button>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-center text-slate-400 mt-4">
                    Tamanho recomendado: 1280 x 720
                  </p>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
