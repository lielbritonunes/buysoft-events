"use client";

import React from "react";
import { Config } from "@measured/puck";
import {
  Calendar,
  Clock,
  Radio,
  Users,
  CheckCircle2,
  Play,
  ArrowRight,
  Sparkles,
  ExternalLink
} from "lucide-react";

export type PuckComponentProps = {
  Navbar: {
    brandText: string;
    logoUrl?: string;
    showLinks: boolean;
    link1?: string;
    link2?: string;
    link3?: string;
    link4?: string;
    ctaText: string;
    themeStyle: "light" | "dark";
  };
  HeroSection: {
    headline: string;
    subtitle: string;
    dateText: string;
    ctaText: string;
    imageUrl?: string;
    themeStyle: "seldon" | "crosby" | "hazel" | "nolan";
    overlayOpacity: number;
  };
  AboutSection: {
    title: string;
    subtitle?: string;
    content: string;
    layout: "centered" | "two_column";
  };
  FeaturesGrid: {
    title: string;
    item1Title: string;
    item1Text: string;
    item2Title: string;
    item2Text: string;
    item3Title: string;
    item3Text: string;
  };
  SpeakersSection: {
    title: string;
    subtitle?: string;
    columns: "2" | "3" | "4";
    syncWithEvent: boolean;
  };
  ScheduleSection: {
    title: string;
    subtitle?: string;
    session1Time: string;
    session1Title: string;
    session1Speaker: string;
    session2Time: string;
    session2Title: string;
    session2Speaker: string;
    session3Time: string;
    session3Title: string;
    session3Speaker: string;
    session4Time?: string;
    session4Title?: string;
    session4Speaker?: string;
  };
  SponsorsSection: {
    title: string;
    tier: "gold" | "silver" | "all";
    sponsorsText: string;
  };
  VideoSection: {
    title: string;
    subtitle?: string;
    videoUrl?: string;
  };
  CallToAction: {
    title: string;
    subtitle: string;
    buttonText: string;
    accentColor: string;
  };
};

