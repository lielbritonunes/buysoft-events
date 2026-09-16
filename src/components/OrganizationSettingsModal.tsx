"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Building,
  CreditCard,
  Users,
  Shield,
  ShieldCheck,
  Check,
  Plus,
  Copy,
  Trash2,
  KeyRound,
  Smartphone,
  AlertCircle,
  ExternalLink,
  Lock,
  Mail,
  Send,
  Video,
  Radio,
  RefreshCw,
  Server
} from "lucide-react";
import { Organization, OrganizationMember, UserSession } from "@/types";
import {
  setupMfaAction,
  enableMfaAction,
  disableMfaAction,
  getOrganizationUsersAction,
  inviteTeamMemberAction,
  removeTeamUserAction
} from "@/lib/authActions";
import {
  updateOrganizationAction,
  testSmtpConnectionAction
} from "@/lib/dbActions";

interface Props {
  organization: Organization;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrg: (updated: Organization) => void;
  currentUser?: UserSession | null;
  onUpdateCurrentUser?: (updated: UserSession) => void;
}

export default function OrganizationSettingsModal({
  organization,
  isOpen,
  onClose,
  onUpdateOrg,
  currentUser,
  onUpdateCurrentUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "team" | "smtp" | "billing"
  >("profile");

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

  // Team Management State
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"organizer" | "admin" | "speaker">("organizer");
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Security & MFA State
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [mfaTestCode, setMfaTestCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [disablePasswordOrCode, setDisablePasswordOrCode] = useState("");
  const [showDisableModal, setShowDisableModal] = useState(false);

  // SMTP & Senders State
  const [customSmtpEnabled, setCustomSmtpEnabled] = useState(organization.customSmtpEnabled ?? false);
  const [smtpHost, setSmtpHost] = useState(organization.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(organization.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState(organization.smtpSecure ?? false);
  const [smtpUser, setSmtpUser] = useState(organization.smtpUser || "");
  const [smtpPass, setSmtpPass] = useState(organization.smtpPass || "");
  const [defaultSender, setDefaultSender] = useState(organization.defaultSender || organization.email);
  const [sendersList, setSendersList] = useState<string[]>(() => {
    try {
      return organization.smtpSendersJson ? JSON.parse(organization.smtpSendersJson) : [organization.email];
    } catch {
      return [organization.email];
    }
  });
  const [newSenderInput, setNewSenderInput] = useState("");
  const [testRecipient, setTestRecipient] = useState(currentUser?.email || organization.email);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testSmtpResult, setTestSmtpResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingSmtp, setSavingSmtp] = useState(false);

  // Load team users when tab opened
  useEffect(() => {
    if (isOpen && activeTab === "team") {
      loadTeam();
    }
  }, [isOpen, activeTab]);

  const loadTeam = async () => {
    setLoadingTeam(true);
    try {
      const users = await getOrganizationUsersAction();
      setTeamUsers(users);
    } catch (err) {
      console.error("Error loading team users:", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateOrganizationAction(organization.id, {
        ...formData,
        customSmtpEnabled,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        smtpSendersJson: JSON.stringify(sendersList),
        defaultSender,
      });
      onUpdateOrg(updated as unknown as Organization);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) return;

    setInviteError(null);
    try {
      const res = await inviteTeamMemberAction(inviteEmail, inviteRole);
      if (!res.success) {
        setInviteError(res.error || "Erro ao gerar convite.");
        return;
      }

      const fullUrl = `${window.location.origin}${res.data?.inviteUrl}`;
      setGeneratedInviteUrl(fullUrl);
      setInviteEmail("");
      loadTeam();
    } catch {
      setInviteError("Erro ao enviar convite.");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro da organização?")) return;
    try {
      const res = await removeTeamUserAction(userId);
      if (res.success) {
        loadTeam();
      } else {
        alert(res.error || "Erro ao remover membro.");
      }
    } catch {
      alert("Erro ao remover membro.");
    }
  };

  // MFA Flow Handlers
  const handleStartMfaSetup = async () => {
    setMfaLoading(true);
    setMfaError(null);
    try {
      const res = await setupMfaAction();
      if (res.success && res.data) {
        setMfaSetupData(res.data);
      } else {
        setMfaError(res.error || "Erro ao iniciar configuração do MFA.");
      }
    } catch {
      setMfaError("Erro ao conectar com o serviço de autenticação.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaSetupData || !mfaTestCode) return;

    setMfaLoading(true);
    setMfaError(null);
    try {
      const res = await enableMfaAction(mfaSetupData.secret, mfaTestCode);
      if (res.success && res.data) {
        setBackupCodes(res.data.backupCodes);
        setMfaSetupData(null);
        setMfaTestCode("");
        if (currentUser && onUpdateCurrentUser) {
          onUpdateCurrentUser({ ...currentUser, mfaEnabled: true });
        }
      } else {
        setMfaError(res.error || "Código incorreto. Tente novamente.");
      }
    } catch {
      setMfaError("Erro ao validar código.");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePasswordOrCode) return;

    setMfaLoading(true);
    setMfaError(null);
    try {
      const res = await disableMfaAction(disablePasswordOrCode);
      if (res.success) {
        setShowDisableModal(false);
        setDisablePasswordOrCode("");
        if (currentUser && onUpdateCurrentUser) {
          onUpdateCurrentUser({ ...currentUser, mfaEnabled: false });
        }
      } else {
        setMfaError(res.error || "Código ou senha incorretos.");
      }
    } catch {
      setMfaError("Erro ao desativar MFA.");
    } finally {
      setMfaLoading(false);
    }
  };

  // SMTP Handlers
  const handleAddSender = () => {
    if (!newSenderInput.trim()) return;
    const clean = newSenderInput.trim();
    if (!sendersList.includes(clean)) {
      const updated = [...sendersList, clean];
      setSendersList(updated);
      if (!defaultSender) setDefaultSender(clean);
    }
    setNewSenderInput("");
  };

  const handleRemoveSender = (senderToRemove: string) => {
    const updated = sendersList.filter((s) => s !== senderToRemove);
    setSendersList(updated);
    if (defaultSender === senderToRemove) {
      setDefaultSender(updated[0] || organization.email);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setTestSmtpResult(null);
    try {
      const res = await testSmtpConnectionAction({
        host: smtpHost,
        port: Number(smtpPort),
        secure: smtpSecure,
        user: smtpUser,
        pass: smtpPass,
        from: defaultSender || smtpUser,
        testRecipient,
      });

      if (res.success) {
        setTestSmtpResult({
          success: true,
          message: `E-mail de teste enviado com sucesso para ${testRecipient}!`,
        });
      } else {
        setTestSmtpResult({
          success: false,
          message: res.error || "Falha na conexão com o servidor SMTP.",
        });
      }
    } catch (err: any) {
      setTestSmtpResult({ success: false, message: err.message || "Erro inesperado ao testar SMTP." });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    try {
      const updated = await updateOrganizationAction(organization.id, {
        ...formData,
        customSmtpEnabled,
        smtpHost,
        smtpPort,
        smtpSecure,
        smtpUser,
        smtpPass,
        smtpSendersJson: JSON.stringify(sendersList),
        defaultSender,
      });
      onUpdateOrg(updated as unknown as Organization);
      alert("Configurações de SMTP salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar configurações de SMTP.");
    } finally {
      setSavingSmtp(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-6 overflow-y-auto font-sans">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:min-h-[580px] my-auto">
        {/* Top bar with back navigation */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 sm:px-6 bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="truncate max-w-[200px] sm:max-w-none">Voltar para {organization.name}</span>
          </button>
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 hidden xs:block">
            Gerenciamento
          </div>
        </div>

        {/* Content Layout: Sidebar + Main Area */}
        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar Tabs */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/40 p-2 sm:p-4 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 sm:gap-2.5 rounded-xl px-3 py-2 sm:py-2.5 text-xs font-semibold shrink-0 whitespace-nowrap transition cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Perfil da Empresa</span>
              </button>

              {/* YouTube Integration removed for MVP native priority */}

              <button
                onClick={() => setActiveTab("smtp")}
                className={`flex items-center gap-2 sm:gap-2.5 rounded-xl px-3 py-2 sm:py-2.5 text-xs font-semibold shrink-0 whitespace-nowrap transition cursor-pointer ${
                  activeTab === "smtp"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Mail className="h-4 w-4 text-blue-500" />
                <span>E-mails & SMTP</span>
                {customSmtpEnabled && (
                  <span className="ml-1.5 sm:ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                    Ativo
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center gap-2 sm:gap-2.5 rounded-xl px-3 py-2 sm:py-2.5 text-xs font-semibold shrink-0 whitespace-nowrap transition cursor-pointer ${
                  activeTab === "security"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Segurança & MFA</span>
                {currentUser?.mfaEnabled && (
                  <span className="ml-1.5 sm:ml-auto flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("team")}
                className={`flex items-center gap-2 sm:gap-2.5 rounded-xl px-3 py-2 sm:py-2.5 text-xs font-semibold shrink-0 whitespace-nowrap transition cursor-pointer ${
                  activeTab === "team"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Equipe & Membros</span>
                <span className="ml-1.5 sm:ml-auto rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  {teamUsers.length || organization.members.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("billing")}
                className={`flex items-center gap-2 sm:gap-2.5 rounded-xl px-3 py-2 sm:py-2.5 text-xs font-semibold shrink-0 whitespace-nowrap transition cursor-pointer ${
                  activeTab === "billing"
                    ? "bg-[#e6f7fe] text-[#0084be]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Plano & Faturamento</span>
              </button>
            </nav>
          </div>

          {/* Right Main Content Panel */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
            {/* ======================================================== */}
            {/* TAB: TRANSMISSÃO & YOUTUBE */}
            {/* YouTube tab content removed for MVP native priority */}

            {/* ======================================================== */}
            {/* TAB: E-MAILS & SMTP */}
            {/* ======================================================== */}
            {activeTab === "smtp" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Servidor de E-mails & Remetentes (SMTP)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure como os convites, lembretes de webinars e e-mails pós-evento serão disparados para os participantes.
                  </p>
                </div>

                {/* Status Toggle Box */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="pr-4">
                      <span className="text-xs font-bold text-slate-900 block">
                        Utilizar servidor de e-mail corporativo próprio (SMTP)
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {customSmtpEnabled
                          ? "Os e-mails serão entregues através do seu servidor dedicado com o seu domínio corporativo."
                          : "Atualmente utilizando o servidor oficial da plataforma (lielbritonunes@gmail.com)."}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={customSmtpEnabled}
                      onChange={(e) => setCustomSmtpEnabled(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-[#00b4fb] focus:ring-[#00b4fb]"
                    />
                  </label>
                </div>

                {/* Form when custom SMTP is enabled */}
                {customSmtpEnabled ? (
                  <form onSubmit={handleSaveSmtp} className="space-y-5 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Servidor SMTP (Host) *
                        </label>
                        <input
                          type="text"
                          required
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="Ex: smtp.office365.com ou smtp.gmail.com"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Porta *</label>
                        <input
                          type="number"
                          required
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          placeholder="587"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Usuário SMTP / E-mail de Autenticação *
                        </label>
                        <input
                          type="text"
                          required
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="eventos@suaempresa.com.br"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Senha / Senha de Aplicativo *
                        </label>
                        <input
                          type="password"
                          required
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="smtpSecure"
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#00b4fb] focus:ring-[#00b4fb]"
                      />
                      <label htmlFor="smtpSecure" className="text-xs text-slate-700 font-medium cursor-pointer">
                        Conexão segura direta SSL/TLS (Porta 465)
                      </label>
                    </div>

                    {/* Senders Management */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Remetentes Autorizados (From Aliases)
                        </label>
                        <span className="text-[11px] text-slate-500">Exibidos nos cabeçalhos dos e-mails</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ex: Buysoft Eventos <eventos@buysoft.com.br>"
                          value={newSenderInput}
                          onChange={(e) => setNewSenderInput(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddSender}
                          className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                        >
                          Adicionar
                        </button>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {sendersList.map((sender, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="defaultSender"
                                checked={defaultSender === sender}
                                onChange={() => setDefaultSender(sender)}
                                className="h-3.5 w-3.5 text-[#00b4fb] focus:ring-[#00b4fb]"
                              />
                              <span className="font-medium text-slate-800">{sender}</span>
                              {defaultSender === sender && (
                                <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-[#0084be] border border-sky-100">
                                  Padrão
                                </span>
                              )}
                            </div>

                            {sendersList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSender(sender)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Test SMTP connection section */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Testar Conexão e Disparo
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="e-mail de destino para teste..."
                          value={testRecipient}
                          onChange={(e) => setTestRecipient(e.target.value)}
                          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleTestSmtp}
                          disabled={testingSmtp || !smtpHost || !smtpUser}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                        >
                          {testingSmtp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                          <span>{testingSmtp ? "Testando..." : "Enviar E-mail de Teste"}</span>
                        </button>
                      </div>

                      {testSmtpResult && (
                        <div
                          className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium border ${
                            testSmtpResult.success
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {testSmtpResult.success ? (
                            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                          )}
                          <span>{testSmtpResult.message}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingSmtp}
                        className="rounded-xl bg-[#00b4fb] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#009ce0] transition disabled:opacity-50"
                      >
                        {savingSmtp ? "Salvando..." : "Salvar Configurações de SMTP"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Server className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Servidor Padrão Ativo</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                        Seus e-mails de confirmação, lembretes de webinar e links de acesso estão sendo disparados com entrega garantida via <b>lielbritonunes@gmail.com</b>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: SEGURANÇA & MFA */}
            {/* ======================================================== */}
            {activeTab === "security" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Segurança & Autenticação em Duas Etapas (MFA)</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Proteja a conta da sua organização adicionando uma camada extra de segurança com o Google Authenticator.
                  </p>
                </div>

                {mfaError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    <span>{mfaError}</span>
                  </div>
                )}

                {/* Status Box */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          currentUser?.mfaEnabled
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {currentUser?.mfaEnabled ? (
                          <ShieldCheck className="h-6 w-6" />
                        ) : (
                          <Smartphone className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {currentUser?.mfaEnabled
                            ? "Autenticação em Dois Fatores Ativada"
                            : "Google Authenticator (MFA) Desativado"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {currentUser?.mfaEnabled
                            ? "Sua conta exige o código de 6 dígitos gerado no app a cada novo login."
                            : "Recomendado para prevenir acessos não autorizados à transmissão e dados de leads."}
                        </p>
                      </div>
                    </div>

                    <div>
                      {currentUser?.mfaEnabled ? (
                        <button
                          type="button"
                          onClick={() => setShowDisableModal(true)}
                          className="rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition shadow-2xs"
                        >
                          Desativar MFA
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartMfaSetup}
                          disabled={mfaLoading || !!mfaSetupData}
                          className="rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#009edc] transition disabled:opacity-50"
                        >
                          {mfaLoading ? "Carregando..." : "Ativar Google Authenticator"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* MFA Setup Wizard */}
                {mfaSetupData && !currentUser?.mfaEnabled && (
                  <div className="rounded-2xl border border-[#00b4fb]/30 bg-sky-50/30 p-6 space-y-5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00b4fb] text-xs font-bold text-white">
                        1
                      </span>
                      <span>Escaneie o QR Code no seu aplicativo</span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Abra o <b>Google Authenticator</b>, <b>Microsoft Authenticator</b> ou <b>1Password</b> no celular e aponte para o QR Code:
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-6 bg-white p-4 rounded-xl border border-slate-200">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-xs">
                        <img
                          src={mfaSetupData.qrCodeUrl}
                          alt="QR Code Google Authenticator"
                          className="h-44 w-44"
                        />
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Não consegue escanear? Chave manual:
                        </span>
                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-800">
                          <span className="truncate">{mfaSetupData.secret}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mfaSetupData.secret);
                              alert("Chave copiada!");
                            }}
                            className="text-[#00b4fb] hover:text-[#0084be]"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pt-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00b4fb] text-xs font-bold text-white">
                        2
                      </span>
                      <span>Insira o código de teste de 6 dígitos</span>
                    </div>

                    <form onSubmit={handleConfirmMfa} className="flex gap-3">
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={mfaTestCode}
                        onChange={(e) => setMfaTestCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000 000"
                        className="w-40 rounded-xl border border-slate-300 px-4 py-2 text-center font-mono text-lg font-bold tracking-widest focus:border-[#00b4fb] focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={mfaLoading || mfaTestCode.length !== 6}
                        className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        {mfaLoading ? "Validando..." : "Confirmar e Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMfaSetupData(null)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                )}

                {/* Backup Codes Display */}
                {backupCodes && (
                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-6 space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Check className="h-5 w-5 text-emerald-600" />
                      <span>Autenticação em Duas Etapas ativada com sucesso!</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <b>Guarde seus códigos de recuperação em um local seguro.</b> Cada código permite 1 acesso caso perca o celular:
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs font-bold text-slate-800 bg-white p-3 rounded-xl border border-emerald-200">
                      {backupCodes.map((c, i) => (
                        <div key={i} className="p-1.5 bg-slate-50 rounded text-center border border-slate-100">
                          {c}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(backupCodes.join("\n"));
                        setCopiedBackup(true);
                        setTimeout(() => setCopiedBackup(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                    >
                      {copiedBackup ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedBackup ? "Códigos Copiados!" : "Copiar todos os códigos"}</span>
                    </button>
                  </div>
                )}

                {/* Disable MFA Modal */}
                {showDisableModal && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-3 animate-in fade-in">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                      Confirmar desativação do MFA
                    </h4>
                    <p className="text-xs text-slate-600">
                      Digite sua senha atual ou o código de 6 dígitos gerado no app:
                    </p>
                    <form onSubmit={handleDisableMfa} className="flex gap-2">
                      <input
                        type="password"
                        required
                        value={disablePasswordOrCode}
                        onChange={(e) => setDisablePasswordOrCode(e.target.value)}
                        placeholder="Sua senha ou código"
                        className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-rose-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={mfaLoading || !disablePasswordOrCode}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition disabled:opacity-50"
                      >
                        {mfaLoading ? "Desativando..." : "Confirmar Desativação"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDisableModal(false)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: EQUIPE & MEMBROS */}
            {/* ======================================================== */}
            {activeTab === "team" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Membros da Organização</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Gerencie quem tem acesso ao estúdio de transmissão, relatórios de leads e configurações corporativas.
                  </p>
                </div>

                {inviteError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{inviteError}</span>
                  </div>
                )}

                {/* Generated Invite Box */}
                {generatedInviteUrl && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Link de convite gerado com sucesso!</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Envie o link abaixo para o colaborador concluir o cadastro com acesso direto a esta organização:
                    </p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-200 text-xs font-mono text-slate-800">
                      <span className="truncate flex-1">{generatedInviteUrl}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedInviteUrl);
                          setCopiedInvite(true);
                          setTimeout(() => setCopiedInvite(false), 2000);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        {copiedInvite ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedInvite ? "Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Invite Form */}
                <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <input
                    type="email"
                    required
                    placeholder="e-mail corporativo do convidado..."
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 focus:border-[#00b4fb] focus:outline-none"
                  >
                    <option value="organizer">Organizador (Host)</option>
                    <option value="admin">Administrador Geral</option>
                    <option value="speaker">Palestrante Convidado</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#00b4fb] px-4 py-2 text-xs font-bold text-white hover:bg-[#009ce0] transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Gerar Convite</span>
                  </button>
                </form>

                {/* Members list */}
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  {loadingTeam ? (
                    <div className="p-8 text-center text-xs text-slate-400">Carregando membros...</div>
                  ) : teamUsers.length > 0 ? (
                    teamUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-2xs">
                            {user.avatarInitials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-800">{user.name}</p>
                              {user.mfaEnabled && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                  <ShieldCheck className="h-3 w-3" /> MFA
                                </span>
                              )}
                              {user.authProvider === "google" && (
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                  Google SSO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              user.role === "admin"
                                ? "bg-slate-900 text-white shadow-xs"
                                : user.role === "speaker"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-sky-50 text-sky-700 border border-sky-200"
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            {user.role === "admin"
                              ? "Administrador"
                              : user.role === "speaker"
                              ? "Palestrante"
                              : "Organizador"}
                          </span>

                          {currentUser?.role === "admin" && currentUser.id !== user.id && (
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(user.id)}
                              title="Remover membro"
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Nenhum membro listado ainda.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB: PERFIL DA ORGANIZAÇÃO */}
            {/* ======================================================== */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Perfil da Organização</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure a identidade corporativa visível nos seus webinars e páginas de inscrição.
                  </p>
                </div>

                {savedSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700 animate-in fade-in">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Dados da organização salvos com sucesso!</span>
                  </div>
                )}

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Nome da Organização</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">E-mail Principal</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Sobre a Organização</label>
                    <textarea
                      rows={3}
                      value={formData.about || ""}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Website Oficial</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#00b4fb] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#00b4fb] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#009ce0] transition"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* TAB: FATURAMENTO */}
            {/* ======================================================== */}
            {activeTab === "billing" && (
              <div className="space-y-6 max-w-xl">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Plano Corporativo</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Informações sobre limites de participantes simultâneos e recursos ativados.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0084be] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {organization.planName || "Trial Ativo"}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">Buysoft Enterprise Webinars</h3>
                    </div>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1.5 pt-2 border-t border-slate-200/60">
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Até 100 participantes simultâneos em WebRTC ultrabaixa latência</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Estúdio Broadcast com Lower Thirds, Ticker e Layouts Customizados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Autenticação em Duas Etapas (MFA), Google SSO e SMTP customizado</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
