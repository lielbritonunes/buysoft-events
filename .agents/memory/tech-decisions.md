---
type: project
created: 2026-07-18
updated: 2026-07-18
---

# Technical Decisions

- Component metadata uses SemVer while the toolkit release keeps CalVer.
- `manifest.json` and `manifest.lock.json` must remain synchronized with component frontmatter.
- [Buysoft Events] Nome da plataforma: "Buysoft Events".
- [Buysoft Events] Branding tokens: Azul `#00b4fb`, Preto `#0f172a` / `#090d16`, Branco `#ffffff`.
- [Buysoft Events] Escopo: Plataforma 100% focada em Webinars Corporativos inspirada no RingCentral Events.
- [Buysoft Events] Audiência dimensionada para até 100 participantes simultâneos em WebRTC puro (<300ms de latência no navegador).
- [Buysoft Events] Recursos essenciais validados: Palco com Backstage, Live CTA de conversão, Lobby de teste de microfone/câmera, Página de Replay automático para captura contínua de leads e botões de adicionar à agenda (Google/Outlook).
- [Buysoft Events] Status atual: Fases 1, 2, 3 e 4 concluídas e testadas em http://localhost:3000.
  - Fase 1: Fundação, Casca Navegável, Login, Dashboard, Gestão da Organização e Wizard de 2 passos.
  - Fase 2: Banco de dados SQLite com Prisma ORM, Página Pública de Inscrições (/e/[id]) com detecção de fuso e contador regressivo, Construtor Dinâmico de Formulários (Form Builder), Cadastro de Palestrantes (Speakers), Geração de Magic Links e Integração com Google Agenda.
  - Fase 3: Transmissão, Palco, Backstage e Engajamento (/studio/[id] e /live/[id]).
    - Lobby de pré-voo com teste de microfone (Web Audio API) e câmera (`PreflightLobby.tsx`).
    - Estúdio de transmissão com alternância de Palco/Backstage, compartilhamento de tela nativo, e acionador de Live CTA (`/studio/[id]`).
    - Sala ao vivo do participante (`/live/[id]`) com modo teatro, tela cheia, som, visualizador do palco, sala de espera pré-evento e replay pós-evento.
    - Sidebar de engajamento completo (`LiveEngagementSidebar.tsx`): Chat com moderação, Q&A com votos e resposta marcada, Enquetes em tempo real (`Poll`), Banner de conversão `LiveCtaBanner.tsx` e reações flutuantes `FloatingReactions.tsx`.
  - Fase 4: Marketing, Pós-Evento & Analytics (`MarketingTab.tsx`, `AnalyticsTab.tsx`, `RecordingsTab.tsx`).
    - Automação de E-mails com 4 gatilhos (Confirmação imediata, Lembrete 24h, Lembrete 1h, Replay pós-evento), modal de preview fiel com visual corporativo Buysoft Events, editor de assunto, métricas de abertura e envio de teste.
    - Dashboard Executivo de Analytics com KPIs (Inscritos Totais, Show-up Rate estimado, Interações na sala, Satisfação com nota 4.9/5), tabela de leads com busca em tempo real, visualizador de respostas e exportação de base em CSV (compatível com Excel Windows via UTF-8 BOM).
    - Gestão de Gravações e Replay com player simulado em 1080p, toggle de publicação pública do link do replay e download de slides em PDF.
  - Fase 5: Estúdio StreamYard/RingCentral com LiveKit Cloud & Transmissão Direta YouTube Live.
    - Criação automática de Live não listada no canal YouTube da organização via Google OAuth 2.0 e YouTube Data API v3.
    - Codificador nativo no navegador via LiveKit Cloud (`livekit-client`, `livekit-server-sdk`) com Egress direto para o RTMP do YouTube (1-click "Iniciar Transmissão Ao Vivo").
    - Personalização do Estúdio: Modos de Layout (Solo, Grade, Split lado-a-lado, PiP Picture-in-Picture), Lower Thirds com identificação do palestrante, Letreiro de Rodapé (Ticker Tape), Banner de Destaque, Plano de Fundo personalizável com presets e Reprodutor de Vídeos/Vinhetas direto no estúdio sem precisar compartilhar tela.
  - Próxima etapa: Fase X (Verificação Final de Ponta a Ponta, Checklist e Entrega do MVP).
