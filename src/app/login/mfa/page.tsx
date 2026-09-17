"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Smartphone,
  ArrowLeft,
} from "lucide-react";
import { verifyMfaChallengeAction } from "@/lib/authActions";
import { ShaderGradient } from "@/components/ui/shader-gradient";
import { springs } from "@/components/ui/motion-primitives";

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
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden font-sans selection:bg-[#00b4fb] selection:text-white">
      {/* Animated Shader Gradient Background */}
      <ShaderGradient
        variant="aurora"
        speed="slow"
        intensity="medium"
        grain
        className="absolute inset-0"
      />

      {/* Header com Logo */}
      <motion.header
        className="relative z-20 w-full px-6 sm:px-10 py-5"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.gentle, delay: 0.1 }}
      >
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
      </motion.header>

      {/* Center MFA Card — Liquid Glass */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...springs.gentle, delay: 0.2 }}
        >
          <div
            className="relative rounded-3xl p-7 sm:p-9 overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.78)",
              backdropFilter: "blur(30px) saturate(1.8)",
              WebkitBackdropFilter: "blur(30px) saturate(1.8)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.08),
                0 12px 24px -8px rgba(0, 0, 0, 0.04),
                inset 0 1px 0 rgba(255, 255, 255, 0.4)
              `,
            }}
          >
            {/* Top edge highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 60%, transparent 90%)",
              }}
            />

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-48 rounded-full bg-[#00b4fb]/10 blur-2xl" />

            {/* Header Icon & Texts */}
            <motion.div
              className="mb-6 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.3 }}
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-[0_4px_16px_rgba(16,185,129,0.15)]">
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
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="flex items-start gap-2.5 rounded-xl border border-rose-200/60 bg-rose-50/80 backdrop-blur-sm p-3 text-xs text-rose-600 overflow-hidden"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MFA Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.35 }}
              >
                <label className="block mb-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                        val = val.replace(/\D/g, "");
                      }
                      setCode(val);
                    }}
                    placeholder={useBackupCode ? "XXXX-XXXX" : "000 000"}
                    className="w-full text-center tracking-[0.3em] text-2xl font-mono font-bold rounded-2xl border border-slate-200/80 bg-white/90 py-3.5 px-4 text-slate-900 placeholder:text-slate-300 shadow-2xs backdrop-blur-xs transition focus:border-[#00b4fb] focus:ring-4 focus:ring-[#00b4fb]/10 focus:outline-none"
                  />
                </div>

                <p className="mt-2 text-center text-[11px] text-slate-400">
                  {useBackupCode
                    ? "Cada código de backup só pode ser utilizado uma única vez."
                    : "O código expira a cada 30 segundos no seu aplicativo."}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.4 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading || !isCodeEntered}
                  className={`w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-all ${
                    !isCodeEntered
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-[#00b4fb] hover:bg-[#009ce0] text-white cursor-pointer shadow-[0_4px_16px_rgba(0,180,251,0.35)]"
                  }`}
                  whileHover={isCodeEntered && !loading ? { scale: 1.01 } : {}}
                  whileTap={isCodeEntered && !loading ? { scale: 0.98 } : {}}
                  transition={springs.snappy}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Validando...</span>
                    </div>
                  ) : (
                    <span>Verificar e Entrar</span>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Toggle Backup Code Mode */}
            <div className="mt-5 border-t border-slate-200/50 pt-4 text-center">
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
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 transition"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Voltar para o login</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-400/80">
        Buysoft Events &copy; {new Date().getFullYear()} &bull; Plataforma Segura
      </footer>
    </div>
  );
}

export default function MfaChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 font-sans text-slate-400">
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
