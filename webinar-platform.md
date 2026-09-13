# Plano de Implementação: Plataforma de Webinars (RingCentral Events Style)

> **Documento:** `webinar-platform.md`  
> **Tipo de Projeto:** WEB (Full-Stack Next.js SaaS)  
> **Status:** Planejamento Aprovado para Solução & Execução  
> **Data:** 12/09/2026  

---

## 1. Visão Geral do Projeto

Construção de uma plataforma corporativa completa para criação, transmissão e gestão de webinars no formato B2B SaaS, inspirada no **RingCentral Events**. A plataforma é projetada para ser 100% amigável e transparente: organizadores e palestrantes transmitem diretamente pelo navegador, sem necessidade de softwares externos (como OBS) ou configurações complexas.

### Público-Alvo & Casos de Uso
- **Empresas & Startups:** Geração de leads, demonstrações de produtos e eventos de autoridade.
- **Palestrantes (Speakers):** Entrada simplificada em um camarim virtual (Backstage) para testes antes da transmissão.
- **Participantes:** Inscrição rápida e acesso direto via link seguro (Magic Link), sem fricção de senhas.

---

## 2. Critérios de Sucesso (Success Criteria)

- [ ] **Multi-tenancy Corporativo:** Organização com logo, identidade visual, membros de equipe e permissões.
- [ ] **Wizard de Criação de Evento:** Criação rápida com nome, datas, fuso horário e descrição (100% focado em Webinars).
- [ ] **Landing Page & Inscrição Dinâmica:** Layout clássico/avançado com formulário customizável e botões de adicionar ao calendário (Google/Outlook).
- [ ] **Lobby & Pre-flight Check:** Teste de câmera, microfone com barra de áudio em tempo real antes de entrar no evento.
- [ ] **Palco & Backstage Nativo no Navegador:** Áudio, vídeo e compartilhamento de tela com transição suave entre bastidores e transmissão ao vivo (WebRTC puro para até 100 espectadores).
- [ ] **Engajamento em Tempo Real:** Chat com moderação, P&R (Q&A) com upvote, enquetes dinâmicas e reações.
- [ ] **Live CTA (Conversão ao Vivo):** Disparo de banner interativo pelo host para agendamento de reuniões ou ofertas durante o webinar.
- [ ] **Automação de E-mails:** Disparo automático (inscrição, 24h antes, 1h antes, pós-evento com pesquisa).
- [ ] **Página de Replay Automático:** Conversão pós-evento para capturar leads contínuos sob demanda.
- [ ] **Dashboard de Análises & Leads:** Métricas de presença, retenção, cliques no CTA, exportação de CSV e construtor de pesquisas de satisfação.
- [ ] **Área de Gravações:** Disponibilização e download das gravações.

---

## 3. Arquitetura & Stack Tecnológica

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Framework Web** | **Next.js 15 (App Router, React 19, TypeScript)** | Performance de ponta, SSR para páginas de inscrição (SEO e velocidade) e SPA fluido para o painel e palco. |
| **Estilização & UI** | **Tailwind CSS + Radix UI (estilo shadcn/ui) + Lucide Icons** | Design system moderno, acessível, minimalista e de nível corporativo. |
| **Banco de Dados** | **PostgreSQL (via Prisma ORM)** | Estrutura relacional sólida para organizações, eventos, inscrições dinâmicas e relatórios. |
| **Vídeo & Transmissão** | **LiveKit (WebRTC / Cloud SDK)** | Zero configuração para o usuário final: roda 100% no navegador, latência ultrabaixa (<300ms) e divisão nativa de Palco vs. Backstage. |
| **Real-time & Chat** | **LiveKit Data Channels + WebSockets** | Sincronização em tempo real de mensagens de chat, perguntas, votos e enquetes sem sobrecarga no servidor. |
| **E-mails Transacionais** | **Resend / React Email** | Templates bonitos em HTML com entrega confiável e agendamento automático de lembretes. |

---

## 4. Estrutura de Diretórios Planejada

