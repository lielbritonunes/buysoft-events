"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  Users,
  Video,
  Radio,
  Clock,
  Sparkles,
  ArrowUpRight,
  Edit3,
  Eye,
  Folder,
  Copy,
  UserCheck,
  Trash2,
  Check,
  AlertTriangle,
  FolderPlus,
  ExternalLink,
  Layers
} from "lucide-react";
import { WebinarEvent } from "@/types";
import { duplicateEvent, deleteEvent, addEventToSeries, createSeries, deleteSeries } from "@/lib/dbActions";

interface Props {
  events: any[];
  seriesList?: any[];
  organizationMembers?: any[];
  onSelectEvent: (event: any) => void;
  onOpenCreateWizard: () => void;
  onRefreshData: () => void;
}

export default function EventsTable({
  events,
  seriesList = [],
  organizationMembers = [],
  onSelectEvent,
  onOpenCreateWizard,
  onRefreshData,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "series">("events");

  // Action Menu State
  const [openMenuEventId, setOpenMenuEventId] = useState<string | null>(null);

  // Modals state
  const [seriesModalEvent, setSeriesModalEvent] = useState<any | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [teamModalEvent, setTeamModalEvent] = useState<any | null>(null);
  const [deleteModalEvent, setDeleteModalEvent] = useState<any | null>(null);
  const [isCopying, setIsCopying] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Series Modal
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [newSeriesDesc, setNewSeriesDesc] = useState("");

  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSeries = seriesList.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Close actions menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuEventId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Action: Duplicate Event
  const handleDuplicate = async (ev: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuEventId(null);
    setIsCopying(ev.id);
    try {
      await duplicateEvent(ev.id);
      onRefreshData();
    } catch (err) {
      console.error(err);
      alert("Erro ao duplicar evento.");
    } finally {
      setIsCopying(null);
    }
  };

  // Action: Delete Event
  const handleConfirmDelete = async () => {
    if (!deleteModalEvent) return;
    setIsDeleting(true);
    try {
      await deleteEvent(deleteModalEvent.id);
      setDeleteModalEvent(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir evento.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Action: Assign Event to Series
  const handleSaveEventSeries = async () => {
    if (!seriesModalEvent) return;
    try {
      await addEventToSeries(seriesModalEvent.id, selectedSeriesId || null);
      setSeriesModalEvent(null);
      onRefreshData();
    } catch (err) {
      console.error(err);
      alert("Erro ao vincular evento à série.");
    }
  };

  // Create Series Handler
  const handleCreateSeriesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesTitle.trim()) return;
    try {
      await createSeries({
        title: newSeriesTitle.trim(),
        description: newSeriesDesc.trim(),
      });
      setNewSeriesTitle("");
      setNewSeriesDesc("");
      setShowCreateSeriesModal(false);
      onRefreshData();
    } catch (err) {
      console.error(err);
      alert("Erro ao criar série.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Alert Banner (estilo RingCentral Events) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00b4fb] text-white shadow-sm shadow-sky-200">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Plataforma Buysoft Events pronta para uso
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Você pode criar e transmitir webinars com até <strong>100 participantes simultâneos</strong> em WebRTC puro.
            </p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 rounded-xl border border-sky-300 bg-white px-3.5 py-2 text-xs font-bold text-[#0084be] shadow-xs hover:bg-sky-50 transition">
          <span>Ver planos de expansão</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Control Bar: Tabs, Search, Filters and CTAs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left Tabs (Eventos | Séries) */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
          <button
            onClick={() => setActiveTab("events")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "events"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setActiveTab("series")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === "series"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Séries
          </button>
        </div>

        {/* Right Controls: Search, Filter, Create Series, Create Event */}
        <div className="flex flex-1 md:flex-initial items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={activeTab === "events" ? "Pesquisar evento..." : "Pesquisar série..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
            />
          </div>

          {/* Filter Dropdown */}
          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>

          {/* Nova Série Button (Image 1 reference) */}
          <button
            onClick={() => setShowCreateSeriesModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <FolderPlus className="h-3.5 w-3.5 text-slate-500" />
            <span>Nova série</span>
          </button>

          {/* Create Event Button (Primary #00b4fb) */}
          <button
            onClick={onOpenCreateWizard}
            className="flex items-center gap-2 rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-sky-200 hover:bg-[#009ce0] transition"
          >
            <Plus className="h-4 w-4" />
            <span>Criar evento</span>
          </button>
        </div>
      </div>

      {/* TAB 1: EVENTOS */}
      {activeTab === "events" && (
        <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3.5">Nome do Evento</th>
                <th scope="col" className="px-4 py-3.5">Tipo</th>
                <th scope="col" className="px-4 py-3.5">Data e Hora</th>
                <th scope="col" className="px-4 py-3.5 text-center">Inscritos</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Video className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Nenhum evento encontrado</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Clique em &quot;Criar evento&quot; para agendar seu primeiro webinar corporativo.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="cursor-pointer transition hover:bg-sky-50/40 group relative"
                  >
                    {/* Title & Thumbnail */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 rounded-lg bg-gradient-to-r from-[#0084be] to-[#00b4fb] flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden">
                          {ev.logoUrl ? (
                            <img src={ev.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                          ) : (
                            <Radio className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 group-hover:text-[#0084be] transition">
                              {ev.title}
                            </span>
                            {ev.series && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                <Folder className="h-2.5 w-2.5" />
                                {ev.series.title}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {ev.timezone}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center rounded-full bg-[#e6f7fe] px-2.5 py-0.5 text-[11px] font-bold text-[#0084be]">
                        Webinar
                      </span>
                    </td>

                    {/* Date/Time */}
                    <td className="px-4 py-4 font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(ev.startDate)}</span>
                      </div>
                    </td>

                    {/* Registered Count */}
                    <td className="px-4 py-4 text-center font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {ev.registrations?.length || 0} / {ev.maxAttendees || 100}
                      </span>
                    </td>

                    {/* Status Tag */}
                    <td className="px-4 py-4">
                      {ev.status === "published" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Publicado
                        </span>
                      )}
                      {ev.status === "draft" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Rascunho
                        </span>
                      )}
                      {ev.status === "live" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Ao Vivo
                        </span>
                      )}
                    </td>

                    {/* Actions Menu (3 dots) with exact RingCentral options from Image 1 */}
                    <td className="px-4 py-4 text-right relative">
                      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuEventId(openMenuEventId === ev.id ? null : ev.id);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                          title="Opções do evento"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Dropdown Popup */}
                        {openMenuEventId === ev.id && (
                          <div className="absolute right-0 z-50 mt-1 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl animate-in fade-in zoom-in-95 text-left divide-y divide-slate-100">
                            <div className="py-1">
                              {/* 1. Editar */}
                              <button
                                onClick={() => {
                                  setOpenMenuEventId(null);
                                  onSelectEvent(ev);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                <span>Editar</span>
                              </button>

                              {/* 2. Pré-visualizar */}
                              <a
                                href={`/e/${ev.id}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setOpenMenuEventId(null)}
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-400" />
                                <span>Pré-visualizar</span>
                              </a>

                              {/* 3. Série */}
                              <button
                                onClick={() => {
                                  setOpenMenuEventId(null);
                                  setSeriesModalEvent(ev);
                                  setSelectedSeriesId(ev.seriesId || "");
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Folder className="h-3.5 w-3.5 text-slate-400" />
                                <span>Série</span>
                              </button>

                              {/* 4. Copiar (Duplicar) */}
                              <button
                                onClick={(e) => handleDuplicate(ev, e)}
                                disabled={isCopying === ev.id}
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Copy className="h-3.5 w-3.5 text-slate-400" />
                                <span>{isCopying === ev.id ? "Copiando..." : "Copiar"}</span>
                              </button>

                              {/* 5. Acesso da Equipe */}
                              <button
                                onClick={() => {
                                  setOpenMenuEventId(null);
                                  setTeamModalEvent(ev);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                              >
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                <span>Acesso da Equipe</span>
                              </button>
                            </div>

                            {/* 6. Excluir */}
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setOpenMenuEventId(null);
                                  setDeleteModalEvent(ev);
                                }}
                                className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                <span>Excluir</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: SÉRIES DE EVENTOS */}
      {activeTab === "series" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Séries de Webinars</h3>
              <p className="text-xs text-slate-500">
                Agrupamentos de múltiplos webinars que facilitam o acompanhamento e inscrição em lote pelos participantes.
              </p>
            </div>
            <button
              onClick={() => setShowCreateSeriesModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#009ce0] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Série</span>
            </button>
          </div>

          {filteredSeries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400 space-y-3">
              <Folder className="h-10 w-10 mx-auto text-slate-300" />
              <div>
                <p className="text-sm font-bold text-slate-700">Nenhuma série criada ainda</p>
                <p className="text-xs text-slate-400 mt-1">
                  Crie uma série para conectar webinars relacionados (ex: Trilha de Inovação, Masterclasses) onde os participantes podem se inscrever em todos de uma só vez.
                </p>
              </div>
              <button
                onClick={() => setShowCreateSeriesModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Criar Primeira Série</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSeries.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                        <Folder className="h-3 w-3" />
                        Série
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {s.events?.length || 0} webinars
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">{s.title}</h4>
                    {s.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                    <a
                      href={`/s/${s.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#00b4fb] hover:underline"
                    >
                      <span>Ver Página Pública</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <button
                      onClick={async () => {
                        if (confirm(`Tem certeza que deseja excluir a série "${s.title}"?`)) {
                          await deleteSeries(s.id);
                          onRefreshData();
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition"
                      title="Excluir série"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Vincular a Série */}
      {seriesModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Vincular a uma Série</h3>
                <p className="text-xs text-slate-500">Evento: {seriesModalEvent.title}</p>
              </div>
              <button
                onClick={() => setSeriesModalEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Selecione a Série:</label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
              >
                <option value="">Nenhuma (Evento Avulso)</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.events?.length || 0} eventos)
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500">
                Ao vincular este webinar a uma série, ele aparecerá na página compartilhada da trilha e os participantes poderão se inscrever em todos os encontros de uma só vez.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSeriesModalEvent(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEventSeries}
                className="rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white hover:bg-[#009ce0] transition"
              >
                Salvar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Acesso da Equipe */}
      {teamModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Acesso da Equipe</h3>
                <p className="text-xs text-slate-500">Gerenciar quem tem permissão neste webinar</p>
              </div>
              <button
                onClick={() => setTeamModalEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Membros com Acesso ao Estúdio
              </span>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {organizationMembers.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 font-bold text-white text-[10px]">
                        {m.avatarInitials || m.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.email}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {m.role === "admin" ? "Organizador" : "Moderador"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Todos os membros ativos da organização possuem acesso automático de co-host ao estúdio de transmissão.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setTeamModalEvent(null)}
                className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirmação de Exclusão de Evento */}
      {deleteModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Excluir este webinar?</h3>
              <p className="text-xs text-slate-500">
                Você tem certeza que deseja excluir <strong>{deleteModalEvent.title}</strong>? Esta ação removerá os palestrantes e inscrições vinculadas permanentemente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalEvent(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Criar Nova Série */}
      {showCreateSeriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Criar Nova Série de Eventos</h3>
                <p className="text-xs text-slate-500">Agrupe webinars para inscrição multi-evento</p>
              </div>
              <button
                onClick={() => setShowCreateSeriesModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSeriesSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Série *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Trilha de Liderança e Inovação 2026"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Explique o objetivo da trilha ou dos episódios..."
                  value={newSeriesDesc}
                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSeriesModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white hover:bg-[#009ce0] transition"
                >
                  Criar Série
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
