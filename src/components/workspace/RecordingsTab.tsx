"use client";

import React, { useState } from "react";
import {
  Video,
  Play,
  Pause,
  Download,
  Share2,
  FileText,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  HardDrive,
  Eye
} from "lucide-react";

interface Props {
  event: any;
}

export default function RecordingsTab({ event }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayPublished, setReplayPublished] = useState(true);
  const [copiedReplay, setCopiedReplay] = useState(false);
  const [uploadedSlides, setUploadedSlides] = useState("Apresentacao_Buysoft_2026.pdf");

  const replayUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/live/${event.id}`;

  const handleCopyReplay = () => {
    navigator.clipboard.writeText(replayUrl);
    setCopiedReplay(true);
    setTimeout(() => setCopiedReplay(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gravações da Sala & Replay Contínuo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gere leads continuamente permitindo que novos participantes assistam à gravação do webinar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Download da gravação em Full HD (.MP4) iniciado!")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <Download className="h-4 w-4 text-[#00b4fb]" />
            <span>Baixar Vídeo (MP4)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Player Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-2xl bg-black border border-slate-800 overflow-hidden shadow-xl aspect-video flex items-center justify-center group">
            {/* Simulated Stage Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/40 flex items-center justify-center">
              <div className="text-center space-y-3 p-4">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-tr from-[#00b4fb] to-sky-400 p-0.5 mx-auto shadow-xl">
                  <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-white text-2xl font-bold">
                    {event.speakers?.[0]?.name ? event.speakers[0].name.charAt(0) : "B"}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {event.speakers?.[0]?.name || "Palestrante Buysoft"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Gravação Original • Transmissão ao Vivo Concluída
                  </p>
                </div>
              </div>
            </div>

            {/* Play/Pause Overlay Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[#00b4fb] text-white shadow-xl shadow-sky-500/30 hover:scale-110 transition active:scale-95"
            >
              {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
            </button>

            {/* Bottom Scrubber Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between text-[11px] text-slate-300 font-mono">
              <div className="flex items-center gap-2">
                <span>{isPlaying ? "14:32" : "00:00"}</span>
                <span>/</span>
                <span>58:45</span>
              </div>
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                1080p 60FPS
              </span>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Duração Total: <strong>58 min 45 seg</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-slate-400" />
              <span>Tamanho do Arquivo: <strong>1.42 GB</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Replay Settings & Slide Materials (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Replay Public Access Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Disponibilização do Replay</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permite que novos visitantes vejam o webinar após o término.
                </p>
              </div>

              <input
                type="checkbox"
                checked={replayPublished}
                onChange={(e) => setReplayPublished(e.target.checked)}
                className="h-5 w-5 accent-[#00b4fb] cursor-pointer"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Link Público do Replay
              </span>
              <div className="flex items-center justify-between gap-2 bg-white rounded-lg border border-slate-200 p-2 font-mono text-[11px] text-slate-700">
                <span className="truncate">{replayUrl}</span>
                <button
                  onClick={handleCopyReplay}
                  className="rounded-md bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 transition shrink-0"
                  title="Copiar link"
                >
                  {copiedReplay ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <a
              href={`/live/${event.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Página de Replay Como Espectador</span>
            </a>
          </div>

          {/* Supplementary Materials (PDF Slides) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Material Complementar (Slides)</h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                Disponível
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Arquivo em PDF liberado para os participantes baixarem durante ou após a sessão.
            </p>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{uploadedSlides}</p>
                  <p className="text-[10px] text-slate-400">PDF • 14.8 MB</p>
                </div>
              </div>

              <button
                onClick={() => alert("Download do PDF oficial de slides iniciado!")}
                className="p-1.5 text-slate-500 hover:text-slate-900 transition"
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
