"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Building,
  CreditCard,
  Users,
  Upload,
  Globe,
  Plus,
  Shield,
  Check,
  Sparkles
} from "lucide-react";
import { Organization, OrganizationMember } from "@/types";

interface Props {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrg: (updated: Organization) => void;
}

export default function OrganizationSettingsModal({
  organization,
  isOpen,
  onClose,
  onUpdateOrg,
}: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "billing" | "team">("profile");
  const [formData, setFormData] = useState({
    name: organization.name,
    email: organization.email,
    about: organization.about,
    website: organization.website || "",
    twitter: organization.twitter || "",
    facebook: organization.facebook || "",
    linkedin: organization.linkedin || "",
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [members, setMembers] = useState<OrganizationMember[]>(organization.members);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"admin" | "member">("member");

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOrg({
      ...organization,
      ...formData,
      members,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddMember = () => {
    if (!newMemberEmail || !newMemberEmail.includes("@")) return;
    const initials = newMemberEmail.substring(0, 2).toUpperCase();
    const newMember: OrganizationMember = {
      id: "mem_" + Date.now(),
      name: newMemberEmail.split("@")[0],
      email: newMemberEmail,
      role: newMemberRole,
      avatarInitials: initials,
    };
    setMembers([...members, newMember]);
    setNewMemberEmail("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
        {/* Top bar with back navigation */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para {organization.name}</span>
          </button>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Gerenciamento da Organização
          </div>
        </div>

        {/* Content Layout: Sidebar + Main Area */}
        <div className="flex flex-1 flex-col md:flex-row">
          {/* Left Sidebar Tabs */}
          <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/40 p-4">
            <nav className="flex md:flex-col gap-1">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  activeTab === "profile"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Perfil</span>
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  activeTab === "billing"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Faturamento</span>
              </button>

              <button
                onClick={() => setActiveTab("team")}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                  activeTab === "team"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Equipe</span>
                <span className="ml-auto rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {members.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Right Main Content Panel */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[75vh]">
            {/* TAB: PERFIL */}
            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Perfil da Organização</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure a identidade corporativa visível nos seus webinars e páginas de inscrição.
                  </p>
                </div>

                {savedSuccess && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-medium text-emerald-700 animate-in fade-in">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Dados da organização salvos com sucesso!</span>
                  </div>
                )}

                {/* Section: Detalhes */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Detalhes Principais
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome da organização *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail oficial da organização *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sobre a organização
                    </label>
                    <textarea
                      rows={3}
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      placeholder="Descreva brevemente sua empresa ou iniciativas..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                    />
                  </div>
                </div>

                {/* Section: Logo */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Foto de Perfil / Logotipo
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00b4fb] to-[#38bdf8] text-white shadow-md">
                      <Building className="h-10 w-10" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">
                        Para melhor resultado, use uma imagem PNG quadrada (mínimo 96×96px).
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Fazer upload da logo</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: Links */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Links da Empresa
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Website Oficial
                    </label>
                    <input
                      type="url"
                      placeholder="https://suaempresa.com.br"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Link do LinkedIn
                      </label>
                      <input
                        type="text"
                        placeholder="https://linkedin.com/company/..."
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Link do X (Twitter)
                      </label>
                      <input
                        type="text"
                        placeholder="https://x.com/..."
                        value={formData.twitter}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#00b4fb] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#009ce0] transition"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}

            {/* TAB: FATURAMENTO */}
            {activeTab === "billing" && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Plano e Faturamento</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Gerencie o limite de participantes simultâneos e recursos corporativos.
                  </p>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#00b4fb] px-2.5 py-0.5 text-xs font-bold text-white uppercase">
                        Plano Atual: {organization.planName}
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">Webinar Scale</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Capacidade para até <strong>100 participantes simultâneos</strong> com latência ultrabaixa via WebRTC.
                      </p>
                    </div>
                    <Sparkles className="h-8 w-8 text-[#00b4fb]" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-sky-100 pt-3 text-xs text-slate-700">
                    <div>✓ Webinars ilimitados</div>
                    <div>✓ Camarim / Backstage nativo</div>
                    <div>✓ Live CTA de conversão</div>
                    <div>✓ Gravação automática na nuvem</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EQUIPE */}
            {activeTab === "team" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Membros da Equipe</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Adicione colaboradores para ajudar na criação e moderação de webinars.
                  </p>
                </div>

                {/* Add member box */}
                <div className="flex flex-col sm:flex-row gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="email"
                    placeholder="e-mail do colaborador..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as "admin" | "member")}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#00b4fb] focus:outline-none"
                  >
                    <option value="member">Membro (Organizador)</option>
                    <option value="admin">Administrador Geral</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#00b4fb] px-4 py-2 text-xs font-semibold text-white hover:bg-[#009ce0] transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Convidar</span>
                  </button>
                </div>

                {/* Members list */}
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                  {members.map((mem) => (
                    <div key={mem.id} className="flex items-center justify-between p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                          {mem.avatarInitials}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{mem.name}</p>
                          <p className="text-[11px] text-slate-500">{mem.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            mem.role === "admin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {mem.role === "admin" ? "Administrador" : "Membro"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
