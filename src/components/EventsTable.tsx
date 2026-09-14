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
  Trash2,
  FolderPlus,
  ExternalLink,
  LayoutList,
  LayoutGrid,
  CheckCircle2,
  AlertTriangle,
  PlayCircle
} from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "published" | "draft">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

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

  // Statistics calculation for Bento Grid
  const totalEvents = events.length;
  const liveEventsCount = events.filter((e) => e.status === "live").length;
  const publishedCount = events.filter((e) => e.status === "published").length;
  const draftCount = events.filter((e) => e.status === "draft").length;
  const totalRegistrations = events.reduce(
    (acc, ev) => acc + (ev.registrations?.length || ev.registeredCount || 0),
    0
  );
  const totalCapacity = events.reduce((acc, ev) => acc + (ev.maxAttendees || 100), 0);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch = ev.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ? true : ev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      {/* Bento Grid: 4 Metric Cards (Untitled UI KPI Architecture) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Webinars */}
        <div className="stat-card-modern">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Webinars
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#0084be] border border-sky-100">
              <Video className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {totalEvents}
            </span>
            <span className="text-xs font-medium text-slate-500">cadastrados</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {publishedCount} ativos
            </span>
            <span>•</span>
            <span>{draftCount} rascunhos</span>
          </div>
        </div>

        {/* Metric 2: Audiência Acumulada */}
        <div className="stat-card-modern">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inscritos & Audiência
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {totalRegistrations}
            </span>
            <span className="text-xs font-medium text-slate-500">participantes</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Capacidade total:</span>
            <span className="font-semibold text-slate-700">{totalCapacity} vagas</span>
          </div>
        </div>

        {/* Metric 3: Infraestrutura WebRTC */}
        <div className="stat-card-modern">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Estúdio & WebRTC
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#0084be] border border-sky-100">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              1080p Full HD
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="h-3 w-3" />
              LiveKit & YouTube Prontos
            </span>
          </div>
        </div>

        {/* Metric 4: Séries e Trilhas */}
        <div className="stat-card-modern">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trilhas & Séries
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Folder className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">
              {seriesList.length}
            </span>
            <span className="text-xs font-medium text-slate-500">trilhas ativas</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
            <span>Inscrições em lote</span>
            <span className="font-semibold text-slate-700">Habilitado</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Filter Pills, Search, View Mode, and CTAs */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Segmented Controls: Eventos vs Séries */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
            <button
              onClick={() => setActiveTab("events")}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "events"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Eventos</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-600 border border-slate-200">
                {events.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("series")}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "series"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Séries</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-semibold text-slate-600 border border-slate-200">
                {seriesList.length}
              </span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === "events" ? "Buscar por título..." : "Buscar série..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00b4fb] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00b4fb] transition"
              />
            </div>

            {/* View Mode Toggle (Table vs Grid) - only on Events tab */}
            {activeTab === "events" && (
              <div className="hidden sm:flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "table"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Visualização em Tabela"
                >
                  <LayoutList className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Nova Série Button */}
            <button
              onClick={() => setShowCreateSeriesModal(true)}
              className="btn-buysoft-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
            >
              <FolderPlus className="h-3.5 w-3.5 text-slate-500" />
              <span>Nova série</span>
            </button>

            {/* Criar Evento Button (Buysoft Cyan #00b4fb) */}
            <button
              onClick={onOpenCreateWizard}
              className="btn-buysoft-primary flex items-center gap-2 px-4 py-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Criar evento</span>
            </button>
          </div>
        </div>

        {/* Status Filter Pills (Only in Events tab) */}
        {activeTab === "events" && (
          <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Todos ({events.length})
            </button>
            <button
              onClick={() => setStatusFilter("live")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                statusFilter === "live"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Ao Vivo ({liveEventsCount})
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                statusFilter === "published"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Publicados ({publishedCount})
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-semibold transition ${
                statusFilter === "draft"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Rascunhos ({draftCount})
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: EVENTOS */}
      {activeTab === "events" && (
        <>
          {filteredEvents.length === 0 ? (
            /* Empty State */
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#00b4fb] mx-auto border border-sky-100">
                <Video className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Nenhum evento encontrado</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Não encontramos eventos com os filtros selecionados. Crie um novo webinar para começar a transmitir.
                </p>
              </div>
              <button
                onClick={onOpenCreateWizard}
                className="btn-buysoft-primary inline-flex items-center gap-2 px-4 py-2 text-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Criar primeiro webinar</span>
              </button>
            </div>
          ) : viewMode === "table" ? (
            /* Untitled UI Table View */
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">Nome do Evento</th>
                    <th scope="col" className="px-4 py-3.5">Tipo</th>
                    <th scope="col" className="px-4 py-3.5">Data e Hora</th>
                    <th scope="col" className="px-4 py-3.5">Audiência</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((ev) => {
                    const regCount = ev.registrations?.length || ev.registeredCount || 0;
                    const maxCount = ev.maxAttendees || 100;
                    const fillPercent = Math.min(100, Math.round((regCount / maxCount) * 100));

                    return (
                      <tr
                        key={ev.id}
                        onClick={() => onSelectEvent(ev)}
                        className="group cursor-pointer transition-colors hover:bg-sky-50/40 relative"
                      >
                        {/* Title & Thumbnail */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="relative h-11 w-16 shrink-0 rounded-xl bg-gradient-to-tr from-[#0084be] to-[#00b4fb] flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden border border-slate-200/60">
                              {ev.logoUrl ? (
                                <img src={ev.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                              ) : (
                                <Radio className="h-5 w-5 opacity-90" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 group-hover:text-[#0084be] transition truncate text-sm">
                                  {ev.title}
                                </span>
                                {ev.series && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0084be] border border-sky-200">
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
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0084be] border border-sky-200/60">
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

                        {/* Registered Count with Mini Progress Bar */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                              <span>{regCount}</span>
                              <span className="text-slate-400 text-[10px]">/ {maxCount}</span>
                            </div>
                            <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#00b4fb] transition-all"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Tag */}
                        <td className="px-4 py-4">
                          {ev.status === "published" && (
                            <span className="status-pill-published">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Publicado
                            </span>
                          )}
                          {ev.status === "draft" && (
                            <span className="status-pill-draft">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                              Rascunho
                            </span>
                          )}
                          {ev.status === "live" && (
                            <span className="status-pill-live animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Ao Vivo
                            </span>
                          )}
                        </td>

                        {/* Actions: Quick Studio button + 3-dot dropdown */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Quick studio button visible on hover/focus */}
                            <a
                              href={`/studio/${ev.id}`}
                              className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:text-[#0084be] hover:bg-sky-50/50 transition shadow-2xs"
                              title="Abrir Estúdio de Transmissão"
                            >
                              <Video className="h-3.5 w-3.5 text-[#00b4fb]" />
                              <span>Estúdio</span>
                            </a>

                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuEventId(openMenuEventId === ev.id ? null : ev.id);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition"
                                title="Opções"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Dropdown Popup */}
                              {openMenuEventId === ev.id && (
                                <div className="absolute right-0 z-50 mt-1 w-48 rounded-2xl border border-slate-200 bg-white py-2 shadow-2xl animate-in fade-in zoom-in-95 text-left divide-y divide-slate-100">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setOpenMenuEventId(null);
                                        onSelectEvent(ev);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                      <span>Gerenciar & Editar</span>
                                    </button>

                                    <a
                                      href={`/e/${ev.id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      onClick={() => setOpenMenuEventId(null)}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      <Eye className="h-3.5 w-3.5 text-slate-400" />
                                      <span>Página de Inscrição</span>
                                    </a>

                                    <a
                                      href={`/studio/${ev.id}`}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#0084be] hover:bg-sky-50 transition"
                                    >
                                      <Video className="h-3.5 w-3.5 text-[#00b4fb]" />
                                      <span>Abrir Estúdio WebRTC</span>
                                    </a>

                                    <button
                                      onClick={() => {
                                        setOpenMenuEventId(null);
                                        setSeriesModalEvent(ev);
                                        setSelectedSeriesId(ev.seriesId || "");
                                      }}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      <Folder className="h-3.5 w-3.5 text-slate-400" />
                                      <span>Vincular à Série</span>
                                    </button>

                                    <button
                                      onClick={(e) => handleDuplicate(ev, e)}
                                      disabled={isCopying === ev.id}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                                      <span>{isCopying === ev.id ? "Copiando..." : "Duplicar Evento"}</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setOpenMenuEventId(null);
                                        setTeamModalEvent(ev);
                                      }}
                                      className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      <Users className="h-3.5 w-3.5 text-slate-400" />
                                      <span>Equipe & Co-hosts</span>
                                    </button>
                                  </div>

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
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* 21st.dev Bento Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((ev) => {
                const regCount = ev.registrations?.length || ev.registeredCount || 0;
                const maxCount = ev.maxAttendees || 100;
                const fillPercent = Math.min(100, Math.round((regCount / maxCount) * 100));

                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="group stat-card-modern flex flex-col justify-between cursor-pointer p-0"
                  >
                    {/* Card Cover */}
                    <div className="relative h-36 w-full bg-gradient-to-tr from-slate-900 via-slate-800 to-sky-950 p-4 flex flex-col justify-between overflow-hidden">
                      {ev.logoUrl && (
                        <img
                          src={ev.logoUrl}
                          alt="Cover"
                          className="absolute inset-0 h-full w-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="flex items-center justify-between z-10">
                        <span className="rounded-full bg-black/50 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-semibold text-white border border-white/20">
                          Webinar
                        </span>

                        {ev.status === "published" && (
                          <span className="status-pill-published bg-emerald-950/80 text-emerald-300 border-emerald-500/50 backdrop-blur-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Publicado
                          </span>
                        )}
                        {ev.status === "draft" && (
                          <span className="status-pill-draft bg-slate-900/80 text-slate-300 border-slate-600 backdrop-blur-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Rascunho
                          </span>
                        )}
                        {ev.status === "live" && (
                          <span className="status-pill-live bg-rose-950/80 text-rose-300 border-rose-500/50 backdrop-blur-md animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Ao Vivo
                          </span>
                        )}
                      </div>

                      <div className="z-10 flex items-center gap-1.5 text-white/90 text-xs font-semibold">
                        <Calendar className="h-3.5 w-3.5 text-[#00b4fb]" />
                        <span>{formatDate(ev.startDate)}</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-900 text-base leading-snug group-hover:text-[#0084be] transition">
                          {ev.title}
                        </h4>
                        {ev.series && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0084be] border border-sky-200">
                            <Folder className="h-2.5 w-2.5" />
                            {ev.series.title}
                          </span>
                        )}
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {ev.description || "Nenhuma descrição informada."}
                        </p>
                      </div>

                      {/* Attendee capacity meter */}
                      <div className="space-y-1.5 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            Inscritos
                          </span>
                          <span className="font-bold text-slate-900">
                            {regCount} / {maxCount}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#00b4fb]"
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`/studio/${ev.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn-buysoft-primary flex-1 flex items-center justify-center gap-1.5 py-2 text-xs"
                        >
                          <Video className="h-3.5 w-3.5" />
                          <span>Estúdio</span>
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(ev);
                          }}
                          className="btn-buysoft-secondary px-3 py-2 text-xs"
                        >
                          <span>Gerenciar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
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
              className="btn-buysoft-primary flex items-center gap-1.5 px-3.5 py-2 text-xs"
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
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Crie uma série para conectar webinars relacionados (ex: Trilha de Inovação, Masterclasses) onde os participantes podem se inscrever em todos de uma só vez.
                </p>
              </div>
              <button
                onClick={() => setShowCreateSeriesModal(true)}
                className="btn-buysoft-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
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
                  className="stat-card-modern space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-[#0084be] border border-sky-200">
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
                      <span>Página Pública da Trilha</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200/80">
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
                className="btn-buysoft-secondary px-4 py-2 text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEventSeries}
                className="btn-buysoft-primary px-4 py-2 text-xs"
              >
                Salvar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Acesso da Equipe */}
      {teamModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200/80">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200/80">
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
                className="btn-buysoft-secondary px-4 py-2 text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-200/80">
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
                  className="btn-buysoft-secondary px-4 py-2 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-buysoft-primary px-4 py-2 text-xs"
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
