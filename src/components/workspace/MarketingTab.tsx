"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  Check,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Radio,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Save,
  Tag
} from "lucide-react";
import { updateEvent, dispatchBroadcastEmail } from "@/lib/dbActions";

interface Props {
  event: any;
  onUpdateEvent?: (updated: any) => void;
}

export interface EmailTrigger {
  id: string;
  name: string;
  triggerTime: string;
  subject: string;
  previewText: string;
  enabled: boolean;
  isCustom?: boolean;
  sentCount: number;
  openRate: string;
  clickRate: string;
  bodyTemplate: string;
}

const DEFAULT_TRIGGERS: EmailTrigger[] = [
  {
    id: "confirmation",
    name: "1. Confirmação de Inscrição Imediata",
    triggerTime: "Disparado imediatamente após a inscrição",
    subject: "Inscrição Confirmada: {{titulo_webinar}}",
    previewText: "Sua vaga está garantida! Veja aqui seu link de acesso exclusivo.",
    enabled: true,
    sentCount: 0,
    openRate: "78.4%",
    clickRate: "52.1%",
    bodyTemplate: `Olá {{nome}},\n\nSua inscrição para o webinar corporativo "{{titulo_webinar}}" foi confirmada com sucesso!\n\n📅 Data: {{data_horario}}\n🌐 Acesso: 100% online no navegador, sem downloads.\n\nClique no botão abaixo no dia e horário marcado para entrar diretamente na sala de transmissão sem precisar de senha.`,
  },
  {
    id: "24h",
    name: "2. Lembrete de 24 Horas",
    triggerTime: "Disparado 24 horas antes do início",
    subject: "Lembrete: Amanhã acontece o webinar {{titulo_webinar}}",
    previewText: "Faltam apenas 24 horas para o início da nossa transmissão ao vivo.",
    enabled: true,
    sentCount: 0,
    openRate: "68.2%",
    clickRate: "44.0%",
    bodyTemplate: `Olá {{nome}},\n\nPassando para lembrar que amanhã teremos o webinar "{{titulo_webinar}}".\n\nNossos especialistas já estão finalizando o material e o palco está pronto.\n\nPrepare suas dúvidas para o Q&A ao vivo!`,
  },
  {
    id: "1h",
    name: "3. Lembrete de 1 Hora (Última Chamada)",
    triggerTime: "Disparado 60 minutos antes do início",
    subject: "Começa em 1 hora! Acesse a sala do webinar {{titulo_webinar}}",
    previewText: "A sala de espera já está aberta. Entre para testar seu áudio.",
    enabled: true,
    sentCount: 0,
    openRate: "84.1%",
    clickRate: "61.7%",
    bodyTemplate: `Olá {{nome}},\n\nEstamos a apenas 1 hora do início de "{{titulo_webinar}}".\n\nA sala de espera já está liberada para você testar seu áudio e mandar as primeiras perguntas.\n\nNos vemos no palco em instantes!`,
  },
  {
    id: "post_event",
    name: "4. Pós-Evento (Gravação & Apresentação)",
    triggerTime: "Disparado automaticamente 1h após o término",
    subject: "Gravação disponível: Reveja o webinar {{titulo_webinar}}",
    previewText: "Perdeu algum momento? Assista ao replay completo e baixe os slides.",
    enabled: true,
    sentCount: 0,
    openRate: "58.9%",
    clickRate: "39.4%",
    bodyTemplate: `Olá {{nome}},\n\nObrigado por acompanhar o webinar "{{titulo_webinar}}".\n\nA gravação oficial na íntegra e os slides em PDF já estão disponíveis para você assistir e compartilhar com sua equipe.`,
  },
];

