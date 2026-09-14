"use client";

import React, { useState } from "react";
import { Building2, Globe, LogOut, Plus, ShieldCheck, Shield, ShieldAlert, Key } from "lucide-react";
import { Organization, UserSession } from "@/types";
import { logoutAction } from "@/lib/authActions";

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

  if (!isOpen) return null;

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
    <>
      {/* Backdrop to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-12 z-50 w-84 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
        {/* Organization Info Card */}
        <div className="flex flex-col items-center border-b border-slate-100 pb-4 text-center">
          <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white shadow-md shadow-sky-100">
            <Building2 className="h-8 w-8" />
            <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-[10px] text-white ring-2 ring-white">
              <ShieldCheck className="h-3 w-3" />
            </div>
          </div>
          <h3 className="font-bold text-slate-900 text-sm">{organization.name}</h3>
          <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0084be]">
            Plano {organization.planName || "Trial Ativo"}
          </span>

          <button
            onClick={() => {
              onClose();
              onOpenOrgSettings();
            }}
            className="mt-3.5 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:border-slate-300"
          >
            Gerenciar organização & Segurança
          </button>
        </div>

        {/* User Profile Section */}
        <div className="py-3 border-b border-slate-100">
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

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-xs">
                {userInitials}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{userName}</p>
                <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 ml-2">
              {userRole}
            </span>
          </div>
        </div>

        {/* Quick links & Logout */}
        <div className="pt-2 text-xs text-slate-600 space-y-0.5">
          <button
            onClick={() => {
              onClose();
              onOpenOrgSettings();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Key className="h-4 w-4 text-slate-400" />
            <span>Configurar Google Authenticator</span>
          </button>

          <button
            onClick={onClose}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Globe className="h-4 w-4 text-slate-400" />
            <span>Idioma: Português (Brasil)</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-rose-600 font-semibold transition hover:bg-rose-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>{loggingOut ? "Desconectando..." : "Desconectar"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