```
d:/Antigravity/
├── .agents/                      # Kit de agentes, regras e automações
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Login, Cadastro, Recuperação de Senha
│   │   ├── (dashboard)/          # Área administrativa da Organização
│   │   │   ├── events/           # Listagem e Criação de Eventos
│   │   │   ├── events/[id]/      # Área de Gestão do Evento (Abas)
│   │   │   │   ├── overview/     # Visão Geral & Links de Convite
│   │   │   │   ├── registration/ # Landing Page & Campos do Formulário
│   │   │   │   ├── settings/     # Básico, Branding, Palco, Speakers
│   │   │   │   ├── marketing/    # Automação de E-mails
│   │   │   │   ├── analytics/    # Métricas, CSV & Pesquisa de Satisfação
│   │   │   │   └── recordings/   # Gravações disponíveis
│   │   │   ├── team/             # Usuários & Níveis de Permissão
│   │   │   └── settings/         # Organização, Idioma, Logo, SMTP
│   │   ├── (public)/             # Páginas Públicas
│   │   │   └── e/[slug]/         # Landing page de Inscrição do Evento
│   │   └── (stage)/              # Ambiente de Transmissão Ao Vivo
│   │       ├── live/[id]/        # Palco Principal (Espectador)
│   │       └── studio/[id]/      # Estúdio do Organizador & Backstage dos Speakers
│   ├── components/               # Componentes Modulares de UI
│   │   ├── common/               # Botões, Modais, Inputs, Cards
│   │   ├── studio/               # Grid de Vídeos, Controles de Câmera/Mic, Compartilhamento
│   │   ├── engagement/           # Chat, Q&A, Polls, Reações flutuantes
│   │   └── landing-builder/      # Construtor visual de Landing Page & Formulários
│   ├── lib/                      # Utilitários, Prisma Client, LiveKit Helpers
│   └── types/                    # Definições TypeScript
├── prisma/
│   └── schema.prisma             # Modelo de Dados Relacional
└── package.json
```

---

## 5. Plano de Tarefas (Task Breakdown)

### Fase 1: Fundação & Multi-tenancy (P0)
- **TASK-01: Setup do Projeto & Design System**
  - **Agente:** `frontend-specialist` | **Skill:** `clean-code`, `frontend-design`
  - **INPUT:** Inicialização Next.js 15, Tailwind, componentes base Radix/Lucide.
  - **OUTPUT:** Layout base funcional, tema corporativo e navegação principal.
  - **VERIFY:** Build sem erros e renderização da casca do dashboard.

- **TASK-02: Modelagem do Banco de Dados Multi-tenant**
  - **Agente:** `backend-specialist` | **Skill:** `database-design`
  - **INPUT:** Especificação de Organização, Membros, Evento, Inscrição, Palestrantes, Enquetes.
  - **OUTPUT:** Arquivo `schema.prisma` completo e migrations geradas.
  - **VERIFY:** Migrations aplicadas com sucesso no PostgreSQL/SQLite de desenvolvimento.

### Fase 2: Gestão do Evento & Abas de Configuração (P1)
- **TASK-03: Wizard de Criação & Aba Visão Geral**
  - **Agente:** `frontend-specialist` | **Skill:** `app-builder`
  - **INPUT:** Modal de criação (Nome, Datas, Fuso, Descrição) + Tela com links mágicos (público vs speaker).
  - **OUTPUT:** Fluxo de criação e página inicial da gestão do evento.
  - **VERIFY:** Criação de evento persistida no banco e links exclusivos gerados.

- **TASK-04: Aba Inscrições (Landing Page + Construtor de Formulário)**
  - **Agente:** `frontend-specialist` | **Skill:** `frontend-architecture`
  - **INPUT:** Seletor de layout (Clássico vs Avançado) + Editor de campos do formulário (Básicos e Avançados).
  - **OUTPUT:** Landing page pública dinâmica `/e/[slug]` consumindo a configuração salva.
  - **VERIFY:** Participante preenche formulário customizado e recebe confirmação.

- **TASK-05: Aba Configuração (Básico, Branding, Palco, Speakers)**
  - **Agente:** `frontend-specialist` + `backend-specialist` | **Skill:** `api-patterns`
  - **INPUT:** Telas para ativar/desativar chat/Q&A, cores/logo, upload de materiais e cadastro de palestrantes.
  - **OUTPUT:** Painéis de configuração totalmente conectados com preview em tempo real.
  - **VERIFY:** Alteração de cor/logo refletida instantaneamente na landing page e palco.

