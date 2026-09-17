"use client";

import React, { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { acceptInviteAction } from "@/lib/authActions";
import { ShaderGradient } from "@/components/ui/shader-gradient";
import { springs } from "@/components/ui/motion-primitives";

interface Props {
  params: Promise<{ token: string }>;
}

export default function AcceptInvitePage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("A senha deve conter no mínimo 8 caracteres.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await acceptInviteAction(token, name, password);

      if (!res.success) {
        setError(res.error || "Não foi possível aceitar o convite.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError("Erro ao processar o convite.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden selection:bg-[#00b4fb] selection:text-white">
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

      {/* Center Invite Card — Liquid Glass */}
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
            {/* Top edge light refraction */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 70%, transparent)",
              }}
            />

            {/* Title & Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00b4fb]/10 text-[#0084be] text-xs font-semibold mb-3 border border-[#00b4fb]/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Convite de Equipe</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Junte-se à Equipe
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Crie sua conta para acessar o workspace da organização
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Seu nome completo *
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Roberto Castro"
                    className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#00b4fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Defina sua senha de acesso *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo de 8 caracteres"
                    className="w-full rounded-xl border border-slate-200/80 bg-white/60 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#00b4fb] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !name || password.length < 8}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={springs.snappy}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#00b4fb] to-[#0084be] shadow-md shadow-[#00b4fb]/25 hover:shadow-lg hover:shadow-[#00b4fb]/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Aceitar Convite & Entrar</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 border-t border-slate-200/60 pt-5 text-center text-xs text-slate-500">
              Já possui cadastro?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#00b4fb] hover:text-[#0084be] transition"
              >
                Fazer login
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Buysoft Events. Todos os direitos reservados.
      </footer>
    </div>
  );
}
