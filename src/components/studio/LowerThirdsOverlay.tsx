"use client";

import React from "react";
import { Sparkles, Megaphone } from "lucide-react";

interface LowerThirdProps {
  isVisible: boolean;
  name: string;
  role?: string;
  company?: string;
  themeColor?: string;
}

export function LowerThird({
  isVisible,
  name,
  role = "Palestrante Especialista",
  company = "Buysoft",
  themeColor = "#00b4fb",
}: LowerThirdProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-6 left-6 z-30 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
      <div className="flex items-stretch rounded-2xl overflow-hidden shadow-2xl border border-white/20 backdrop-blur-xl bg-slate-900/90 max-w-md">
        {/* Accent Brand Bar */}
        <div
          className="w-2.5 shrink-0"
          style={{ backgroundColor: themeColor }}
        />

        <div className="py-2.5 px-4 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white tracking-tight">
              {name}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white shadow-xs"
              style={{ backgroundColor: themeColor }}
            >
              {company}
            </span>
          </div>
          {role && (
            <p className="text-[11px] font-medium text-slate-300 mt-0.5">
              {role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface TickerTapeProps {
  isVisible: boolean;
  text: string;
  themeColor?: string;
}

export function TickerTape({
  isVisible,
  text,
  themeColor = "#00b4fb",
}: TickerTapeProps) {
  if (!isVisible || !text) return null;

  return (
    <div className="absolute bottom-0 inset-x-0 z-30 h-8 bg-slate-950/95 border-t border-slate-800 flex items-center overflow-hidden backdrop-blur-md pointer-events-none">
      <div
        className="h-full px-3 flex items-center gap-1.5 text-white text-[10px] font-black uppercase tracking-wider shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        <Megaphone className="h-3 w-3" />
        <span>Aviso</span>
      </div>

      <div className="flex-1 whitespace-nowrap overflow-hidden">
        <div className="inline-block animate-marquee pl-4 text-xs font-semibold text-slate-200">
          {text} &nbsp; • &nbsp; {text} &nbsp; • &nbsp; {text}
        </div>
      </div>
    </div>
  );
}

interface HeadlineBannerProps {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  themeColor?: string;
}

export function HeadlineBanner({
  isVisible,
  title,
  subtitle,
  themeColor = "#00b4fb",
}: HeadlineBannerProps) {
  if (!isVisible || !title) return null;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 max-w-xl w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
      <div className="rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl p-3.5 text-center shadow-2xl">
        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white mb-1" style={{ backgroundColor: themeColor }}>
          <Sparkles className="h-3 w-3" />
          <span>Destaque</span>
        </div>
        <h4 className="text-sm font-bold text-white leading-tight">{title}</h4>
        {subtitle && <p className="text-xs text-slate-300 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface FixedBannerProps {
  isVisible: boolean;
  text: string;
  themeColor?: string;
}

export function FixedBanner({
  isVisible,
  text,
  themeColor = "#00b4fb",
}: FixedBannerProps) {
  if (!isVisible || !text) return null;

  return (
    <div className="absolute bottom-8 sm:bottom-10 inset-x-0 z-30 flex justify-center px-6 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div
        className="max-w-2xl bg-white/95 text-slate-900 font-bold text-sm sm:text-base px-6 py-3 rounded-xl shadow-2xl border-b-4 text-center leading-snug backdrop-blur-md"
        style={{ borderBottomColor: themeColor }}
      >
        {text}
      </div>
    </div>
  );
}

