"use client";

import React, { useState } from "react";
import {
  Home,
  HelpCircle,
  ChevronDown,
  Globe,
  Radio,
  Building2
} from "lucide-react";
import { Organization, UserSession } from "@/types";
import OrganizationDropdown from "./OrganizationDropdown";

interface Props {
  organization: Organization;
  onOpenOrgSettings: () => void;
  activeNavTab?: "home";
  onSelectNavTab?: (tab: "home") => void;
  currentUser?: UserSession | null;
}

export default function Header({
  organization,
  onOpenOrgSettings,
  activeNavTab = "home",
  onSelectNavTab,
  currentUser,
}: Props) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs">
      {/* Brand & Main Nav */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectNavTab?.("home")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white shadow-sm shadow-sky-200">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-slate-900 leading-none">
              Buysoft <span className="text-[#00b4fb]">Events</span>
            </span>
            <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
              Webinar Platform
            </span>
          </div>
        </div>

        {/* Navigation Tabs (estilo RingCentral) */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectNavTab?.("home")}
            className="flex items-center gap-2 border-b-2 border-[#00b4fb] px-3.5 py-5 text-sm font-semibold text-[#00b4fb] transition"
          >
            <Home className="h-4 w-4" />
            <span>Início</span>
          </button>
        </nav>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        {/* Help */}
        <button className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition">
          <HelpCircle className="h-4 w-4 text-slate-400" />
          <span>Ajuda</span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-[1px] bg-slate-200" />

        {/* Organization / Profile Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#0084be]">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="max-w-[140px] truncate font-semibold text-slate-800">
              {organization.name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <OrganizationDropdown
            organization={organization}
            isOpen={isDropdownOpen}
            onClose={() => setIsDropdownOpen(false)}
            onOpenOrgSettings={onOpenOrgSettings}
            currentUser={currentUser}
          />
        </div>

        {/* Language Badge */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span>PT</span>
        </div>
      </div>
    </header>
  );
}
