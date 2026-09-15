"use client";

import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Globe,
  Radio,
  CheckCircle2,
  Users,
  Copy,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Share2,
  X,
  Play
} from "lucide-react";
import { PageBlock, getDefaultBlocksForTheme } from "@/components/builder/builderTemplates";

interface Props {
  event: any;
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  registrationResult: any;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCopyLink: () => void;
  copiedLink: boolean;
  googleCalendarUrl: () => string;
  formatDateString: (iso: string) => string;
}

export default function AdvancedLandingPage({
  event,
  formData,
  setFormData,
  isSubmitting,
  registrationResult,
  onSubmit,
  onCopyLink,
  copiedLink,
  googleCalendarUrl,
  formatDateString,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parse blocks
  const blocks: PageBlock[] = React.useMemo(() => {
    if (event.customLandingJson) {
      try {
        const parsed = JSON.parse(event.customLandingJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return getDefaultBlocksForTheme(event.advancedTheme || "crosby", event);
  }, [event.customLandingJson, event.advancedTheme]);

  const theme = event.advancedTheme || "crosby";
  const isDark = theme === "seldon" || theme === "nolan";

  const handleInputChange = (field: string, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCheckboxChange = (field: string, option: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev[field] ? prev[field].split(", ").filter(Boolean) : [];
      let updated = checked ? [...current, option] : current.filter((o) => o !== option);
      return { ...prev, [field]: updated.join(", ") };
    });
  };

  return (
    <div
      className={`min-h-screen font-sans ${
        isDark ? "bg-[#090d16] text-white" : "bg-white text-slate-900"
      }`}
    >
      {/* RENDER BLOCKS IN ORDER */}
      {blocks.map((block) => {
        return (
          <div key={block.id}>
            {/* 1. STANDALONE NAVIGATION */}
            {block.type === "standalone_nav" && (
              <header
                className={`sticky top-0 z-30 px-6 py-4 border-b backdrop-blur-md ${
                  isDark
                    ? "border-slate-800/80 bg-[#090d16]/90 text-white"
                    : "border-slate-200/80 bg-white/90 text-slate-900"
                }`}
              >
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      {event.logoUrl ? (
                        <img src={event.logoUrl} alt="Logo" className="h-7 w-auto max-w-[130px]" />
                      ) : (
                        <span className="font-extrabold text-sm tracking-tight">
                          ✦ {event.title || "Buysoft Events"}
                        </span>
                      )}
                    </div>

                    <div className="hidden md:flex items-center gap-6 text-xs font-semibold opacity-75">
                      <a href="#home" className="hover:opacity-100 transition">
                        Home
                      </a>
                      <span>•</span>
                      <a href="#about" className="hover:opacity-100 transition">
                        About
                      </a>
                      <span>•</span>
                      <a href="#speakers" className="hover:opacity-100 transition">
                        Synced Speakers
                      </a>
                      <span>•</span>
                      <a href="#schedule" className="hover:opacity-100 transition">
                        Synced Schedule
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95"
                  >
                    {block.ctaText || "Tickets"}
                  </button>
                </div>
              </header>
            )}

            {/* 2. HERO OPTION 1 (Maxi Cover) */}
            {block.type === "hero_opt1" && (
              <section
                id="home"
                className="relative min-h-[500px] sm:min-h-[560px] flex items-center justify-center p-8 sm:p-16 overflow-hidden text-center text-white"
              >
                <img
                  src={
                    block.imageUrl ||
                    event.bannerUrl ||
                    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80"
                  }
                  alt="Cover"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

                <div className="relative z-10 max-w-3xl mx-auto space-y-5">
                  <div className="flex justify-center">
                    <span className="text-xl font-bold tracking-tight opacity-90">
                      ✦ {event.title}
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight">
                    {block.title || event.title}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                    {block.subtitle || event.description}
                  </p>

                  <div className="text-xs sm:text-sm font-bold text-sky-400">
                    {block.dateText || formatDateString(event.startDate)}
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-8 py-3 text-sm font-bold text-white shadow-xl shadow-[#00b4fb]/30 transition active:scale-95"
                    >
                      {block.ctaText || "Inscreva-se Agora"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 3. HERO OPTION 2 (Split Columns) */}
            {block.type === "hero_opt2" && (
              <section id="home" className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00b4fb]">
                      ✦ {event.title}
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                      {block.title || event.title}
                    </h1>
                    <p className="text-sm leading-relaxed opacity-75">
                      {block.subtitle || event.description}
                    </p>
                    <div className="text-xs font-bold text-[#00b4fb]">
                      {block.dateText || formatDateString(event.startDate)}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-7 py-3 text-xs font-bold text-white shadow-lg shadow-[#00b4fb]/20 transition"
                      >
                        {block.ctaText || "Register"}
                      </button>
                    </div>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                    <img
                      src={
                        block.imageUrl ||
                        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
                      }
                      alt="Visual"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </section>
            )}

            {/* 4. HERO OPTION 3 (Minimalist Clean) */}
            {block.type === "hero_opt3" && (
              <section id="home" className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center space-y-5">
                <span className="text-xs font-bold uppercase tracking-wider opacity-60">
                  ✦ {event.title}
                </span>
                <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight">
                  {block.title || event.title}
                </h1>
                <p className="text-sm sm:text-base leading-relaxed opacity-75 max-w-2xl mx-auto">
                  {block.subtitle || event.description}
                </p>
                <div className="text-xs font-bold text-[#00b4fb]">
                  {block.dateText || formatDateString(event.startDate)}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-8 py-3 text-xs font-bold text-white shadow-md transition"
                  >
                    {block.ctaText || "Register"}
                  </button>
                </div>
              </section>
            )}

            {/* 5. RICH TEXT */}
            {block.type === "rich_text" && (
              <section id="about" className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-200/20 space-y-4">
                <h3 className="text-2xl font-bold tracking-tight">{block.title || "About Details"}</h3>
                <p className="text-sm leading-relaxed opacity-80 whitespace-pre-line">{block.content}</p>
              </section>
            )}

            {/* 6. TWO COL TEXT */}
            {block.type === "two_col_text" && (
              <section id="about" className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200/20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <div className="md:col-span-4 space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">{block.title}</h3>
                    <p className="text-xs text-[#00b4fb] font-semibold">{block.subtitle}</p>
                  </div>
                  <div className="md:col-span-8">
                    <p className="text-sm leading-relaxed opacity-80">{block.content}</p>
                  </div>
                </div>
              </section>
            )}

            {/* 7. THREE COL TEXT */}
            {block.type === "three_col_text" && (
              <section className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200/20 space-y-6">
                <h3 className="text-2xl font-bold tracking-tight">{block.title || "Look forward to..."}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {(
                    block.extraData?.items || [
                      { title: "Masterclasses", text: "Workshops práticos com oradores de ponta." },
                      { title: "Networking", text: "Salas virtuais para conexões executivas." },
                      { title: "Live Q&A", text: "Envio de perguntas e votação interativa." },
                    ]
                  ).map((it: any, i: number) => (
                    <div key={i} className="p-5 rounded-2xl border border-slate-200/30 bg-slate-500/5 space-y-2">
                      <h4 className="text-sm font-bold text-[#00b4fb]">{it.title}</h4>
                      <p className="text-xs opacity-75 leading-relaxed">{it.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 8. IMAGE TEXT TWO COL */}
            {block.type === "image_text_two_col" && (
              <section className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight">{block.title}</h3>
                    <p className="text-xs text-[#00b4fb] font-semibold">{block.subtitle}</p>
                    <p className="text-sm leading-relaxed opacity-80">{block.content}</p>
                  </div>
                  <div className="rounded-3xl overflow-hidden aspect-[4/3] shadow-lg">
                    <img src={block.imageUrl} alt="Visual" className="h-full w-full object-cover" />
                  </div>
                </div>
              </section>
            )}

            {/* 9. SPONSORS GOLD */}
            {block.type === "sponsors_gold" && (
              <section className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200/20 text-center space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                  {block.title || "Patrocinadores Master"}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                  {["Opentech", "Globex", "Keyspace"].map((sp, i) => (
                    <div
                      key={i}
                      className="px-8 py-3.5 rounded-2xl border border-slate-200/40 bg-slate-500/5 font-bold text-xs shadow-2xs"
                    >
                      ✦ {sp}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 10. SPONSORS SILVER */}
            {block.type === "sponsors_silver" && (
              <section className="max-w-6xl mx-auto px-6 py-8 border-t border-slate-200/20 text-center space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-60">
                  {block.title || "Apoiadores Institucionais"}
                </span>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  {["Coursera", "Kakao", "OneSky", "Fastly"].map((sp, i) => (
                    <div
                      key={i}
                      className="px-5 py-2.5 rounded-xl border border-slate-200/30 bg-slate-500/5 text-xs font-semibold opacity-70"
                    >
                      {sp}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 11. SPEAKERS GRID */}
            {block.type === "speakers_grid" && (
              <section id="speakers" className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200/20 space-y-8">
                <div className="text-center max-w-xl mx-auto space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {block.title || "Synced Speakers"}
                  </h3>
                  <p className="text-xs opacity-70">{block.subtitle || "Palestrantes convidados"}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {event.speakers && event.speakers.length > 0 ? (
                    event.speakers.map((sp: any) => (
                      <div
                        key={sp.id}
                        className="p-5 rounded-3xl border border-slate-200/30 bg-slate-500/5 flex flex-col items-center text-center space-y-3 shadow-xs"
                      >
                        <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shadow-md">
                          {sp.avatarUrl ? (
                            <img src={sp.avatarUrl} alt={sp.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-base font-bold text-slate-700">{sp.name.charAt(0)}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold leading-tight">{sp.name}</h4>
                        <p className="text-xs text-[#00b4fb] font-semibold leading-tight">
                          {sp.role} {sp.company ? `• ${sp.company}` : ""}
                        </p>
                        {sp.bio && <p className="text-[11px] opacity-70 line-clamp-3">{sp.bio}</p>}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-8 text-center text-xs opacity-60">
                      Nenhum palestrante cadastrado no momento.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 12. SCHEDULE TIMELINE */}
            {block.type === "schedule_timeline" && (
              <section id="schedule" className="max-w-4xl mx-auto px-6 py-14 border-t border-slate-200/20 space-y-8">
                <div className="text-center max-w-xl mx-auto space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {block.title || "Synced Schedule"}
                  </h3>
                  <p className="text-xs opacity-70">{block.subtitle || "Agenda das transmissões"}</p>
                </div>

                <div className="space-y-3">
                  {(
                    block.extraData?.items || [
                      { time: "17:00", title: "Abertura Oficial & Boas-Vindas", speaker: "Head de Produto" },
                      { time: "17:20", title: "Novos Paradigmas de Engajamento", speaker: "Orador Convidado" },
                      { time: "17:45", title: "Sessão de Perguntas e Respostas ao Vivo", speaker: "Todos" },
                    ]
                  ).map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/30 bg-slate-500/5 text-xs"
                    >
                      <div className="rounded-xl bg-[#00b4fb]/15 text-[#00b4fb] px-3 py-1.5 font-mono font-bold shrink-0">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm leading-tight">{item.title}</h4>
                        <p className="text-xs opacity-70 mt-0.5">{item.speaker}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 13. MEDIA VIDEO */}
            {block.type === "media_video" && (
              <section className="max-w-4xl mx-auto px-6 py-14 border-t border-slate-200/20 text-center space-y-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight">{block.title || "Veja o que espera por você"}</h3>
                  <p className="text-xs opacity-70">{block.subtitle}</p>
                </div>
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="h-16 w-16 rounded-full bg-[#00b4fb] flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition">
                      <Play className="h-7 w-7 fill-white text-white ml-1" />
                    </div>
                    <span className="text-xs font-semibold opacity-90">Teaser Oficial do Evento</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        );
      })}

      {/* FOOTER */}
      <footer className="border-t border-slate-200/20 py-8 px-6 text-center text-xs opacity-60">
        <p>
          © {new Date().getFullYear()} {event.title} • Organizado com <b>Buysoft Events</b>
        </p>
      </footer>

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Inscrição no Webinar</h3>
                <p className="text-xs text-slate-500 mt-0.5">{event.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {registrationResult ? (
                /* Confirmation Screen matching item 3 */
                <div className="text-center py-6 space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Inscrição Confirmada!</h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    {event.confirmationMessage ||
                      "Obrigado por se inscrever! Seu acesso ao webinar está confirmado."}
                  </p>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={onCopyLink}
                      className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copiedLink ? "Link Copiado!" : "Copiar Link de Acesso Exclusivo"}</span>
                    </button>

                    <a
                      href={googleCalendarUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] py-2.5 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Adicionar ao Google Agenda</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData["Nome completo"] || ""}
                      onChange={(e) => handleInputChange("Nome completo", e.target.value)}
                      placeholder="Seu nome"
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  {/* E-mail */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seu melhor e-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData["Seu melhor e-mail"] || ""}
                      onChange={(e) => handleInputChange("Seu melhor e-mail", e.target.value)}
                      placeholder="nome@empresa.com"
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  {/* Dynamic Form Fields from Database */}
                  {event.formFields &&
                    event.formFields
                      .filter((f: any) => {
                        const l = f.label.toLowerCase();
                        return (
                          l !== "nome" &&
                          l !== "sobrenome" &&
                          l !== "nome completo" &&
                          l !== "e-mail" &&
                          l !== "email" &&
                          l !== "seu melhor e-mail"
                        );
                      })
                      .map((field: any) => {
                        let opts: string[] = [];
                        if (field.options) opts = field.options;
                        else if (field.optionsJson) {
                          try {
                            opts = JSON.parse(field.optionsJson);
                          } catch {}
                        }

                        if (field.type === "paragraph") {
                          return (
                            <div key={field.id}>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              <textarea
                                rows={3}
                                required={field.required}
                                value={formData[field.label] || ""}
                                onChange={(e) => handleInputChange(field.label, e.target.value)}
                                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#00b4fb] focus:outline-none"
                              />
                            </div>
                          );
                        }

                        if (field.type === "select") {
                          return (
                            <div key={field.id}>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              <select
                                required={field.required}
                                value={formData[field.label] || ""}
                                onChange={(e) => handleInputChange(field.label, e.target.value)}
                                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#00b4fb] focus:outline-none bg-white"
                              >
                                <option value="">Selecione uma opção...</option>
                                {opts.map((opt, i) => (
                                  <option key={i} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        if (field.type === "checkbox") {
                          return (
                            <div key={field.id} className="space-y-1.5">
                              <label className="block text-xs font-bold text-slate-700">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </label>
                              <div className="space-y-1">
                                {opts.map((opt, i) => {
                                  const selected = (formData[field.label] || "")
                                    .split(", ")
                                    .includes(opt);
                                  return (
                                    <label key={i} className="flex items-center gap-2 text-xs text-slate-700">
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={(e) =>
                                          handleCheckboxChange(field.label, opt, e.target.checked)
                                        }
                                        className="rounded border-slate-300 text-[#00b4fb] focus:ring-[#00b4fb]"
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={field.id}>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                              type={field.type === "date" ? "date" : "text"}
                              required={field.required}
                              value={formData[field.label] || ""}
                              onChange={(e) => handleInputChange(field.label, e.target.value)}
                              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-[#00b4fb] focus:outline-none"
                            />
                          </div>
                        );
                      })}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] py-3 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Enviando Inscrição..." : "Confirmar Inscrição"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
