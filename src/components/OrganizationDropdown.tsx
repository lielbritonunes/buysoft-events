"use client";

import React from "react";
import { Building2, Globe, LogOut, Plus, User, ShieldCheck } from "lucide-react";
import { Organization } from "@/types";

interface Props {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onOpenOrgSettings: () => void;
}

export default function OrganizationDropdown({
  organization,
  isOpen,
  onClose,
  onOpenOrgSettings,
}: Props) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop to close */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
        {/* Organization Info Card */}
        <div className="flex flex-col items-center border-b border-slate-100 pb-4 text-center">
          <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white shadow-md">
            <Building2 className="h-8 w-8" />
            <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-[10px] text-white ring-2 ring-white">
              <ShieldCheck className="h-3 w-3" />
            </div>
          </div>
          <h3 className="font-semibold text-slate-900">{organization.name}</h3>
          <span className="mt-0.5 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-[#0084be]">
            Plano {organization.planName}
          </span>

          <button
            onClick={() => {
              onClose();
              onOpenOrgSettings();
            }}
            className="mt-3.5 w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            Gerenciar organização
          </button>
        </div>

        {/* Quick links */}
        <div className="border-b border-slate-100 py-2 text-xs text-slate-600">
          <button
            onClick={onClose}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Globe className="h-4 w-4 text-slate-400" />
            <span>Idioma: Português (Brasil)</span>
          </button>
          <button
            onClick={onClose}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Desconectar</span>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="pt-3">
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Perfil Pessoal
          </span>
          <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-50 p-2 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-xs font-bold text-white">
                EN
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800">Eliel Nunes</p>
                <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{organization.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:border-[#00b4fb] hover:text-[#0084be]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Criar nova organização</span>
          </button>
        </div>
      </div>
    </>
  );
}