### Fase 3: Transmissão, Palco & Backstage (P0 - O Coração) - [CONCLUÍDA ✓]
- **TASK-06: Estúdio de Transmissão (Backstage & Live Stage) [CONCLUÍDO]**
  - **Agente:** `frontend-specialist` | **Skill:** `frontend-design`, `clean-code`
  - **Implementado:** Pré-flight Lobby (`PreflightLobby.tsx`) com testador de microfone por Web Audio API e preview de câmera; Estúdio (`/studio/[id]`) com alternador de Palco/Backstage, captura de tela nativa, transmissão WebRTC, e disparador de Live CTA; e Sala do Participante (`/live/[id]`) com modo teatro, tela cheia, som e modo replay pós-evento.
  - **VERIFY:** HTTP 200 verificado e compilado sem erros no Next.js App Router.

- **TASK-07: Painel de Engajamento ao Vivo (Chat, Q&A, Polls, Live CTA, Reactions) [CONCLUÍDO]**
  - **Agente:** `frontend-specialist` | **Skill:** `frontend-architecture`
  - **Implementado:** Sidebar de Engajamento (`LiveEngagementSidebar.tsx`) com moderação de chat, perguntas com upvote e status "respondida", enquetes interativas com distribuição percentual em tempo real, banner de conversão `LiveCtaBanner.tsx`, e partículas animadas de reações `FloatingReactions.tsx` (👏, ❤️, 🔥, 💡, 🚀).
  - **VERIFY:** Persistência em SQLite via Prisma (`ChatMessage`, `Question`, `Poll`, `PollVote`, `LiveCta`) e sincronização periódica a cada 2.5s.

### Fase 4: Marketing, Pós-Evento & Analytics (P1) - [CONCLUÍDA ✓]
- **TASK-08: Automação de E-mails & Lembretes [CONCLUÍDO]**
  - **Agente:** `backend-specialist` + `frontend-specialist` | **Skill:** `api-patterns`
  - **Implementado:** Componente `MarketingTab.tsx` com 4 gatilhos essenciais (Confirmação Imediata, Lembrete 24h, Lembrete 1h, Pós-Evento/Replay), modal de preview fiel com visual corporativo Buysoft Events, editor de assunto, métricas de abertura (open rate) e cliques (CTR), e disparador simulado de e-mail de teste.
  - **VERIFY:** Alternância de status ativo/pausado e envio de teste sem falhas.

- **TASK-09: Análises, Pesquisa de Satisfação & Exportação CSV [CONCLUÍDO]**
  - **Agente:** `frontend-specialist` + `backend-specialist` | **Skill:** `database-design`
  - **Implementado:** Componente `AnalyticsTab.tsx` com KPIs executivos (Inscritos Totais, Comparecimento Estimado, Interações na Sala, Satisfação com nota 4.9/5 estrelas), tabela de participantes com busca em tempo real e visualizador de respostas de campos dinâmicos, e exportação direta em CSV com codificação UTF-8 BOM (`\uFEFF`) para compatibilidade perfeita com Microsoft Excel em português.
  - **VERIFY:** Arquivo `.csv` gerado e estruturado contendo todos os dados dos inscritos e link mágico.

- **TASK-10: Gravações & Replay Contínuo [CONCLUÍDO]**
  - **Agente:** `frontend-specialist` | **Skill:** `clean-code`
  - **Implementado:** Componente `RecordingsTab.tsx` com player de gravação simulado em 1080p 60fps, controle de publicação pública do Replay para captação contínua de leads pós-evento, cópia rápida de link de replay e área de download de materiais de apoio (PDF).
  - **VERIFY:** Integração e transição perfeita no `EventWorkspace.tsx`.

---

## 6. Verificação & Qualidade (Fase X)

- [ ] `npm run lint` & checagem estática de tipos TypeScript sem erros.
- [ ] Auditoria de Segurança: verificação de tokens e proteção de links exclusivos de palestrantes.
- [ ] Teste de ponta a ponta: Inscrição -> Entrada no Backstage -> Transmissão no Palco -> Interação via Chat/Enquete -> Relatório gerado.
