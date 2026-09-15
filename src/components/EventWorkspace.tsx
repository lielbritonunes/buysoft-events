"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Clock,
  Users,
  Radio,
  FileText,
  Settings,
  Mail,
  BarChart3,
  Video,
  Plus,
  Trash2,
  Play,
  Mic,
  Save,
  Palette,
  Shield,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Layout,
  MessageSquare,
  HelpCircle,
  BarChart2,
  ChevronDown,
  Star,
  Layers,
  CheckCircle2,
  Send,
  Eye,
  Sliders,
  Maximize2
} from "lucide-react";

function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

import {
  updateEvent,
  addSpeaker,
  deleteSpeaker,
  saveFormFields,
} from "@/lib/dbActions";
import MarketingTab from "@/components/workspace/MarketingTab";
import AnalyticsTab from "@/components/workspace/AnalyticsTab";
import RecordingsTab from "@/components/workspace/RecordingsTab";

interface Props {
  event: any;
  onBack: () => void;
  onUpdateEvent: (updated: any) => void;
}

export default function EventWorkspace({ event, onBack, onUpdateEvent }: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "registration" | "settings" | "marketing" | "analytics" | "recordings"
  >("overview");

  // Configuração sub-tabs: Básico, Branding, Agenda, Patrocinadores, Orador, YouTube
  const [settingsSubTab, setSettingsSubTab] = useState<
    "basic" | "branding" | "agenda" | "sponsors" | "speakers" | "youtube"
  >("branding");

  // YouTube Live Integration State
  const [ytStatus, setYtStatus] = useState<{
    isConnected: boolean;
    channelTitle?: string;
    channelThumbnail?: string;
  }>({ isConnected: false });
  const [isSyncingYt, setIsSyncingYt] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);

  const fetchYouTubeStatus = () => {
    fetch("/api/integrations/youtube/status")
      .then((res) => res.json())
      .then((data) => setYtStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchYouTubeStatus();
  }, []);

  const handleSyncYouTube = async () => {
    setIsSyncingYt(true);
    try {
      const res = await fetch("/api/integrations/youtube/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_event", eventId: event.id }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        onUpdateEvent(data.event);
        setSaveToast(true);
        setTimeout(() => setSaveToast(false), 3000);
      } else {
        alert(data.message || "Erro ao sincronizar com o YouTube");
      }
    } catch (e: any) {
      alert("Erro ao conectar com a API do YouTube: " + e.message);
    } finally {
      setIsSyncingYt(false);
    }
  };

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form builder & Registration page settings (Item 3)
  const [layoutType, setLayoutType] = useState<"classic" | "advanced">(
    event.layoutType || "classic"
  );
  const [advancedTheme, setAdvancedTheme] = useState<string>(
    event.advancedTheme || "crosby"
  );
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string>(
    event.confirmationMessage ||
      "Obrigado por se inscrever! Seu acesso ao webinar está confirmado. Enviamos as orientações e o link exclusivo para o seu e-mail."
  );

  const [formFields, setFormFields] = useState<any[]>(
    event.formFields && event.formFields.length > 0
      ? event.formFields
      : [
          { id: "f1", label: "Nome completo", type: "text", required: true, orderIndex: 0 },
          { id: "f2", label: "Seu melhor e-mail", type: "text", required: true, orderIndex: 1 },
          { id: "f3", label: "Empresa", type: "text", required: false, orderIndex: 2 },
        ]
  );
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Branding & Cores state (Item 4 matching Image 3)
  const [logoUrl, setLogoUrl] = useState<string>(
    event.logoUrl || ""
  );
  const [bannerUrl, setBannerUrl] = useState<string>(
    event.bannerUrl || ""
  );
  const [colorPreset, setColorPreset] = useState<string>("classic");
  const [primaryColor, setPrimaryColor] = useState<string>(
    event.primaryColor || "#00b4fb"
  );
  const [backgroundColor, setBackgroundColor] = useState<string>(
    event.backgroundColor || "#ffffff"
  );
  const [textColor, setTextColor] = useState<string>(
    event.textColor || "#0f172a"
  );
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);

  // File upload refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Speaker state
  const [speakerForm, setSpeakerForm] = useState({
    name: "",
    email: "",
    role: "",
    company: "",
    bio: "",
  });
  const [isAddingSpeaker, setIsAddingSpeaker] = useState(false);

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Toggle publish
  const handleTogglePublish = async () => {
    const nextStatus = event.status === "draft" ? "published" : "draft";
    const updated = await updateEvent(event.id, { status: nextStatus });
    onUpdateEvent(updated);
  };

  // Handle Logo Upload (Base64)
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Banner Upload (Base64)
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Arquivo muito grande. O tamanho máximo permitido é 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBannerUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save branding settings (Item 4)
  const handleSaveBranding = async () => {
    setIsSaving(true);
    try {
      const updated = await updateEvent(event.id, {
        logoUrl,
        bannerUrl,
        primaryColor,
        backgroundColor,
        textColor,
      });
      onUpdateEvent(updated);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (err) {
      console.error("Error saving branding:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save registration settings (Item 3)
  const handleSaveRegistrationSettings = async () => {
    setIsSaving(true);
    try {
      const [updated] = await Promise.all([
        updateEvent(event.id, {
          layoutType,
          advancedTheme,
          confirmationMessage,
        }),
        saveFormFields(
          event.id,
          formFields.map((f, i) => ({
            label: f.label,
            type: f.type || "text",
            required: f.required || false,
            orderIndex: i,
          }))
        ),
      ]);
      onUpdateEvent(updated);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    } catch (err) {
      console.error("Error saving registration settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const newField = {
      id: "f_" + Date.now(),
      label: newFieldLabel.trim(),
      type: "text",
      required: newFieldRequired,
      orderIndex: formFields.length,
    };
    setFormFields([...formFields, newField]);
    setNewFieldLabel("");
    setNewFieldRequired(false);
  };

  const handleDeleteField = (index: number) => {
    setFormFields(formFields.filter((_, i) => i !== index));
  };

  // Add speaker
  const handleCreateSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speakerForm.name.trim() || !speakerForm.email.trim()) return;

    const newSpk = await addSpeaker(event.id, speakerForm);
    const updatedSpeakers = [...(event.speakers || []), newSpk];
    onUpdateEvent({ ...event, speakers: updatedSpeakers });

    setSpeakerForm({ name: "", email: "", role: "", company: "", bio: "" });
    setIsAddingSpeaker(false);
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    await deleteSpeaker(speakerId);
    onUpdateEvent({
      ...event,
      speakers: (event.speakers || []).filter((s: any) => s.id !== speakerId),
    });
  };

  const registrationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/e/${event.id}`
    : `/e/${event.id}`;

  const backstageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/studio/${event.id}?role=speaker`
    : `/studio/${event.id}?role=speaker`;

  const liveUrl = typeof window !== "undefined"
    ? `${window.location.origin}/live/${event.id}`
    : `/live/${event.id}`;

  const hostStudioUrl = typeof window !== "undefined"
    ? `${window.location.origin}/studio/${event.id}?role=host`
    : `/studio/${event.id}?role=host`;

  // Color preset selector handler
  const handlePresetSelect = (preset: string) => {
    setColorPreset(preset);
    if (preset === "classic") {
      setPrimaryColor("#00b4fb");
      setBackgroundColor("#ffffff");
      setTextColor("#0f172a");
    } else if (preset === "dark") {
      setPrimaryColor("#38bdf8");
      setBackgroundColor("#0b0f19");
      setTextColor("#f8fafc");
    } else if (preset === "emerald") {
      setPrimaryColor("#10b981");
      setBackgroundColor("#ffffff");
      setTextColor("#064e3b");
    } else if (preset === "sunset") {
      setPrimaryColor("#f97316");
      setBackgroundColor("#ffffff");
      setTextColor("#431407");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans selection:bg-[#00b4fb] selection:text-white">
      {/* Top Bar matching RingCentral Events */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg p-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para Eventos</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200" />

          {/* Logo Buysoft */}
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-[#00b4fb] tracking-tight">Buysoft</span>
            <span className="text-sm font-semibold text-slate-800">Events</span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
              {event.title}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                event.status === "published"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {event.status === "published" ? "Publicado" : "Rascunho"}
            </span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href={hostStudioUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00b4fb] to-sky-600 hover:from-[#009ce0] hover:to-sky-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs shadow-sky-500/25 transition"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Abrir Estúdio (Host)</span>
          </a>

          <a
            href={registrationUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Pré-visualizar inscrição</span>
          </a>

          <a
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Pré-visualizar evento</span>
          </a>

          <button
            onClick={handleTogglePublish}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-xs transition ${
              event.status === "published"
                ? "bg-slate-700 hover:bg-slate-800"
                : "bg-[#ff6d00] hover:bg-[#e66200]"
            }`}
          >
            {event.status === "published" ? "Despublicar evento" : "Atualizar para publicar"}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout with Left Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Menu */}
        <aside className="w-60 border-r border-slate-200 bg-white p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* Event Name & Time Info */}
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 truncate">{event.title}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {new Date(event.startDate).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                  activeTab === "overview"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="h-4 w-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-[1px]" />
                  <div className="bg-current rounded-[1px]" />
                  <div className="bg-current rounded-[1px]" />
                  <div className="bg-current rounded-[1px]" />
                </div>
                <span>Visão geral</span>
              </button>

              <button
                onClick={() => setActiveTab("registration")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                  activeTab === "registration"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Página de inscrições</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                  activeTab === "settings"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Configuração</span>
              </button>

              {/* Sub-menu of Configuração if on settings tab */}
              {activeTab === "settings" && (
                <div className="pl-6 pt-1 pb-2 space-y-1">
                  <button
                    onClick={() => setSettingsSubTab("basic")}
                    className={`block w-full text-left py-1 px-2 rounded text-[11px] font-medium transition ${
                      settingsSubTab === "basic"
                        ? "text-[#00b4fb] font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Básico
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("branding")}
                    className={`block w-full text-left py-1 px-2 rounded text-[11px] font-medium transition ${
                      settingsSubTab === "branding"
                        ? "text-[#00b4fb] font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Branding
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("agenda")}
                    className={`block w-full text-left py-1 px-2 rounded text-[11px] font-medium transition ${
                      settingsSubTab === "agenda"
                        ? "text-[#00b4fb] font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Agenda
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("sponsors")}
                    className={`block w-full text-left py-1 px-2 rounded text-[11px] font-medium transition ${
                      settingsSubTab === "sponsors"
                        ? "text-[#00b4fb] font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Patrocinadores
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("speakers")}
                    className={`flex items-center justify-between w-full text-left py-1 px-2 rounded text-[11px] font-medium transition ${
                      settingsSubTab === "speakers"
                        ? "text-[#00b4fb] font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>Orador</span>
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("youtube")}
                    className={`flex items-center justify-between w-full text-left py-1 px-2 rounded text-[11px] font-medium transition ${
                      settingsSubTab === "youtube"
                        ? "text-rose-600 font-bold bg-rose-50"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>YouTube Live</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        ytStatus.isConnected ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={ytStatus.isConnected ? "Canal Conectado" : "Não conectado"}
                    />
                  </button>
                </div>
              )}

              <button
                onClick={() => setActiveTab("marketing")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                  activeTab === "marketing"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Marketing & E-mails</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                  activeTab === "analytics"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Análises & Leads</span>
              </button>

              <button
                onClick={() => setActiveTab("recordings")}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 transition ${
                  activeTab === "recordings"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Video className="h-4 w-4" />
                <span>Gravações</span>
              </button>
            </nav>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center gap-2.5 text-xs text-slate-600">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 font-bold text-white text-[10px]">
              EN
            </div>
            <span className="font-semibold text-slate-800">Eliel Nunes</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 max-w-6xl overflow-y-auto">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Guia Rápido */}
                <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Guia de configuração rápida</h3>
                    <ul className="space-y-2.5 text-xs">
                      <li
                        onClick={() => setActiveTab("registration")}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 transition"
                      >
                        <span>1. Layout e página de inscrição</span>
                        <span className="text-slate-400">›</span>
                      </li>
                      <li
                        onClick={() => {
                          setActiveTab("settings");
                          setSettingsSubTab("branding");
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 transition"
                      >
                        <span>2. Logo, banner e cores</span>
                        <span className="text-slate-400">›</span>
                      </li>
                      <li
                        onClick={() => {
                          setActiveTab("settings");
                          setSettingsSubTab("speakers");
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 transition"
                      >
                        <span>3. Oradores ({event.speakers?.length || 0})</span>
                        <span className="text-slate-400">›</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Status</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        event.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {event.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                </div>

                {/* Event Card com Links */}
                <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex items-start gap-4">
                    {bannerUrl ? (
                      <div className="h-16 w-24 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                        <img src={bannerUrl} alt="Banner" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-24 rounded-xl bg-gradient-to-r from-[#0084be] to-[#00b4fb] flex items-center justify-center text-white font-bold shadow-xs">
                        <Radio className="h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-[#e6f7fe] px-2.5 py-0.5 text-xs font-bold text-[#0084be]">
                          Webinar
                        </span>
                        <span className="text-xs font-bold text-slate-600">
                          {event.registrations?.length || 0} inscritos
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">{event.title}</h2>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {/* Public Registration Link */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Link Público de Inscrição</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm">{registrationUrl}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(registrationUrl, "registration")}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                        >
                          {copiedLink === "registration" ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`/e/${event.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                          title="Abrir página"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Host Studio Link */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50/60 border border-sky-200">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Radio className="h-3.5 w-3.5 text-[#00b4fb] animate-pulse" />
                          <p className="text-xs font-bold text-slate-900">Estúdio de Transmissão & Palco (Host / Organizador)</p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Controle de câmera, microfone, slides, entrada ao vivo, camarim e Live CTA
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(hostStudioUrl, "hostStudio")}
                          className="flex items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-50 transition shadow-xs"
                        >
                          {copiedLink === "hostStudio" ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-sky-500" />
                              <span>Copiar Link do Host</span>
                            </>
                          )}
                        </button>
                        <a
                          href={hostStudioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-[#00b4fb] hover:bg-[#009ce0] text-white px-3 py-1.5 text-xs font-bold shadow-xs transition"
                          title="Abrir estúdio como organizador"
                        >
                          <span>Entrar no Estúdio</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Backstage Link */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div>
                        <p className="text-xs font-bold text-slate-900">Link Exclusivo dos Oradores (Backstage)</p>
                        <p className="text-[11px] text-slate-500">Acesso direto ao camarim e palco para palestrantes</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(backstageUrl, "backstage")}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                        >
                          {copiedLink === "backstage" ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-400" />
                              <span>Copiar Backstage</span>
                            </>
                          )}
                        </button>
                        <a
                          href={backstageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          title="Abrir camarim do orador"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PÁGINA DE INSCRIÇÕES (ITEM 3) */}
          {activeTab === "registration" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Configuração da Página de Inscrições</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Escolha entre o layout clássico ou o construtor visual avançado com temas personalizáveis.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {saveToast && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                      <Check className="h-4 w-4" /> Alterações salvas!
                    </span>
                  )}
                  <button
                    onClick={handleSaveRegistrationSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#009ce0] transition disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Salvar Configurações</span>
                  </button>
                </div>
              </div>

              {/* Layout Mode Selector (Item 3) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layout className="h-4 w-4 text-[#00b4fb]" />
                  Modelo de Layout da Página
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Clássico */}
                  <div
                    onClick={() => setLayoutType("classic")}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition flex flex-col justify-between ${
                      layoutType === "classic"
                        ? "border-[#00b4fb] bg-sky-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Padrão RingCentral
                        </span>
                        {layoutType === "classic" && (
                          <span className="rounded-full bg-[#00b4fb] px-2 py-0.5 text-[10px] font-bold text-white">
                            Ativo
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">Layout Clássico</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Página de alta conversão, limpa e direta. Formulário lateral com cronômetro regressivo, detalhes do evento e oradores em destaque.
                      </p>
                    </div>

                    <div className="mt-4 rounded-lg bg-slate-100 p-2 text-center text-[11px] font-medium text-slate-600">
                      Ideal para webinários corporativos rápidos e objetivos
                    </div>
                  </div>

                  {/* Option 2: Avançado */}
                  <div
                    onClick={() => {
                      setLayoutType("advanced");
                      setIsThemeModalOpen(true);
                    }}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition flex flex-col justify-between ${
                      layoutType === "advanced"
                        ? "border-[#00b4fb] bg-sky-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#0084be]">
                          Modular & Rico
                        </span>
                        {layoutType === "advanced" && (
                          <span className="rounded-full bg-[#00b4fb] px-2 py-0.5 text-[10px] font-bold text-white">
                            Ativo: {advancedTheme.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">Layout Avançado (Themes)</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Construtor de páginas com templates pré-construídos (Crosby, Seldon, Minimalist) ou criação do zero. Ideal para grandes eventos e exposições.
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#00b4fb]">
                        Tema selecionado: <b>{advancedTheme}</b>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsThemeModalOpen(true);
                        }}
                        className="rounded-lg bg-white border border-slate-300 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                      >
                        Trocar tema
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensagem de Confirmação de Inscrição (Item 3) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Mensagem de Confirmação de Inscrição
                  </h3>
                  <span className="text-[11px] text-slate-400">Exibida na tela pós-inscrição</span>
                </div>
                <p className="text-xs text-slate-500">
                  Personalize a mensagem de agradecimento e as orientações que o participante verá imediatamente após concluir o formulário:
                </p>
                <textarea
                  rows={3}
                  value={confirmationMessage}
                  onChange={(e) => setConfirmationMessage(e.target.value)}
                  placeholder="Ex: Obrigado por se inscrever! Seu acesso ao webinar está garantido..."
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-800 leading-relaxed focus:border-[#00b4fb] focus:outline-none"
                />
              </div>

              {/* Form Fields Builder */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#00b4fb]" />
                  Campos do Formulário de Inscrição
                </h3>

                {/* Add New Field */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ex: Cargo, Segmento da Empresa, Telefone/WhatsApp..."
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                  />
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 px-2">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="h-4 w-4 accent-[#00b4fb]"
                    />
                    <span>Obrigatório</span>
                  </label>
                  <button
                    onClick={handleAddField}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Pergunta</span>
                  </button>
                </div>

                {/* Fields List */}
                <div className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {formFields.map((field, index) => (
                    <div key={field.id || index} className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{field.label}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => {
                              const copy = [...formFields];
                              copy[index].required = e.target.checked;
                              setFormFields(copy);
                            }}
                            className="h-3.5 w-3.5 accent-[#00b4fb]"
                          />
                          <span className="text-[11px] font-medium">Obrigatório</span>
                        </label>

                        <button
                          onClick={() => handleDeleteField(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                          title="Remover pergunta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURAÇÃO (ITEM 4 MATCHING IMAGE 3) */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Sub-tab: BRANDING & CORES (IMAGE 3 REFERENCE) */}
              {settingsSubTab === "branding" && (
                <div className="space-y-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Branding</h2>
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                        Personalize seu evento customizando seu logotipo e cores. Veja-os refletidos em aplicativos web e móveis.
                        Visite nossa <a href="#" className="text-[#00b4fb] hover:underline">Base de Conhecimento</a> para saber mais sobre design e branding no RingCentral.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={registrationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Pré-visualizar inscrição</span>
                      </a>
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Pré-visualizar evento</span>
                      </a>
                    </div>
                  </div>

                  {/* Main Grid: Left Controls (Logo, Banner, Cores) + Right Live Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column (6 cols): Inputs */}
                    <div className="lg:col-span-6 space-y-6">
                      {/* 1. LOGOTIPO */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <h3 className="text-sm font-bold text-slate-900">Logotipo</h3>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                            ) : (
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00b4fb] text-white font-black text-xs">
                                B
                              </div>
                            )}
                          </div>

                          <div>
                            <input
                              type="file"
                              ref={logoInputRef}
                              onChange={handleLogoFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => logoInputRef.current?.click()}
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                            >
                              Escolha a imagem
                            </button>
                            <p className="text-[11px] text-slate-400 mt-1">PNG ou SVG transparente recomendado</p>
                          </div>
                        </div>
                      </div>

                      {/* 2. BANNER */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Banner</h3>
                          <p className="text-xs text-slate-500">Mostrado na inscrição, recepção e palco principal.</p>
                        </div>

                        {/* Drag & Drop Zone */}
                        <div
                          onClick={() => bannerInputRef.current?.click()}
                          className="cursor-pointer group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 text-center transition hover:border-[#00b4fb] hover:bg-sky-50/30"
                        >
                          <input
                            type="file"
                            ref={bannerInputRef}
                            onChange={handleBannerFileChange}
                            accept="image/*"
                            className="hidden"
                          />

                          {bannerUrl ? (
                            <div className="w-full aspect-[5/2] rounded-xl overflow-hidden shadow-sm relative group">
                              <img src={bannerUrl} alt="Banner Preview" className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                                Clique para trocar o banner
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-2 group-hover:text-[#00b4fb] transition">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                              <p className="text-xs font-semibold text-slate-700">
                                <span className="text-[#00b4fb] font-bold">Escolha o arquivo</span> ou arraste-o e solte-o aqui
                              </p>
                              <p className="text-[11px] text-slate-400 mt-1">Tamanho máximo de upload: 2 MB</p>
                              <p className="text-[10px] text-slate-400">
                                Para melhores resultados, use uma imagem com tamanho mínimo de 1500×600 e proporção de 5:2.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 3. PREDEFINIDOS DE CORES */}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900">Predefinidos de cores</h3>
                          <button
                            type="button"
                            onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                            className="text-xs font-bold text-[#00b4fb] hover:underline"
                          >
                            {showCustomColorPicker ? "Fechar personalizador" : "Criar novo"}
                          </button>
                        </div>

                        {/* Presets Select */}
                        <div className="space-y-2">
                          <select
                            value={colorPreset}
                            onChange={(e) => handlePresetSelect(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#00b4fb] focus:outline-none"
                          >
                            <option value="classic">Clássico (Buysoft Cyan #00b4fb)</option>
                            <option value="dark">Dark Modern (Sky Blue #38bdf8)</option>
                            <option value="emerald">Emerald B2B (Green #10b981)</option>
                            <option value="sunset">Sunset Tech (Orange #f97316)</option>
                          </select>

                          <div className="flex items-center gap-2 pt-1">
                            <span
                              className="h-6 w-6 rounded-full border border-slate-200 shadow-xs"
                              style={{ backgroundColor: primaryColor }}
                              title="Cor Primária"
                            />
                            <span
                              className="h-6 w-6 rounded-full border border-slate-200 shadow-xs"
                              style={{ backgroundColor: backgroundColor }}
                              title="Cor de Fundo"
                            />
                            <span
                              className="h-6 w-6 rounded-full border border-slate-200 shadow-xs"
                              style={{ backgroundColor: textColor }}
                              title="Cor de Texto"
                            />
                            <span className="text-[11px] font-mono text-slate-500 pl-2">
                              {primaryColor}
                            </span>
                          </div>
                        </div>

                        {/* Custom Color Picker Accordion */}
                        {showCustomColorPicker && (
                          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
                            <h4 className="text-xs font-bold text-sky-900">Definir Cores Customizadas</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Primária</label>
                                <input
                                  type="color"
                                  value={primaryColor}
                                  onChange={(e) => setPrimaryColor(e.target.value)}
                                  className="h-8 w-full rounded border border-slate-200 cursor-pointer"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Fundo</label>
                                <input
                                  type="color"
                                  value={backgroundColor}
                                  onChange={(e) => setBackgroundColor(e.target.value)}
                                  className="h-8 w-full rounded border border-slate-200 cursor-pointer"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Texto</label>
                                <input
                                  type="color"
                                  value={textColor}
                                  onChange={(e) => setTextColor(e.target.value)}
                                  className="h-8 w-full rounded border border-slate-200 cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sticky Save Button matching Image 3 "Guardar" */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleSaveBranding}
                          disabled={isSaving}
                          className="flex items-center justify-center gap-2 rounded-xl bg-[#00b4fb] px-8 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#009ce0] transition disabled:opacity-50"
                        >
                          {isSaving ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <>
                              <Save className="h-3.5 w-3.5" />
                              <span>Guardar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right Column (6 cols): LIVE PREVIEW (MATCHING IMAGE 3 EXACTLY) */}
                    <div className="lg:col-span-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Pré-visualizar</span>
                        <span className="text-[10px] text-slate-400">Ambiente do participante ao vivo</span>
                      </div>

                      {/* Live App Frame Mockup */}
                      <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden flex flex-col h-[520px]">
                        {/* Mock Stage Header */}
                        <div className="flex h-10 items-center justify-between border-b border-slate-100 px-4 bg-slate-50/80">
                          <div className="flex items-center gap-2">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="h-5 w-auto object-contain" />
                            ) : (
                              <div
                                className="h-4 w-4 rounded font-bold text-white flex items-center justify-center text-[9px]"
                                style={{ backgroundColor: primaryColor }}
                              >
                                B
                              </div>
                            )}
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                              {event.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                              AO VIVO
                            </span>
                          </div>
                        </div>

                        {/* Mock Body: Left Mini Nav + Main Chat / Stage */}
                        <div className="flex flex-1 overflow-hidden">
                          {/* Mini Left Navigation matching Image 3: Recepção, Palco, Sessões, Networking */}
                          <div className="w-20 border-r border-slate-100 bg-slate-50/50 p-2 flex flex-col items-center gap-3 shrink-0">
                            <div
                              className="flex flex-col items-center gap-1 p-2 rounded-xl text-center w-full transition"
                              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                            >
                              <div className="h-4 w-4 rounded flex items-center justify-center">🏠</div>
                              <span className="text-[9px] font-bold">Recepção</span>
                            </div>

                            <div className="flex flex-col items-center gap-1 p-2 rounded-xl text-center w-full text-slate-400 hover:text-slate-700">
                              <div className="h-4 w-4 rounded flex items-center justify-center">📹</div>
                              <span className="text-[9px] font-medium">Palco</span>
                            </div>

                            <div className="flex flex-col items-center gap-1 p-2 rounded-xl text-center w-full text-slate-400 hover:text-slate-700">
                              <div className="h-4 w-4 rounded flex items-center justify-center">👥</div>
                              <span className="text-[9px] font-medium">Sessões</span>
                            </div>

                            <div className="flex flex-col items-center gap-1 p-2 rounded-xl text-center w-full text-slate-400 hover:text-slate-700">
                              <div className="h-4 w-4 rounded flex items-center justify-center">💬</div>
                              <span className="text-[9px] font-medium">Networking</span>
                            </div>
                          </div>

                          {/* Chat & Engagement Column matching Image 3 */}
                          <div className="flex-1 flex flex-col justify-between bg-white p-3">
                            {/* Tabs: Chat, Enquetes, P&R */}
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-2 text-xs font-bold">
                              <span
                                className="border-b-2 pb-1 transition"
                                style={{ borderColor: primaryColor, color: primaryColor }}
                              >
                                Chat
                              </span>
                              <span className="text-slate-400 hover:text-slate-600">Enquetes</span>
                              <span className="text-slate-400 hover:text-slate-600">P&R</span>
                            </div>

                            {/* Chat messages */}
                            <div className="space-y-3 py-3 overflow-y-auto text-xs">
                              {/* Message 1 */}
                              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[9px] font-bold"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    EN
                                  </div>
                                  <span className="font-bold text-slate-800 text-[11px]">Eliel Nunes</span>
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                                  >
                                    Organizador
                                  </span>
                                  <span className="text-[10px] text-slate-400 ml-auto">12:30</span>
                                </div>
                                <p className="text-[11px] text-slate-700 pl-7">
                                  Bem-vindos ao nosso evento! Preparem-se!
                                </p>
                              </div>

                              {/* Message 2 */}
                              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold">
                                    SS
                                  </div>
                                  <span className="font-bold text-slate-800 text-[11px]">Sophie Smith</span>
                                  <span className="text-[10px] text-slate-400 ml-auto">12:30</span>
                                </div>
                                <p className="text-[11px] text-slate-700 pl-7">
                                  Adorando esta sessão!
                                </p>
                              </div>

                              {/* Message 3 with reaction */}
                              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <div
                                    className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[9px] font-bold"
                                    style={{ backgroundColor: primaryColor }}
                                  >
                                    EN
                                  </div>
                                  <span className="font-bold text-slate-800 text-[11px]">Eliel Nunes</span>
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded"
                                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                                  >
                                    Organizador
                                  </span>
                                  <span className="text-[10px] text-slate-400 ml-auto">12:30</span>
                                </div>
                                <p className="text-[11px] text-slate-700 pl-7">
                                  Obrigado a todos por comparecerem!
                                </p>
                                <div className="pl-7 pt-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-xs">
                                    👍 122
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Message input */}
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                              <input
                                type="text"
                                disabled
                                placeholder="Escreva uma mensagem..."
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400"
                              />
                              <button
                                type="button"
                                style={{ backgroundColor: primaryColor }}
                                className="p-1.5 rounded-xl text-white shadow-xs"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: BÁSICO */}
              {settingsSubTab === "basic" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                  <h3 className="text-base font-bold text-slate-900">Recursos do Palco e Interação</h3>
                  <div className="divide-y divide-slate-100 text-xs text-slate-700">
                    <div className="flex items-center justify-between py-2.5">
                      <span>Chat ao vivo liberado para participantes</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00b4fb]" />
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span>Aba de Perguntas (Q&A) com moderação e votos da plateia</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00b4fb]" />
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span>Enquetes ao vivo (Polls)</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00b4fb]" />
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <span>Gravação automática na nuvem em HD</span>
                      <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#00b4fb]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: AGENDA */}
              {settingsSubTab === "agenda" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Agenda & Cronograma do Evento</h3>
                      <p className="text-xs text-slate-500">Defina os tópicos e blocos horários da transmissão.</p>
                    </div>
                    <button className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] px-3 py-1.5 text-xs font-bold text-white">
                      <Plus className="h-3.5 w-3.5" /> Adicionar Bloco
                    </button>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                    <div className="font-bold text-slate-900">Bloco Principal: {event.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(event.startDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(event.endDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab: PATROCINADORES */}
              {settingsSubTab === "sponsors" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Patrocinadores & Apoio</h3>
                      <p className="text-xs text-slate-500">Adicione estandes e marcas em destaque na recepção do evento.</p>
                    </div>
                    <button className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] px-3 py-1.5 text-xs font-bold text-white">
                      <Plus className="h-3.5 w-3.5" /> Adicionar Patrocinador
                    </button>
                  </div>

                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                    Nenhum patrocinador cadastrado. Clique no botão acima para adicionar marcas e links.
                  </div>
                </div>
              )}

              {/* Sub-tab: ORADORES (SPEAKERS) */}
              {settingsSubTab === "speakers" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Palestrantes do Webinar</h3>
                      <p className="text-xs text-slate-500">
                        Oradores cadastrados aparecem na Landing Page pública e recebem link exclusivo de acesso ao Backstage.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddingSpeaker(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#009ce0]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Adicionar Palestrante</span>
                    </button>
                  </div>

                  {/* Add Speaker Form */}
                  {isAddingSpeaker && (
                    <form
                      onSubmit={handleCreateSpeaker}
                      className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 space-y-3"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#0084be]">
                        Novo Palestrante
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Nome completo *"
                          value={speakerForm.name}
                          onChange={(e) => setSpeakerForm({ ...speakerForm, name: e.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                        />
                        <input
                          type="email"
                          required
                          placeholder="E-mail profissional *"
                          value={speakerForm.email}
                          onChange={(e) => setSpeakerForm({ ...speakerForm, email: e.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Cargo (ex: Diretor de Marketing) *"
                          value={speakerForm.role}
                          onChange={(e) => setSpeakerForm({ ...speakerForm, role: e.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Empresa *"
                          value={speakerForm.company}
                          onChange={(e) => setSpeakerForm({ ...speakerForm, company: e.target.value })}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Mini biografia..."
                        value={speakerForm.bio}
                        onChange={(e) => setSpeakerForm({ ...speakerForm, bio: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs"
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingSpeaker(false)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-[#00b4fb] px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                        >
                          Salvar Palestrante
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Speaker Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {event.speakers && event.speakers.length > 0 ? (
                      event.speakers.map((spk: any) => (
                        <div
                          key={spk.id}
                          className="flex items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white font-bold text-xs">
                              {spk.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{spk.name}</p>
                              <p className="text-[11px] font-semibold text-[#0084be]">{spk.role}</p>
                              <p className="text-[10px] text-slate-500">{spk.company}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteSpeaker(spk.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Remover palestrante"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400">
                        Nenhum palestrante cadastrado ainda.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-tab: YOUTUBE LIVE INTEGRATION */}
              {settingsSubTab === "youtube" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Integração com o YouTube Live</h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                      Configure a conta do YouTube para provisionar automaticamente uma transmissão ao vivo não listada a cada evento criado, com entrega global via CDN e gravação automática de replay.
                    </p>
                  </div>

                  {/* Connection Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
                          <YouTubeIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">Canal do YouTube</h3>
                            {ytStatus.isConnected ? (
                              <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Conectado
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-bold">
                                Não Conectado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ytStatus.isConnected
                              ? `Canal: ${ytStatus.channelTitle || "YouTube Channel"} • Todas as transmissões serão criadas como Não Listadas (unlisted).`
                              : "Conecte sua conta do Google para permitir que a Buysoft crie transmissões ao vivo automaticamente."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!ytStatus.isConnected ? (
                          <a
                            href="/api/integrations/youtube/auth"
                            className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition"
                          >
                            <YouTubeIcon className="h-4 w-4" />
                            <span>Conectar Canal do YouTube</span>
                          </a>
                        ) : (
                          <button
                            onClick={async () => {
                              if (confirm("Tem certeza que deseja desconectar o canal do YouTube?")) {
                                await fetch("/api/integrations/youtube/status", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "disconnect" }),
                                });
                                fetchYouTubeStatus();
                              }
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                          >
                            Desconectar Canal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event YouTube Live Status & Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Live Vinculada a este Evento</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Detalhes da transmissão no YouTube provisionada para "{event.title}".
                        </p>
                      </div>

                      {ytStatus.isConnected && (
                        <button
                          onClick={handleSyncYouTube}
                          disabled={isSyncingYt}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition disabled:opacity-50"
                        >
                          <YouTubeIcon className="h-3.5 w-3.5 text-rose-600" />
                          <span>{isSyncingYt ? "Sincronizando..." : event.youtubeBroadcastId ? "Recriar / Sincronizar" : "Criar Live no YouTube"}</span>
                        </button>
                      )}
                    </div>

                    {event.youtubeBroadcastId ? (
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-slate-400 font-medium">Broadcast ID do YouTube:</span>
                            <p className="font-mono font-bold text-slate-800">{event.youtubeBroadcastId}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-slate-400 font-medium">Privacidade:</span>
                            <p className="font-bold text-emerald-700">Não Listada (unlisted) ✓</p>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-slate-400 font-medium">Servidor de Ingestão (RTMP):</span>
                            <div className="flex items-center justify-between">
                              <p className="font-mono text-slate-700 font-semibold truncate max-w-[200px]">
                                {event.youtubeRtmpUrl || "rtmp://a.rtmp.youtube.com/live2"}
                              </p>
                              <button
                                onClick={() => handleCopy(event.youtubeRtmpUrl || "rtmp://a.rtmp.youtube.com/live2", "rtmpUrl")}
                                className="p-1 text-slate-400 hover:text-slate-700"
                              >
                                {copiedLink === "rtmpUrl" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-slate-400 font-medium">Chave de Transmissão:</span>
                            <div className="flex items-center justify-between">
                              <p className="font-mono text-slate-700 font-semibold truncate max-w-[160px]">
                                {showStreamKey ? event.youtubeStreamKey : "••••••••••••••••"}
                              </p>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setShowStreamKey(!showStreamKey)}
                                  className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                                >
                                  {showStreamKey ? "Ocultar" : "Ver"}
                                </button>
                                <button
                                  onClick={() => handleCopy(event.youtubeStreamKey || "", "streamKey")}
                                  className="p-1 text-slate-400 hover:text-slate-700"
                                >
                                  {copiedLink === "streamKey" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <a
                            href={`https://studio.youtube.com/video/${event.youtubeBroadcastId}/livestreaming`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition"
                          >
                            <span>Abrir no YouTube Studio (Iniciar com 1 Clique)</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <a
                            href={`https://www.youtube.com/watch?v=${event.youtubeBroadcastId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-semibold shadow-xs transition"
                          >
                            <span>Ver no YouTube</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                        {ytStatus.isConnected
                          ? "Nenhuma live criada ainda para este evento. Clique no botão acima para gerar agora."
                          : "Conecte sua conta do YouTube acima para que as transmissões sejam criadas automaticamente."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MARKETING */}
          {activeTab === "marketing" && (
            <MarketingTab event={event} onUpdateEvent={onUpdateEvent} />
          )}

          {/* TAB 5: ANÁLISES & LEADS */}
          {activeTab === "analytics" && <AnalyticsTab event={event} />}

          {/* TAB 6: GRAVAÇÕES */}
          {activeTab === "recordings" && <RecordingsTab event={event} />}
        </main>
      </div>

      {/* MODAL: ESCOLHA O TEMA (MATCHING IMAGE 2 EXACTLY) */}
      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Title */}
            <div className="p-6 text-center border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900">Escolha o tema</h2>
              <p className="text-xs text-slate-500 mt-1">
                Selecione o estilo visual que melhor atende ao perfil do seu público
              </p>
            </div>

            {/* Themes Grid matching Image 2 */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme 1: Crosby */}
                <div
                  onClick={() => setAdvancedTheme("crosby")}
                  className={`cursor-pointer rounded-2xl border-2 p-3 transition flex flex-col justify-between ${
                    advancedTheme === "crosby"
                      ? "border-[#00b4fb] ring-2 ring-[#00b4fb]/20 bg-sky-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700">your logo</span>
                      <span className="text-[9px] text-slate-400">About • Speakers • Schedule</span>
                    </div>
                    <div className="my-auto text-left pl-2">
                      <p className="text-sm font-extrabold text-slate-900">The future of everything</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1">Get ready for three days of disruptive ideas</p>
                      <div className="mt-2 inline-block rounded bg-black px-2 py-0.5 text-[8px] font-bold text-white">
                        Register
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Crosby</h4>
                      <p className="text-xs text-slate-500">University Events, Job Fairs, Expos/Tradeshows, Workshops</p>
                    </div>

                    {advancedTheme === "crosby" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        ★ Selecionado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Selecione o tema
                      </button>
                    )}
                  </div>
                </div>

                {/* Theme 2: Seldon */}
                <div
                  onClick={() => setAdvancedTheme("seldon")}
                  className={`cursor-pointer rounded-2xl border-2 p-3 transition flex flex-col justify-between ${
                    advancedTheme === "seldon"
                      ? "border-[#00b4fb] ring-2 ring-[#00b4fb]/20 bg-sky-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 flex flex-col justify-between text-white">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-bold text-white">your logo</span>
                      <span className="text-[9px]">About • Speakers • Schedule</span>
                    </div>
                    <div className="my-auto text-center">
                      <p className="text-sm font-extrabold text-white">The future of everything</p>
                      <p className="text-[9px] text-slate-400 line-clamp-1">Get ready for three days of disruptive ideas</p>
                      <div className="mt-2 inline-block rounded bg-[#00b4fb] px-2 py-0.5 text-[8px] font-bold text-white">
                        Register
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Seldon</h4>
                      <p className="text-xs text-slate-500">Webinars, Meetups</p>
                    </div>

                    {advancedTheme === "seldon" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        ★ Selecionado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Selecione o tema
                      </button>
                    )}
                  </div>
                </div>

                {/* Theme 3: Minimalist */}
                <div
                  onClick={() => setAdvancedTheme("minimalist")}
                  className={`cursor-pointer rounded-2xl border-2 p-3 transition flex flex-col justify-between ${
                    advancedTheme === "minimalist"
                      ? "border-[#00b4fb] ring-2 ring-[#00b4fb]/20 bg-sky-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="aspect-[16/10] rounded-xl overflow-hidden bg-white border border-slate-200 p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-900">your logo</span>
                    </div>
                    <div className="my-auto text-left pl-2">
                      <p className="text-sm font-serif font-bold text-slate-900">The future of everything</p>
                      <p className="text-[9px] text-slate-500">Tech talks, product announcements</p>
                      <div className="mt-2 inline-block rounded border border-slate-900 px-2 py-0.5 text-[8px] font-bold text-slate-900">
                        Register
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Minimalist</h4>
                      <p className="text-xs text-slate-500">Keynotes, Product Launches, High Tech</p>
                    </div>

                    {advancedTheme === "minimalist" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        ★ Selecionado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Selecione o tema
                      </button>
                    )}
                  </div>
                </div>

                {/* Theme 4: Criar do Zero */}
                <div
                  onClick={() => setAdvancedTheme("custom")}
                  className={`cursor-pointer rounded-2xl border-2 p-3 transition flex flex-col justify-between ${
                    advancedTheme === "custom"
                      ? "border-[#00b4fb] ring-2 ring-[#00b4fb]/20 bg-sky-50/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="aspect-[16/10] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-2 flex flex-col items-center justify-center text-center">
                    <Sliders className="h-8 w-8 text-slate-400 mb-1" />
                    <p className="text-xs font-bold text-slate-700">Criar do Zero</p>
                    <p className="text-[10px] text-slate-400">Monte blocos de texto, vídeo e palestrantes</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Customizado</h4>
                      <p className="text-xs text-slate-500">Construção livre modular</p>
                    </div>

                    {advancedTheme === "custom" ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                        ★ Selecionado
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                      >
                        Selecione o tema
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer with "Começar" button */}
            <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setLayoutType("advanced");
                  setIsThemeModalOpen(false);
                }}
                className="rounded-xl bg-[#0084be] px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0073a6] transition"
              >
                Começar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
