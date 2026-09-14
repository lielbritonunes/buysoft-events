"use client";

import React, { useState } from "react";
import {
  Home,
  HelpCircle,
  ChevronDown,
  Globe,
  Radio,
  Building2,
  Search,
  Sparkles,
  Command
} from "lucide-react";
import { Organization, UserSession } from "@/types";
import OrganizationDropdown from "./OrganizationDropdown";

interface Props {
  organization: Organization;
  onOpenOrgSettings: () => void;
  activeNavTab?: "home";
  onSelectNavTab?: (tab: "home") => void;
  currentUser?: UserSession | null;
  hasLiveEvent?: boolean;
}

export default function Header({
  organization,
  onOpenOrgSettings,
  activeNavTab = "home",
  onSelectNavTab,
  currentUser,
  hasLiveEvent = false,
}: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Brand & Main Nav */}
      <div className="flex items-center gap-6 lg:gap-10">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onSelectNavTab?.("home")}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white shadow-sm shadow-sky-200 transition-transform duration-200 group-hover:scale-105">
            <Radio className="h-5 w-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
                Buysoft <span className="text-[#00b4fb]">Events</span>
              </span>
              <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#0084be] border border-sky-200/60 leading-none">
                Enterprise
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">
              Webinar & Live Studio
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Untitled UI segment style) */}
        <nav className="hidden md:flex items-center gap-1 border-l border-slate-200/80 pl-6">
          <button
            onClick={() => onSelectNavTab?.("home")}
            className="flex items-center gap-2 rounded-lg bg-sky-50/80 border border-sky-200/70 px-3.5 py-1.5 text-xs font-bold text-[#0084be] shadow-xs transition"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Painel de Eventos</span>
          </button>
        </nav>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Live Broadcast Indicator (if active) */}
        {hasLiveEvent && (
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 shadow-xs animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Transmissão Ao Vivo</span>
          </div>
        )}

        {/* Quick Search Shortcut Pill (Untitled UI / 21st.dev style) */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-400">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500">Buscar eventos</span>
          <div className="flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200 shadow-2xs">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>

        {/* Help */}
        <button
          onClick={() => window.open("https://buysoft.com.br", "_blank")}
          className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <HelpCircle className="h-4 w-4 text-slate-400" />
          <span>Ajuda</span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-[1px] bg-slate-200" />

        {/* Organization / Profile Trigger (Untitled UI modern pill) */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 group"
          >
            {/* Avatar Pill */}
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white text-xs font-bold shadow-xs">
              {currentUser?.avatarInitials || "EN"}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="max-w-[120px] truncate font-bold text-slate-900 text-xs leading-none">
                {currentUser?.name || organization.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {organization.name}
              </span>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:text-slate-700" />
          </button>

          <OrganizationDropdown
            organization={organization}
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onOpenOrgSettings={onOpenOrgSettings}
            currentUser={currentUser}
          />
        </div>

        {/* Language Pill */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px]">PT-BR</span>
        </div>
      </div>
    </header>
  );
}
