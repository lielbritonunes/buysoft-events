"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  RotateCcw,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { WebinarEvent } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateEvent: (event: Partial<WebinarEvent>) => void;
  lastEvent?: Partial<WebinarEvent>;
}

export default function CreateEventWizard({
  isOpen,
  onClose,
  onCreateEvent,
  lastEvent
}: Props) {
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateOption, setDateOption] = useState<string>("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [hour, setHour] = useState<string>("19");
  const [minute, setMinute] = useState<string>("00");
  const [duration, setDuration] = useState<number>(60);
  const [loading, setLoading] = useState(false);

  // Initialize initial hour/minute based on current time
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const nextHour = (now.getHours() + 1) % 24;
      setHour(nextHour.toString().padStart(2, "0"));
      setMinute("00");

      const todayStr = now.toISOString().split("T")[0];
      setCustomDate(todayStr);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTitleEntered = title.trim().length > 0;

  // "Usar anterior" handlers
  const handleUsePreviousTitle = () => {
    const saved =
      lastEvent?.title ||
      localStorage.getItem("buysoft_last_event_title") ||
      "Webinar de Demonstração Buysoft";
    setTitle(saved);
  };

  const handleUsePreviousDesc = () => {
    const saved =
      lastEvent?.description ||
      localStorage.getItem("buysoft_last_event_desc") ||
      "Participe deste webinar exclusivo com demonstrações práticas ao vivo e sessão aberta de perguntas e respostas.";
    setDescription(saved);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTitleEntered) return;

    setLoading(true);

    // Save for future "Usar anterior"
    try {
      localStorage.setItem("buysoft_last_event_title", title);
      if (description) {
        localStorage.setItem("buysoft_last_event_desc", description);
      }
    } catch {
      // ignore local storage errors
    }

    // Calculate dates
    const now = new Date();
    let targetDate = new Date();

    if (dateOption === "today") {
      targetDate = new Date();
    } else if (dateOption === "tomorrow") {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (dateOption === "custom" && customDate) {
      const [y, m, d] = customDate.split("-").map(Number);
      targetDate = new Date(y, m - 1, d);
    } else {
      // parsed ISO string like "2026-10-15"
      const [y, m, d] = dateOption.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        targetDate = new Date(y, m - 1, d);
      }
    }

    targetDate.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);

    const startDateIso = targetDate.toISOString();
    const endDateIso = new Date(
      targetDate.getTime() + duration * 60 * 1000
    ).toISOString();

    onCreateEvent({
      title: title.trim(),
      description: description.trim(),
      startDate: startDateIso,
      endDate: endDateIso,
      timezone: "(GMT-03:00) Horário de Brasília",
      status: "draft",
      registeredCount: 0,
      maxAttendees: 100,
      speakers: [],
      formFields: [
        { id: "f_1", label: "Nome completo", type: "text", required: true },
        { id: "f_2", label: "E-mail de contato", type: "text", required: true }
      ],
      settings: {
        chatEnabled: true,
        qaEnabled: true,
        pollsEnabled: true,
        attendeeListVisible: true,
        autoRecord: true,
        primaryColor: "#00b4fb",
        backgroundColor: "#ffffff",
        textColor: "#0f172a"
      }
    });

    setLoading(false);
    onClose();
  };

  // Generate dynamic date quick options (Hoje, Amanhã, +3 dias)
  const now = new Date();
  const nextDays = [2, 3, 4].map((offset) => {
    const d = new Date();
    d.setDate(now.getDate() + offset);
    const dayStr = d.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short"
    });
    const isoDate = d.toISOString().split("T")[0];
    return { label: dayStr.replace(".", ""), value: isoDate };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-[530px] rounded-2xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header: Title & Close Button */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900">
            Vamos configurar seu evento
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: Título */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Título
              </label>
              <button
                type="button"
                onClick={handleUsePreviousTitle}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Usar anterior</span>
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={256}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
            />
            <div className="mt-1 text-right text-[11px] text-slate-400 font-medium">
              {title.length}/256
            </div>
          </div>

          {/* Field 2: Descrição */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <span>Descrição</span>
                <span
                  title="A descrição será exibida na página pública de inscrição do webinar."
                  className="cursor-help text-slate-400 hover:text-slate-600"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </span>
              </label>
              <button
                type="button"
                onClick={handleUsePreviousDesc}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Usar anterior</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Diga algo sobre este webinário"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] resize-none"
            />
          </div>

          {/* Field 3 & 4: Horário de Início e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Horário de início agendado GMT-3 */}
            <div>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <span>Horário de início agendado GMT-3</span>
                <span
                  title="Fuso horário oficial de Brasília (GMT-03:00)."
                  className="cursor-help text-slate-400 hover:text-slate-600"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </span>
              </label>

              <div className="flex items-center gap-1.5">
                {/* Date Selector */}
                <div className="relative flex-1 min-w-[90px]">
                  <select
                    value={dateOption}
                    onChange={(e) => setDateOption(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] pr-6"
                  >
                    <option value="today">Hoje</option>
                    <option value="tomorrow">Amanhã</option>
                    {nextDays.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                    <option value="custom">Outra data...</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>

                {/* Hour Selector */}
                <div className="relative w-[62px]">
                  <select
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] pr-5 font-mono"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const val = i.toString().padStart(2, "0");
                      return (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>

                {/* Minute Selector */}
                <div className="relative w-[62px]">
                  <select
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] pr-5 font-mono"
                  >
                    {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                      (val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      )
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-1.5 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              {/* Custom Date Input when selected */}
              {dateOption === "custom" && (
                <div className="mt-2">
                  <input
                    type="date"
                    required
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                  />
                </div>
              )}
            </div>

            {/* Duração */}
            <div>
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <span>Duração</span>
                <span
                  title="Duração estimada. A transmissão não será interrompida caso ultrapasse."
                  className="cursor-help text-slate-400 hover:text-slate-600"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </span>
              </label>

              <div className="relative">
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] pr-8"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1 hora e 30 min</option>
                  <option value={120}>2 horas</option>
                  <option value={180}>3 horas</option>
                  <option value={240}>4 horas</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isTitleEntered}
              className={`w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                !isTitleEntered
                  ? "bg-[#9cd9f7] text-white cursor-not-allowed opacity-90 shadow-none"
                  : "bg-[#00b4fb] hover:bg-[#009ce0] text-white cursor-pointer shadow-md shadow-sky-300/30 hover:shadow-lg hover:shadow-sky-400/40 active:scale-[0.99]"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Criando...</span>
                </div>
              ) : (
                <span>Criar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