export default function MarketingTab({ event, onUpdateEvent }: Props) {
  // Load initial triggers from event if present
  const [triggers, setTriggers] = useState<EmailTrigger[]>(() => {
    if (event.customEmailsJson) {
      try {
        const parsed = JSON.parse(event.customEmailsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error parsing custom emails:", e);
      }
    }
    return DEFAULT_TRIGGERS;
  });

  const [activePreview, setActivePreview] = useState<EmailTrigger | null>(null);
  const [testEmailSent, setTestEmailSent] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState("organizador@buysoft.com.br");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real Broadcast dispatch state
  const [isDispatching, setIsDispatching] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<{ id: string; count: number; message: string } | null>(null);

  // New Custom Email Modal state
  const [isCreatingCustomEmail, setIsCreatingCustomEmail] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "",
    triggerTime: "Disparado 2 horas antes do início",
    subject: "Novidades exclusivas sobre {{titulo_webinar}}",
    previewText: "Veja informações importantes antes de começar...",
    bodyTemplate: `Olá {{nome}},\n\nQueremos compartilhar um material preparatório exclusivo antes do webinar "{{titulo_webinar}}".\n\n📅 Data: {{data_horario}}\n\nAcesse o link abaixo para entrar na sala.`,
  });

  // Save triggers to DB
  const persistTriggers = async (newTriggers: EmailTrigger[]) => {
    try {
      setTriggers(newTriggers);
      const updated = await updateEvent(event.id, {
        customEmailsJson: JSON.stringify(newTriggers),
      });
      if (onUpdateEvent) onUpdateEvent(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving emails:", err);
    }
  };

  // Broadcast email to all registered attendees now
  const handleBroadcastNow = async (trigger: EmailTrigger) => {
    const regCount = event.registrations?.length || 0;
    if (regCount === 0) {
      alert("Ainda não há participantes inscritos neste webinar para receber este e-mail.");
      return;
    }

    if (!confirm(`Deseja disparar "${trigger.name}" para todos os ${regCount} participante(s) inscritos agora?`)) {
      return;
    }

    setIsDispatching(trigger.id);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const res = await dispatchBroadcastEmail(event.id, trigger.subject, trigger.bodyTemplate, origin);

      // Update trigger sentCount
      const next = triggers.map((t) =>
        t.id === trigger.id ? { ...t, sentCount: (t.sentCount || 0) + res.sentCount } : t
      );
      await persistTriggers(next);

      setDispatchResult({
        id: trigger.id,
        count: res.sentCount,
        message:
          res.mode === "real"
            ? `E-mail enviado com sucesso via SMTP para ${res.sentCount} participante(s)!`
            : `Disparo simulado com sucesso para ${res.sentCount} participante(s). (Configure credenciais SMTP em .env para envio real)`,
      });
      setTimeout(() => setDispatchResult(null), 5000);
    } catch (err: any) {
      alert("Erro ao disparar e-mails: " + err.message);
    } finally {
      setIsDispatching(null);
    }
  };

  // Toggle trigger active
  const handleToggleTrigger = async (id: string) => {
    const next = triggers.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    await persistTriggers(next);
  };

  // Create custom email
  const handleSaveCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name || !customForm.subject) return;

    const newTrigger: EmailTrigger = {
      id: "custom_" + Date.now(),
      name: customForm.name,
      triggerTime: customForm.triggerTime,
      subject: customForm.subject,
      previewText: customForm.previewText,
      enabled: true,
      isCustom: true,
      sentCount: 0,
      openRate: "0.0%",
      clickRate: "0.0%",
      bodyTemplate: customForm.bodyTemplate,
    };

    const next = [...triggers, newTrigger];
    await persistTriggers(next);
    setIsCreatingCustomEmail(false);
    setCustomForm({
      name: "",
      triggerTime: "Disparado 2 horas antes do início",
      subject: "Novidades exclusivas sobre {{titulo_webinar}}",
      previewText: "Veja informações importantes antes de começar...",
      bodyTemplate: `Olá {{nome}},\n\nQueremos compartilhar um material preparatório exclusivo antes do webinar "{{titulo_webinar}}".\n\n📅 Data: {{data_horario}}\n\nAcesse o link abaixo para entrar na sala.`,
    });
  };

  // Delete custom email
  const handleDeleteTrigger = async (id: string) => {
    const next = triggers.filter((t) => t.id !== id);
    await persistTriggers(next);
  };

  // Insert variable into custom body template
  const insertVariable = (variable: string) => {
    setCustomForm((prev) => ({
      ...prev,
      bodyTemplate: prev.bodyTemplate + variable,
    }));
  };

  // Simulate send test email
  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    setTestEmailSent(true);
    setTimeout(() => setTestEmailSent(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Automação de E-mails & Lembretes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure e-mails transacionais automáticos e crie comunicações personalizadas para seus participantes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <Check className="h-4 w-4" /> Alterações salvas!
            </span>
          )}

          <button
            onClick={() => setIsCreatingCustomEmail(true)}
            className="flex items-center gap-2 rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#009ce0] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar e-mail personalizado</span>
          </button>
        </div>
      </div>

      {/* Remetente Info Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#00b4fb]">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Servidor SMTP Corporativo Conectado</p>
            <p className="text-[11px] text-slate-500">
              Disparos autenticados via SPF, DKIM e DMARC com 99.8% de entregabilidade na caixa de entrada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700">
          <span className="font-semibold text-slate-400">Remetente:</span>
          <span className="font-bold text-[#0084be]">
            Buysoft Events &lt;eventos@buysoft.com.br&gt;
          </span>
        </div>
      </div>

      {/* Triggers List */}
      <div className="space-y-3.5">
        {triggers.map((trigger) => (
          <div
            key={trigger.id}
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-xs transition ${
              trigger.enabled ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                  trigger.enabled
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <Mail className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{trigger.name}</h3>
                  {trigger.isCustom && (
                    <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-bold text-[#0084be]">
                      Personalizado
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      trigger.enabled
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {trigger.enabled ? "Ativo" : "Pausado"}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {trigger.triggerTime}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 truncate max-w-md">
                    Assunto: <span className="text-slate-500 font-normal">{trigger.subject.replace("{{titulo_webinar}}", event.title)}</span>
                  </span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Taxa Abertura: <strong className="text-slate-700">{trigger.openRate}</strong></span>
                    <span>•</span>
                    <span>Cliques (CTR): <strong className="text-slate-700">{trigger.clickRate}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <button
                onClick={() => handleBroadcastNow(trigger)}
                disabled={isDispatching === trigger.id}
                className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-[#0084be] hover:bg-sky-100 shadow-xs transition disabled:opacity-50"
                title="Disparar este e-mail agora para todos os participantes inscritos"
              >
                {isDispatching === trigger.id ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0084be] border-t-transparent" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Disparar ({event.registrations?.length || 0})</span>
              </button>

              <button
                onClick={() => setActivePreview(trigger)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
              >
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <span>Visualizar / Editar</span>
              </button>

              <button
                onClick={() => handleToggleTrigger(trigger.id)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition shadow-xs ${
                  trigger.enabled
                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {trigger.enabled ? "Desativar" : "Ativar"}
              </button>

              {trigger.isCustom && (
                <button
                  onClick={() => handleDeleteTrigger(trigger.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Excluir e-mail personalizado"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {dispatchResult && dispatchResult.id === trigger.id && (
              <div className="w-full mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{dispatchResult.message}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal: Adicionar E-mail Personalizado */}
      {isCreatingCustomEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b4fb] text-white">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Novo E-mail Personalizado</h3>
                  <p className="text-xs text-slate-500">Configure um novo gatilho ou comunicação customizada.</p>
                </div>
              </div>

              <button
                onClick={() => setIsCreatingCustomEmail(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomEmail} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Interno do E-mail *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 5. Pesquisa de Satisfação (2 dias após)"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gatilho de Envio (Quando disparar?) *
                  </label>
                  <select
                    value={customForm.triggerTime}
                    onChange={(e) => setCustomForm({ ...customForm, triggerTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none bg-white"
                  >
                    <option value="Imediatamente após a inscrição">Imediatamente após a inscrição</option>
                    <option value="Disparado 48 horas antes do início">Disparado 48 horas antes do início</option>
                    <option value="Disparado 24 horas antes do início">Disparado 24 horas antes do início</option>
                    <option value="Disparado 2 horas antes do início">Disparado 2 horas antes do início</option>
                    <option value="Disparado 15 minutos antes do início">Disparado 15 minutos antes do início</option>
                    <option value="Disparado ao término do webinar">Disparado ao término do webinar</option>
                    <option value="Disparado 24 horas após o término">Disparado 24 horas após o término</option>
                    <option value="Disparado 48 horas após o término">Disparado 48 horas após o término</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pré-visualização (Preheader)
                  </label>
                  <input
                    type="text"
                    placeholder="Texto secundário visível na caixa de entrada..."
                    value={customForm.previewText}
                    onChange={(e) => setCustomForm({ ...customForm, previewText: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Linha de Assunto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: {{nome}}, aqui está o certificado e materiais do webinar {{titulo_webinar}}"
                  value={customForm.subject}
                  onChange={(e) => setCustomForm({ ...customForm, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Mensagem do E-mail *
                  </label>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Tag className="h-3 w-3" />
                    <span>Inserir variável:</span>
                    <button
                      type="button"
                      onClick={() => insertVariable("{{nome}}")}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px]"
                    >
                      {"{{nome}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{{titulo_webinar}}")}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px]"
                    >
                      {"{{titulo_webinar}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{{link_acesso}}")}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px]"
                    >
                      {"{{link_acesso}}"}
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  required
                  value={customForm.bodyTemplate}
                  onChange={(e) => setCustomForm({ ...customForm, bodyTemplate: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed font-sans text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingCustomEmail(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#009ce0]"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar E-mail Personalizado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Template Preview & Test Modal */}
      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Modelo de E-mail: {activePreview.name}
                </h3>
                <p className="text-xs text-slate-500">Preview fiel do HTML renderizado para o participante.</p>
              </div>

              <button
                onClick={() => setActivePreview(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Mock Email Client */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Email Envelope Header */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-16">De:</span>
                  <span className="font-semibold text-slate-800">
                    Buysoft Events &lt;eventos@buysoft.com.br&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-16">Para:</span>
                  <span className="font-mono text-slate-700">participante@empresa.com.br</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400 w-16">Assunto:</span>
                  <input
                    type="text"
                    value={activePreview.subject}
                    onChange={(e) => {
                      const val = e.target.value;
                      setActivePreview({ ...activePreview, subject: val });
                      const updated = triggers.map((t) =>
                        t.id === activePreview.id ? { ...t, subject: val } : t
                      );
                      persistTriggers(updated);
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-900 focus:border-[#00b4fb] focus:outline-none"
                  />
                </div>
              </div>

              {/* Rendered Corporate Email Paper */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 max-w-lg mx-auto">
                {/* Brand Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center">
                    <img
                      src="/logo.png"
                      alt="Buysoft Events"
                      className="h-7 w-auto object-contain"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Transmissão Online
                  </span>
                </div>

                {/* Email Body Message */}
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {activePreview.bodyTemplate
                    .replace(/\{\{nome\}\}/g, "João Silva")
                    .replace(/\{\{titulo_webinar\}\}/g, event.title)
                    .replace(/\{\{data_horario\}\}/g, "Sexta-feira, às 14:00 (Horário de Brasília)")}
                </div>

                {/* Simulated Magic Link Button */}
                <div className="pt-2 text-center">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00b4fb] px-6 py-3 text-xs font-bold text-white shadow-md shadow-sky-500/25 hover:bg-[#009ce0] transition"
                  >
                    <span>Entrar na Sala do Webinar (Sem Senha)</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Não requer instalação. Funciona em qualquer navegador web.
                  </p>
                </div>

                {/* Email Footer */}
                <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400 space-y-1">
                  <p>Buysoft do Brasil • Soluções em Software e Tecnologia B2B</p>
                  <p>Você recebeu este e-mail porque se inscreveu no webinar de {event.title}.</p>
                </div>
              </div>

              {/* Send Test Email Card */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
                <h4 className="text-xs font-bold text-sky-900 mb-2">
                  Testar este modelo na sua caixa de entrada
                </h4>
                <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder="Seu e-mail para teste..."
                    className="flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#009ce0] transition"
                  >
                    {testEmailSent ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Enviado com Sucesso!</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Disparar Teste</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                onClick={() => setActivePreview(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
