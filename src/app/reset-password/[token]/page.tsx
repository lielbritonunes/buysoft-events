"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { resetPasswordAction } from "@/lib/authActions";

interface Props {
  params: Promise<{ token: string }>;
}

export default function ResetPasswordPage({ params }: Props) {
  const router = useRouter();
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        setError(res.error || "Erro ao redefinir a senha.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro inesperado ao salvar nova senha.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 font-sans text-slate-100 selection:bg-[#00b4fb] selection:text-white">
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#00b4fb]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00b4fb] to-sky-400 text-white shadow-lg shadow-[#00b4fb]/20 ring-1 ring-white/20">
            <Radio className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Definir Nova Senha
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Escolha uma senha forte com pelo menos 8 caracteres
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-white">Senha alterada com sucesso!</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sua senha foi redefinida com segurança. Você já pode fazer login na plataforma.
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00b4fb] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#009edc] transition shadow-md shadow-[#00b4fb]/20"
                >
                  <span>Acessar Conta Agora</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
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

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a mesma senha"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 transition focus:border-[#00b4fb] focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || password.length < 8 || password !== confirmPassword}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-sm font-bold text-white shadow-md shadow-[#00b4fb]/20 transition hover:bg-[#009edc] focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/50 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Atualizar Senha & Concluir</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Cancelar e voltar ao login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
