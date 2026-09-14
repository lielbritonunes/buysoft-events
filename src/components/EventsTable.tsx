"use client";

import React, { useState } from "react";
import {
  Search,
  ChevronDown,
  MoreHorizontal,
  FolderPlus,
  Plus,
  Video,
  Eye,
  Edit3,
  Folder,
  Copy,
  Users,
  Trash2,
  ExternalLink,
  ChevronsUpDown,
  Check,
  AlertTriangle,
  Calendar,
  Clock
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
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Action Menu State (Three horizontal dots)
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

  // Format date like RingCentral: "12 de out., 17:00 → 18:00"
  const formatRingCentralDate = (startDateStr: string, endDateStr?: string) => {
    try {
      const start = new Date(startDateStr);
      const dayMonth = start.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
      const startTime = start.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (endDateStr) {
        const end = new Date(endDateStr);
        const endTime = end.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${dayMonth}, ${startTime} → ${endTime}`;
      }

      return `${dayMonth}, ${startTime}`;
    } catch {
      return startDateStr;
    }
  };

  // Close menus when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuEventId(null);
      setIsFilterDropdownOpen(false);
    };
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

  // Render Action Dropdown Menu
  const renderActionMenu = (ev: any, alignRight = true) => {
    if (openMenuEventId !== ev.id) return null;

    return (
      <div
        className={`absolute z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-xl text-left divide-y divide-slate-100 animate-in fade-in zoom-in-95 ${
          alignRight ? "right-0" : "left-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
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

          <a
            href={`/studio/${ev.id}`}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-[#0084be] hover:bg-sky-50 transition"
          >
            <Video className="h-3.5 w-3.5 text-[#00b4fb]" />
            <span>Abrir Estúdio</span>
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
            <span>Série</span>
          </button>

          <button
            onClick={(e) => handleDuplicate(ev, e)}
            disabled={isCopying === ev.id}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400" />
            <span>{isCopying === ev.id ? "Copiando..." : "Copiar"}</span>
          </button>

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
    );
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 font-sans">
      {/* 1. Mobile-First Control Bar (Clean & Responsive) */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Top Row on mobile: Tabs & Create Event CTA */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Tabs: Eventos | Séries */}
          <div className="flex items-center gap-1.5 bg-slate-200/50 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("events")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "events"
                  ? "bg-white text-[#0084be] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Eventos
            </button>
            <button
              onClick={() => setActiveTab("series")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "series"
                  ? "bg-white text-[#0084be] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Séries
            </button>
          </div>

          {/* Criar Evento Button on Top Right */}
          <button
            onClick={onOpenCreateWizard}
            className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-xs shadow-sky-300/30 transition shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Criar evento</span>
          </button>
        </div>

        {/* Second Row: Search, Filter, and Nova Série */}
        <div className="flex items-center gap-2">
          {/* Pesquisar Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb] shadow-2xs transition"
            />
          </div>

          {/* Filtrar Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition shadow-2xs shrink-0 ${
                statusFilter !== "all"
                  ? "border-sky-300 bg-sky-50 text-[#0084be]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <span>
                {statusFilter === "all"
                  ? "Filtrar"
                  : statusFilter === "published"
                  ? "Publicados"
                  : statusFilter === "live"
                  ? "Ao Vivo"
                  : "Rascunhos"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 z-40 mt-1.5 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg text-xs animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 font-medium transition ${
                    statusFilter === "all" ? "bg-sky-50 text-[#0084be] font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>Todos</span>
                  {statusFilter === "all" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setStatusFilter("published");
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 font-medium transition ${
                    statusFilter === "published" ? "bg-sky-50 text-[#0084be] font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Publicados
                  </span>
                  {statusFilter === "published" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setStatusFilter("live");
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 font-medium transition ${
                    statusFilter === "live" ? "bg-sky-50 text-[#0084be] font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Ao Vivo
                  </span>
                  {statusFilter === "live" && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setStatusFilter("draft");
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 font-medium transition ${
                    statusFilter === "draft" ? "bg-sky-50 text-[#0084be] font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Rascunho
                  </span>
                  {statusFilter === "draft" && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Nova Série Button */}
          <button
            onClick={() => setShowCreateSeriesModal(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 sm:px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs shrink-0"
          >
            Nova série
          </button>
        </div>
      </div>

      {/* 2. TAB 1: EVENTOS */}
      {activeTab === "events" && (
        <>
          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center text-slate-400 space-y-3 shadow-xs">
              <Video className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">Nenhum evento encontrado</p>
              <p className="text-xs text-slate-400">
                Clique em &quot;Criar evento&quot; para agendar seu primeiro webinar.
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW (< md): Touch-Friendly Cards */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredEvents.map((ev) => {
                  const regCount = ev.registrations?.length || ev.registeredCount || 0;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs active:scale-[0.99] transition cursor-pointer relative"
                    >
                      {/* Top Row: Thumbnail + Title + Options Menu */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-14 shrink-0 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white overflow-hidden shadow-2xs">
                            {ev.logoUrl ? (
                              <img src={ev.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                            ) : null}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate leading-snug">
                              {ev.title}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="inline-flex items-center rounded-md bg-[#e6f7fe] px-2 py-0.5 text-[10px] font-semibold text-[#0084be]">
                                Webinar
                              </span>
                              {ev.series && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0084be] border border-sky-100">
                                  <Folder className="h-2.5 w-2.5" />
                                  {ev.series.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3-dots Menu Button */}
                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuEventId(openMenuEventId === ev.id ? null : ev.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 transition rounded-lg hover:bg-slate-100"
                            title="Opções"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {renderActionMenu(ev, true)}
                        </div>
                      </div>

                      {/* Bottom Info Row: Date + Registered + Status */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">
                            {formatRingCentralDate(ev.startDate, ev.endDate)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {regCount} {regCount === 1 ? "inscrito" : "inscritos"}
                          </span>
                        </div>

                        <div>
                          {ev.status === "published" && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Publicado</span>
                            </div>
                          )}
                          {ev.status === "draft" && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                              <span>Rascunho</span>
                            </div>
                          )}
                          {ev.status === "live" && (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              <span>Ao Vivo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP VIEW (>= md): Full RingCentral Clean Table */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="border-b border-slate-100 bg-white text-[12px] font-semibold text-slate-500">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-semibold">Nome</th>
                      <th scope="col" className="px-4 py-4 font-semibold">Tipo</th>
                      <th scope="col" className="px-4 py-4 font-semibold">
                        <div className="flex items-center gap-1 cursor-pointer hover:text-slate-800">
                          <span>Data e Hora</span>
                          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-4 font-semibold text-center">Inscritos</th>
                      <th scope="col" className="px-4 py-4 font-semibold">Status</th>
                      <th scope="col" className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEvents.map((ev) => {
                      const regCount = ev.registrations?.length || ev.registeredCount || 0;

                      return (
                        <tr
                          key={ev.id}
                          onClick={() => onSelectEvent(ev)}
                          className="group cursor-pointer hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Nome + Thumbnail */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-14 shrink-0 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white overflow-hidden shadow-2xs">
                                {ev.logoUrl ? (
                                  <img src={ev.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                                ) : null}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 group-hover:text-[#0084be] transition text-sm">
                                    {ev.title}
                                  </span>
                                  {ev.series && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-[#0084be] border border-sky-100">
                                      <Folder className="h-2.5 w-2.5" />
                                      {ev.series.title}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400">
                                  {ev.timezone || "Horário de Brasília"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Tipo: Webinar Badge */}
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-md bg-[#e6f7fe] px-2.5 py-0.5 text-[11px] font-semibold text-[#0084be]">
                              Webinar
                            </span>
                          </td>

                          {/* Data e Hora */}
                          <td className="px-4 py-4 font-medium text-slate-700">
                            {formatRingCentralDate(ev.startDate, ev.endDate)}
                          </td>

                          {/* Inscritos */}
                          <td className="px-4 py-4 text-center font-medium text-slate-800">
                            {regCount}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            {ev.status === "published" && (
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <span className="h-2 w-2 rounded-xs bg-emerald-500" />
                                <span>Publicado</span>
                              </div>
                            )}
                            {ev.status === "draft" && (
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <span className="h-2 w-2 rounded-xs bg-amber-400" />
                                <span>Rascunho</span>
                              </div>
                            )}
                            {ev.status === "live" && (
                              <div className="flex items-center gap-2 text-xs font-bold text-rose-600 animate-pulse">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                <span>Ao Vivo</span>
                              </div>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuEventId(openMenuEventId === ev.id ? null : ev.id);
                                }}
                                className="p-1 text-sky-600 hover:text-[#0084be] transition rounded-lg hover:bg-slate-100"
                                title="Opções"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {renderActionMenu(ev, true)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* 3. TAB 2: SÉRIES DE EVENTOS */}
      {activeTab === "series" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Séries de Webinars</h3>
              <p className="text-xs text-slate-500">
                Agrupamentos de múltiplos webinars para inscrição unificada.
              </p>
            </div>
            <button
              onClick={() => setShowCreateSeriesModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Série</span>
            </button>
          </div>

          {filteredSeries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center text-slate-400 space-y-3">
              <Folder className="h-10 w-10 mx-auto text-slate-300" />
              <div>
                <p className="text-sm font-bold text-slate-700">Nenhuma série cadastrada</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Crie uma série para conectar webinars relacionados (ex: Trilha de Liderança, Masterclasses).
                </p>
              </div>
              <button
                onClick={() => setShowCreateSeriesModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-2 text-xs font-bold text-white transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Criar Primeira Série</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSeries.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-[#0084be] border border-sky-100">
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
                      <span>Página da Trilha</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Vincular à Série</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{seriesModalEvent.title}</p>
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
                Ao vincular este webinar a uma série, os participantes poderão se inscrever em todos os encontros de uma só vez.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSeriesModalEvent(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEventSeries}
                className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-2 text-xs font-bold text-white transition"
              >
                Salvar Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Acesso da Equipe */}
      {teamModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Acesso da Equipe</h3>
                <p className="text-xs text-slate-500">Membros com permissão de orador/host</p>
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
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                {organizationMembers.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00b4fb] font-bold text-white text-[10px]">
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
                Todos os membros da organização possuem acesso automático ao estúdio de transmissão.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Excluir este webinar?</h3>
              <p className="text-xs text-slate-500">
                Tem certeza que deseja excluir <strong>{deleteModalEvent.title}</strong>? Esta ação removerá as inscrições permanentemente.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModalEvent(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Criar Nova Série */}
      {showCreateSeriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Criar Nova Série</h3>
                <p className="text-xs text-slate-500">Agrupe webinars em uma mesma trilha</p>
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
                  placeholder="Ex: Trilha de Liderança 2026"
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Objetivo da série de webinars..."
                  value={newSeriesDesc}
                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSeriesModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-2 text-xs font-bold text-white transition"
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
