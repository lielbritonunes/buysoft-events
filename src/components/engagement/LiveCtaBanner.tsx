"use client";

import React, { useState } from "react";
import { Sparkles, ExternalLink, X, Zap } from "lucide-react";

interface Props {
  cta: {
    id: string;
    title: string;
    buttonText: string;
    buttonUrl: string;
  } | null;
  onDismiss?: () => void;
}

export default function LiveCtaBanner({ cta, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!cta || dismissed) return null;

  return (
    <div className="w-full animate-in slide-in-from-top duration-300">
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#00b4fb] bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-4 sm:p-5 shadow-2xl text-white">
        {/* Glow accent */}
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#00b4fb]/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00b4fb] text-white shadow-md shadow-sky-500/30">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#00b4fb]/20 px-2 py-0.5 text-[10px] font-bold text-[#00b4fb] uppercase tracking-wider">
                  Destaque do Webinar
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                {cta.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={cta.buttonUrl.startsWith("http") ? cta.buttonUrl : `https://${cta.buttonUrl}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-[#00b4fb] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:bg-[#009ce0] transition active:scale-98"
            >
              <span>{cta.buttonText}</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {onDismiss && (
              <button
                onClick={() => {
                  setDismissed(true);
                  onDismiss();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
                title="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
