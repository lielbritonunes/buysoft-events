"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, AlertCircle, KeyRound, Smartphone, ArrowLeft } from "lucide-react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) return;

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
    } catch (err: any) {
      setError("Erro ao validar o código. Tente novamente.");
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
        {/* Header Icon */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Verificação em Duas Etapas
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {useBackupCode
              ? "Insira um dos seus códigos de recuperação de 8 dígitos"
              : "Insira o código de 6 dígitos gerado no Google Authenticator"}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400 text-center">
                {useBackupCode ? "Código de Recuperação (Backup)" : "Código do Aplicativo"}
              </label>

              <div className="relative flex justify-center">
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={useBackupCode ? 10 : 6}
                  value={code}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (!useBackupCode) {
                      val = val.replace(/\D/g, ""); // digits only for TOTP
                    }
                    setCode(val);
                  }}
                  placeholder={useBackupCode ? "XXXX-XXXX" : "000 000"}
                  className="w-full text-center tracking-[0.35em] text-2xl font-mono font-bold rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 px-4 text-white placeholder-slate-600 transition focus:border-[#00b4fb] focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/40"
                />
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                {useBackupCode
                  ? "Cada código de backup só pode ser utilizado uma única vez."
                  : "O código expira a cada 30 segundos no seu app."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.trim().length < (useBackupCode ? 8 : 6)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-sm font-bold text-white shadow-md shadow-[#00b4fb]/20 transition hover:bg-[#009edc] focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/50 disabled:opacity-40"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Verificar e Continuar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Backup Code Mode */}
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setCode("");
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              {useBackupCode ? (
                <>
                  <Smartphone className="h-3.5 w-3.5 text-[#00b4fb]" />
                  <span>Voltar para o código do Google Authenticator</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                  <span>Perdeu o smartphone? Usar código de backup</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Retornar para o início do login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MfaChallengePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00b4fb] border-t-transparent" />
            <span className="text-xs">Carregando autenticação...</span>
          </div>
        </div>
      }
    >
      <MfaChallengeContent />
    </Suspense>
  );
}
