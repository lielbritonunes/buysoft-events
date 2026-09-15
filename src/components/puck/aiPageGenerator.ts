import { Data } from "@measured/puck";

export interface GeneratePageOptions {
  event: any;
  style?: "tecnologico" | "corporativo" | "minimalista" | "show";
  prompt?: string;
}

export function generateAIPuckPage({
  event,
  style = "tecnologico",
  prompt,
}: GeneratePageOptions): Data {
  const title = event?.title || "Buysoft Events 2026";
  const desc =
    event?.description ||
    "Uma experiência imersiva e inovadora com palestras exclusivas dos maiores especialistas do mercado.";
  const dateStr = event?.startDate
    ? new Date(event.startDate).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Data e horário a serem confirmados";

  // Customize based on style
  let heroTheme: "seldon" | "crosby" | "hazel" | "nolan" = "seldon";
  let heroBg =
    event?.bannerUrl ||
    "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80";
  let ctaText = "Garantir Minha Vaga Gratuita";

  let pillar1 = {
    title: "Keynotes Exclusivos",
    text: "Apresentações com líderes e especialistas compartilhando tendências práticas e cases reais.",
  };
  let pillar2 = {
    title: "Networking Interativo",
    text: "Conecte-se com outros profissionais através do chat ao vivo e salas temáticas.",
  };
  let pillar3 = {
    title: "Q&A com Palestrantes",
    text: "Envie suas dúvidas ao vivo e participe ativamente das discussões em tempo real.",
  };

  if (style === "corporativo") {
    heroTheme = "nolan";
    heroBg =
      event?.bannerUrl ||
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80";
    ctaText = "Solicitar Credencial Executiva";
    pillar1 = {
      title: "Visão Estratégica",
      text: "Diagnósticos e projeções para tomada de decisão em mercados altamente competitivos.",
    };
    pillar2 = {
      title: "Mesa Redonda C-Level",
      text: "Debates focados em governança, eficiência operacional e novos modelos de negócios.",
    };
    pillar3 = {
      title: "Benchmarking Direto",
      text: "Acesso a dados e práticas validadas por organizações de referência.",
    };
  } else if (style === "minimalista") {
    heroTheme = "crosby";
    heroBg =
      event?.bannerUrl ||
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";
    ctaText = "Inscrever-se no Workshop";
    pillar1 = {
      title: "Conteúdo Direto ao Ponto",
      text: "Metodologias práticas sem rodeios, prontas para aplicação imediata no seu dia a dia.",
    };
    pillar2 = {
      title: "Material Didático Incluso",
      text: "Apostila digital e resumos dos tópicos abordados entregues após o encerramento.",
    };
    pillar3 = {
      title: "Certificado de Participação",
      text: "Comprovante digital emitido para todos os participantes confirmados.",
    };
  } else if (style === "show") {
    heroTheme = "hazel";
    heroBg =
      event?.bannerUrl ||
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80";
    ctaText = "Garantir Ingresso";
  }

  // Build the complete Puck layout
  return {
    root: { props: { title: title } },
    content: [
      {
        type: "Navbar",
        props: {
          id: "nav_" + Date.now(),
          brandText: title,
          logoUrl: event?.logoUrl || "",
          showLinks: true,
          link1: "Início",
          link2: "Sobre",
          link3: "Oradores",
          link4: "Programação",
          ctaText: "Inscreva-se",
          themeStyle: heroTheme === "seldon" || heroTheme === "nolan" ? "dark" : "light",
        },
      },
      {
        type: "HeroSection",
        props: {
          id: "hero_" + Date.now(),
          headline: title,
          subtitle: desc,
          dateText: `${dateStr} (Horário de Brasília)`,
          ctaText: ctaText,
          imageUrl: heroBg,
          themeStyle: heroTheme,
          overlayOpacity: 75,
        },
      },
      {
        type: "AboutSection",
        props: {
          id: "about_" + Date.now(),
          title: "Por que participar deste evento?",
          subtitle: "Uma imersão completa desenhada para impulsionar seus resultados",
          content: `${desc}\n\nPreparamos uma jornada prática com palestras dinâmicas, demonstrações ao vivo e espaço aberto para perguntas com os maiores nomes da área.`,
          layout: "two_column",
        },
      },
      {
        type: "FeaturesGrid",
        props: {
          id: "feat_" + Date.now(),
          title: "Diferenciais do Encontro",
          item1Title: pillar1.title,
          item1Text: pillar1.text,
          item2Title: pillar2.title,
          item2Text: pillar2.text,
          item3Title: pillar3.title,
          item3Text: pillar3.text,
        },
      },
      {
        type: "SpeakersSection",
        props: {
          id: "spk_" + Date.now(),
          title: "Palestrantes Confirmados",
          subtitle: "Especialistas que compartilharão seus conhecimentos",
          columns: "3",
          syncWithEvent: true,
        },
      },
      {
        type: "ScheduleSection",
        props: {
          id: "sch_" + Date.now(),
          title: "Programação Oficial",
          subtitle: "Confira a grade horária das transmissões",
          session1Time: "17:00",
          session1Title: "Abertura & Boas-Vindas",
          session1Speaker: "Apresentação Buysoft",
          session2Time: "17:20",
          session2Title: "Palestra Principal: Transformação e Resultados",
          session2Speaker: "Orador Convidado",
          session3Time: "17:50",
          session3Title: "Painel de Dúvidas e Respostas ao Vivo",
          session3Speaker: "Todos os Especialistas",
          session4Time: "18:15",
          session4Title: "Considerações Finais & Sorteio",
          session4Speaker: "Equipe Organizadora",
        },
      },
      {
        type: "SponsorsSection",
        props: {
          id: "spon_" + Date.now(),
          title: "Apoio e Realização",
          tier: "gold",
          sponsorsText: "Buysoft, TechLead, CloudStream, LeadPulse",
        },
      },
      {
        type: "CallToAction",
        props: {
          id: "cta_" + Date.now(),
          title: "Garanta seu lugar antes que as vagas esgotem",
          subtitle: "A transmissão será exclusiva para inscritos confirmados.",
          buttonText: ctaText,
          accentColor: "#00b4fb",
        },
      },
    ],
  };
}
