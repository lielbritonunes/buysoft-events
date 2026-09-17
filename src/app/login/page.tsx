"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { loginAction } from "@/lib/authActions";
import { ShaderGradient } from "@/components/ui/shader-gradient";
import { springs } from "@/components/ui/motion-primitives";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "google_auth_failed"
      ? "Falha ao autenticar com o Google. Tente novamente."
      : urlError === "token_exchange_failed"
      ? "Erro na troca de credenciais do Google."
      : null
  );

  const isEmailEntered = email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailEntered) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("rememberMe", rememberMe ? "true" : "false");

      const res = await loginAction(null, formData);

      if (!res.success) {
        setError(res.error || "Não foi possível realizar o login.");
        setLoading(false);
        return;
      }

      if (res.requiresMfa && res.challengeToken) {
        router.push(
          `/login/mfa?challenge=${encodeURIComponent(res.challengeToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Ocorreu um erro inesperado ao conectar.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const returnTo = encodeURIComponent(callbackUrl);
    window.location.href = `/api/auth/google?returnTo=${returnTo}`;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden">
      {/* Animated Shader Gradient Background */}
      <ShaderGradient
        variant="aurora"
        speed="slow"
        intensity="medium"
        grain
        className="absolute inset-0"
      />

      {/* Header with Logo */}
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

      {/* Center Login Card — Liquid Glass */}
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
                background: "linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.9) 60%, transparent 90%)",
              }}
            />

            {/* Header */}
            <motion.div
              className="mb-6 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.35 }}
            >
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Bem-vindo de volta
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Entre para acessar sua conta.
              </p>
            </motion.div>

            {/* Google SSO Button */}
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl py-2.5 px-4 text-sm font-semibold text-slate-700 transition-all"
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(226, 232, 240, 0.6)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
              whileHover={{
                scale: 1.01,
                boxShadow: "0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
              whileTap={{ scale: 0.98 }}
              transition={springs.snappy}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Continuar com o Google</span>
            </motion.button>

            {/* Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-slate-200/50" />
              <span
                className="absolute px-3 text-[11px] font-medium text-slate-400"
                style={{ background: "rgba(255,255,255,0.78)" }}
              >
                Ou continue com o e-mail
              </span>
            </div>

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

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.4 }}
              >
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    className="glass-input pl-10"
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.45 }}
              >
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className="glass-input pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                className="flex items-center justify-between pt-0.5 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#00b4fb] focus:ring-[#00b4fb]"
                  />
                  <span className="text-[11px]">Lembrar-me</span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-[#0084be] hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </motion.div>

              {/* CTA Button */}
              <motion.button
                type="submit"
                disabled={loading || !isEmailEntered}
                className={`w-full rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                  !isEmailEntered
                    ? "bg-[#00b4fb]/40 text-white/80 cursor-not-allowed"
                    : "bg-[#00b4fb] hover:bg-[#009ce0] text-white cursor-pointer"
                }`}
                style={{
                  boxShadow: isEmailEntered
                    ? "0 4px 16px rgba(0, 180, 251, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)"
                    : "none",
                }}
                whileHover={isEmailEntered ? { scale: 1.01, y: -1 } : undefined}
                whileTap={isEmailEntered ? { scale: 0.98 } : undefined}
                transition={springs.snappy}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Acessando...</span>
                  </div>
                ) : (
                  <span>Entrar</span>
                )}
              </motion.button>
            </form>

            {/* Signup Link */}
            <motion.div
              className="mt-5 text-center text-xs text-slate-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Novo na Buysoft Events?{" "}
              <Link
                href="/register"
                className="font-bold text-[#0084be] hover:underline"
              >
                Crie uma conta.
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        className="relative z-10 py-4 text-center text-[11px] text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Buysoft Events &copy; {new Date().getFullYear()}
      </motion.footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-sans text-slate-400"
          style={{ background: "linear-gradient(135deg, #f0f6ff 0%, #e6f7fe 50%, #f4f8fe 100%)" }}>
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00b4fb] border-t-transparent" />
            <span className="text-xs font-semibold text-slate-500">
              Carregando portal de acesso...
            </span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
