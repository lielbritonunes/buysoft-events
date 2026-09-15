export interface PageBlock {
  id: string;
  type: string;
  category: "title" | "sections" | "sponsors" | "speakers" | "expo" | "schedule" | "media";
  title: string;
  subtitle?: string;
  content?: string;
  dateText?: string;
  ctaText?: string;
  imageUrl?: string;
  logoUrl?: string;
  badge?: string;
  isSynced?: boolean;
  extraData?: Record<string, any>;
}

export interface ThemeConfig {
  id: "crosby" | "seldon" | "hazel" | "nolan";
  name: string;
  description: string;
  previewImg: string;
  categoryTags: string;
  defaultBgColor: string;
  defaultTextColor: string;
  defaultPrimaryColor: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: "crosby",
    name: "Crosby",
    description: "University Events, Job Fairs, Expos/Tradeshows, Workshops",
    previewImg: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    categoryTags: "University Events, Job Fairs, Expos/Tradeshows, Workshops",
    defaultBgColor: "#ffffff",
    defaultTextColor: "#0f172a",
    defaultPrimaryColor: "#00b4fb",
  },
  {
    id: "seldon",
    name: "Seldon",
    description: "Webinars, Meetups",
    previewImg: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    categoryTags: "Webinars, Meetups",
    defaultBgColor: "#090d16",
    defaultTextColor: "#ffffff",
    defaultPrimaryColor: "#00b4fb",
  },
  {
    id: "hazel",
    name: "Hazel",
    description: "Internal Events, University Events, Webinars, Workshops",
    previewImg: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    categoryTags: "Internal Events, University Events, Webinars, Workshops",
    defaultBgColor: "#fafafa",
    defaultTextColor: "#18181b",
    defaultPrimaryColor: "#00b4fb",
  },
  {
    id: "nolan",
    name: "Nolan",
    description: "Conferences, Summits, Multi-day events",
    previewImg: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    categoryTags: "Conferences, Summits, Multi-day events",
    defaultBgColor: "#06141d",
    defaultTextColor: "#f8fafc",
    defaultPrimaryColor: "#00b4fb",
  },
];

export interface BlockTemplateItem {
  id: string;
  type: string;
  category: "title" | "sections" | "sponsors" | "speakers" | "expo" | "schedule" | "media";
  label: string;
  badge?: string;
  isSynced?: boolean;
  previewThumbnail: string;
  description: string;
  createDefaultBlock: (event: any, theme: string) => PageBlock;
}

