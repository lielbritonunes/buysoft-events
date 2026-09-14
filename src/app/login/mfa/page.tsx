"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Radio,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Smartphone,
  ArrowLeft,
  MessageSquare,
  Video,
  Monitor,
  Heart,
  PieChart,
  Bookmark,
  User
} from "lucide-react";
import { verifyMfaChallengeAction } from "@/lib/authActions";

function MfaChallengeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeToken = searchParams.get("challenge");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!challengeToken) {
      router.push("/login");
    }
  }, [challengeToken, router]);

  const isCodeEntered = code.trim().length >= (useBackupCode ? 8 : 6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken || !isCodeEntered) return;

    setError(null);
    setLoading(true);

    try {
      const res = await verifyMfaChallengeAction(challengeToken, code);

      if (!res.success) {
        setError(res.error || "Código incorreto. Tente novamente.");
        setLoading(false);
        return;
      }

      // Success
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Erro ao validar o código. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#eef5fe] font-sans selection:bg-[#00b4fb] selection:text-white overflow-hidden">
      {/* 1. Header com Logo Superior Buysoft Events */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b4fb] text-white shadow-sm shadow-sky-200 transition-transform group-hover:scale-105">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              buysoft
            </span>
            <span className="text-lg font-bold tracking-tight text-[#00b4fb] leading-none">
              events
            </span>
          </div>
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

        {/* Small chat bubble (far right) */}
        <div className="hidden md:flex absolute right-[9%] bottom-[15%] h-10 w-14 items-center justify-center rounded-xl bg-white/90 shadow-sm border border-sky-100">
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-sky-300" />
            <span className="h-1 w-1 rounded-full bg-sky-300" />
            <span className="h-1 w-1 rounded-full bg-sky-300" />
          </div>
        </div>

        {/* Decorative dots */}
        <div className="absolute left-[18%] bottom-[26%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute left-[26%] bottom-[13%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute right-[28%] bottom-[22%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute right-[11%] bottom-[28%] h-2 w-2 rounded-full bg-sky-300/60" />
      </div>

      {/* 3. Center MFA Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-7 sm:p-9 shadow-lg shadow-sky-900/5 border border-slate-100/90">
          {/* Header Icon & Texts */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#00b4fb] border border-sky-100 shadow-2xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Verificação em Duas Etapas
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              {useBackupCode
                ? "Insira um dos seus códigos de recuperação de 8 caracteres"
                : "Insira o código de 6 dígitos gerado no Google Authenticator"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* MFA Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {useBackupCode ? "Código de Backup" : "Código do Aplicativo"}
              </label>

              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={useBackupCode ? 10 : 6}
                  value={code}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!useBackupCode) {
                      val = val.replace(/\D/g, ""); // Apenas números para TOTP
                    }
                    setCode(val);
                  }}
                  placeholder={useBackupCode ? "XXXX-XXXX" : "000 000"}
                  className="w-full text-center tracking-[0.3em] text-2xl font-mono font-bold rounded-xl border border-slate-200 bg-white py-3 px-4 text-slate-900 placeholder:text-slate-300 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                />
              </div>

              <p className="mt-2 text-center text-[11px] text-slate-400">
                {useBackupCode
                  ? "Cada código de backup só pode ser utilizado uma única vez."
                  : "O código expira a cada 30 segundos no seu aplicativo."}
              </p>
            </div>

            {/* Dynamic Button:
                - Azul apagado quando código incompleto
                - Azul #00b4fb vibrante ao completar */}
            <button
              type="submit"
              disabled={loading || !isCodeEntered}
              className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
                !isCodeEntered
                  ? "bg-[#9cd9f7] text-white cursor-not-allowed opacity-90 shadow-none"
                  : "bg-[#00b4fb] hover:bg-[#009ce0] text-white cursor-pointer shadow-md shadow-sky-300/30 hover:shadow-lg hover:shadow-sky-400/40"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Validando...</span>
                </div>
              ) : (
                <span>Verificar e Entrar</span>
              )}
            </button>
          </form>

          {/* Toggle Backup Code Mode */}
          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode("");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0084be] transition"
            >
              {useBackupCode ? (
                <>
                  <Smartphone className="h-3.5 w-3.5 text-[#00b4fb]" />
                  <span>Voltar para o código do Google Authenticator</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                  <span>Perdeu o smartphone? Usar código de backup</span>
                </>
              )}
            </button>
          </div>

          {/* Back to Login Link */}
          <div className="mt-3 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Voltar para o login</span>
            </Link>
          </div>
        </div>
      </main>

      {/* 4. Bottom Spacer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-400">
        Buysoft Events &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function MfaChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#eef5fe] font-sans text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00b4fb] border-t-transparent" />
            <span className="text-xs font-semibold text-slate-500">
              Carregando verificação...
            </span>
          </div>
        </div>
      }
    >
      <MfaChallengeContent />
    </Suspense>
  );
}
