"use client";

import React, { useState } from "react";
import { Building2, Globe, LogOut, ShieldCheck, Shield, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Organization, UserSession } from "@/types";
import { logoutAction } from "@/lib/authActions";
import { springs } from "./ui/motion-primitives";

interface Props {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onOpenOrgSettings: () => void;
  currentUser?: UserSession | null;
}

export default function OrganizationDropdown({
  organization,
  isOpen,
  onClose,
  onOpenOrgSettings,
  currentUser,
}: Props) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAction();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const userName = currentUser?.name || "Eliel Nunes";
  const userEmail = currentUser?.email || organization.email;
  const userInitials = currentUser?.avatarInitials || "EN";
  const userRole =
    currentUser?.role === "admin"
      ? "Administrador"
      : currentUser?.role === "speaker"
      ? "Palestrante"
      : "Organizador";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={springs.snappy}
            className="absolute right-0 top-12 z-50 w-86 overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.14),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-2xl"
          >
            {/* Ambient top glow */}
            <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 h-24 w-40 rounded-full bg-[#00b4fb]/15 blur-2xl" />

            {/* Organization Info Card */}
            <div className="relative flex flex-col items-center border-b border-slate-100/80 pb-4 text-center">
              <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white shadow-[0_8px_20px_rgba(0,180,251,0.28)] ring-4 ring-white/80">
                <Building2 className="h-8 w-8" />
                <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-[10px] text-white ring-2 ring-white shadow-xs">
                  <ShieldCheck className="h-3 w-3" />
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">{organization.name}</h3>
              <span className="mt-1 inline-flex items-center rounded-full bg-[#00b4fb]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0084be]">
                Plano {organization.planName || "Trial Ativo"}
              </span>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onClose();
                  onOpenOrgSettings();
                }}
                className="mt-3.5 w-full rounded-xl border border-slate-200/80 bg-white/80 py-2 text-xs font-semibold text-slate-700 shadow-2xs backdrop-blur-xs transition hover:bg-slate-50 hover:border-slate-300"
              >
                Gerenciar organização & Segurança
              </motion.button>
            </div>

            {/* User Profile Section */}
            <div className="py-3 border-b border-slate-100/80">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sessão Ativa
                </span>
                {currentUser?.mfaEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    MFA Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
                    <Shield className="h-3 w-3 text-amber-500" />
                    MFA Inativo
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50/80 p-2.5 border border-slate-200/60 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-xs font-black text-white shadow-xs">
                    {userInitials}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 ml-2">
                  {userRole}
                </span>
              </div>
            </div>

            {/* Quick links & Logout */}
            <div className="pt-2 text-xs text-slate-600 space-y-0.5">
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => {
                  onClose();
                  onOpenOrgSettings();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-100/70 hover:text-slate-900"
              >
                <Key className="h-4 w-4 text-slate-400" />
                <span>Configurar Google Authenticator</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 2 }}
                onClick={onClose}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-100/70 hover:text-slate-900"
              >
                <Globe className="h-4 w-4 text-slate-400" />
                <span>Idioma: Português (Brasil)</span>
              </motion.button>

              <motion.button
                whileHover={{ x: 2 }}
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 font-semibold transition hover:bg-rose-50/80 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                <span>{loggingOut ? "Desconectando..." : "Desconectar"}</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
