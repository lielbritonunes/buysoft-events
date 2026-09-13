"use client";

import React, { useEffect, useState, use } from "react";
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
  Layers,
  Check,
  Video
} from "lucide-react";
import { getSeriesById, registerSeriesAttendee } from "@/lib/dbActions";

interface Props {
  params: Promise<{ id: string }>;
}

export default function PublicSeriesPage({ params }: Props) {
  const resolvedParams = use(params);
  const seriesId = resolvedParams.id;

  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);

  // Form submission state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const s = await getSeriesById(seriesId);
        setSeries(s);
        if (s?.events && s.events.length > 0) {
          // Select all by default
          setSelectedEventIds(s.events.map((e: any) => e.id));
        }
      } catch (err) {
        console.error("Error loading series:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [seriesId]);

  const toggleEventSelection = (id: string) => {
    if (selectedEventIds.includes(id)) {
      if (selectedEventIds.length === 1) return; // keep at least one
      setSelectedEventIds(selectedEventIds.filter((eId) => eId !== id));
    } else {
      setSelectedEventIds([...selectedEventIds, id]);
    }
  };

  const selectAllEvents = () => {
    if (series?.events) {
      setSelectedEventIds(series.events.map((e: any) => e.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    try {
      const res = await registerSeriesAttendee(seriesId, {
        attendeeName: formData.name,
        attendeeEmail: formData.email,
        responses: {
          Empresa: formData.company,
          Cargo: formData.role,
        },
        selectedEventIds,
      });
      setRegistrationResult({
        enrolledCount: res.length,
        registrations: res.map((r: any) => ({
          id: r.id,
          eventTitle: r.event?.title || "Webinar",
          magicLinkToken: r.magicLinkToken,
        })),
      });
    } catch (err) {
      console.error("Error registering in series:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#00b4fb] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Carregando série de eventos...</p>
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center font-sans">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200">
          <Layers className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Série não encontrada</h1>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          A série de webinars que você está procurando não existe ou foi removida pelo organizador.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-[#00b4fb] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00b4fb] to-sky-400 text-white font-black text-base shadow-sm">
              B
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900">Buysoft Events</span>
              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00b4fb] border border-blue-100">
                Série Oficial
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Share2 className="h-3.5 w-3.5" />}
            {copiedLink ? "Link copiado!" : "Compartilhar"}
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Banner if exists */}
        {series.bannerUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-md aspect-[5/2] max-h-72 w-full">
            <img
              src={series.bannerUrl}
              alt={series.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Series Details & Included Events */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#00b4fb] mb-4 border border-blue-100">
                <Layers className="h-3.5 w-3.5" />
                Trilha de Webinars
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {series.title}
              </h1>

              {series.description && (
                <p className="mt-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {series.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4 pt-6 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-4 w-4 text-[#00b4fb]" />
                  <span>{series.events?.length || 0} eventos inclusos</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Inscrição Unificada em 1 Passo</span>
                </div>
              </div>
            </div>

            {/* List of Events in the Series */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#00b4fb]" />
                  Eventos desta série
                </h2>
                {series.events?.length > 1 && (
                  <button
                    onClick={selectAllEvents}
                    className="text-xs font-semibold text-[#00b4fb] hover:underline"
                  >
                    Selecionar todos
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {series.events && series.events.length > 0 ? (
                  series.events.map((ev: any, index: number) => {
                    const isSelected = selectedEventIds.includes(ev.id);
                    return (
                      <div
                        key={ev.id}
                        onClick={() => !registrationResult && toggleEventSelection(ev.id)}
                        className={`group relative flex items-start gap-4 rounded-xl border p-4 transition cursor-pointer ${
                          isSelected
                            ? "border-[#00b4fb] bg-sky-50/40 ring-1 ring-[#00b4fb]/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!!registrationResult}
                            onChange={() => toggleEventSelection(ev.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#00b4fb] focus:ring-[#00b4fb]"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              Parte {index + 1}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(ev.startDate).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#00b4fb] transition">
                            {ev.title}
                          </h3>
                          {ev.description && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                              {ev.description}
                            </p>
                          )}
                          {ev.speakers && ev.speakers.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              {ev.speakers.slice(0, 3).map((sp: any) => (
                                <span
                                  key={sp.id}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5"
                                >
                                  👤 {sp.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Nenhum evento vinculado a esta série ainda.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Registration Card or Success Card */}
          <div className="lg:col-span-5">
            {registrationResult ? (
              /* Success State */
              <div className="sticky top-24 rounded-2xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Inscrição Confirmada!</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Você foi inscrito em <b>{registrationResult.enrolledCount} evento(s)</b> desta série.
                  Os links de transmissão e confirmações foram gerados:
                </p>

                <div className="mt-6 space-y-3">
                  {registrationResult.registrations?.map((reg: any) => (
                    <div key={reg.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                      <p className="text-xs font-bold text-slate-900 truncate">{reg.eventTitle}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">Acesso individual:</span>
                        <a
                          href={`/live/${reg.magicLinkToken}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#00b4fb] hover:underline"
                        >
                          Entrar na sala <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setRegistrationResult(null)}
                  className="mt-6 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Fazer outra inscrição
                </button>
              </div>
            ) : (
              /* Form State */
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Garanta sua vaga na série</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Preencha seus dados uma única vez para garantir acesso a todos os eventos selecionados.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Ana Silva"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ana@empresa.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Ex: Buysoft do Brasil"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cargo / Função
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      placeholder="Ex: Diretor de Tecnologia"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div className="rounded-xl bg-blue-50/50 border border-blue-100 p-3 text-xs text-blue-900">
                    <span className="font-semibold">Eventos selecionados:</span> {selectedEventIds.length} de {series.events?.length || 0}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || selectedEventIds.length === 0}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-sm font-bold text-white shadow-sm hover:bg-[#009edc] transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        Confirmar Inscrição na Série
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    Ao se inscrever você receberá lembretes e links de acesso direto para cada sessão.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
