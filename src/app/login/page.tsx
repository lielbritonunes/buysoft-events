"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Radio,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  MessageSquare,
  Video,
  Monitor,
  Heart,
  PieChart,
  Bookmark,
  User,
  Sparkles
} from "lucide-react";
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
        // Redirect to MFA challenge
        router.push(
          `/login/mfa?challenge=${encodeURIComponent(res.challengeToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
        );
        return;
      }

      // Successful login
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
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#eef5fe] font-sans selection:bg-[#00b4fb] selection:text-white overflow-hidden">
      {/* 1. Header com Logo Superior Buysoft Events */}
      <header className="relative z-20 w-full px-6 sm:px-10 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00b4fb] text-white shadow-sm shadow-sky-200 transition-transform group-hover:scale-105">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
              buysoft
            </span>
            <span className="text-lg font-bold tracking-tight text-[#00b4fb] leading-none">
              events
            </span>
          </div>
        </Link>
      </header>

      {/* 2. Floating StreamYard-style stickers/illustrations background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        {/* Chat bubble sticker (left) */}
        <div className="hidden md:flex absolute left-[8%] lg:left-[12%] bottom-[30%] h-12 w-16 items-center justify-center rounded-2xl bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
          </div>
        </div>

        {/* Webcam participant window (left) */}
        <div className="hidden lg:flex absolute left-[11%] top-[42%] h-16 w-24 flex-col items-center justify-center rounded-xl bg-white/80 p-2 shadow-sm border border-sky-100/90">
          <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-400">
            <User className="h-4 w-4" />
          </div>
          <div className="mt-1.5 h-1.5 w-12 rounded-full bg-sky-100" />
        </div>

        {/* Monitor Screen sticker */}
        <div className="hidden md:flex absolute left-[20%] bottom-[16%] h-14 w-18 items-center justify-center rounded-2xl bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <Monitor className="h-6 w-6 text-sky-300" />
        </div>

        {/* Camera circle (left-center) */}
        <div className="hidden sm:flex absolute left-[30%] bottom-[13%] h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <Video className="h-4 w-4 text-sky-300" />
        </div>

        {/* Bookmark sticker (center-bottom) */}
        <div className="hidden md:flex absolute left-[44%] bottom-[10%] h-12 w-10 items-center justify-center rounded-xl bg-white/90 text-sky-400 shadow-sm border border-sky-100">
          <Bookmark className="h-5 w-5 text-sky-300 fill-sky-200" />
        </div>

        {/* Video Card sticker (center-right) */}
        <div className="hidden md:flex absolute left-[54%] bottom-[14%] h-14 w-20 flex-col items-center justify-center rounded-xl bg-white/80 p-2 shadow-sm border border-sky-100">
          <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-400">
            <User className="h-4 w-4" />
          </div>
          <div className="mt-1.5 h-1 w-10 rounded-full bg-sky-100" />
        </div>

        {/* Pie chart sticker */}
        <div className="hidden md:flex absolute right-[31%] bottom-[11%] h-12 w-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-sky-100">
          <PieChart className="h-5 w-5 text-sky-300" />
        </div>

        {/* Heart bubble sticker */}
        <div className="hidden md:flex absolute right-[23%] bottom-[32%] h-12 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-sky-100">
          <Heart className="h-5 w-5 text-sky-300 fill-sky-200" />
        </div>

        {/* Video frame sticker (right) */}
        <div className="hidden lg:flex absolute right-[13%] bottom-[24%] h-16 w-24 flex-col items-center justify-center rounded-xl bg-white/80 p-2 shadow-sm border border-sky-100">
          <div className="h-6 w-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-400">
            <User className="h-4 w-4" />
          </div>
          <div className="mt-1.5 h-1.5 w-12 rounded-full bg-sky-100" />
        </div>

        {/* Camera circle (right) */}
        <div className="hidden sm:flex absolute right-[18%] bottom-[12%] h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm border border-sky-100">
          <Video className="h-4 w-4 text-sky-300" />
        </div>

        {/* Small chat bubble (far right) */}
        <div className="hidden md:flex absolute right-[9%] bottom-[15%] h-10 w-14 items-center justify-center rounded-xl bg-white/90 shadow-sm border border-sky-100">
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-sky-300" />
            <span className="h-1 w-1 rounded-full bg-sky-300" />
            <span className="h-1 w-1 rounded-full bg-sky-300" />
          </div>
        </div>

        {/* Subtle decorative dots */}
        <div className="absolute left-[18%] bottom-[26%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute left-[26%] bottom-[13%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute right-[28%] bottom-[22%] h-2 w-2 rounded-full bg-sky-300/60" />
        <div className="absolute right-[11%] bottom-[28%] h-2 w-2 rounded-full bg-sky-300/60" />
      </div>

      {/* 3. Center Login Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-7 sm:p-9 shadow-lg shadow-sky-900/5 border border-slate-100/90">
          {/* Header Texts */}
          <div className="mb-6 text-center">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Bem-vindo de volta!
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Entre para acessar sua conta.
            </p>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00b4fb]/40"
          >
            {/* Official Google SVG */}
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
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-slate-200" />
            <span className="absolute bg-white px-3 text-[11px] font-medium text-slate-400">
              Ou continue com o e-mail
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* E-mail */}
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
              />
            </div>

            {/* Senha */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#00b4fb] focus:outline-none focus:ring-1 focus:ring-[#00b4fb]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
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
            </div>

            {/* Dynamic CTA Button:
                - Azul apagado quando vazio
                - Azul #00b4fb vibrante ao digitar */}
            <button
              type="submit"
              disabled={loading || !isEmailEntered}
              className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all duration-200 ${
                !isEmailEntered
                  ? "bg-[#9cd9f7] text-white cursor-not-allowed opacity-90 shadow-none"
                  : "bg-[#00b4fb] hover:bg-[#009ce0] text-white cursor-pointer shadow-md shadow-sky-300/30 hover:shadow-lg hover:shadow-sky-400/40"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Acessando...</span>
                </div>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-5 text-center text-xs text-slate-600">
            Novo na Buysoft Events?{" "}
            <Link
              href="/register"
              className="font-bold text-[#0084be] hover:underline"
            >
              Crie uma conta.
            </Link>
          </div>
        </div>
      </main>

      {/* 4. Bottom Spacer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-400">
        Buysoft Events &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#eef5fe] font-sans text-slate-400">
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
