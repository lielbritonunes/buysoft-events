"use client";

import React, { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "./ui/motion-primitives";
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
  Maximize2,
  Edit3,
  AlignLeft,
  CheckSquare,
  Globe,
  ShieldCheck,
  EyeOff,
  Type,
  ChevronUp
} from "lucide-react";



import {
  updateEvent,
  addSpeaker,
  deleteSpeaker,
  saveFormFields,
} from "@/lib/dbActions";
import MarketingTab from "@/components/workspace/MarketingTab";
import AnalyticsTab from "@/components/workspace/AnalyticsTab";
import RecordingsTab from "@/components/workspace/RecordingsTab";
import PuckEditorModal from "@/components/puck/PuckEditorModal";
import type { Data as PuckData } from "@measured/puck";

interface FieldTypeDefinition {
  type: string;
  label: string;
  category: "Básico" | "Avançado";
  icon: any;
  iconBg: string;
  defaultLabel: string;
  defaultOptions?: string[];
  description: string;
  preview: React.ReactNode;
}

const FORM_FIELD_TYPES: FieldTypeDefinition[] = [
  {
    type: "text",
    label: "Texto em linha única",
    category: "Básico",
    icon: Edit3,
    iconBg: "bg-sky-500 text-white",
    defaultLabel: "Cargo / Função",
    description: "Campo de texto curto ideal para cargos, departamentos, telefones ou respostas diretas.",
    preview: (
      <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-2 text-xs text-slate-500 font-mono">
        Ex: Gerente de TI
      </div>
    )
  },
  {
    type: "paragraph",
    label: "Texto do parágrafo",
    category: "Básico",
    icon: AlignLeft,
    iconBg: "bg-orange-500 text-white",
    defaultLabel: "Quais são suas principais expectativas para o evento?",
    description: "Área de texto com várias linhas para comentários, expectativas ou perguntas abertas.",
    preview: (
      <div className="rounded-lg border border-orange-200 bg-orange-50/70 p-2 text-[11px] text-slate-500 font-mono h-12">
        Escreva aqui suas dúvidas e observações detalhadas...
      </div>
    )
  },
  {
    type: "select",
    label: "Seleção única",
    category: "Básico",
    icon: CheckCircle2,
    iconBg: "bg-purple-600 text-white",
    defaultLabel: "Qual o segmento da sua empresa?",
    defaultOptions: ["Tecnologia & Software", "Varejo & E-commerce", "Serviços & Consultoria", "Outro"],
    description: "Permita que o participante escolha apenas uma opção de uma lista pré-definida.",
    preview: (
      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full border border-purple-400 bg-purple-500 flex items-center justify-center">
            <div className="h-1 w-1 rounded-full bg-white" />
          </div>
          <span className="text-[11px]">Tecnologia & Software</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full border border-slate-300" />
          <span className="text-[11px]">Varejo & E-commerce</span>
        </div>
      </div>
    )
  },
  {
    type: "checkbox",
    label: "Seleção múltipla",
    category: "Básico",
    icon: CheckSquare,
    iconBg: "bg-amber-500 text-white",
    defaultLabel: "Quais tópicos você gostaria de aprofundar?",
    defaultOptions: ["Segurança e LGPD", "Automação e IA", "Redução de Custos"],
    description: "Permite que os participantes selecionem uma ou mais opções entre as alternativas.",
    preview: (
      <div className="space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">
            ✓
          </div>
          <span className="text-[11px]">Automação e IA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-slate-300" />
          <span className="text-[11px]">Segurança e LGPD</span>
        </div>
      </div>
    )
  },
  {
    type: "date",
    label: "Data",
    category: "Avançado",
    icon: Calendar,
    iconBg: "bg-emerald-500 text-white",
    defaultLabel: "Data de nascimento ou disponibilidade",
    description: "Seletor de data para coletar nascimento, agendamentos ou disponibilidade.",
    preview: (
      <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 text-xs text-slate-600 font-mono">
        <span>15/10/2026</span>
        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
      </div>
    )
  },
  {
    type: "country",
    label: "País",
    category: "Avançado",
    icon: Globe,
    iconBg: "bg-[#0084be] text-white",
    defaultLabel: "País de residência",
    description: "Menu suspenso com lista padronizada de países e localizações.",
    preview: (
      <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50/70 p-2 text-xs text-slate-700">
        <span>🇧🇷 Brasil</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </div>
    )
  },
  {
    type: "terms",
    label: "Informações legais",
    category: "Avançado",
    icon: ShieldCheck,
    iconBg: "bg-slate-800 text-white",
    defaultLabel: "Concordo com os Termos de Uso e Políticas de Privacidade.",
    description: "Permita que os participantes visualizem e aceitem os seus termos e políticas.",
    preview: (
      <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50/70 p-2 text-[11px] text-slate-600 leading-snug">
        <div className="mt-0.5 h-3.5 w-3.5 rounded border border-sky-400 bg-white flex items-center justify-center text-[9px] text-sky-600 font-bold">
          ✓
        </div>
        <span>
          Li e concordo com os <b className="text-sky-600">Termos</b> e <b className="text-sky-600">Políticas</b>.
        </span>
      </div>
    )
  },
  {
    type: "hidden",
    label: "Campo oculto",
    category: "Avançado",
    icon: EyeOff,
    iconBg: "bg-slate-500 text-white",
    defaultLabel: "utm_source",
    description: "Armazene parâmetros de rastreamento (UTMs) ou metadados sem exibir ao participante.",
    preview: (
      <div className="rounded-lg border border-slate-300 bg-slate-100 p-2 text-xs text-slate-600 font-mono">
        <span>🔒 utm_source = campanha_2026</span>
      </div>
    )
  }
];

