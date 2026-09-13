"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  Globe,
  Radio,
  Sparkles,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  ArrowRight,
  ArrowLeft,
  Users,
  Video,
  MessageSquare,
  BarChart2
} from "lucide-react";
import { WebinarEvent } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (event: Partial<WebinarEvent>) => void;
}

export default function CreateEventWizard({ isOpen, onClose, onCreateEvent }: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  // Form State
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("2026-10-12T17:00");
  const [endDate, setEndDate] = useState("2026-10-12T18:00");
  const [timezone, setTimezone] = useState("(GMT-03:00) Horário de Brasília");
  const [description, setDescription] = useState(
    "Participe deste webinar exclusivo onde compartilharemos estratégias práticas, demonstrações de recursos ao vivo e responderemos a todas as dúvidas da plateia."
  );

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setStep(2);
  };

  const handleFinish = () => {
    onCreateEvent({
      title,
      startDate,
      endDate,
      timezone,
      description,
      status: "draft",
      registeredCount: 0,
      maxAttendees: 100,
      speakers: [],
      formFields: [
        { id: "f_1", label: "Nome completo", type: "text", required: true },
        { id: "f_2", label: "E-mail de contato", type: "text", required: true },
      ],
      settings: {
        chatEnabled: true,
        qaEnabled: true,
        pollsEnabled: true,
        attendeeListVisible: true,
        autoRecord: true,
        primaryColor: "#00b4fb",
        backgroundColor: "#ffffff",
        textColor: "#0f172a",
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col min-h-[640px]">
        {/* Header Bar */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-6 bg-slate-50/50">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition mr-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Voltar</span>
              </button>
            )}
            <span className="text-xs font-bold uppercase tracking-wider text-[#0084be]">
              Passo {step} de 2: {step === 1 ? "Configuração Inicial" : "Descrição e Landing Page"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: Basic Info & Live Preview Mockup */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 p-6 sm:p-8 gap-8">
            {/* Left Form: 7 cols */}
            <form onSubmit={handleNext} className="lg:col-span-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Vamos configurar seu webinar
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Preencha os dados essenciais para criarmos sua sala e a página de inscrição.
                  </p>
                </div>

                {/* Event Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do webinar (obrigatório) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Demonstração de Soluções Buysoft 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                  />
                </div>

                {/* Dates Start/End */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Começa em
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Termina em
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fuso horário
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                  >
                    <option value="(GMT-03:00) Horário de Brasília">
                      (GMT-03:00) Horário de Brasília (São Paulo)
                    </option>
                    <option value="(GMT-04:00) Horário do Amazonas">
                      (GMT-04:00) Horário do Amazonas (Manaus)
                    </option>
                    <option value="(GMT+00:00) UTC">
                      (GMT+00:00) UTC (Londres / Lisboa)
                    </option>
                    <option value="(GMT-05:00) Eastern Time">
                      (GMT-05:00) Horário do Leste (Nova York / Miami)
                    </option>
                  </select>
                </div>

                {/* Event Type: Webinar (100% Focused, single option) */}
                <div className="pt-2">
                  <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Formato da Transmissão
                  </span>
                  <div className="rounded-xl border-2 border-[#00b4fb] bg-[#e6f7fe]/40 p-3.5 flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00b4fb] text-white">
                      <Radio className="h-3 w-3" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Webinar Corporativo</span>
                        <span className="rounded-full bg-[#00b4fb] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                          Até 100 participantes
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Transmissão nativa e transparente no navegador (sem programas externos), com Camarim privado (Backstage), chat com moderação, P&R com votos e Live CTA de conversão.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Step 1 */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="flex items-center gap-2 rounded-xl bg-[#00b4fb] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-200 hover:bg-[#009ce0] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Continuar para a Descrição</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Right Side: Visual Mockup (estilo print do RingCentral) */}
            <div className="hidden lg:flex lg:col-span-5 flex-col justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/80 p-6">
              <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                {/* Mockup stage window */}
                <div className="bg-slate-900 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                    Ao Vivo
                  </span>
                </div>

                {/* Mockup Stage Content */}
                <div className="p-3 bg-slate-950 text-white flex flex-col gap-2">
                  <div className="aspect-video w-full rounded-lg bg-gradient-to-tr from-[#0084be] to-[#00b4fb] p-3 flex flex-col justify-between shadow-inner">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        Buysoft Stage
                      </span>
                      <span className="bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" /> 84 online
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs leading-snug line-clamp-2">
                        {title || "Título do Seu Webinar ao Vivo"}
                      </h4>
                      <p className="text-[9px] text-blue-100 mt-0.5">Palestrantes apresentando slides</p>
                    </div>
                  </div>

                  {/* Speakers thumbnails below */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-12 rounded-md bg-slate-800 p-1.5 flex items-center gap-2 border border-slate-700">
                      <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold">
                        EN
                      </div>
                      <div className="text-[9px]">
                        <p className="font-bold truncate text-slate-200">Eliel Nunes</p>
                        <p className="text-[8px] text-slate-400">Host</p>
                      </div>
                    </div>

                    <div className="h-12 rounded-md bg-slate-800 p-1.5 flex items-center gap-2 border border-slate-700">
                      <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold">
                        SP
                      </div>
                      <div className="text-[9px]">
                        <p className="font-bold truncate text-slate-200">Palestrante</p>
                        <p className="text-[8px] text-emerald-400">Ao vivo</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mockup Chat */}
                <div className="p-2.5 bg-white border-t border-slate-100 flex flex-col gap-1.5 text-[10px]">
                  <div className="flex items-center justify-between font-bold text-slate-400 border-b border-slate-100 pb-1">
                    <span>Chat ao vivo</span>
                    <span>Q&A</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="font-bold text-slate-900">Mariana:</span>
                    <span className="truncate">Excelente apresentação! 👏</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Description & Landing Page Live Preview */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 p-6 sm:p-8 gap-8">
            {/* Left Form: Description Editor */}
            <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Sobre o que é seu webinar?
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Deixe seus participantes saberem o que esperar do evento. Esta descrição aparecerá na sua página de inscrição.
                  </p>
                </div>

                {/* Rich text editor mockup */}
                <div className="rounded-xl border border-slate-300 overflow-hidden focus-within:border-[#00b4fb] focus-within:ring-1 focus-within:ring-[#00b4fb]">
                  {/* Toolbar */}
                  <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-600">
                    <button type="button" className="p-1 hover:bg-slate-200 rounded">
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded">
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded">
                      <Underline className="h-3.5 w-3.5" />
                    </button>
                    <div className="h-4 w-[1px] bg-slate-300 mx-1" />
                    <button type="button" className="p-1 hover:bg-slate-200 rounded">
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded">
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded">
                      <Link className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Escreva a descrição do evento..."
                    className="w-full p-3.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#00b4fb]" />
                  <span>Você poderá personalizar cores, banners e palestrantes na aba de Configurações após a criação.</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="flex items-center gap-2 rounded-xl bg-[#00b4fb] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-200 hover:bg-[#009ce0] transition"
                >
                  <span>Criar Webinar e Acessar Painel</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right Side: Landing Page Preview (estilo Tela criar evento 2.png) */}
            <div className="hidden lg:flex lg:col-span-6 flex-col justify-center items-center bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden flex flex-col">
                {/* Banner */}
                <div className="h-32 w-full bg-gradient-to-r from-[#0084be] via-[#00b4fb] to-sky-400 p-4 flex flex-col justify-end text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded w-fit mb-1">
                    Buysoft Webinar
                  </span>
                  <h3 className="text-base font-bold leading-tight">{title || "Nome do Seu Evento"}</h3>
                </div>

                {/* Landing page body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="text-xs text-slate-600">
                      <p className="font-semibold text-slate-800">12 de Outubro de 2026</p>
                      <p className="text-[11px] text-slate-500">17:00 às 18:00 (BRT)</p>
                    </div>

                    <button
                      type="button"
                      className="rounded-lg bg-[#00b4fb] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
                    >
                      Inscrever-se Grátis
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">Sobre o Webinar</h4>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                      {description || "A descrição aparecerá aqui para os participantes."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
