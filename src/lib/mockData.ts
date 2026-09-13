import { Organization, WebinarEvent } from "@/types";

export const initialOrganization: Organization = {
  id: "org_buysoft_1",
  name: "Buysoft Organization",
  email: "lielbritonunesbuysoft@gmail.com",
  about: "Líder em soluções digitais e eventos corporativos de alta performance.",
  website: "https://buysoft.com.br",
  twitter: "https://x.com/buysoft",
  linkedin: "https://linkedin.com/company/buysoft",
  facebook: "https://facebook.com/buysoft",
  planName: "Trial Ativo",
  members: [
    {
      id: "mem_1",
      name: "Eliel Nunes",
      email: "lielbritonunesbuysoft@gmail.com",
      role: "admin",
      avatarInitials: "EN",
    },
    {
      id: "mem_2",
      name: "Ana Souza",
      email: "ana.souza@buysoft.com.br",
      role: "member",
      avatarInitials: "AS",
    },
  ],
};

export const initialEvents: WebinarEvent[] = [
  {
    id: "evt_1",
    title: "Lançamento de Produtos Buysoft 2026",
    description: "<p>Conheça os novos recursos da plataforma, melhores práticas para engajar audiências e demonstrações ao vivo com nossos especialistas.</p>",
    startDate: "2026-10-12T17:00",
    endDate: "2026-10-12T18:00",
    timezone: "(GMT-03:00) Horário de Brasília",
    status: "published",
    registeredCount: 42,
    maxAttendees: 100,
    bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    speakers: [
      {
        id: "spk_1",
        name: "Eliel Nunes",
        email: "eliel@buysoft.com.br",
        role: "Head de Produto",
        company: "Buysoft",
        bio: "Especialista em produtos digitais e comunicação corporativa.",
      },
      {
        id: "spk_2",
        name: "Carlos Mendes",
        email: "carlos.mendes@tech.com",
        role: "Arquiteto de Soluções",
        company: "Tech Lead",
        bio: "Engenheiro sênior com foco em transmissões em tempo real.",
      }
    ],
    formFields: [
      { id: "f_1", label: "Nome completo", type: "text", required: true },
      { id: "f_2", label: "Seu melhor e-mail", type: "text", required: true },
      { id: "f_3", label: "Empresa", type: "text", required: true },
      { id: "f_4", label: "Cargo", type: "text", required: false },
    ],
    settings: {
      chatEnabled: true,
      qaEnabled: true,
      pollsEnabled: true,
      attendeeListVisible: true,
      autoRecord: true,
      primaryColor: "#00b4fb",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
    },
    createdAt: "2026-09-12",
  },
  {
    id: "evt_2",
    title: "Workshop de Integração e Vendas B2B",
    description: "<p>Aprenda como estruturar um funil de vendas corporativo utilizando webinars para atrair e converter clientes qualificados.</p>",
    startDate: "2026-10-25T14:00",
    endDate: "2026-10-25T15:30",
    timezone: "(GMT-03:00) Horário de Brasília",
    status: "draft",
    registeredCount: 0,
    maxAttendees: 100,
    speakers: [],
    formFields: [
      { id: "f_1", label: "Nome completo", type: "text", required: true },
      { id: "f_2", label: "E-mail corporativo", type: "text", required: true },
    ],
    settings: {
      chatEnabled: true,
      qaEnabled: true,
      pollsEnabled: true,
      attendeeListVisible: false,
      autoRecord: true,
      primaryColor: "#00b4fb",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
    },
    createdAt: "2026-09-10",
  }
];