export const BLOCK_TEMPLATES: BlockTemplateItem[] = [
  // --- TÍTULO ---
  {
    id: "standalone_nav",
    type: "standalone_nav",
    category: "title",
    label: "Navegação autônoma",
    previewThumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=70",
    description: "Barra superior com logo, links âncora para as seções e botão de inscrição.",
    createDefaultBlock: (event) => ({
      id: "block_nav_" + Date.now(),
      type: "standalone_nav",
      category: "title",
      title: event?.title || "Buysoft Events",
      ctaText: "Tickets",
      extraData: {
        links: [
          { label: "Home", target: "#home" },
          { label: "About", target: "#about" },
          { label: "Synced Speakers", target: "#speakers" },
          { label: "Synced Schedule", target: "#schedule" },
        ],
      },
    }),
  },
  {
    id: "hero_opt1",
    type: "hero_opt1",
    category: "title",
    label: "Opção de título nº 1 (Maxi Cover)",
    previewThumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=70",
    description: "Capa cinematográfica de tela cheia com overlay escuro, logo central, título hero e data.",
    createDefaultBlock: (event) => ({
      id: "block_hero1_" + Date.now(),
      type: "hero_opt1",
      category: "title",
      title: event?.title || "The future of everything",
      subtitle:
        event?.description ||
        "Get ready for five days of disruptive ideas and ground-breaking insights as we bring together the most revolutionary minds.",
      dateText: "Oct 14, 9:00AM - 10:00AM UTC",
      ctaText: "Register",
      imageUrl:
        event?.bannerUrl ||
        "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
    }),
  },
  {
    id: "hero_opt2",
    type: "hero_opt2",
    category: "title",
    label: "Opção de título nº 2 (Split Colunas)",
    previewThumbnail: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=400&q=70",
    description: "Layout moderno dividido: chamada de impacto à esquerda e visual gráfico à direita.",
    createDefaultBlock: (event) => ({
      id: "block_hero2_" + Date.now(),
      type: "hero_opt2",
      category: "title",
      title: event?.title || "The future of everything",
      subtitle:
        event?.description ||
        "Get ready for three days of disruptive ideas as we explore what our world will look like fifty years from now.",
      dateText: "26th - 28th September",
      ctaText: "Register",
      imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
    }),
  },
  {
    id: "hero_opt3",
    type: "hero_opt3",
    category: "title",
    label: "Opção de título nº 3 (Minimalist Clean)",
    previewThumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=70",
    description: "Tipografia limpa e elegante em fundo claro, foco direto na mensagem do evento.",
    createDefaultBlock: (event) => ({
      id: "block_hero3_" + Date.now(),
      type: "hero_opt3",
      category: "title",
      title: event?.title || "The future of everything",
      subtitle:
        "Join leaders from across the globe in this exclusive executive briefing.",
      dateText: "Online • 17:00 Horário de Brasília",
      ctaText: "Inscreva-se Gratuitamente",
    }),
  },

  // --- SEÇÕES ---
  {
    id: "rich_text",
    type: "rich_text",
    category: "sections",
    label: "Editor de Rich Text",
    previewThumbnail: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=70",
    description: "Bloco de texto corrido ideal para manifesto, história do evento ou regulamento.",
    createDefaultBlock: () => ({
      id: "block_rich_" + Date.now(),
      type: "rich_text",
      category: "sections",
      title: "Sobre o Evento",
      content:
        "Uma experiência imersiva reunindo os maiores especialistas em tecnologia, liderança e inovação corporativa. Durante as sessões, discutiremos os novos paradigmas do mercado digital, ferramentas disruptivas e estratégias práticas para alavancar seus resultados no próximo ciclo.",
    }),
  },
  {
    id: "two_col_text",
    type: "two_col_text",
    category: "sections",
    label: "Título e texto em duas colunas",
    previewThumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=70",
    description: "Título impactante na coluna esquerda e parágrafos detalhados na coluna direita.",
    createDefaultBlock: () => ({
      id: "block_twocol_" + Date.now(),
      type: "two_col_text",
      category: "sections",
      title: "About The Festival",
      subtitle: "Three days of intense discovery",
      content:
        "We believe that the future belongs to those who dare to question existing paradigms. This summit was designed from the ground up to connect visionaries, practitioners and thought-leaders in an open, highly interactive environment.",
    }),
  },
  {
    id: "three_col_text",
    type: "three_col_text",
    category: "sections",
    label: "Título, descrição em três colunas",
    previewThumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=70",
    description: "Três colunas com destaques rápidos, diferenciais ou pilares do evento.",
    createDefaultBlock: () => ({
      id: "block_threecol_" + Date.now(),
      type: "three_col_text",
      category: "sections",
      title: "Look forward to...",
      extraData: {
        items: [
          {
            title: "Hands-on Masterclasses",
            text: "Workshops práticos com acesso direto aos oradores e materiais complementares exclusivos.",
          },
          {
            title: "Executive Networking",
            text: "Salas de bate-papo segmentadas e rodadas de negócios virtuais durante os intervalos.",
          },
          {
            title: "Live Q&A Sessions",
            text: "Envie suas perguntas e vote nas melhores dúvidas em tempo real pelo painel interativo.",
          },
        ],
      },
    }),
  },
  {
    id: "image_text_two_col",
    type: "image_text_two_col",
    category: "sections",
    label: "Imagem e texto em duas colunas",
    previewThumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=70",
    description: "Apresentação com foto ilustrativa de um lado e texto explicativo do outro.",
    createDefaultBlock: () => ({
      id: "block_imgtext_" + Date.now(),
      type: "image_text_two_col",
      category: "sections",
      title: "Ambiente Virtual de Alta Definição",
      subtitle: "Transmissão sem engasgos com latência ultrabaixa",
      content:
        "Nossa infraestrutura WebRTC com aceleração em nuvem garante que você assista a cada detalhe com qualidade cristalina de áudio e vídeo, diretamente do seu navegador sem necessidade de instalar aplicativos.",
      imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    }),
  },

  // --- PATROCINADORES ---
  {
    id: "sponsors_gold",
    type: "sponsors_gold",
    category: "sponsors",
    label: "Patrocinadores Sincronizados - Golden",
    badge: "Synced",
    isSynced: true,
    previewThumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=70",
    description: "Grade de destaque para patrocinadores principais (Tier Ouro / Master).",
    createDefaultBlock: () => ({
      id: "block_sponsors_gold_" + Date.now(),
      type: "sponsors_gold",
      category: "sponsors",
      title: "Patrocinadores Master",
      isSynced: true,
      extraData: {
        tier: "gold",
        sponsors: [
          { name: "Opentech", logo: "" },
          { name: "Globex", logo: "" },
          { name: "Keyspace", logo: "" },
        ],
      },
    }),
  },
  {
    id: "sponsors_silver",
    type: "sponsors_silver",
    category: "sponsors",
    label: "Patrocinadores Sincronizados - Silver",
    badge: "Synced",
    isSynced: true,
    previewThumbnail: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=400&q=70",
    description: "Grade de apoio e patrocinadores institucionais.",
    createDefaultBlock: () => ({
      id: "block_sponsors_silver_" + Date.now(),
      type: "sponsors_silver",
      category: "sponsors",
      title: "Apoiadores Institucionais",
      isSynced: true,
      extraData: {
        tier: "silver",
        sponsors: [
          { name: "Coursera", logo: "" },
          { name: "Kakao", logo: "" },
          { name: "OneSky", logo: "" },
          { name: "Fastly", logo: "" },
        ],
      },
    }),
  },

  // --- ORADORES ---
  {
    id: "speakers_grid",
    type: "speakers_grid",
    category: "speakers",
    label: "Oradores Sincronizados - Grade",
    badge: "Synced",
    isSynced: true,
    previewThumbnail: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=400&q=70",
    description: "Sincroniza automaticamente com os oradores cadastrados no evento.",
    createDefaultBlock: (event) => ({
      id: "block_speakers_" + Date.now(),
      type: "speakers_grid",
      category: "speakers",
      title: "Synced Speakers",
      subtitle: "Conheça os especialistas que liderarão as apresentações",
      isSynced: true,
    }),
  },
  {
    id: "speakers_keynote",
    type: "speakers_keynote",
    category: "speakers",
    label: "Destaque do Keynote Speaker",
    previewThumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=70",
    description: "Card em destaque com foto ampliada, citação e biografia do palestrante principal.",
    createDefaultBlock: () => ({
      id: "block_keynote_" + Date.now(),
      type: "speakers_keynote",
      category: "speakers",
      title: "Palestrante Especial Convidado",
      content:
        "“A transformação digital não é sobre tecnologia, é sobre como capacitamos pessoas a resolver problemas complexos com agilidade e clareza.”",
      extraData: {
        name: "Dra. Helena Brandão",
        role: "Chief Innovation Officer & Futurista",
        company: "Global Vanguard",
        avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=500&q=80",
      },
    }),
  },

  // --- CRONOGRAMA ---
  {
    id: "schedule_timeline",
    type: "schedule_timeline",
    category: "schedule",
    label: "Cronograma Sincronizado - Agenda",
    badge: "Synced",
    isSynced: true,
    previewThumbnail: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=400&q=70",
    description: "Linha do tempo com as faixas de horário e sessões programadas.",
    createDefaultBlock: () => ({
      id: "block_schedule_" + Date.now(),
      type: "schedule_timeline",
      category: "schedule",
      title: "Synced Schedule",
      subtitle: "Confira a programação completa das palestras",
      isSynced: true,
      extraData: {
        items: [
          { time: "17:00", title: "Abertura Oficial & Boas-Vindas", speaker: "Head de Produto Buysoft" },
          { time: "17:20", title: "Novos Paradigmas de Engajamento Interativo", speaker: "Carlos Mendes" },
          { time: "17:45", title: "Sessão de Perguntas e Respostas ao Vivo", speaker: "Painel com Todos os Oradores" },
          { time: "18:00", title: "Encerramento e Próximos Passos", speaker: "Equipe Buysoft Events" },
        ],
      },
    }),
  },

  // --- EXPOSIÇÃO ---
  {
    id: "expo_booths",
    type: "expo_booths",
    category: "expo",
    label: "Estandes Virtuais e Expositores",
    previewThumbnail: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=70",
    description: "Vitrine de expositores com links diretos para salas de demonstração.",
    createDefaultBlock: () => ({
      id: "block_expo_" + Date.now(),
      type: "expo_booths",
      category: "expo",
      title: "Exposição & Feira de Soluções",
      subtitle: "Visite os estandes dos nossos parceiros e solicite demonstrações",
      extraData: {
        booths: [
          { name: "CloudStream Pro", desc: "Infraestrutura de vídeo para alta audiência.", tags: ["Streaming", "Cloud"] },
          { name: "SmartChat AI", desc: "Moderação automatizada e tradução em tempo real.", tags: ["IA", "Engajamento"] },
          { name: "LeadPulse CRM", desc: "Captura e qualificação imediata de inscritos.", tags: ["Vendas", "Automação"] },
        ],
      },
    }),
  },

  // --- MÍDIA ---
  {
    id: "media_video",
    type: "media_video",
    category: "media",
    label: "Player de Vídeo Teaser / Institucional",
    previewThumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=400&q=70",
    description: "Player de vídeo embutido com teaser ou chamada dos oradores.",
    createDefaultBlock: () => ({
      id: "block_video_" + Date.now(),
      type: "media_video",
      category: "media",
      title: "Veja o que espera por você",
      subtitle: "Assista ao teaser oficial da edição 2026",
      extraData: {
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      },
    }),
  },
];

