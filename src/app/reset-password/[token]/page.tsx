"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Radio,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Video,
  Monitor,
  Heart,
  PieChart,
  Bookmark,
  User,
  ShieldCheck
} from "lucide-react";
import { resetPasswordAction } from "@/lib/authActions";

interface Props {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: Props) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isFormValid = password.length >= 8 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await resetPasswordAction(token, password);
      if (!res.success) {
        setError(res.error || "Erro ao redefinir a senha ou token expirado.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro inesperado ao salvar nova senha. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#eef5fe] font-sans selection:bg-[#00b4fb] selection:text-white overflow-hidden">
      {/* 1. Header com Logo Superior Buysoft Events */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-5">
        <Link href="/" className="inline-flex items-center group">
          <Image
            src="/logo.png"
            alt="Buysoft Events"
            width={160}
            height={48}
            className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>
      </header>

      {/* 2. Floating StreamYard-style stickers/illustrations background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        {/* Chat bubble sticker (left) */}
        <div className="hidden md:flex absolute left-[8%] lg:left-[12%] bottom-[30%] h-12 w-16 items-center justify-center rounded-2xl bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
          </div>
        </div>

        {/* Webcam participant window (left) */}
        <div className="hidden lg:flex absolute left-[11%] top-[42%] h-16 w-24 flex-col items-center justify-center rounded-xl bg-white/80 p-2 shadow-sm border border-sky-100/90">
          <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-400">
            <User className="h-4 w-4" />
          </div>
          <div className="mt-1.5 h-1.5 w-12 rounded-full bg-sky-100" />
        </div>

        {/* Monitor Screen sticker */}
        <div className="hidden md:flex absolute left-[20%] bottom-[16%] h-14 w-18 items-center justify-center rounded-2xl bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <Monitor className="h-6 w-6 text-sky-300" />
        </div>

        {/* Camera circle (left-center) */}
        <div className="hidden sm:flex absolute left-[30%] bottom-[13%] h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <Video className="h-4 w-4 text-sky-300" />
        </div>

        {/* Bookmark sticker (center-bottom) */}
        <div className="hidden md:flex absolute left-[44%] bottom-[10%] h-12 w-10 items-center justify-center rounded-xl bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <Bookmark className="h-5 w-5 text-sky-300 fill-sky-200" />
        </div>

        {/* Video Card sticker (center-right) */}
        <div className="hidden md:flex absolute left-[54%] bottom-[14%] h-14 w-20 flex-col items-center justify-center rounded-xl bg-white/80 p-2 shadow-sm border border-sky-100">
          <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-400">
            <User className="h-4 w-4" />
          </div>
          <div className="mt-1.5 h-1 w-10 rounded-full bg-sky-100" />
        </div>

        {/* Pie chart sticker */}
        <div className="hidden md:flex absolute right-[31%] bottom-[11%] h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-sky-100">
          <PieChart className="h-5 w-5 text-sky-300" />
        </div>

        {/* Heart bubble sticker */}
        <div className="hidden md:flex absolute right-[23%] bottom-[32%] h-12 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-sky-100">
          <Heart className="h-5 w-5 text-sky-300 fill-sky-200" />
        </div>

        {/* Video frame sticker (right) */}
        <div className="hidden lg:flex absolute right-[13%] bottom-[24%] h-16 w-24 flex-col items-center justify-center rounded-xl bg-white/80 p-2 shadow-sm border border-sky-100">
          <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-400">
            <User className="h-4 w-4" />
          </div>
          <div className="mt-1.5 h-1.5 w-12 rounded-full bg-sky-100" />
        </div>

        {/* Camera circle (right) */}
        <div className="hidden sm:flex absolute right-[18%] bottom-[12%] h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm border border-sky-100">
          <Video className="h-4 w-4 text-sky-300" />
        </div>

        {/* Decorative dots */}
        <div className="absolute left-[18%] bottom-[26%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute left-[26%] bottom-[13%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute right-[28%] bottom-[22%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute right-[11%] bottom-[28%] h-2 w-2 rounded-full bg-sky-300/60" />
      </div>

      {/* 3. Center Reset Password Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-7 sm:p-9 shadow-lg shadow-sky-900/5 border border-slate-100/90 my-auto">
          {success ? (
            /* Success Feedback */
            <div className="text-center py-2 space-y-4 animate-in fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-2xs">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Senha alterada com sucesso!</h2>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  Sua nova senha já está ativa. Você agora pode acessar sua conta normalmente.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href="/login"
                  className="btn-buysoft-primary w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs"
                >
                  <span>Ir para o Login</span>
                  <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                </Link>
              </div>
            </div>
          ) : (
            /* New Password Form */
            <>
              {/* Header Texts */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#00b4fb] border border-sky-100 shadow-2xs">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Definir nova senha
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Crie uma senha segura com no mínimo 8 caracteres.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nova Senha */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nova Senha */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita sua nova senha"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                    />
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-[11px] text-rose-500">As senhas não coincidem.</p>
                  )}
                </div>

                {/* Dynamic Button:
                    - Azul apagado quando incompleto / inválido (#9cd9f7)
                    - Azul #00b4fb vibrante ao preencher corretamente */}
                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
                    !isFormValid
                      ? "bg-[#9cd9f7] text-white cursor-not-allowed opacity-90 shadow-none"
                      : "bg-[#00b4fb] hover:bg-[#009ce0] text-white cursor-pointer shadow-md shadow-sky-300/30 hover:shadow-lg hover:shadow-sky-400/40"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Salvando nova senha...</span>
                    </div>
                  ) : (
                    <span>Redefinir Senha</span>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition font-medium"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Voltar para o login</span>
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      {/* 4. Bottom Spacer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-400">
        Buysoft Events &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
