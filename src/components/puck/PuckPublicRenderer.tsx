"use client";

import React, { useState, useMemo } from "react";
import { Render, Data } from "@measured/puck";
import { getPuckConfig } from "./puckConfig";
import {
  X,
  CheckCircle2,
  Copy,
  Calendar
} from "lucide-react";

interface Props {
  event: any;
  puckData: Data;
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isSubmitting: boolean;
  registrationResult: any;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCopyLink: () => void;
  copiedLink: boolean;
  googleCalendarUrl: () => string;
}

export default function PuckPublicRenderer({
  event,
  puckData,
  formData,
  setFormData,
  isSubmitting,
  registrationResult,
  onSubmit,
  onCopyLink,
  copiedLink,
  googleCalendarUrl,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const config = useMemo(
    () => getPuckConfig(event, () => setIsModalOpen(true)),
    [event]
  );

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
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* PUCK RENDER ENGINE */}
      <Render config={config} data={puckData} />

      {/* Hidden button for programmatic trigger if needed */}
      <button
        id="buysoft-reg-trigger"
        type="button"
        className="hidden"
        onClick={() => setIsModalOpen(true)}
      />

      {/* REGISTRATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Inscrição no Evento</h3>
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
                /* Confirmation Screen */
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
                /* Registration Form with Platform & Custom Fields */
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

                  {/* Dynamic Form Fields */}
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
                    className="w-full rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] py-3 text-xs font-bold text-white shadow-md transition disabled:opacity-50 active:scale-95"
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
