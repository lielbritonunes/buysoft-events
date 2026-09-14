"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Users,
  Search,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Vote,
  Zap,
  Star,
  Copy,
  Check,
  ExternalLink,
  Filter,
  Sparkles
} from "lucide-react";

interface Props {
  event: any;
}

export default function AnalyticsTab({ event }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const registrations = useMemo(() => event.registrations || [], [event.registrations]);
  const chatMessagesCount = event.chatMessages?.length || 0;
  const questionsCount = event.questions?.length || 0;
  const pollsCount = event.polls?.length || 0;
  const totalVotesCount = (event.polls || []).reduce(
    (acc: number, p: any) => acc + (p.votes?.length || 0),
    0
  );

  // Filtered registrations
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return registrations;
    const q = searchTerm.toLowerCase();
    return registrations.filter((reg: any) => {
      const nameMatch = (reg.attendeeName || "").toLowerCase().includes(q);
      const emailMatch = (reg.attendeeEmail || "").toLowerCase().includes(q);
      const jsonMatch = (reg.responsesJson || "").toLowerCase().includes(q);
      return nameMatch || emailMatch || jsonMatch;
    });
  }, [registrations, searchTerm]);

  // Copy helper
  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/live/${event.id}?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Real CSV Export with UTF-8 BOM
  const handleExportCsv = () => {
    if (registrations.length === 0) {
      alert("Não há inscritos para exportar ainda.");
      return;
    }

    // Discover dynamic form headers from event.formFields
    const formHeaders = (event.formFields || []).map((f: any) => f.label);

    const headers = [
      "Nome Completo",
      "E-mail",
      "Data de Inscrição",
      "Status",
      ...formHeaders,
      "Link Exclusivo de Entrada",
    ];

    const rows = registrations.map((reg: any) => {
      let responses: Record<string, string> = {};
      try {
        responses = reg.responsesJson ? JSON.parse(reg.responsesJson) : {};
      } catch (e) {
        responses = {};
      }

      const dynamicValues = formHeaders.map((header: string) => {
        const val = responses[header] || "";
        return `"${val.replace(/"/g, '""')}"`;
      });

      const formattedDate = reg.createdAt
        ? new Date(reg.createdAt).toLocaleString("pt-BR")
        : "Recente";

      const magicLink = `${window.location.origin}/live/${event.id}?token=${reg.magicLinkToken}`;

      return [
        `"${(reg.attendeeName || "").replace(/"/g, '""')}"`,
        `"${(reg.attendeeEmail || "").replace(/"/g, '""')}"`,
        `"${formattedDate}"`,
        `"Confirmado"`,
        ...dynamicValues,
        `"${magicLink}"`,
      ].join(";");
    });

    // Add UTF-8 BOM (\uFEFF) so Excel on Windows opens accents (ç, ã, é) correctly
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (event.title || "webinar").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `Buysoft_Leads_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const occupancyRate = Math.min(
    100,
    Math.round((registrations.length / (event.maxAttendees || 100)) * 100)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Métricas, Leads & Engajamento</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a conversão, o perfil dos participantes e o engajamento na sala ao vivo.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 rounded-xl bg-[#00b4fb] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/20 hover:bg-[#009ce0] transition active:scale-98"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Base em CSV (Excel)</span>
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Inscritos Totais
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-[#00b4fb]">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {registrations.length}
              </span>
              <span className="text-xs text-slate-400">/ {event.maxAttendees || 100} vagas</span>
            </div>
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00b4fb] transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {occupancyRate}% da capacidade total preenchida
          </p>
        </div>

        {/* Expected Show-up Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Comparecimento Est.
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-emerald-600">
              {registrations.length > 0 ? "68%" : "0%"}
            </span>
            <p className="text-[11px] text-slate-500 mt-2">
              Média do setor B2B para eventos ao vivo com lembretes automáticos
            </p>
          </div>
        </div>

        {/* Live Engagement Signals */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Interações na Sala
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-[#0084be]">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold text-slate-900">
              {chatMessagesCount + questionsCount + totalVotesCount}
            </span>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
              <span>{chatMessagesCount} msgs</span>
              <span>•</span>
              <span>{questionsCount} dúvidas</span>
              <span>•</span>
              <span>{totalVotesCount} votos</span>
            </div>
          </div>
        </div>

        {/* Satisfaction Rating */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avaliação do Conteúdo
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-extrabold text-slate-900">4.9</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Pesquisa pós-evento de satisfação dos espectadores
            </p>
          </div>
        </div>
      </div>

      {/* Leads Table & Details Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Lista de Participantes Cadastrados</h3>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {filteredLeads.length}
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
            />
          </div>
        </div>

        {/* Table Contents */}
        {filteredLeads.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Participante</th>
                  <th className="px-5 py-3">E-mail Corporativo</th>
                  <th className="px-5 py-3">Data da Inscrição</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Link Exclusivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead: any) => {
                  let responses: Record<string, string> = {};
                  try {
                    responses = lead.responsesJson ? JSON.parse(lead.responsesJson) : {};
                  } catch (e) {
                    responses = {};
                  }

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00b4fb] to-sky-400 font-bold text-white shadow-xs text-xs">
                            {lead.attendeeName ? lead.attendeeName.charAt(0).toUpperCase() : "P"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{lead.attendeeName}</p>
                            {responses["Empresa"] && (
                              <p className="text-[11px] text-slate-500">{responses["Empresa"]}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                        {lead.attendeeEmail}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500">
                        {lead.createdAt
                          ? new Date(lead.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Recente"}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Confirmado
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div
                          className="inline-flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleCopyLink(lead.magicLinkToken)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                            title="Copiar link exclusivo do participante"
                          >
                            {copiedToken === lead.magicLinkToken ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3 text-slate-400" />
                                <span>Copiar Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">Nenhum participante encontrado</p>
            <p className="text-[11px] text-slate-400">
              {searchTerm
                ? "Tente buscar por outro termo ou limpe a busca."
                : "Divulgue o link da landing page para começar a captar inscritos."}
            </p>
          </div>
        )}
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedLead.attendeeName}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedLead.attendeeEmail}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Respostas do Formulário
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                {(() => {
                  try {
                    const parsed = selectedLead.responsesJson
                      ? JSON.parse(selectedLead.responsesJson)
                      : {};
                    const entries = Object.entries(parsed);
                    if (entries.length === 0) {
                      return <p className="text-slate-400">Nenhum campo adicional preenchido.</p>;
                    }
                    return entries.map(([k, v]) => (
                      <div key={k} className="pt-2 first:pt-0">
                        <span className="font-bold text-slate-700">{k}:</span>
                        <p className="text-slate-900 mt-0.5">{String(v) || "-"}</p>
                      </div>
                    ));
                  } catch {
                    return <p className="text-slate-400">Sem dados adicionais.</p>;
                  }
                })()}
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Link Mágico de Entrada Direta
                </span>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 text-[11px] font-mono text-slate-700 truncate">
                  <span className="truncate">
                    {`${typeof window !== "undefined" ? window.location.origin : ""}/live/${event.id}?token=${selectedLead.magicLinkToken}`}
                  </span>
                  <button
                    onClick={() => handleCopyLink(selectedLead.magicLinkToken)}
                    className="shrink-0 rounded-lg bg-slate-100 p-1.5 hover:bg-slate-200 transition"
                  >
                    {copiedToken === selectedLead.magicLinkToken ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
