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
    - [Correções de Transmissão]:
      - Isolamento estrito de bastidores/camarim: a plateia `/live/[id]` permanece obrigatoriamente na Sala de Espera até o host clicar em "Iniciar Transmissão Ao Vivo" no estúdio. Nenhuma faixa de áudio ou vídeo composta é publicada ou reproduzida antes do início oficial da live.
      - Otimização de qualidade 1080p Full HD cristalina: captura de tela em 1920x1080 com `contentHint: detail`, desativação de simulcast (evitando rebaixamento para 360p/540p), bitrate configurado para 5 Mbps e interpolação de alta qualidade no canvas 2D do estúdio.
      - Encerramento robusto de Egress: cancelamento ativo de qualquer egress pendente no LiveKit Cloud para a sala ao finalizar a transmissão.
  - Fase 6: Autenticação Moderna, SSO (Google OAuth 2.0) e MFA com Google Authenticator (TOTP RFC 6238).
    - Hashing seguro de senhas com `bcryptjs` e tokens de sessão JWT assinados via `jose` armazenados em cookies `httpOnly`, `secure` e `sameSite: "lax"`.
    - Middleware do Next.js (`src/middleware.ts`) interceptando e protegendo rotas administrativas (`/`, `/studio/*`), redirecionando não autenticados para `/login`. Rotas públicas de participante (`/e/*`, `/s/*`, `/live/*`) preservadas sem barreira de login.
    - SSO corporativo com Google OAuth 2.0 ("Continuar com Google") em `/login` e `/register`, conectado via Google Identity Services.
    - Autenticação em Duas Etapas (MFA/2FA) com Google Authenticator via RFC 6238 TOTP: assistente com QR Code visual, validação de teste, desafio de login (`/login/mfa`) e geração de 8 códigos de backup para emergência.
    - Gestão de Equipe e RBAC (`admin`, `organizer`, `speaker`) no modal da organização, com links de convite `/invite/[token]` expiráveis e remoção de membros.
    - Fase 7: Redesign Visual Moderno, Construtor de Formulários e Construtor de Páginas Visual Puck com IA (100% Gratuita).
    - Redesign de telas inspirado em StreamYard e RingCentral: Login, MFA, Recuperação de Senha, Cadastro, Criação de Evento em passo único e Dashboard.
    - Página de Inscrições organizada em sub-abas: "Página inicial do evento" e "Formulário de inscrições".
    - Construtor Dinâmico de Formulários com 8 tipos de campos (texto curto, parágrafo, seleção única, múltipla, data, país, termos legais e campo oculto) com preview explicativo em popover flutuante no hover.
    - Construtor Visual de Páginas com a biblioteca open-source Puck (`@measured/puck` - MIT, 100% gratuito) integrado a assistente de IA embutido (custo zero, sem Puck Cloud) com estilos Tecnológico, Corporativo, Minimalista e Show.
    - Renderização dinâmica em `/e/[id]` via `<Render />` e modal de inscrição acionado por qualquer botão de CTA.
  - Próxima etapa: Refinamentos contínuos de UX, customizações adicionais do editor e homologação geral.

