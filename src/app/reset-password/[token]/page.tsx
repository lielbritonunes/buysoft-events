"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { resetPasswordAction } from "@/lib/authActions";
import { ShaderGradient } from "@/components/ui/shader-gradient";
import { springs } from "@/components/ui/motion-primitives";

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

      {/* Center Reset Password Card — Liquid Glass */}
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

            {success ? (
              /* Success Feedback */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springs.gentle}
                className="text-center py-2 space-y-4"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-[0_4px_16px_rgba(16,185,129,0.15)]">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Senha alterada com sucesso!
                  </h2>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Sua nova credencial já está ativa. Você agora pode acessar sua conta normalmente.
                  </p>
                </div>

                <div className="pt-3">
                  <Link
                    href="/login"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] py-2.5 px-4 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(0,180,251,0.3)] transition-all"
                  >
                    <span>Ir para o Login</span>
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* New Password Form */
              <>
                {/* Header Texts */}
                <motion.div
                  className="mb-6 text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springs.gentle, delay: 0.3 }}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00b4fb]/10 text-[#00b4fb] border border-[#00b4fb]/20 shadow-xs">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    Definir nova senha
                  </h1>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                    Crie uma senha segura com no mínimo 8 caracteres.
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

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nova Senha */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.gentle, delay: 0.35 }}
                  >
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Nova Senha
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="glass-input pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Confirmar Nova Senha */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.gentle, delay: 0.4 }}
                  >
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita sua nova senha"
                        className="glass-input pl-10 pr-10"
                      />
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <p className="mt-1.5 text-[11px] text-rose-500 font-medium">As senhas não coincidem.</p>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springs.gentle, delay: 0.45 }}
                  >
                    <motion.button
                      type="submit"
                      disabled={loading || !isFormValid}
                      className={`w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-all ${
                        !isFormValid
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                          : "bg-[#00b4fb] hover:bg-[#009ce0] text-white cursor-pointer shadow-[0_4px_16px_rgba(0,180,251,0.35)]"
                      }`}
                      whileHover={isFormValid && !loading ? { scale: 1.01 } : {}}
                      whileTap={isFormValid && !loading ? { scale: 0.98 } : {}}
                      transition={springs.snappy}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Salvando nova senha...</span>
                        </div>
                      ) : (
                        <span>Redefinir Senha</span>
                      )}
                    </motion.button>
                  </motion.div>

                  <div className="pt-2 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      <span>Voltar para o login</span>
                    </Link>
                  </div>
                </form>
              </>
            )}
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
