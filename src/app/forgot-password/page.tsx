"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Radio, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { forgotPasswordAction } from "@/lib/authActions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await forgotPasswordAction(email);
      if (!res.success) {
        setError(res.error || "Não foi possível processar a recuperação.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Erro ao solicitar redefinição.");
    } finally {
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
            <Radio className="h-7 w-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Recuperação de Senha
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Informe seu e-mail para receber o link seguro de redefinição
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
          {submitted ? (
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-white">E-mail de recuperação enviado!</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enviamos as instruções e o link seguro de redefinição para <b className="text-[#00b4fb]">{email}</b>.
              </p>
              <p className="text-[11px] text-slate-500">
                Por favor, verifique a sua caixa de entrada e pasta de spam. O link é válido por 1 hora.
              </p>

              <div className="pt-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 px-5 py-2.5 text-xs font-semibold text-white transition shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
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
                  E-mail corporativo
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 transition focus:border-[#00b4fb] focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-sm font-bold text-white shadow-md shadow-[#00b4fb]/20 transition hover:bg-[#009edc] focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/50 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Enviar Link de Recuperação</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar para o login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
