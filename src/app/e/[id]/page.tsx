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
  Share2
} from "lucide-react";
import { getEventById, registerAttendee } from "@/lib/dbActions";
import PuckPublicRenderer from "@/components/puck/PuckPublicRenderer";
import { generateAIPuckPage } from "@/components/puck/aiPageGenerator";

interface Props {
  params: Promise<{ id: string }>;
}

export default function PublicEventPage({ params }: Props) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detectedTimezone, setDetectedTimezone] = useState("Detectando...");
  
  // Form submission state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Detect visitor timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(tz);
    } catch {
      setDetectedTimezone("Horário Local");
    }

    // Load event from database
    async function loadData() {
      try {
        const ev = await getEventById(eventId);
        setEvent(ev);
      } catch (err) {
        console.error("Error loading event:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  // Countdown calculation
  useEffect(() => {
    if (!event?.startDate) return;

    const target = new Date(event.startDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [event]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#00b4fb] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Carregando webinar...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <Radio className="h-12 w-12 text-slate-300 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Webinar não encontrado</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          O link que você tentou acessar não existe ou o webinar foi removido.
        </p>
        <a
          href="/"
          className="mt-4 rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white hover:bg-[#009ce0] transition"
        >
          Voltar para Buysoft Events
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const name = formData["Nome completo"] || formData["name"] || Object.values(formData)[0] || "Participante";
      const email = formData["Seu melhor e-mail"] || formData["E-mail de contato"] || formData["email"] || Object.values(formData)[1] || "participante@exemplo.com";

      const res = await registerAttendee(event.id, {
        attendeeName: name,
        attendeeEmail: email,
        responses: formData,
      });

      setRegistrationResult(res);
    } catch (err) {
      console.error("Error registering:", err);
      alert("Erro ao enviar inscrição. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const magicLink = `${window.location.origin}/live/${event.id}?token=${registrationResult?.magicLinkToken || "direct"}`;
    navigator.clipboard.writeText(magicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Google Calendar URL builder
  const googleCalendarUrl = () => {
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(
      `Webinar Buysoft Events.\nAcesse pelo seu link exclusivo no dia: ${window.location.origin}/live/${event.id}`
    );
    // Format dates to YYYYMMDDTHHmmssZ
    const cleanDate = (iso: string) => {
      try {
        return new Date(iso).toISOString().replace(/-|:|\.\d+/g, "");
      } catch {
        return "";
      }
    };
    const start = cleanDate(event.startDate);
    const end = cleanDate(event.endDate);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  };

  const formatDateString = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (event.layoutType === "advanced") {
    let puckData = null;
    if (event.customLandingJson) {
      try {
        const parsed = JSON.parse(event.customLandingJson);
        if (parsed && parsed.content && Array.isArray(parsed.content)) {
          puckData = parsed;
        }
      } catch {}
    }
    if (!puckData) {
      puckData = generateAIPuckPage({ event, style: "tecnologico" });
    }

    return (
      <PuckPublicRenderer
        event={event}
        puckData={puckData}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        registrationResult={registrationResult}
        onSubmit={handleSubmit}
        onCopyLink={handleCopyLink}
        copiedLink={copiedLink}
        googleCalendarUrl={googleCalendarUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Brand Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {event.logoUrl ? (
              <img src={event.logoUrl} alt="Logo" className="h-7 w-auto object-contain max-w-[140px]" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs font-bold"
                style={{ backgroundColor: event.primaryColor || "#00b4fb" }}
              >
                <Radio className="h-4 w-4" />
              </div>
            )}
            <span className="text-sm font-bold tracking-tight text-slate-900">
              Buysoft <span style={{ color: event.primaryColor || "#00b4fb" }}>Events</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <span>{detectedTimezone}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Banner if exists */}
        {event.bannerUrl && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-md aspect-[5/2] max-h-72 w-full">
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (Details & Speakers): 7 cols */}
          <div className="lg:col-span-7 space-y-8">
            {/* Event Header Card */}
            <div className="space-y-4">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border"
                style={{
                  backgroundColor: `${event.primaryColor || "#00b4fb"}15`,
                  color: event.primaryColor || "#0084be",
                  borderColor: `${event.primaryColor || "#00b4fb"}40`,
                }}
              >
                <Radio className="h-3.5 w-3.5" />
                <span>Webinar Online • Transmissão Exclusiva</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {event.title}
              </h1>

              {/* Date, Time & Location Banner */}
              <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs text-xs text-slate-700">
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0084be]">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Data e Horário</p>
                    <p className="text-slate-500 capitalize">{formatDateString(event.startDate)}</p>
                  </div>
                </div>

                <div className="hidden sm:block w-[1px] bg-slate-200" />

                <div className="flex items-center gap-2.5 flex-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Acesso 100% Gratuito</p>
                    <p className="text-slate-500">Diretamente no navegador (sem downloads)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-md">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-400 text-center mb-3">
                O evento começa em
              </p>
              <div className="grid grid-cols-4 gap-2 text-center max-w-sm mx-auto">
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="text-xl sm:text-2xl font-black">{timeLeft.days}</span>
                  <span className="text-[10px] text-slate-300 block uppercase">Dias</span>
                </div>
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="text-xl sm:text-2xl font-black">{timeLeft.hours}</span>
                  <span className="text-[10px] text-slate-300 block uppercase">Horas</span>
                </div>
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="text-xl sm:text-2xl font-black">{timeLeft.minutes}</span>
                  <span className="text-[10px] text-slate-300 block uppercase">Min</span>
                </div>
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="text-xl sm:text-2xl font-black">{timeLeft.seconds}</span>
                  <span className="text-[10px] text-slate-300 block uppercase">Seg</span>
                </div>
              </div>
            </div>

            {/* Description / About Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-3">
              <h3 className="text-base font-bold text-slate-900">Sobre este Webinar</h3>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
                <p>{event.description}</p>
              </div>
            </div>

            {/* Speakers Section */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Palestrantes Confirmados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((spk: any) => (
                    <div
                      key={spk.id}
                      className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white font-bold text-sm shadow-xs">
                        {spk.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{spk.name}</h4>
                        <p className="text-xs font-semibold text-[#0084be]">{spk.role}</p>
                        <p className="text-[11px] text-slate-500 truncate">{spk.company}</p>
                        {spk.bio && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{spk.bio}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Registration Box (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl">
              {registrationResult ? (
                /* Success State */
                <div className="text-center space-y-4 animate-in fade-in zoom-in-95">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Inscrição Confirmada!</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                      {event.confirmationMessage || `Você garantiu sua vaga no webinar de ${event.title}.`}
                    </p>
                  </div>

                  {/* Magic Link Box */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Seu Link Exclusivo de Entrada (Sem Senha)
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-white rounded-xl border border-slate-200 p-2">
                      <span className="text-xs text-slate-700 truncate font-mono">
                        {`${window.location.origin}/live/${event.id}?token=${registrationResult.magicLinkToken}`}
                      </span>
                      <button
                        onClick={handleCopyLink}
                        className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 transition"
                        title="Copiar link"
                      >
                        {copiedLink ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Guarde esse link ou adicione diretamente ao seu calendário abaixo.
                    </p>
                  </div>

                  {/* Access Live Room & Calendar Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <a
                      href={`/live/${event.id}?name=${encodeURIComponent(registrationResult.attendeeName)}&email=${encodeURIComponent(registrationResult.attendeeEmail)}&token=${registrationResult.magicLinkToken}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-xs font-bold text-white shadow-md shadow-sky-200 hover:bg-[#009ce0] transition"
                    >
                      <Radio className="h-4 w-4" />
                      <span>Entrar na Sala do Webinar Agora</span>
                    </a>

                    <a
                      href={googleCalendarUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Calendar className="h-4 w-4 text-[#00b4fb]" />
                      <span>Adicionar ao Google Agenda</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Garanta sua Vaga</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Preencha o formulário abaixo para receber o link exclusivo da sala.
                    </p>
                  </div>

                  {/* Form fields rendered dynamically from event.formFields */}
                  <div className="space-y-3.5 pt-2">
                    {event.formFields && event.formFields.length > 0 ? (
                      event.formFields.map((field: any) => {
                        let parsedOptions: string[] = [];
                        if (Array.isArray(field.options)) {
                          parsedOptions = field.options;
                        } else if (field.optionsJson) {
                          try {
                            parsedOptions = JSON.parse(field.optionsJson);
                          } catch {}
                        }

                        if (field.type === "hidden") {
                          return (
                            <input
                              key={field.id}
                              type="hidden"
                              value={formData[field.label] || ""}
                            />
                          );
                        }

                        if (field.type === "terms") {
                          return (
                            <div key={field.id} className="pt-1">
                              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                                <input
                                  type="checkbox"
                                  required={field.required}
                                  checked={formData[field.label] === "true"}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      [field.label]: e.target.checked ? "true" : ""
                                    })
                                  }
                                  className="mt-0.5 h-4 w-4 accent-[#00b4fb] rounded shrink-0"
                                />
                                <span className="text-[11px] text-slate-600 leading-snug">
                                  {field.label}{" "}
                                  {field.required && <span className="text-rose-500">*</span>}
                                </span>
                              </label>
                            </div>
                          );
                        }

                        return (
                          <div key={field.id}>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </label>

                            {field.type === "paragraph" ? (
                              <textarea
                                rows={3}
                                required={field.required}
                                value={formData[field.label] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.label]: e.target.value })
                                }
                                placeholder={`Escreva aqui...`}
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] resize-none"
                              />
                            ) : field.type === "select" ? (
                              <select
                                required={field.required}
                                value={formData[field.label] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.label]: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] bg-white"
                              >
                                <option value="">Selecione uma opção...</option>
                                {parsedOptions.map((opt, i) => (
                                  <option key={i} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === "checkbox" ? (
                              <div className="space-y-1.5 pt-1">
                                {(parsedOptions.length > 0 ? parsedOptions : ["Sim, tenho interesse"]).map(
                                  (opt, i) => {
                                    const selected = (formData[field.label] || "")
                                      .split(", ")
                                      .includes(opt);
                                    return (
                                      <label
                                        key={i}
                                        className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selected}
                                          onChange={(e) => {
                                            const current = (formData[field.label] || "")
                                              .split(", ")
                                              .filter(Boolean);
                                            const updated = e.target.checked
                                              ? [...current, opt]
                                              : current.filter((c) => c !== opt);
                                            setFormData({
                                              ...formData,
                                              [field.label]: updated.join(", ")
                                            });
                                          }}
                                          className="h-4 w-4 accent-[#00b4fb] rounded"
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    );
                                  }
                                )}
                              </div>
                            ) : field.type === "date" ? (
                              <input
                                type="date"
                                required={field.required}
                                value={formData[field.label] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.label]: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] bg-white"
                              />
                            ) : field.type === "country" ? (
                              <select
                                required={field.required}
                                value={formData[field.label] || "Brasil"}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.label]: e.target.value })
                                }
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] bg-white"
                              >
                                <option value="Brasil">🇧🇷 Brasil</option>
                                <option value="Portugal">🇵🇹 Portugal</option>
                                <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
                                <option value="Argentina">🇦🇷 Argentina</option>
                                <option value="Espanha">🇪🇸 Espanha</option>
                                <option value="Reino Unido">🇬🇧 Reino Unido</option>
                                <option value="Outro">🌐 Outro</option>
                              </select>
                            ) : (
                              <input
                                type={field.type === "email" ? "email" : "text"}
                                required={field.required}
                                value={formData[field.label] || ""}
                                onChange={(e) =>
                                  setFormData({ ...formData, [field.label]: e.target.value })
                                }
                                placeholder={`Digite seu ${field.label.toLowerCase()}...`}
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                              />
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nome completo *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData["Nome completo"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "Nome completo": e.target.value })
                            }
                            placeholder="Seu nome completo"
                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            E-mail corporativo *
                          </label>
                          <input
                            type="email"
                            required
                            value={formData["E-mail corporativo"] || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, "E-mail corporativo": e.target.value })
                            }
                            placeholder="seuemail@empresa.com"
                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Ao se inscrever, você concorda em receber os lembretes do evento e as atualizações corporativas.
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 hover:bg-[#009ce0] transition disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Confirmando inscrição...</span>
                    ) : (
                      <>
                        <span>Garantir minha vaga gratuita</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