export function getDefaultBlocksForTheme(theme: string, event: any): PageBlock[] {
  switch (theme) {
    case "seldon":
      return [
        {
          id: "seldon_nav",
          type: "standalone_nav",
          category: "title",
          title: event?.title || "Buysoft Events",
          ctaText: "Tickets",
          extraData: {
            links: [
              { label: "Home", target: "#home" },
              { label: "About", target: "#about" },
              { label: "Synced Speakers", target: "#speakers" },
              { label: "Synced Schedule", target: "#schedule" },
            ],
          },
        },
        {
          id: "seldon_hero",
          type: "hero_opt1",
          category: "title",
          title: event?.title || "The future of everything",
          subtitle:
            event?.description ||
            "Get ready for five days of disruptive ideas and ground-breaking insights as we bring together the most revolutionary minds.",
          dateText: "Oct 14, 9:00AM - 10:00AM UTC",
          ctaText: "Register",
          imageUrl:
            event?.bannerUrl ||
            "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
        },
        {
          id: "seldon_about",
          type: "rich_text",
          category: "sections",
          title: "About Details",
          content:
            "IMPOSTER SYNDROME IS THE INABILITY TO ACCEPT ONES OWN ACCOMPLISHMENT AND THE CONSTANT FEAR OF BEING EXPOSED AS A FRAUD.",
        },
        {
          id: "seldon_speakers",
          type: "speakers_grid",
          category: "speakers",
          title: "Synced Speakers",
          subtitle: "Palestrantes convidados",
          isSynced: true,
        },
        {
          id: "seldon_schedule",
          type: "schedule_timeline",
          category: "schedule",
          title: "Synced Schedule",
          subtitle: "Agenda das transmissões",
          isSynced: true,
        },
      ];

    case "hazel":
      return [
        {
          id: "hazel_nav",
          type: "standalone_nav",
          category: "title",
          title: event?.title || "Buysoft Events",
          ctaText: "Inscreva-se",
        },
        {
          id: "hazel_hero",
          type: "hero_opt2",
          category: "title",
          title: event?.title || "The future of everything",
          subtitle:
            event?.description ||
            "Get ready for three days of disruptive ideas as we explore what our world will look like fifty years from now.",
          dateText: "26th - 28th September",
          ctaText: "Register",
          imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        },
        {
          id: "hazel_features",
          type: "three_col_text",
          category: "sections",
          title: "Pilares do Encontro",
        },
        {
          id: "hazel_speakers",
          type: "speakers_grid",
          category: "speakers",
          title: "Synced Speakers",
          isSynced: true,
        },
      ];

    case "nolan":
      return [
        {
          id: "nolan_nav",
          type: "standalone_nav",
          category: "title",
          title: event?.title || "Buysoft Events",
          ctaText: "Garantir Ingresso",
        },
        {
          id: "nolan_hero",
          type: "hero_opt1",
          category: "title",
          title: event?.title || "The future of everything",
          subtitle:
            event?.description ||
            "Conferences, Summits, Multi-day events. Connect with industry leaders.",
          dateText: "26th - 28th • September 2026",
          ctaText: "Register",
          imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
        },
        {
          id: "nolan_details",
          type: "two_col_text",
          category: "sections",
          title: "Summit Overview",
          subtitle: "Exclusive leadership gathering",
          content:
            "A high-level assembly designed for decision-makers and key stakeholders to deliberate on emerging market trajectories.",
        },
        {
          id: "nolan_speakers",
          type: "speakers_grid",
          category: "speakers",
          title: "Synced Speakers",
          isSynced: true,
        },
        {
          id: "nolan_sponsors",
          type: "sponsors_gold",
          category: "sponsors",
          title: "Synced Sponsors",
          isSynced: true,
        },
      ];

    case "crosby":
    default:
      return [
        {
          id: "crosby_nav",
          type: "standalone_nav",
          category: "title",
          title: event?.title || "Buysoft Events",
          ctaText: "Tickets",
        },
        {
          id: "crosby_hero",
          type: "hero_opt3",
          category: "title",
          title: event?.title || "The future of everything",
          subtitle:
            event?.description ||
            "Get ready for three days of disruptive ideas and ground-breaking insights as we bring together the most revolutionary minds.",
          dateText: "26th - 27th - 28th September",
          ctaText: "Register",
        },
        {
          id: "crosby_about",
          type: "two_col_text",
          category: "sections",
          title: "About Details",
          content:
            "An open forum for innovators, researchers, and builders shaping tomorrow.",
        },
        {
          id: "crosby_speakers",
          type: "speakers_grid",
          category: "speakers",
          title: "Synced Speakers",
          isSynced: true,
        },
        {
          id: "crosby_sponsors",
          type: "sponsors_gold",
          category: "sponsors",
          title: "Patrocinadores Oficiais",
          isSynced: true,
        },
      ];
  }
}