export function getPuckConfig(event?: any, onCtaClick?: () => void): Config<PuckComponentProps> {
  const triggerCta = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onCtaClick) {
      onCtaClick();
    } else {
      const modalTrigger = document.getElementById("buysoft-reg-trigger");
      if (modalTrigger) modalTrigger.click();
    }
  };

  return {
    components: {
      // 1. NAVBAR
      Navbar: {
        fields: {
          brandText: { type: "text", label: "Texto da Marca" },
          logoUrl: { type: "text", label: "URL da Logo" },
          showLinks: {
            type: "radio",
            label: "Exibir Links",
            options: [
              { label: "Sim", value: true },
              { label: "Não", value: false },
            ],
          },
          link1: { type: "text", label: "Link 1" },
          link2: { type: "text", label: "Link 2" },
          link3: { type: "text", label: "Link 3" },
          link4: { type: "text", label: "Link 4" },
          ctaText: { type: "text", label: "Texto do Botão" },
          themeStyle: {
            type: "radio",
            label: "Estilo",
            options: [
              { label: "Claro", value: "light" },
              { label: "Escuro", value: "dark" },
            ],
          },
        },
        defaultProps: {
          brandText: event?.title || "Buysoft Events",
          logoUrl: event?.logoUrl || "",
          showLinks: true,
          link1: "Início",
          link2: "Sobre",
          link3: "Oradores",
          link4: "Programação",
          ctaText: "Inscreva-se",
          themeStyle: "dark",
        },
        render: ({ brandText, logoUrl, showLinks, link1, link2, link3, link4, ctaText, themeStyle }) => {
          const isDark = themeStyle === "dark";
          return (
            <nav
              className={`w-full px-6 py-4 border-b transition ${
                isDark
                  ? "bg-[#090d16] border-slate-800 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 font-extrabold text-sm tracking-tight">
                    {logoUrl ? (
                      <img src={logoUrl} alt={brandText} className="h-7 w-auto max-w-[130px] object-contain" />
                    ) : (
                      <span>✦ {brandText}</span>
                    )}
                  </div>

                  {showLinks && (
                    <div className="hidden md:flex items-center gap-6 text-xs font-semibold opacity-75">
                      {link1 && <a href="#home" className="hover:opacity-100 transition">{link1}</a>}
                      <span>•</span>
                      {link2 && <a href="#about" className="hover:opacity-100 transition">{link2}</a>}
                      <span>•</span>
                      {link3 && <a href="#speakers" className="hover:opacity-100 transition">{link3}</a>}
                      <span>•</span>
                      {link4 && <a href="#schedule" className="hover:opacity-100 transition">{link4}</a>}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={triggerCta}
                  className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-4 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
                >
                  {ctaText || "Inscreva-se"}
                </button>
              </div>
            </nav>
          );
        },
      },

      // 2. HERO SECTION
      HeroSection: {
        fields: {
          headline: { type: "text", label: "Título Principal (Headline)" },
          subtitle: { type: "textarea", label: "Subtítulo / Descrição" },
          dateText: { type: "text", label: "Data e Horário" },
          ctaText: { type: "text", label: "Texto do Botão CTA" },
          imageUrl: { type: "text", label: "URL da Imagem de Fundo" },
          themeStyle: {
            type: "select",
            label: "Tema Visual",
            options: [
              { label: "Seldon (Escuro / Palco / Neon)", value: "seldon" },
              { label: "Crosby (Claro / Moderno)", value: "crosby" },
              { label: "Hazel (Split Colunas / Vibrante)", value: "hazel" },
              { label: "Nolan (Cúpula / Executivo)", value: "nolan" },
            ],
          },
          overlayOpacity: { type: "number", label: "Opacidade do Overlay (0 a 100)" },
        },
        defaultProps: {
          headline: event?.title || "The future of everything",
          subtitle:
            event?.description ||
            "Get ready for disruptive ideas and ground-breaking insights as we bring together revolutionary minds.",
          dateText: "Online • Transmissão Exclusiva Buysoft Events",
          ctaText: "Garantir Minha Vaga Gratuita",
          imageUrl:
            event?.bannerUrl ||
            "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
          themeStyle: "seldon",
          overlayOpacity: 75,
        },
        render: ({ headline, subtitle, dateText, ctaText, imageUrl, themeStyle, overlayOpacity = 75 }) => {
          if (themeStyle === "hazel") {
            return (
              <section id="home" className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#00b4fb]">
                      ✦ {event?.title || "Buysoft Events"}
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                      {headline}
                    </h1>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {subtitle}
                    </p>
                    <div className="text-xs font-bold text-[#00b4fb]">{dateText}</div>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={triggerCta}
                        className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-7 py-3 text-xs font-bold text-white shadow-lg transition active:scale-95"
                      >
                        {ctaText}
                      </button>
                    </div>
                  </div>
                  <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-2xl">
                    <img src={imageUrl} alt={headline} className="h-full w-full object-cover" />
                  </div>
                </div>
              </section>
            );
          }

          if (themeStyle === "crosby") {
            return (
              <section id="home" className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center space-y-5 bg-white text-slate-900">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ✦ {event?.title || "Buysoft Events"}
                </span>
                <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
                  {headline}
                </h1>
                <p className="text-sm sm:text-base leading-relaxed text-slate-600 max-w-2xl mx-auto">
                  {subtitle}
                </p>
                <div className="text-xs font-bold text-[#00b4fb]">{dateText}</div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={triggerCta}
                    className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-8 py-3 text-xs font-bold text-white shadow-md transition active:scale-95"
                  >
                    {ctaText}
                  </button>
                </div>
              </section>
            );
          }

          // Default: Seldon / Nolan (Dark Cover)
          return (
            <section
              id="home"
              className="relative min-h-[500px] sm:min-h-[560px] flex items-center justify-center p-8 sm:p-16 overflow-hidden text-center text-white"
            >
              <img
                src={imageUrl}
                alt="Cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-black backdrop-blur-[2px]"
                style={{ opacity: overlayOpacity / 100 }}
              />

              <div className="relative z-10 max-w-3xl mx-auto space-y-5">
                <div className="flex justify-center">
                  <span className="text-xl font-bold tracking-tight opacity-90">
                    ✦ {event?.title || "Buysoft Events"}
                  </span>
                </div>

                <h1 className="text-3xl sm:text-6xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
                  {headline}
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                  {subtitle}
                </p>

                <div className="text-xs sm:text-sm font-bold text-sky-400">{dateText}</div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={triggerCta}
                    className="rounded-xl bg-[#00b4fb] hover:bg-[#009ce0] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#00b4fb]/30 transition active:scale-95"
                  >
                    {ctaText}
                  </button>
                </div>
              </div>
            </section>
          );
        },
      },

      // 3. ABOUT SECTION
      AboutSection: {
        fields: {
          title: { type: "text", label: "Título da Seção" },
          subtitle: { type: "text", label: "Subtítulo" },
          content: { type: "textarea", label: "Texto / Conteúdo" },
          layout: {
            type: "radio",
            label: "Disposição",
            options: [
              { label: "Duas Colunas", value: "two_column" },
              { label: "Centralizado", value: "centered" },
            ],
          },
        },
        defaultProps: {
          title: "Sobre a Edição 2026",
          subtitle: "Uma imersão completa em inovação corporativa",
          content:
            "Reuniremos profissionais de destaque para compartilhar metodologias práticas, estratégias comprovadas e visões de futuro que você pode aplicar imediatamente na sua organização.",
          layout: "two_column",
        },
        render: ({ title, subtitle, content, layout }) => {
          if (layout === "centered") {
            return (
              <section id="about" className="max-w-4xl mx-auto px-6 py-14 text-center space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs text-[#00b4fb] font-semibold">{subtitle}</p>}
                <p className="text-sm leading-relaxed opacity-80 whitespace-pre-line text-left max-w-2xl mx-auto">
                  {content}
                </p>
              </section>
            );
          }

          return (
            <section id="about" className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200/20">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-4 space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                  {subtitle && <p className="text-xs text-[#00b4fb] font-semibold">{subtitle}</p>}
                </div>
                <div className="md:col-span-8">
                  <p className="text-sm leading-relaxed opacity-80 whitespace-pre-line">{content}</p>
                </div>
              </div>
            </section>
          );
        },
      },

      // 4. FEATURES GRID
      FeaturesGrid: {
        fields: {
          title: { type: "text", label: "Título do Bloco" },
          item1Title: { type: "text", label: "Destaque 1 - Título" },
          item1Text: { type: "textarea", label: "Destaque 1 - Descrição" },
          item2Title: { type: "text", label: "Destaque 2 - Título" },
          item2Text: { type: "textarea", label: "Destaque 2 - Descrição" },
          item3Title: { type: "text", label: "Destaque 3 - Título" },
          item3Text: { type: "textarea", label: "Destaque 3 - Descrição" },
        },
        defaultProps: {
          title: "O que esperar deste webinar",
          item1Title: "Acesso Direto aos Especialistas",
          item1Text: "Interaja pelo chat ao vivo e envie suas perguntas para a rodada de Q&A.",
          item2Title: "Metodologias Práticas",
          item2Text: "Casos de estudo com números reais e lições aplicáveis ao seu mercado.",
          item3Title: "Gravação & Certificado",
          item3Text: "Inscritos recebem link exclusivo para rever os conteúdos quando quiserem.",
        },
        render: ({ title, item1Title, item1Text, item2Title, item2Text, item3Title, item3Text }) => {
          return (
            <section className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200/20 space-y-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center">{title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { t: item1Title, d: item1Text },
                  { t: item2Title, d: item2Text },
                  { t: item3Title, d: item3Text },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-slate-200/40 bg-slate-500/5 space-y-2.5">
                    <h3 className="text-sm font-bold text-[#00b4fb]">{item.t}</h3>
                    <p className="text-xs opacity-75 leading-relaxed">{item.d}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        },
      },

      // 5. SPEAKERS SECTION
      SpeakersSection: {
        fields: {
          title: { type: "text", label: "Título" },
          subtitle: { type: "text", label: "Subtítulo" },
          columns: {
            type: "radio",
            label: "Colunas",
            options: [
              { label: "2 Colunas", value: "2" },
              { label: "3 Colunas", value: "3" },
              { label: "4 Colunas", value: "4" },
            ],
          },
          syncWithEvent: {
            type: "radio",
            label: "Sincronizar com Oradores do Evento",
            options: [
              { label: "Sim", value: true },
              { label: "Não (Mockup)", value: false },
            ],
          },
        },
        defaultProps: {
          title: "Palestrantes Confirmados",
          subtitle: "Líderes de tecnologia e produto que conduzirão as apresentações",
          columns: "3",
          syncWithEvent: true,
        },
        render: ({ title, subtitle, columns }) => {
          const colClass =
            columns === "2"
              ? "sm:grid-cols-2"
              : columns === "4"
              ? "sm:grid-cols-2 md:grid-cols-4"
              : "sm:grid-cols-2 md:grid-cols-3";

          const speakers = event?.speakers && event.speakers.length > 0 ? event.speakers : [
            { id: "1", name: "Carlos Mendes", role: "Head de Produto", company: "Buysoft", bio: "Especialista em produtos digitais." },
            { id: "2", name: "Mariana Souza", role: "Diretora de Engenharia", company: "TechLead", bio: "Líder em arquiteturas em tempo real." },
            { id: "3", name: "Eliel Nunes", role: "Arquiteto de Soluções", company: "Global Cloud", bio: "Especialista em WebRTC e streaming." },
          ];

          return (
            <section id="speakers" className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200/20 space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
              </div>

              <div className={`grid grid-cols-1 ${colClass} gap-6`}>
                {speakers.map((sp: any) => (
                  <div
                    key={sp.id}
                    className="p-5 rounded-3xl border border-slate-200/30 bg-slate-500/5 flex flex-col items-center text-center space-y-3 shadow-xs"
                  >
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center shadow-md">
                      {sp.avatarUrl ? (
                        <img src={sp.avatarUrl} alt={sp.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-slate-700">{sp.name.charAt(0)}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold leading-tight">{sp.name}</h3>
                    <p className="text-xs text-[#00b4fb] font-semibold leading-tight">
                      {sp.role} {sp.company ? `• ${sp.company}` : ""}
                    </p>
                    {sp.bio && <p className="text-[11px] opacity-70 line-clamp-3 leading-relaxed">{sp.bio}</p>}
                  </div>
                ))}
              </div>
            </section>
          );
        },
      },

      // 6. SCHEDULE SECTION
      ScheduleSection: {
        fields: {
          title: { type: "text", label: "Título" },
          subtitle: { type: "text", label: "Subtítulo" },
          session1Time: { type: "text", label: "Sessão 1 - Horário" },
          session1Title: { type: "text", label: "Sessão 1 - Título" },
          session1Speaker: { type: "text", label: "Sessão 1 - Orador" },
          session2Time: { type: "text", label: "Sessão 2 - Horário" },
          session2Title: { type: "text", label: "Sessão 2 - Título" },
          session2Speaker: { type: "text", label: "Sessão 2 - Orador" },
          session3Time: { type: "text", label: "Sessão 3 - Horário" },
          session3Title: { type: "text", label: "Sessão 3 - Título" },
          session3Speaker: { type: "text", label: "Sessão 3 - Orador" },
          session4Time: { type: "text", label: "Sessão 4 - Horário (Opcional)" },
          session4Title: { type: "text", label: "Sessão 4 - Título (Opcional)" },
          session4Speaker: { type: "text", label: "Sessão 4 - Orador (Opcional)" },
        },
        defaultProps: {
          title: "Agenda das Apresentações",
          subtitle: "Grade completa de horários",
          session1Time: "17:00",
          session1Title: "Abertura Oficial & Boas-Vindas",
          session1Speaker: "Apresentação Buysoft",
          session2Time: "17:20",
          session2Title: "Palestra Principal: Inovação e Resultados",
          session2Speaker: "Palestrante Convidado",
          session3Time: "17:50",
          session3Title: "Painel de Dúvidas ao Vivo",
          session3Speaker: "Todos os Oradores",
        },
        render: ({
          title,
          subtitle,
          session1Time,
          session1Title,
          session1Speaker,
          session2Time,
          session2Title,
          session2Speaker,
          session3Time,
          session3Title,
          session3Speaker,
          session4Time,
          session4Title,
          session4Speaker,
        }) => {
          const sessions = [
            { time: session1Time, title: session1Title, speaker: session1Speaker },
            { time: session2Time, title: session2Title, speaker: session2Speaker },
            { time: session3Time, title: session3Title, speaker: session3Speaker },
            ...(session4Time && session4Title
              ? [{ time: session4Time, title: session4Title, speaker: session4Speaker }]
              : []),
          ];

          return (
            <section id="schedule" className="max-w-4xl mx-auto px-6 py-14 border-t border-slate-200/20 space-y-8">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
              </div>

              <div className="space-y-3">
                {sessions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200/40 bg-slate-500/5 text-xs shadow-2xs"
                  >
                    <div className="rounded-xl bg-[#00b4fb]/15 text-[#00b4fb] px-3 py-1.5 font-mono font-bold shrink-0">
                      {s.time}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm leading-tight">{s.title}</h3>
                      <p className="text-xs opacity-70 mt-0.5">{s.speaker}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        },
      },

      // 7. SPONSORS SECTION
      SponsorsSection: {
        fields: {
          title: { type: "text", label: "Título" },
          tier: {
            type: "radio",
            label: "Tier de Destaque",
            options: [
              { label: "Ouro (Maior)", value: "gold" },
              { label: "Prata (Médio)", value: "silver" },
              { label: "Todos", value: "all" },
            ],
          },
          sponsorsText: { type: "text", label: "Nomes dos Patrocinadores (separados por vírgula)" },
        },
        defaultProps: {
          title: "Realização e Apoio Institucional",
          tier: "gold",
          sponsorsText: "Buysoft Events, CloudStream Pro, SmartChat AI, LeadPulse CRM",
        },
        render: ({ title, tier, sponsorsText }) => {
          const names = sponsorsText.split(",").map((s) => s.trim()).filter(Boolean);
          return (
            <section className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-200/20 text-center space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider opacity-60">{title}</h2>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                {names.map((sp, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border border-slate-200/40 bg-slate-500/5 font-bold text-xs shadow-2xs ${
                      tier === "gold" ? "px-8 py-3.5" : "px-5 py-2.5 opacity-80"
                    }`}
                  >
                    ✦ {sp}
                  </div>
                ))}
              </div>
            </section>
          );
        },
      },

      // 8. VIDEO SECTION
      VideoSection: {
        fields: {
          title: { type: "text", label: "Título" },
          subtitle: { type: "text", label: "Subtítulo" },
          videoUrl: { type: "text", label: "URL do Vídeo (YouTube embed ou MP4)" },
        },
        defaultProps: {
          title: "Assista ao Teaser Oficial",
          subtitle: "Uma prévia dos temas e discussões que preparamos para você",
          videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        },
        render: ({ title, subtitle, videoUrl }) => {
          return (
            <section className="max-w-4xl mx-auto px-6 py-14 border-t border-slate-200/20 text-center space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                {subtitle && <p className="text-xs opacity-70">{subtitle}</p>}
              </div>

              <div className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl flex items-center justify-center border border-slate-800">
                {videoUrl && videoUrl.includes("embed") ? (
                  <iframe
                    src={videoUrl}
                    title={title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="h-16 w-16 rounded-full bg-[#00b4fb] flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition">
                      <Play className="h-7 w-7 fill-white text-white ml-1" />
                    </div>
                    <span className="text-xs font-semibold opacity-90">Teaser do Evento</span>
                  </div>
                )}
              </div>
            </section>
          );
        },
      },

      // 9. CALL TO ACTION
      CallToAction: {
        fields: {
          title: { type: "text", label: "Título de Fechamento" },
          subtitle: { type: "textarea", label: "Texto de Chamada" },
          buttonText: { type: "text", label: "Texto do Botão" },
          accentColor: { type: "text", label: "Cor de Destaque" },
        },
        defaultProps: {
          title: "Garanta seu lugar antes que as vagas se esgotem",
          subtitle: "Evento exclusivo com transmissão ao vivo e materiais complementares para inscritos.",
          buttonText: "Inscreva-se Gratuitamente",
          accentColor: "#00b4fb",
        },
        render: ({ title, subtitle, buttonText, accentColor = "#00b4fb" }) => {
          return (
            <section className="max-w-4xl mx-auto px-6 py-16 border-t border-slate-200/20">
              <div
                className="rounded-3xl p-8 sm:p-12 text-center text-white space-y-4 shadow-2xl relative overflow-hidden"
                style={{ backgroundColor: "#0b121e" }}
              >
                <div
                  className="absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: accentColor }}
                />
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight relative z-10">{title}</h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto relative z-10 leading-relaxed">
                  {subtitle}
                </p>
                <div className="pt-2 relative z-10">
                  <button
                    type="button"
                    onClick={triggerCta}
                    className="rounded-xl px-8 py-3.5 text-xs font-bold text-white shadow-xl transition active:scale-95"
                    style={{ backgroundColor: accentColor }}
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            </section>
          );
        },
      },
    },
  };
}
