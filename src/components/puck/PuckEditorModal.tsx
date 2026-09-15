"use client";

import React, { useState, useMemo } from "react";
import "@measured/puck/puck.css";
import { Puck, Data } from "@measured/puck";
import {
  ArrowLeft,
  Sparkles,
  Save,
  Check,
  Eye,
  X,
  Wand2,
  Layers,
  Cpu,
  Building2,
  Minimize2,
  Flame
} from "lucide-react";
import { getPuckConfig } from "./puckConfig";
import { generateAIPuckPage } from "./aiPageGenerator";

interface Props {
  event: any;
  initialData?: Data | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Data) => Promise<void>;
  onPreview: () => void;
}

export default function PuckEditorModal({
  event,
  initialData,
  isOpen,
  onClose,
  onSave,
  onPreview,
}: Props) {
  const [data, setData] = useState<Data>(() => {
    if (initialData && initialData.content && initialData.content.length > 0) {
      return initialData;
    }
    return generateAIPuckPage({ event, style: "tecnologico" });
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<
    "tecnologico" | "corporativo" | "minimalista" | "show"
  >("tecnologico");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Memoize config
  const config = useMemo(() => getPuckConfig(event), [event]);

  if (!isOpen) return null;

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateAIPuckPage({ event, style: selectedStyle });
      setData(generated);
      setIsGenerating(false);
      setIsAiModalOpen(false);
    }, 400);
  };

  const handleSave = async (publishedData: Data) => {
    setIsSaving(true);
    try {
      await onSave(publishedData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Error saving puck page:", err);
      alert("Erro ao salvar página. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 overflow-hidden animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <header className="h-14 border-b border-slate-800 bg-[#0c1017] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Voltar ao Painel & Event Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Painel</span>
          </button>

          <span className="hidden sm:inline-block h-4 w-px bg-slate-800" />
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-300 truncate max-w-sm">
            {event.title} • <b>Construtor Visual Puck</b>
          </span>
        </div>

        {/* Right: AI Generator Button, Preview, Save */}
        <div className="flex items-center gap-2.5">
          {/* FREE AI GENERATOR BUTTON */}
          <button
            type="button"
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-[#00b4fb] hover:from-sky-400 hover:to-[#009ce0] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition active:scale-95"
          >
            <Wand2 className="h-3.5 w-3.5" />
            <span>Gerar com IA 🪄</span>
          </button>

          <button
            type="button"
            onClick={onPreview}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Pré-visualizar</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(data)}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-1.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 active:scale-95"
          >
            {saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Puck Editor Container */}
      <div className="flex-1 overflow-hidden relative puck-dark-wrapper bg-white text-slate-900">
        <Puck
          config={config}
          data={data}
          onPublish={handleSave}
          onChange={(newData) => setData(newData)}
        />
      </div>

      {/* FREE AI GENERATOR MODAL */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0f141c] border border-slate-800 p-6 text-slate-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b4fb]/20 text-[#00b4fb]">
                  <Wand2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Assistente de IA (100% Gratuito)</h3>
                  <p className="text-[11px] text-slate-400">
                    Crie a página completa em 1 segundo com copywriting e blocos prontos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300">Escolha o estilo do evento:</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "tecnologico",
                    label: "Tecnologia & Inovação",
                    desc: "Visual escuro, hero de impacto e pilares práticos",
                    icon: Cpu,
                  },
                  {
                    id: "corporativo",
                    label: "Executivo & Negócios",
                    desc: "Tom C-Level com cúpula e credenciais",
                    icon: Building2,
                  },
                  {
                    id: "minimalista",
                    label: "Clean & Acadêmico",
                    desc: "Fundo claro, tipografia limpa e foco no conteúdo",
                    icon: Minimize2,
                  },
                  {
                    id: "show",
                    label: "Webinar Dinâmico",
                    desc: "Layout split vibrante de alta conversão",
                    icon: Flame,
                  },
                ].map((st) => (
                  <div
                    key={st.id}
                    onClick={() => setSelectedStyle(st.id as any)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      selectedStyle === st.id
                        ? "border-[#00b4fb] bg-[#00b4fb]/10 text-white"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <st.icon className="h-4 w-4 text-[#00b4fb]" />
                      <span className="text-xs font-bold">{st.label}</span>
                    </div>
                    <p className="text-[10px] opacity-70 leading-relaxed">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 text-[11px] text-slate-400 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-[#00b4fb] shrink-0 mt-0.5" />
              <span>
                A IA lerá o título <b>"{event.title}"</b> e criará a estrutura completa com Navbar, Hero, Sobre, Palestrantes, Agenda, Patrocinadores e Chamada de Inscrição.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <Wand2 className="h-4 w-4" />
                <span>{isGenerating ? "Gerando Layout..." : "Gerar Página Agora"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