interface Props {
  event: any;
  onBack: () => void;
  onUpdateEvent: (updated: any) => void;
}

export default function EventWorkspace({ event, onBack, onUpdateEvent }: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "registration" | "settings" | "marketing" | "analytics" | "recordings"
  >("overview");

  // Configuração sub-tabs: Básico, Branding, Agenda, Patrocinadores, Orador
  const [settingsSubTab, setSettingsSubTab] = useState<
    "basic" | "branding" | "agenda" | "sponsors" | "speakers"
  >("branding");

  // Registration sub-tabs: "landing" (Página inicial do evento) | "form" (Formulário de inscrições)
  const [registrationSubTab, setRegistrationSubTab] = useState<"landing" | "form">("landing");

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
  const [isPuckOpen, setIsPuckOpen] = useState(false);
  const [puckData, setPuckData] = useState<PuckData | null>(() => {
    if (event.customLandingJson) {
      try {
        const parsed = JSON.parse(event.customLandingJson);
        if (parsed && parsed.content && Array.isArray(parsed.content)) {
          return parsed;
        }
      } catch {}
    }
    return null;
  });

  const handleSavePuck = async (publishedData: PuckData) => {
    setPuckData(publishedData);
    setLayoutType("advanced");
    const updated = await updateEvent(event.id, {
      layoutType: "advanced",
      customLandingJson: JSON.stringify(publishedData),
    });
    onUpdateEvent(updated);
  };

  const [confirmationMessage, setConfirmationMessage] = useState<string>(
    event.confirmationMessage ||
      "Obrigado por se inscrever! Seu acesso ao webinar está confirmado. Enviamos as orientações e o link exclusivo para o seu e-mail."
  );

  const [formFields, setFormFields] = useState<any[]>(() => {
    if (event.formFields && event.formFields.length > 0) {
      return event.formFields
        .filter((f: any) => {
          const l = f.label.toLowerCase();
          return (
            l !== "nome" &&
            l !== "sobrenome" &&
            l !== "nome completo" &&
            l !== "e-mail" &&
            l !== "email" &&
            l !== "e-mail de contato" &&
            l !== "e-mail corporativo"
          );
        })
        .map((f: any) => {
          let opts = f.options;
          if (!opts && f.optionsJson) {
            try {
              opts = JSON.parse(f.optionsJson);
            } catch {}
          }
          return { ...f, options: opts };
        });
    }
    return [
      { id: "f1", label: "Cargo / Função", type: "text", required: false, orderIndex: 0 },
      { id: "f2", label: "Empresa", type: "text", required: false, orderIndex: 1 },
    ];
  });

  const [hoveredFieldType, setHoveredFieldType] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newOptionText, setNewOptionText] = useState("");

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
          customLandingJson: puckData ? JSON.stringify(puckData) : event.customLandingJson || undefined,
        }),
        saveFormFields(
          event.id,
          formFields.map((f, i) => ({
            label: f.label,
            type: f.type || "text",
            required: f.required || false,
            orderIndex: i,
            optionsJson: f.options ? JSON.stringify(f.options) : f.optionsJson || undefined,
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

  const handleAddFieldOfType = (typeDef: FieldTypeDefinition) => {
    const newField: any = {
      id: "f_" + Date.now(),
      label: typeDef.defaultLabel,
      type: typeDef.type,
      required: typeDef.type === "terms",
      options: typeDef.defaultOptions ? [...typeDef.defaultOptions] : undefined,
      orderIndex: formFields.length,
    };
    setFormFields([...formFields, newField]);
    if (typeDef.type === "select" || typeDef.type === "checkbox") {
      setEditingFieldId(newField.id);
    }
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formFields.length) return;
    const copy = [...formFields];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setFormFields(copy);
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
      {/* Top Bar with Liquid Glass */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-xl px-4 sm:px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-white/60 p-1.5 px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar para Eventos</span>
          </motion.button>

          <div className="h-4 w-px bg-slate-200/70" />

          {/* Logo Buysoft */}
          <div className="flex items-center">
            <NextImage
              src="/logo.png"
              alt="Buysoft Events"
              width={140}
              height={42}
              className="h-7 sm:h-8 w-auto object-contain"
              priority
            />
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
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springs.snappy}
            href={hostStudioUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#00b4fb] to-sky-600 hover:from-[#009ce0] hover:to-sky-700 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-xs shadow-sky-500/25 transition cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="hidden xs:inline">Abrir Estúdio (Host)</span>
            <span className="xs:hidden">Estúdio</span>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springs.snappy}
            href={registrationUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Pré-visualizar inscrição</span>
          </motion.a>

          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springs.snappy}
            href={liveUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Pré-visualizar evento</span>
          </motion.a>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springs.snappy}
            onClick={handleTogglePublish}
            className={`rounded-xl px-3 sm:px-4 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer ${
              event.status === "published"
                ? "bg-slate-800 hover:bg-slate-900"
                : "bg-[#ff6d00] hover:bg-[#e66200]"
            }`}
          >
            <span className="hidden sm:inline">{event.status === "published" ? "Despublicar evento" : "Atualizar para publicar"}</span>
            <span className="sm:hidden">{event.status === "published" ? "Despublicar" : "Publicar"}</span>
          </motion.button>
        </div>
      </header>

      {/* Main Workspace Layout with Left Sidebar */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Sidebar Menu */}
        <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-slate-200/70 bg-white/75 backdrop-blur-xl p-3 sm:p-4 flex flex-col lg:justify-between shrink-0">
          <div className="space-y-2 lg:space-y-6">
            {/* Event Name & Time Info (Desktop only) */}
            <div className="hidden lg:block pb-3 border-b border-slate-100/80">
              <h2 className="text-sm font-bold text-slate-900 truncate tracking-tight">{event.title}</h2>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {new Date(event.startDate).toLocaleDateString("pt-BR", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Navigation Tabs (Scrollable on mobile) */}
            <nav className="flex lg:flex-col overflow-x-auto gap-1 py-1 lg:space-y-1 text-xs font-semibold scrollbar-none">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 lg:gap-2.5 rounded-xl px-3 py-2 lg:py-2.5 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#00b4fb]/10 text-[#0084be] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
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
                className={`flex items-center gap-2 lg:gap-2.5 rounded-xl px-3 py-2 lg:py-2.5 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === "registration"
                    ? "bg-[#00b4fb]/10 text-[#0084be] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Página de inscrições</span>
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-2 lg:gap-2.5 rounded-xl px-3 py-2 lg:py-2.5 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === "settings"
                    ? "bg-[#00b4fb]/10 text-[#0084be] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Configuração</span>
              </button>

              {/* Sub-menu of Configuração (Desktop view) */}
              {activeTab === "settings" && (
                <div className="hidden lg:block pl-6 pt-1 pb-2 space-y-1">
                  <button
                    onClick={() => setSettingsSubTab("basic")}
                    className={`block w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      settingsSubTab === "basic"
                        ? "text-[#0084be] bg-[#00b4fb]/8 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Básico
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("branding")}
                    className={`block w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      settingsSubTab === "branding"
                        ? "text-[#0084be] bg-[#00b4fb]/8 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Branding
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("agenda")}
                    className={`block w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      settingsSubTab === "agenda"
                        ? "text-[#0084be] bg-[#00b4fb]/8 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Agenda
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("sponsors")}
                    className={`block w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      settingsSubTab === "sponsors"
                        ? "text-[#0084be] bg-[#00b4fb]/8 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    Patrocinadores
                  </button>

                  <button
                    onClick={() => setSettingsSubTab("speakers")}
                    className={`flex items-center justify-between w-full text-left py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                      settingsSubTab === "speakers"
                        ? "text-[#0084be] bg-[#00b4fb]/8 font-bold"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span>Orador</span>
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setActiveTab("marketing")}
                className={`flex items-center gap-2 lg:gap-2.5 rounded-xl px-3 py-2 lg:py-2.5 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === "marketing"
                    ? "bg-[#00b4fb]/10 text-[#0084be] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Marketing & E-mails</span>
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-2 lg:gap-2.5 rounded-xl px-3 py-2 lg:py-2.5 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === "analytics"
                    ? "bg-[#00b4fb]/10 text-[#0084be] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Análises & Leads</span>
              </button>

              <button
                onClick={() => setActiveTab("recordings")}
                className={`flex items-center gap-2 lg:gap-2.5 rounded-xl px-3 py-2 lg:py-2.5 transition shrink-0 whitespace-nowrap cursor-pointer ${
                  activeTab === "recordings"
                    ? "bg-[#00b4fb]/10 text-[#0084be] font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <Video className="h-4 w-4" />
                <span>Gravações</span>
              </button>
            </nav>

            {/* Mobile Sub-menu of Configuração */}
            {activeTab === "settings" && (
              <div className="flex lg:hidden overflow-x-auto gap-1.5 pt-1.5 pb-1 border-t border-slate-100">
                <button
                  onClick={() => setSettingsSubTab("basic")}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                    settingsSubTab === "basic"
                      ? "bg-[#00b4fb] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Básico
                </button>
                <button
                  onClick={() => setSettingsSubTab("branding")}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                    settingsSubTab === "branding"
                      ? "bg-[#00b4fb] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Branding
                </button>
                <button
                  onClick={() => setSettingsSubTab("agenda")}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                    settingsSubTab === "agenda"
                      ? "bg-[#00b4fb] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Agenda
                </button>
                <button
                  onClick={() => setSettingsSubTab("sponsors")}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                    settingsSubTab === "sponsors"
                      ? "bg-[#00b4fb] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Patrocinadores
                </button>
                <button
                  onClick={() => setSettingsSubTab("speakers")}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition cursor-pointer ${
                    settingsSubTab === "speakers"
                      ? "bg-[#00b4fb] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Orador ⭐
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:flex border-t border-slate-100 pt-3 items-center gap-2.5 text-xs text-slate-600">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 font-bold text-white text-[10px]">
              EN
            </div>
            <span className="font-semibold text-slate-800">Eliel Nunes</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl overflow-y-auto">

          {/* TAB 1: VISÃO GERAL */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Guia Rápido */}
                <div className="lg:col-span-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 tracking-tight">Guia de configuração rápida</h3>
                    <ul className="space-y-2 text-xs">
                      <li
                        onClick={() => setActiveTab("registration")}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/70 cursor-pointer text-slate-700 transition"
                      >
                        <span className="font-semibold">1. Layout e página de inscrição</span>
                        <span className="text-slate-400 font-bold">›</span>
                      </li>
                      <li
                        onClick={() => {
                          setActiveTab("settings");
                          setSettingsSubTab("branding");
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/70 cursor-pointer text-slate-700 transition"
                      >
                        <span className="font-semibold">2. Logo, banner e cores</span>
                        <span className="text-slate-400 font-bold">›</span>
                      </li>
                      <li
                        onClick={() => {
                          setActiveTab("settings");
                          setSettingsSubTab("speakers");
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/70 cursor-pointer text-slate-700 transition"
                      >
                        <span className="font-semibold">3. Oradores ({event.speakers?.length || 0})</span>
                        <span className="text-slate-400 font-bold">›</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Status</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        event.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-slate-100 text-slate-600 border border-slate-200/60"
                      }`}
                    >
                      {event.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                </div>

                {/* Event Card com Links */}
                <div className="lg:col-span-8 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xs backdrop-blur-xs space-y-5">
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
            </motion.div>
          )}

          {/* TAB 2: PÁGINA DE INSCRIÇÕES (ORGANIZADO EM DUAS ABAS: PÁGINA INICIAL & FORMULÁRIO) */}
          {activeTab === "registration" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header with Navigation & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Página de Inscrições</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Personalize o layout de recepção do evento e configure as perguntas do formulário de inscrição.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    <span>Pré-visualizar inscrição</span>
                  </a>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    <span>Pré-visualizar evento</span>
                  </a>
                  <button
                    onClick={handleSaveRegistrationSettings}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
                  >
                    {saveToast ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Salvo!</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-tab Switcher: Página inicial do evento vs Formulário de inscrições */}
              <div className="flex items-center gap-8 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setRegistrationSubTab("landing")}
                  className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                    registrationSubTab === "landing"
                      ? "border-[#00b4fb] text-[#0084be]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layout className="h-4 w-4" />
                  <span>Página inicial do evento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationSubTab("form")}
                  className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                    registrationSubTab === "form"
                      ? "border-[#00b4fb] text-[#0084be]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Formulário de inscrições</span>
                </button>
              </div>

              {/* SUB-TAB 1: PÁGINA INICIAL DO EVENTO (Layouts e Mensagem de Confirmação) */}
              {registrationSubTab === "landing" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Configurações da Página Inicial</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Defina o modelo de layout e a mensagem exibida após a inscrição confirmada.
                    </p>
                  </div>

                  {/* Modelo de Layout da Página */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Layout className="h-4 w-4 text-[#00b4fb]" />
                        <span>Modelo de Layout da Página</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-[#00b4fb]">
                        Tema atual: <b>{layoutType === "classic" ? "Clássico" : advancedTheme.toUpperCase()}</b>
                      </span>
                    </div>

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
                            <h5 className="text-base font-bold text-slate-900">Layout Clássico</h5>
                            {layoutType === "classic" && (
                              <span className="rounded-full bg-[#00b4fb] px-2.5 py-0.5 text-[10px] font-bold text-white">
                                Ativo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Página de alta conversão, limpa e direta. Formulário lateral com cronômetro regressivo, detalhes do evento e oradores em destaque.
                          </p>
                        </div>

                        <div className="mt-4 rounded-lg bg-slate-100 p-2.5 text-center text-[11px] font-medium text-slate-600">
                          {layoutType === "classic" ? "✓ Layout Clássico selecionado" : "Clique para usar o Layout Clássico"}
                        </div>
                      </div>

                      {/* Option 2: Avançado com Puck */}
                      <div
                        className={`rounded-2xl border-2 p-5 transition flex flex-col justify-between ${
                          layoutType === "advanced"
                            ? "border-[#00b4fb] bg-sky-50/40 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <h5 className="text-base font-bold text-slate-900">Layout Avançado (Construtor Visual Puck)</h5>
                            {layoutType === "advanced" && (
                              <span className="rounded-full bg-[#00b4fb] px-2.5 py-0.5 text-[10px] font-bold text-white">
                                Ativo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Construtor visual com arrastar e soltar (Puck), assistente de IA gratuito em 1 clique e blocos sincronizados com oradores e agenda.
                          </p>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] font-semibold text-[#00b4fb]">
                            Status: <b>{puckData ? "Página Personalizada Salva" : "Modelo Disponível"}</b>
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setLayoutType("advanced");
                                setIsPuckOpen(true);
                              }}
                              className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-2 text-xs font-bold text-white shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>{layoutType === "advanced" ? "Abrir Construtor com IA" : "Usar este layout"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mensagem de Confirmação de Inscrição */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Mensagem de Confirmação de Inscrição</span>
                      </h4>
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
                </div>
              )}

              {/* SUB-TAB 2: FORMULÁRIO DE INSCRIÇÕES (Campos do Formulário com Hover Previews) */}
              {registrationSubTab === "form" && (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Configuração dos Campos</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                      Configure seu formulário de registro para coletar informações dos participantes quando eles se registrarem. Exigimos que você colete nome, sobrenome e e-mail porque usamos essas informações para configurar uma conta para esse participante após o registro.
                    </p>
                  </div>

                  {/* Main Grid: Left (Active Form Fields Cards) + Right (Campos do Formulário with Hover Popover) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Form Fields Cards */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Fixed Required Platform Fields (matching user screenshot) */}
                      <div className="space-y-3">
                        {/* Nome */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b4fb] text-white shadow-2xs">
                              <Edit3 className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-900">Nome (obrigatório)</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">Todos os ingressos</span>
                        </div>

                        {/* Sobrenome */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b4fb] text-white shadow-2xs">
                              <Edit3 className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-900">Sobrenome (obrigatório)</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">Todos os ingressos</span>
                        </div>

                        {/* E-mail */}
                        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 transition">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00b4fb] text-white shadow-2xs">
                              <Edit3 className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-900">E-mail (obrigatório)</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">Todos os ingressos</span>
                        </div>
                      </div>

                      {/* Custom Dynamic Fields Added by User */}
                      <div className="space-y-3 pt-2">
                        {formFields.length > 0 && (
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-slate-700">
                              Campos Adicionais ({formFields.length})
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Use as setas para reordenar perguntas
                            </span>
                          </div>
                        )}

                        {formFields.map((field, index) => {
                          const typeDef =
                            FORM_FIELD_TYPES.find((t) => t.type === field.type) || FORM_FIELD_TYPES[0];
                          const IconComp = typeDef.icon;
                          const isEditing = editingFieldId === field.id;

                          return (
                            <div
                              key={field.id || index}
                              className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition space-y-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${typeDef.iconBg} shadow-2xs shrink-0`}
                                  >
                                    <IconComp className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={field.label}
                                      onChange={(e) => {
                                        const copy = [...formFields];
                                        copy[index].label = e.target.value;
                                        setFormFields(copy);
                                      }}
                                      placeholder="Título da pergunta"
                                      className="w-full text-xs font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#00b4fb] focus:outline-none transition py-0.5"
                                    />
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                        {typeDef.label}
                                      </span>
                                      {(field.type === "select" || field.type === "checkbox") && (
                                        <button
                                          type="button"
                                          onClick={() => setEditingFieldId(isEditing ? null : field.id)}
                                          className="text-[10px] text-[#00b4fb] hover:underline font-bold"
                                        >
                                          {isEditing
                                            ? "Ocultar alternativas"
                                            : `Editar alternativas (${field.options?.length || 0})`}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={field.required}
                                      onChange={(e) => {
                                        const copy = [...formFields];
                                        copy[index].required = e.target.checked;
                                        setFormFields(copy);
                                      }}
                                      className="h-3.5 w-3.5 accent-[#00b4fb] rounded"
                                    />
                                    <span className="text-[11px] font-medium">Obrigatório</span>
                                  </label>

                                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => handleMoveField(index, "up")}
                                      className="p-1 hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                                      title="Mover para cima"
                                    >
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === formFields.length - 1}
                                      onClick={() => handleMoveField(index, "down")}
                                      className="p-1 hover:bg-slate-200 disabled:opacity-30 text-slate-600 border-l border-slate-200"
                                      title="Mover para baixo"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteField(index)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                                    title="Remover campo"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Options Editor for Select & Checkbox */}
                              {isEditing && (field.type === "select" || field.type === "checkbox") && (
                                <div className="pt-2 border-t border-slate-100 space-y-2 bg-slate-50/70 p-3 rounded-xl animate-in fade-in">
                                  <div className="text-[11px] font-bold text-slate-700">
                                    Alternativas pré-definidas da lista:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(field.options || []).map((opt: string, optIdx: number) => (
                                      <span
                                        key={optIdx}
                                        className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] text-slate-700 shadow-2xs"
                                      >
                                        <span>{opt}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const copy = [...formFields];
                                            copy[index].options = copy[index].options.filter(
                                              (_: any, i: number) => i !== optIdx
                                            );
                                            setFormFields(copy);
                                          }}
                                          className="text-slate-400 hover:text-rose-600 ml-0.5"
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2 pt-1">
                                    <input
                                      type="text"
                                      placeholder="Digite uma nova opção e pressione Enter..."
                                      value={newOptionText}
                                      onChange={(e) => setNewOptionText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && newOptionText.trim()) {
                                          e.preventDefault();
                                          const copy = [...formFields];
                                          const opts = copy[index].options || [];
                                          copy[index].options = [...opts, newOptionText.trim()];
                                          setFormFields(copy);
                                          setNewOptionText("");
                                        }
                                      }}
                                      className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00b4fb] focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newOptionText.trim()) return;
                                        const copy = [...formFields];
                                        const opts = copy[index].options || [];
                                        copy[index].options = [...opts, newOptionText.trim()];
                                        setFormFields(copy);
                                        setNewOptionText("");
                                      }}
                                      className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800"
                                    >
                                      Adicionar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {formFields.length === 0 && (
                          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-400">
                            Nenhum campo personalizado adicionado ainda. Clique em um dos tipos no menu ao lado para incluir novas perguntas ao formulário.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Campos do Formulário Sidebar (matching screenshot with hover popover) */}
                    <div className="lg:col-span-4 relative">
                      <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-visible">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">
                          Campos do Formulário
                        </h4>

                        {/* Group: Básico */}
                        <div className="space-y-1 mb-5">
                          <div className="px-1 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Básico
                          </div>
                          {FORM_FIELD_TYPES.filter((t) => t.category === "Básico").map((item) => (
                            <div
                              key={item.type}
                              className="relative"
                              onMouseEnter={() => setHoveredFieldType(item.type)}
                              onMouseLeave={() => setHoveredFieldType(null)}
                            >
                              <button
                                type="button"
                                onClick={() => handleAddFieldOfType(item)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition text-left group cursor-pointer"
                              >
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.iconBg} shadow-2xs shrink-0`}
                                >
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <span className="group-hover:text-slate-900 font-medium">{item.label}</span>
                              </button>

                              {/* Hover Popover preview to the left */}
                              {hoveredFieldType === item.type && (
                                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-64 rounded-2xl bg-white p-4 shadow-xl border border-slate-200/90 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                  <div className="mb-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                                    {item.preview}
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900 mb-1">{item.label}</h4>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {item.description}
                                  </p>
                                  {/* Pointer Arrow */}
                                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 bg-white border-r border-t border-slate-200/90" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Group: Avançado */}
                        <div className="space-y-1 border-t border-slate-100 pt-4">
                          <div className="px-1 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Avançado
                          </div>
                          {FORM_FIELD_TYPES.filter((t) => t.category === "Avançado").map((item) => (
                            <div
                              key={item.type}
                              className="relative"
                              onMouseEnter={() => setHoveredFieldType(item.type)}
                              onMouseLeave={() => setHoveredFieldType(null)}
                            >
                              <button
                                type="button"
                                onClick={() => handleAddFieldOfType(item)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition text-left group cursor-pointer"
                              >
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.iconBg} shadow-2xs shrink-0`}
                                >
                                  <item.icon className="h-4 w-4" />
                                </div>
                                <span className="group-hover:text-slate-900 font-medium">{item.label}</span>
                              </button>

                              {/* Hover Popover preview to the left */}
                              {hoveredFieldType === item.type && (
                                <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 w-64 rounded-2xl bg-white p-4 shadow-xl border border-slate-200/90 z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                  <div className="mb-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                                    {item.preview}
                                  </div>
                                  <h4 className="text-xs font-bold text-slate-900 mb-1">{item.label}</h4>
                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                    {item.description}
                                  </p>
                                  {/* Pointer Arrow */}
                                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 bg-white border-r border-t border-slate-200/90" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

      {/* Puck Visual Editor Modal with Free AI Generator */}
      <PuckEditorModal
        isOpen={isPuckOpen}
        event={event}
        initialData={puckData}
        onClose={() => setIsPuckOpen(false)}
        onSave={handleSavePuck}
        onPreview={() => window.open(`/e/${event.id}`, "_blank")}
      />
    </div>
  );
}
