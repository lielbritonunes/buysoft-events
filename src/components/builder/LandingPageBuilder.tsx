"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Smartphone,
  Tablet,
  Monitor,
  Cloud,
  Check,
  RotateCcw,
  RotateCw,
  Eye,
  Save,
  Settings,
  Type,
  LayoutGrid,
  Star,
  Users,
  Building,
  Calendar,
  Video,
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit2,
  ExternalLink,
  Sparkles,
  Layers,
  Palette,
  Sliders,
  CheckCircle2,
  Play
} from "lucide-react";
import {
  PageBlock,
  BLOCK_TEMPLATES,
  AVAILABLE_THEMES,
  getDefaultBlocksForTheme,
  BlockTemplateItem,
} from "./builderTemplates";

interface Props {
  event: any;
  initialTheme: string;
  initialBlocks?: PageBlock[];
  onBack: () => void;
  onSave: (blocks: PageBlock[], theme: string) => Promise<void>;
  onPreviewPublic: () => void;
}

export default function LandingPageBuilder({
  event,
  initialTheme,
  initialBlocks,
  onBack,
  onSave,
  onPreviewPublic,
}: Props) {
  const [theme, setTheme] = useState<string>(initialTheme || "crosby");
  const [blocks, setBlocks] = useState<PageBlock[]>(() => {
    if (initialBlocks && initialBlocks.length > 0) return initialBlocks;
    return getDefaultBlocksForTheme(initialTheme || "crosby", event);
  });

  // History for Undo / Redo
  const [history, setHistory] = useState<PageBlock[][]>([blocks]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newBlocks: PageBlock[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newBlocks);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    setBlocks(newBlocks);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setBlocks(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setBlocks(next);
    }
  };

  // Device view switcher: "desktop" | "tablet" | "mobile"
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Left category drawer state
  const [activeCategory, setActiveCategory] = useState<
    "title" | "sections" | "sponsors" | "speakers" | "expo" | "schedule" | "media" | null
  >(null);

  // Right sidebar tab: "layout" | "theme"
  const [rightTab, setRightTab] = useState<"layout" | "theme">("layout");

  // Selected block for property editing
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Category navigation icons
  const CATEGORIES = [
    { id: "title", label: "Título", icon: Type },
    { id: "sections", label: "Seções", icon: LayoutGrid },
    { id: "sponsors", label: "Patrocinadores", icon: Star },
    { id: "speakers", label: "Oradores", icon: Users },
    { id: "expo", label: "Exposição", icon: Building },
    { id: "schedule", label: "Cronograma", icon: Calendar },
    { id: "media", label: "Mídia", icon: Video },
  ];

  // Add block handler
  const handleAddBlock = (template: BlockTemplateItem) => {
    const newBlock = template.createDefaultBlock(event, theme);
    const updated = [...blocks, newBlock];
    pushHistory(updated);
    setSelectedBlockId(newBlock.id);
  };

  // Remove block handler
  const handleRemoveBlock = (blockId: string) => {
    const updated = blocks.filter((b) => b.id !== blockId);
    pushHistory(updated);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  // Move block handler
  const handleMoveBlock = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    pushHistory(copy);
  };

  // Update block content inline
  const handleUpdateBlockField = (blockId: string, field: keyof PageBlock, value: any) => {
    const updated = blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b));
    setBlocks(updated);
  };

  // Commit changes to history after inline blur
  const handleBlurInlineEdit = () => {
    pushHistory(blocks);
  };

  // Save handler
  const handleTriggerSave = async () => {
    setIsSaving(true);
    try {
      await onSave(blocks, theme);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Error saving page builder:", err);
      alert("Erro ao salvar layout. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden animate-in fade-in duration-200">
      {/* 1. TOP HEADER BAR matching User Screenshot 2 */}
      <header className="h-14 border-b border-slate-800 bg-[#0f141c] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Voltar ao Painel */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Painel</span>
          </button>

          <span className="hidden sm:inline-block h-4 w-px bg-slate-800" />
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-400">
            Tema ativo: <b className="text-white uppercase">{theme}</b>
          </span>
        </div>

        {/* Center: Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setDeviceMode("mobile")}
            title="Visualização Mobile"
            className={`p-1.5 rounded-lg transition ${
              deviceMode === "mobile"
                ? "bg-[#00b4fb] text-white shadow-2xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("tablet")}
            title="Visualização Tablet"
            className={`p-1.5 rounded-lg transition ${
              deviceMode === "tablet"
                ? "bg-[#00b4fb] text-white shadow-2xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode("desktop")}
            title="Visualização Desktop"
            className={`p-1.5 rounded-lg transition ${
              deviceMode === "desktop"
                ? "bg-[#00b4fb] text-white shadow-2xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Cloud Sync, Undo, Redo, Preview & Save Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 text-slate-400 mr-1">
            <span
              title="Status da nuvem"
              className="p-1.5 text-slate-400 hover:text-slate-200"
            >
              <Cloud className="h-4 w-4" />
            </span>
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Desfazer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Refazer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onPreviewPublic}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Pré-visualizar</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-1.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50 active:scale-98"
          >
            {savedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{isSaving ? "Salvando..." : "Salvar"}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER (Left Icon Bar + Left Template Drawer + Center Canvas + Right Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 2A. LEFT VERTICAL CATEGORY BAR (Icons matching Screenshot 2 & 3) */}
        <aside className="w-20 bg-[#0b0e14] border-r border-slate-800/80 flex flex-col items-center py-4 gap-2 shrink-0 z-20">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(isActive ? null : (cat.id as any))}
                className={`w-16 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition ${
                  isActive
                    ? "bg-[#00b4fb] text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium"
                }`}
              >
                <cat.icon className="h-5 w-5" />
                <span className="text-[10px] leading-none">{cat.label}</span>
              </button>
            );
          })}
        </aside>

        {/* 2B. LEFT DRAWER: BLOCK TEMPLATES FLYOUT (Matching Screenshot 3 & 4) */}
        {activeCategory && (
          <div className="w-80 bg-[#101520] border-r border-slate-800/90 flex flex-col shrink-0 z-10 animate-in slide-in-from-left-4 duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Selecione um(a) {CATEGORIES.find((c) => c.id === activeCategory)?.label.toLowerCase()}
              </h3>
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Template Items List */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {BLOCK_TEMPLATES.filter((t) => t.category === activeCategory).map((template) => (
                <div
                  key={template.id}
                  className="group relative rounded-xl border border-slate-800 bg-[#161c2b] overflow-hidden hover:border-[#00b4fb]/60 transition shadow-xs"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                    <img
                      src={template.previewThumbnail}
                      alt={template.label}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {template.badge && (
                      <span className="absolute top-2 right-2 rounded-md bg-emerald-600/90 text-white px-2 py-0.5 text-[10px] font-bold shadow-2xs">
                        {template.badge}
                      </span>
                    )}
                    {/* Hover Overlay "Adicionar bloco" */}
                    <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-3 backdrop-blur-2xs">
                      <button
                        type="button"
                        onClick={() => handleAddBlock(template)}
                        className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-2 text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Adicionar bloco</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="p-3">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-white">
                      {template.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2C. CENTER CANVAS: LIVE EDITABLE LANDING PAGE */}
        <main className="flex-1 bg-[#090d14] overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
          <div
            className={`transition-all duration-300 bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-800/80 min-h-[85vh] ${
              deviceMode === "mobile"
                ? "w-[390px] text-sm"
                : deviceMode === "tablet"
                ? "w-[768px]"
                : "w-full max-w-5xl"
            }`}
            style={{
              backgroundColor: theme === "seldon" ? "#090d16" : theme === "nolan" ? "#06141d" : "#ffffff",
              color: theme === "seldon" || theme === "nolan" ? "#ffffff" : "#0f172a",
            }}
          >
            {blocks.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-40 text-slate-400" />
                <h4 className="text-base font-bold text-slate-400">Nenhum bloco no layout</h4>
                <p className="text-xs mt-1">Selecione uma categoria no menu à esquerda para adicionar blocos.</p>
              </div>
            ) : (
              blocks.map((block, index) => {
                const isSelected = selectedBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`relative group transition ${
                      isSelected ? "ring-2 ring-[#00b4fb] ring-inset" : "hover:ring-1 hover:ring-slate-400/50"
                    }`}
                  >
                    {/* Block Toolbar on Hover/Select */}
                    <div
                      className={`absolute top-2 right-2 z-20 flex items-center gap-1 rounded-lg bg-slate-900/90 text-white p-1 text-xs shadow-md border border-slate-700 transition ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(index, "up");
                        }}
                        disabled={index === 0}
                        title="Mover para cima"
                        className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(index, "down");
                        }}
                        disabled={index === blocks.length - 1}
                        title="Mover para baixo"
                        className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-px h-3 bg-slate-700 mx-0.5" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBlock(block.id);
                        }}
                        title="Excluir bloco"
                        className="p-1 hover:bg-red-500/80 rounded text-red-300 hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* RENDER BLOCK TYPES */}

                    {/* 1. STANDALONE NAVIGATION */}
                    {block.type === "standalone_nav" && (
                      <nav className="px-6 py-4 border-b border-slate-200/20 flex items-center justify-between backdrop-blur-xs">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            {event.logoUrl ? (
                              <img src={event.logoUrl} alt="Logo" className="h-6 w-auto max-w-[120px]" />
                            ) : (
                              <span className="font-extrabold text-sm tracking-tight">
                                ✦ {event.title || "your logo"}
                              </span>
                            )}
                          </div>
                          <div className="hidden md:flex items-center gap-5 text-xs font-semibold opacity-80">
                            <span>Home</span>
                            <span>•</span>
                            <span>About</span>
                            <span>•</span>
                            <span>Synced Speakers</span>
                            <span>•</span>
                            <span>Synced Schedule</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="rounded-lg bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-xs font-bold shadow-xs hover:opacity-90"
                        >
                          {block.ctaText || "Tickets"}
                        </button>
                      </nav>
                    )}

                    {/* 2. HERO OPTION 1 (Maxi Cover - dark immersive) */}
                    {block.type === "hero_opt1" && (
                      <div className="relative min-h-[440px] flex items-center justify-center p-8 sm:p-14 overflow-hidden text-center text-white">
                        <img
                          src={
                            block.imageUrl ||
                            "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80"
                          }
                          alt="Cover"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                          <div className="flex justify-center mb-2">
                            <span className="text-xl font-bold tracking-tight opacity-90">
                              ✦ {event.title || "your logo"}
                            </span>
                          </div>

                          <h1
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleUpdateBlockField(block.id, "title", e.currentTarget.textContent || "");
                              handleBlurInlineEdit();
                            }}
                            className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight outline-none focus:bg-white/10 rounded px-2"
                          >
                            {block.title || "The future of everything"}
                          </h1>

                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleUpdateBlockField(block.id, "subtitle", e.currentTarget.textContent || "");
                              handleBlurInlineEdit();
                            }}
                            className="text-xs sm:text-sm text-slate-300 leading-relaxed outline-none focus:bg-white/10 rounded px-2"
                          >
                            {block.subtitle ||
                              "Get ready for five days of disruptive ideas and ground-breaking insights as we bring together the most revolutionary minds."}
                          </p>

                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleUpdateBlockField(block.id, "dateText", e.currentTarget.textContent || "");
                              handleBlurInlineEdit();
                            }}
                            className="text-xs font-bold text-sky-400 outline-none focus:bg-white/10 rounded inline-block px-2 py-1"
                          >
                            {block.dateText || "Oct 14, 9:00AM - 10:00AM UTC"}
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#00b4fb]/30 transition active:scale-95"
                            >
                              {block.ctaText || "Register"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. HERO OPTION 2 (Split Columns) */}
                    {block.type === "hero_opt2" && (
                      <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#00b4fb]">
                            ✦ {event.title || "your logo"}
                          </span>
                          <h1
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleUpdateBlockField(block.id, "title", e.currentTarget.textContent || "");
                              handleBlurInlineEdit();
                            }}
                            className="text-3xl sm:text-4xl font-extrabold tracking-tight outline-none focus:bg-slate-500/10 rounded px-1"
                          >
                            {block.title || "The future of everything"}
                          </h1>
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleUpdateBlockField(block.id, "subtitle", e.currentTarget.textContent || "");
                              handleBlurInlineEdit();
                            }}
                            className="text-xs text-slate-500 leading-relaxed outline-none focus:bg-slate-500/10 rounded px-1"
                          >
                            {block.subtitle ||
                              "Get ready for three days of disruptive ideas as we explore what our world will look like fifty years from now."}
                          </p>
                          <div className="text-xs font-bold text-[#00b4fb]">{block.dateText || "26th - 28th September"}</div>
                          <div>
                            <button
                              type="button"
                              className="rounded-xl bg-[#00b4fb] px-5 py-2.5 text-xs font-bold text-white shadow-md"
                            >
                              {block.ctaText || "Register"}
                            </button>
                          </div>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-lg">
                          <img
                            src={
                              block.imageUrl ||
                              "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
                            }
                            alt="Visual"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* 4. HERO OPTION 3 (Minimalist Clean) */}
                    {block.type === "hero_opt3" && (
                      <div className="p-10 sm:p-16 text-center max-w-3xl mx-auto space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          ✦ {event.title || "your logo"}
                        </span>
                        <h1
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            handleUpdateBlockField(block.id, "title", e.currentTarget.textContent || "");
                            handleBlurInlineEdit();
                          }}
                          className="text-3xl sm:text-5xl font-extrabold tracking-tight outline-none focus:bg-slate-500/10 rounded"
                        >
                          {block.title || "The future of everything"}
                        </h1>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            handleUpdateBlockField(block.id, "subtitle", e.currentTarget.textContent || "");
                            handleBlurInlineEdit();
                          }}
                          className="text-xs sm:text-sm text-slate-500 leading-relaxed outline-none focus:bg-slate-500/10 rounded"
                        >
                          {block.subtitle ||
                            "Get ready for three days of disruptive ideas and ground-breaking insights as we bring together the most revolutionary minds."}
                        </p>
                        <div className="text-xs font-bold text-[#00b4fb]">{block.dateText || "26th - 28th September"}</div>
                        <div>
                          <button
                            type="button"
                            className="rounded-xl bg-[#00b4fb] px-6 py-2 text-xs font-bold text-white shadow-md"
                          >
                            {block.ctaText || "Register"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 5. RICH TEXT EDITOR / MANIFESTO */}
                    {block.type === "rich_text" && (
                      <div className="p-8 sm:p-12 border-t border-slate-200/20 max-w-3xl mx-auto space-y-3">
                        <h3
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            handleUpdateBlockField(block.id, "title", e.currentTarget.textContent || "");
                            handleBlurInlineEdit();
                          }}
                          className="text-xl font-bold tracking-tight outline-none focus:bg-slate-500/10 rounded"
                        >
                          {block.title || "About Details"}
                        </h3>
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            handleUpdateBlockField(block.id, "content", e.currentTarget.textContent || "");
                            handleBlurInlineEdit();
                          }}
                          className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-300 outline-none focus:bg-slate-500/10 rounded"
                        >
                          {block.content ||
                            "IMPOSTER SYNDROME IS THE INABILITY TO ACCEPT ONES OWN ACCOMPLISHMENT AND THE CONSTANT FEAR OF BEING EXPOSED AS A FRAUD."}
                        </p>
                      </div>
                    )}

                    {/* 6. TWO COLUMN TEXT */}
                    {block.type === "two_col_text" && (
                      <div className="p-8 sm:p-12 border-t border-slate-200/20 grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-4 space-y-1">
                          <h3
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleUpdateBlockField(block.id, "title", e.currentTarget.textContent || "");
                              handleBlurInlineEdit();
                            }}
                            className="text-xl font-bold tracking-tight outline-none focus:bg-slate-500/10 rounded"
                          >
                            {block.title || "About The Festival"}
                          </h3>
                          <p className="text-xs text-[#00b4fb] font-semibold">{block.subtitle || "Three days of intense discovery"}</p>
                        </div>
                        <div className="md:col-span-8">
                          <p
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              handleUpdateBlockField(block.id, "content", e.currentTarget.textContent || "");
                              handleBlurInlineEdit();
                            }}
                            className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-300 outline-none focus:bg-slate-500/10 rounded"
                          >
                            {block.content ||
                              "We believe that the future belongs to those who dare to question existing paradigms. This summit was designed from the ground up to connect visionaries, practitioners and thought-leaders."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 7. THREE COLUMN TEXT */}
                    {block.type === "three_col_text" && (
                      <div className="p-8 sm:p-12 border-t border-slate-200/20 space-y-6">
                        <h3 className="text-xl font-bold tracking-tight">{block.title || "Look forward to..."}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          {(
                            block.extraData?.items || [
                              { title: "Masterclasses", text: "Workshops práticos com oradores de ponta." },
                              { title: "Networking", text: "Salas virtuais para conexões executivas." },
                              { title: "Live Q&A", text: "Envio de perguntas e votação interativa." },
                            ]
                          ).map((it: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl border border-slate-200/40 bg-slate-50/10 space-y-2">
                              <h4 className="text-xs font-bold text-[#00b4fb]">{it.title}</h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed">{it.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 8. IMAGE & TEXT TWO COL */}
                    {block.type === "image_text_two_col" && (
                      <div className="p-8 sm:p-12 border-t border-slate-200/20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold tracking-tight">{block.title || "Ambiente Virtual"}</h3>
                          <p className="text-xs text-[#00b4fb] font-semibold">{block.subtitle}</p>
                          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">{block.content}</p>
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-[4/3] shadow-md">
                          <img
                            src={
                              block.imageUrl ||
                              "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
                            }
                            alt="Visual"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* 9. SPONSORS GOLD */}
                    {block.type === "sponsors_gold" && (
                      <div className="p-8 sm:p-10 border-t border-slate-200/20 text-center space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {block.title || "Patrocinadores Master"}
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                          {["Opentech", "Globex", "Keyspace"].map((sp, i) => (
                            <div
                              key={i}
                              className="px-6 py-3 rounded-xl border border-slate-200/50 bg-slate-50/10 font-bold text-xs shadow-2xs"
                            >
                              ✦ {sp}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 10. SPONSORS SILVER */}
                    {block.type === "sponsors_silver" && (
                      <div className="p-6 sm:p-8 border-t border-slate-200/20 text-center space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {block.title || "Apoiadores Institucionais"}
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                          {["Coursera", "Kakao", "OneSky", "Fastly"].map((sp, i) => (
                            <div
                              key={i}
                              className="px-4 py-2 rounded-lg border border-slate-200/30 bg-slate-50/5 text-[11px] font-semibold text-slate-400"
                            >
                              {sp}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 11. SPEAKERS GRID */}
                    {block.type === "speakers_grid" && (
                      <div className="p-8 sm:p-12 border-t border-slate-200/20 space-y-6" id="speakers">
                        <div className="text-center max-w-xl mx-auto space-y-1">
                          <h3 className="text-xl font-bold tracking-tight">{block.title || "Synced Speakers"}</h3>
                          <p className="text-xs text-slate-400">{block.subtitle || "Palestrantes convidados"}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {event.speakers && event.speakers.length > 0 ? (
                            event.speakers.map((sp: any) => (
                              <div
                                key={sp.id}
                                className="p-4 rounded-2xl border border-slate-200/30 bg-slate-50/10 flex flex-col items-center text-center space-y-2 shadow-xs"
                              >
                                <div className="h-16 w-16 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shadow-xs">
                                  {sp.avatarUrl ? (
                                    <img src={sp.avatarUrl} alt={sp.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-sm font-bold text-slate-700">{sp.name.charAt(0)}</span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold leading-tight">{sp.name}</h4>
                                <p className="text-[11px] text-[#00b4fb] font-medium leading-tight">
                                  {sp.role} {sp.company ? `• ${sp.company}` : ""}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full p-6 text-center text-xs text-slate-400">
                              Nenhum palestrante cadastrado ainda. Eles serão sincronizados automaticamente quando adicionados.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 12. SCHEDULE TIMELINE */}
                    {block.type === "schedule_timeline" && (
                      <div className="p-8 sm:p-12 border-t border-slate-200/20 space-y-6" id="schedule">
                        <div className="text-center max-w-xl mx-auto space-y-1">
                          <h3 className="text-xl font-bold tracking-tight">{block.title || "Synced Schedule"}</h3>
                          <p className="text-xs text-slate-400">{block.subtitle || "Agenda das transmissões"}</p>
                        </div>

                        <div className="max-w-2xl mx-auto space-y-3">
                          {(
                            block.extraData?.items || [
                              { time: "17:00", title: "Abertura Oficial & Boas-Vindas", speaker: "Head de Produto" },
                              { time: "17:20", title: "Novos Paradigmas de Engajamento", speaker: "Orador Convidado" },
                              { time: "17:45", title: "Sessão de Perguntas e Respostas ao Vivo", speaker: "Todos" },
                            ]
                          ).map((item: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200/40 bg-slate-50/10 text-xs"
                            >
                              <div className="rounded-lg bg-[#00b4fb]/15 text-[#00b4fb] px-2.5 py-1 font-mono font-bold shrink-0">
                                {item.time}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold leading-tight">{item.title}</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">{item.speaker}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 13. MEDIA VIDEO */}
                    {block.type === "media_video" && (
                      <div className="p-8 sm:p-12 border-t border-slate-200/20 max-w-3xl mx-auto text-center space-y-4">
                        <h3 className="text-xl font-bold tracking-tight">{block.title || "Veja o que espera por você"}</h3>
                        <p className="text-xs text-slate-400">{block.subtitle}</p>
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-lg flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2 text-white">
                            <div className="h-12 w-12 rounded-full bg-[#00b4fb] flex items-center justify-center shadow-lg">
                              <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                            </div>
                            <span className="text-xs font-semibold opacity-80">Player de Teaser do Evento</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* 2D. RIGHT SIDEBAR (Layout e Tema matching Screenshot 2) */}
        <aside className="w-72 bg-[#101520] border-l border-slate-800/90 flex flex-col shrink-0 z-20">
          {/* Sidebar Tabs: Layout vs Tema */}
          <div className="h-12 border-b border-slate-800 flex items-center">
            <button
              type="button"
              onClick={() => setRightTab("layout")}
              className={`flex-1 h-full text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
                rightTab === "layout"
                  ? "border-[#00b4fb] text-[#00b4fb]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Layout</span>
            </button>
            <button
              type="button"
              onClick={() => setRightTab("theme")}
              className={`flex-1 h-full text-xs font-bold transition flex items-center justify-center gap-2 border-b-2 ${
                rightTab === "theme"
                  ? "border-[#00b4fb] text-[#00b4fb]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Tema</span>
            </button>
          </div>

          {/* TAB 1: BLOCKS IN LAYOUT */}
          {rightTab === "layout" && (
            <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300">Blocos de página</h4>
                  <span className="text-[10px] text-slate-500">{blocks.length} blocos</span>
                </div>

                {/* Blocks List matching Screenshot 2 */}
                <div className="space-y-1.5">
                  {blocks.map((block, index) => {
                    const isSelected = selectedBlockId === block.id;
                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                          isSelected
                            ? "bg-[#182235] border-[#00b4fb] text-white"
                            : "bg-[#141a27] border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="font-medium truncate">{block.title || block.type}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBlock(block.id);
                            }}
                            title="Remover bloco"
                            className="p-1 text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Button "Adicionar blocos" matching Screenshot 2 */}
              <div className="pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setActiveCategory("title")}
                  className="w-full rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] py-2.5 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 active:scale-98"
                >
                  <Plus className="h-4 w-4" />
                  <span>Adicionar blocos</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: THEME SETTINGS */}
          {rightTab === "theme" && (
            <div className="p-4 space-y-5 overflow-y-auto flex-1">
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">Tema Base</h4>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => setTheme(th.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                        theme === th.id
                          ? "border-[#00b4fb] bg-[#00b4fb]/10 text-white"
                          : "border-slate-800 bg-[#141a27] text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{th.name}</span>
                      <span className="text-[9px] font-normal opacity-70">
                        {th.id === "seldon" || th.id === "nolan" ? "Escuro" : "Claro"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Block Quick Editor */}
              {selectedBlock && (
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Edit2 className="h-3.5 w-3.5 text-[#00b4fb]" />
                    <span>Propriedades do Bloco</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400">Título</label>
                      <input
                        type="text"
                        value={selectedBlock.title || ""}
                        onChange={(e) => handleUpdateBlockField(selectedBlock.id, "title", e.target.value)}
                        className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-white focus:border-[#00b4fb] focus:outline-none"
                      />
                    </div>

                    {selectedBlock.subtitle !== undefined && (
                      <div>
                        <label className="text-[11px] text-slate-400">Subtítulo / Descrição curta</label>
                        <input
                          type="text"
                          value={selectedBlock.subtitle || ""}
                          onChange={(e) => handleUpdateBlockField(selectedBlock.id, "subtitle", e.target.value)}
                          className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-white focus:border-[#00b4fb] focus:outline-none"
                        />
                      </div>
                    )}

                    {selectedBlock.ctaText !== undefined && (
                      <div>
                        <label className="text-[11px] text-slate-400">Texto do Botão CTA</label>
                        <input
                          type="text"
                          value={selectedBlock.ctaText || ""}
                          onChange={(e) => handleUpdateBlockField(selectedBlock.id, "ctaText", e.target.value)}
                          className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-white focus:border-[#00b4fb] focus:outline-none"
                        />
                      </div>
                    )}

                    {selectedBlock.imageUrl !== undefined && (
                      <div>
                        <label className="text-[11px] text-slate-400">URL da Imagem</label>
                        <input
                          type="text"
                          value={selectedBlock.imageUrl || ""}
                          onChange={(e) => handleUpdateBlockField(selectedBlock.id, "imageUrl", e.target.value)}
                          placeholder="https://..."
                          className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-white focus:border-[#00b4fb] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
