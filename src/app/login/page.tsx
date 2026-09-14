"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Radio, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { loginAction } from "@/lib/authActions";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // Redirect to MFA challenge
        router.push(
          `/login/mfa?challenge=${encodeURIComponent(res.challengeToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
        return;
      }

      // Successful login
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError("Ocorreu um erro inesperado ao conectar.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const returnTo = encodeURIComponent(callbackUrl);
    window.location.href = `/api/auth/google?returnTo=${returnTo}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 font-sans text-slate-100 selection:bg-[#00b4fb] selection:text-white">
      {/* Background radial glow */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-[#00b4fb]/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#00b4fb] to-sky-400 text-white shadow-lg shadow-[#00b4fb]/20 ring-1 ring-white/20">
            <Radio className="h-7 w-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Buysoft <span className="text-[#00b4fb]">Events</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-400">
            Plataforma Corporativa de Transmissões e Webinars
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Acesse sua conta</h2>
            <p className="text-xs text-slate-400">
              Entre com suas credenciais ou use o login corporativo
            </p>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700/80 bg-slate-800/80 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-750 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/50"
          >
            {/* Google SVG Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            <span>Continuar com Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-slate-800" />
            <span className="absolute bg-slate-900 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              ou com e-mail
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="voce@buysoft.com.br"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 transition focus:border-[#00b4fb] focus:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Senha</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#00b4fb] transition hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-[#00b4fb] focus:ring-[#00b4fb] focus:ring-offset-slate-900"
                />
                <span>Lembrar por 30 dias</span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>MFA Suportado</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00b4fb] py-3 text-sm font-bold text-white shadow-md shadow-[#00b4fb]/20 transition hover:bg-[#009edc] focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/50 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-400">
            Ainda não tem conta corporativa?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#00b4fb] hover:underline"
            >
              Criar nova organização
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-slate-500">
          Buysoft Events &copy; 2026. Conexão protegida com criptografia de ponta a ponta.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00b4fb] border-t-transparent" />
            <span className="text-xs">Carregando portal de acesso...</span>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
