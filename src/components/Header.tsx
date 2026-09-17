"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  ChevronDown,
  Building2,
} from "lucide-react";
import { Organization, UserSession } from "@/types";
import OrganizationDropdown from "./OrganizationDropdown";
import { springs } from "@/components/ui/motion-primitives";

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
    <header className="glass-navbar sticky top-0 z-30 flex h-16 w-full items-center justify-between px-4 sm:px-8 lg:px-10">
      {/* Top edge highlight — Apple glass refraction */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.7) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.7) 70%, transparent 95%)",
        }}
      />

      {/* Left: Logo */}
      <motion.div
        className="flex items-center cursor-pointer select-none"
        onClick={() => onSelectNavTab?.("home")}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={springs.snappy}
      >
        <Image
          src="/logo.png"
          alt="Buysoft Events"
          width={160}
          height={48}
          className="h-8 sm:h-9 w-auto object-contain"
          priority
        />
      </motion.div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Live Broadcast Pill */}
        <AnimatePresence>
          {hasLiveEvent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springs.snappy}
              className="flex items-center gap-1.5 rounded-full bg-rose-50/80 backdrop-blur-sm border border-rose-200/50 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold text-rose-600"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}
            >
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-rose-500 animate-pulse-glow" />
              <span>Ao Vivo</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help */}
        <motion.button
          onClick={() => window.open("https://buysoft.com.br", "_blank")}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={springs.snappy}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Ajuda</span>
          <ChevronDown className="h-3 w-3" />
        </motion.button>

        {/* Organization */}
        <motion.button
          onClick={onOpenOrgSettings}
          className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors group"
          title="Configurações da Organização"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#00b4fb]/8 text-[#0084be] group-hover:bg-[#00b4fb]/15 transition-colors">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <span className="max-w-[150px] truncate font-semibold">
            {organization.name}
          </span>
        </motion.button>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-slate-200/50" />

        {/* User Avatar */}
        <div className="relative">
          <motion.button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 rounded-full p-0.5 transition-shadow hover:shadow-[0_0_0_3px_rgba(0,180,251,0.15)]"
            title="Menu do Usuário"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springs.snappy}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#00b4fb] to-[#0084be] text-white text-xs font-bold shadow-[0_2px_8px_rgba(0,180,251,0.3)]">
              {currentUser?.avatarInitials || "EN"}
            </div>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={springs.snappy}
            >
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </motion.div>
          </motion.button>

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
