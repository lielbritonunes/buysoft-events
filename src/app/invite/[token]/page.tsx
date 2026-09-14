"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { acceptInviteAction } from "@/lib/authActions";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 font-sans text-slate-100 selection:bg-[#00b4fb] selection:text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#00b4fb]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00b4fb] to-sky-400 text-white shadow-lg shadow-[#00b4fb]/20 ring-1 ring-white/20">
            <Radio className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Convite para Equipe
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Você foi convidado para ingressar em uma organização no Buysoft Events
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Seu nome completo *
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Roberto Castro"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 transition focus:border-[#00b4fb] focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                Defina sua senha de acesso *
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 transition focus:border-[#00b4fb] focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name || password.length < 8}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-sm font-bold text-white shadow-md shadow-[#00b4fb]/20 transition hover:bg-[#009edc] focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/50 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Aceitar Convite & Entrar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-400">
            Já possui cadastro?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#00b4fb] hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
