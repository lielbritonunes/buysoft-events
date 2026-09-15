"use client";

import React, { useState } from "react";
import { X, Check, Star } from "lucide-react";
import { AVAILABLE_THEMES, ThemeConfig } from "@/components/builder/builderTemplates";

interface Props {
  isOpen: boolean;
  currentTheme: string;
  onClose: () => void;
  onSelectAndStart: (themeId: string) => void;
}

export default function ThemeSelectorModal({
  isOpen,
  currentTheme,
  onClose,
  onSelectAndStart,
}: Props) {
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme || "crosby");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative pt-7 pb-4 px-8 text-center border-b border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Escolha o tema
          </h2>
        </div>

        {/* Modal Body: Themes 2x2 Grid matching user image 1 */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {AVAILABLE_THEMES.map((theme: ThemeConfig) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`group relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "border-[#00b4fb] bg-sky-50/20 shadow-md ring-2 ring-[#00b4fb]/20"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Theme Thumbnail Preview Card */}
                  <div className="p-3 bg-slate-50/80">
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200/80 shadow-xs">
                      <img
                        src={theme.previewImg}
                        alt={theme.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {/* Theme Overlay Mockup */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-between p-3.5 text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">
                            {theme.name}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold leading-tight drop-shadow-xs">
                            The future of everything
                          </p>
                          <span className="inline-block mt-1.5 rounded-sm bg-[#00b4fb] px-2 py-0.5 text-[9px] font-bold text-white shadow-2xs">
                            Register
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Theme Info & Action Button */}
                  <div className="p-4 pt-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{theme.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {theme.categoryTags}
                      </p>
                    </div>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-600 shadow-2xs shrink-0">
                        <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                        <span>Selecionado</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTheme(theme.id);
                        }}
                        className="rounded-lg bg-slate-100 hover:bg-slate-200/80 px-3 py-1 text-xs font-semibold text-slate-700 transition shrink-0"
                      >
                        Selecione o tema
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer with "Começar" */}
        <div className="p-6 px-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={() => onSelectAndStart(selectedTheme)}
            className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-98"
          >
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}
