"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  HelpCircle,
  ChevronDown,
  Building2,
  Sparkles
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white px-4 sm:px-8 lg:px-10 shadow-2xs">
      {/* 1. Left: Buysoft Events Logo */}
      <div
        className="flex items-center cursor-pointer group select-none transition-transform hover:opacity-90 active:scale-98"
        onClick={() => onSelectNavTab?.("home")}
      >
        <Image
          src="/logo.png"
          alt="Buysoft Events"
          width={160}
          height={48}
          className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
          priority
        />
      </div>

      {/* 2. Right: Ajuda, Organization, Vertical Bar, User Profile Avatar (Exact RingCentral structure) */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Live Broadcast Pill (if live) */}
        {hasLiveEvent && (
          <div className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-rose-600 shadow-2xs animate-pulse">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-rose-500" />
            <span>Ao Vivo</span>
          </div>
        )}

        {/* Ajuda */}
        <button
          onClick={() => window.open("https://buysoft.com.br", "_blank")}
          className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>Ajuda</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>

        {/* Organization Name with Spark/Icon (RingCentral style) */}
        <button
          onClick={onOpenOrgSettings}
          className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition group"
          title="Configurações da Organização"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 text-[#0084be] group-hover:bg-sky-100 transition">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <span className="max-w-[150px] truncate font-semibold">
            {organization.name}
          </span>
        </button>

        {/* Vertical Divider (from RingCentral screenshot) */}
        <div className="hidden sm:block h-5 w-[1px] bg-slate-200" />

        {/* User Profile Avatar Pill (RingCentral [EN] circle trigger) */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-[#00b4fb]/30 transition group"
            title="Menu do Usuário"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00b4fb] text-white text-xs font-bold shadow-xs">
              {currentUser?.avatarInitials || "EN"}
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-700 transition" />
          </button>

          <OrganizationDropdown
            organization={organization}
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onOpenOrgSettings={onOpenOrgSettings}
            currentUser={currentUser}
          />
        </div>
      </div>
    </header>
  );
}
