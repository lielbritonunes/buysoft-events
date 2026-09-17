"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { registerAction } from "@/lib/authActions";
import { ShaderGradient } from "@/components/ui/shader-gradient";
import { springs } from "@/components/ui/motion-primitives";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPasswordLongEnough = password.length >= 8;
  const hasNumbersOrSpecial = /[\d!@#$%^&*]/.test(password);

  const isFormValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    organizationName.trim().length > 0 &&
    isPasswordLongEnough;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      if (!isPasswordLongEnough) {
        setError("A senha deve conter no mínimo 8 caracteres.");
      }
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("organizationName", organizationName);

      const res = await registerAction(null, formData);

      if (!res.success) {
        setError(res.error || "Não foi possível criar a conta.");
        setLoading(false);
        return;
      }

      // Success -> Redirect to dashboard
      router.push("/");
      router.refresh();
    } catch {
      setError("Ocorreu um erro ao registrar a organização.");
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `/api/auth/google`;
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
            width={300}
            height={42}
            className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
            priority
          />
        </Link>
      </motion.header>

      {/* Center Registration Card — Liquid Glass */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <motion.div
          className="w-full max-w-[440px]"
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

            {/* Ambient subtle glow */}
            <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-32 w-48 rounded-full bg-[#00b4fb]/10 blur-2xl" />

            {/* Header Texts */}
            <motion.div
              className="mb-6 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.gentle, delay: 0.3 }}
            >
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Crie sua conta corporativa
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                Configure sua organização e realize webinars em minutos.
              </p>
            </motion.div>

            {/* Google SSO Button */}
            <motion.button
              type="button"
              onClick={handleGoogleRegister}
              className="flex w-full items-center justify-center gap-3 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-700 transition-all"
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
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
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
                Ou cadastre-se com e-mail
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

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nome Completo */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.35 }}
              >
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="glass-input pl-10"
                  />
                </div>
              </motion.div>

              {/* E-mail */}
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
                    placeholder="E-mail corporativo"
                    className="glass-input pl-10"
                  />
                </div>
              </motion.div>

              {/* Nome da Organização */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.45 }}
              >
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]" />
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Nome da organização / empresa"
                    className="glass-input pl-10"
                  />
                </div>
              </motion.div>

              {/* Senha */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.5 }}
              >
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Criar senha (mínimo 8 caracteres)"
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

                {/* Password strength tips */}
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                  <span
                    className={`flex items-center gap-1 transition-colors ${
                      isPasswordLongEnough ? "text-emerald-600 font-medium" : ""
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Mínimo 8 caracteres
                  </span>
                  <span
                    className={`flex items-center gap-1 transition-colors ${
                      hasNumbersOrSpecial ? "text-emerald-600 font-medium" : ""
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Números ou símbolos
                  </span>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.gentle, delay: 0.55 }}
              >
                <motion.button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className={`w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-all mt-2 ${
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
                      <span>Criando organização...</span>
                    </div>
                  ) : (
                    <span>Criar Conta & Começar</span>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Login link */}
            <motion.div
              className="mt-6 text-center text-xs text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Já possui uma conta corporativa?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0084be] hover:underline"
              >
                Entrar.
              </Link>
            </motion.div>
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
