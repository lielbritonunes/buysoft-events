# Documento de Escopo do Produto & Arquitetura de Software
## Plataforma de Webinars Corporativos (Inspirada no RingCentral Events)

> **Versão do Documento:** 1.0.0  
> **Status:** Aprovado para Planejamento e Execução  
> **Data:** 12/09/2026  
> **Autor:** Planejador de Projetos (AG Kit) & Founder  

---

## 1. Conceitos Fundamentais de Desenvolvimento de Software

Para que você acompanhe cada decisão e cada etapa sem depender de jargões técnicos, este capítulo explica os conceitos essenciais utilizados na criação de produtos digitais modernos.

### 1.1 O que é o Ciclo de Vida do Software (SDLC)?
Desenvolver um sistema não é apenas "digitar código". É um processo estruturado em etapas:
1. **Descoberta & Escopo (Onde estamos agora):** Mapear exatamente o que vamos construir, por que e para quem, evitando retrabalho e desperdício de tempo e dinheiro.
2. **Design & Prototipagem:** Definir a aparência visual, telas, cores, tipografia e navegação.
3. **Desenvolvimento (Build):** Construção da estrutura visual (Frontend), das regras de negócio e banco de dados (Backend) e dos serviços em tempo real (Áudio/Vídeo e Chat).
4. **Testes & Qualidade (QA):** Garantir que não há falhas, links quebrados ou problemas de segurança.
5. **Implantação (Deploy):** Colocar a plataforma no ar em servidores profissionais na nuvem.

### 1.2 Níveis de Maturidade do Produto: MVP vs. MMP vs. MLP

```
   ┌────────────────────────────────────────────────────────┐
   │  MLP (Minimum Lovable Product)                         │
   │  Experiência encantadora, design premium e polimento   │
   ├────────────────────────────────────────────────────────┤
   │  MMP (Minimum Marketable Product)                      │
   │  Recursos suficientes para vender a clientes reais    │
   ├────────────────────────────────────────────────────────┤
   │  MVP (Minimum Viable Product)                          │
   │  O menor conjunto funcional que resolve o problema     │
   └────────────────────────────────────────────────────────┘
```

- **MVP (Minimum Viable Product / Produto Mínimo Viável):**  
  É a versão mais enxuta possível da plataforma que já entrega valor real de ponta a ponta: o organizador cria o evento, os participantes se inscrevem, todos entram no dia, assistem à transmissão no navegador e o organizador exporta a lista de presença.
- **MMP (Minimum Marketable Product / Produto Mínimo Comercializável):**  
  A versão que já contém diferenciais comerciais: branding personalizado (logo e cores da empresa contratante), formulário dinâmico e automação de e-mails de lembrete. **Este é o nosso objetivo principal.**
- **MLP (Minimum Lovable Product / Produto Mínimo Apaixonante):**  
  A experiência visual idêntica ao RingCentral Events, com reações em emojis flutuantes, animações suaves e facilidade de uso sem fricção.

### 1.3 Priorização MoSCoW
Para garantir foco e velocidade, cada funcionalidade do projeto é classificada em quatro categorias:
- **M (Must Have - Obrigatório no MVP):** Se faltar isso, o evento não acontece.
- **S (Should Have - Importante na Fase 2):** Recursos de alto valor comercial, como múltiplos layouts de landing page.
- **C (Could Have - Desejável no Futuro):** Integrações externas (ex: webhook para CRM, Hubspot, WhatsApp).
- **W (Won't Have - Fora de Escopo Inicial):** Ingressos pagos, estandes 3D de exposição e salas simultâneas de networking.

---

## 2. Visão do Produto & Personas

### 2.1 Declaração de Visão
> *"Criar uma plataforma de webinars corporativos elegante, robusta e descomplicada, onde empresas possam criar eventos profissionais em minutos e transmitir áudio, vídeo e apresentações diretamente pelo navegador, proporcionando à plateia uma experiência interativa e imersiva sem necessidade de download de aplicativos."*

### 2.2 Personas do Sistema

| Persona | Quem é? | Principal Necessidade | O que valoriza? |
| :--- | :--- | :--- | :--- |
| **Organizador (Host / Admin)** | Gestor de Marketing, Vendas ou RH da empresa contratante. | Configurar o evento com a marca da empresa, convidar palestrantes e coletar dados de inscritos. | Interface intuitiva, relatórios em CSV e controle total da transmissão sem estresse técnico. |
| **Palestrante (Speaker)** | Especialista ou convidado externo que vai apresentar. | Entrar no evento com antecedência, testar áudio/vídeo e compartilhar slides. | Camarim privado (Backstage) para alinhar detalhes antes de entrar ao vivo. |
| **Participante (Attendee)** | Lead, cliente ou colaborador que vai assistir. | Acessar o webinar com 1 clique, interagir via chat, enviar perguntas e responder enquetes. | Velocidade de carregamento, vídeo sem travamentos e acesso sem necessidade de criar senhas. |
| **Membro de Equipe (Staff)** | Colega da empresa que ajuda na moderação. | Moderar chat, aprovar perguntas no Q&A e publicar enquetes. | Painel de controle em tempo real separado da transmissão principal. |

---

## 3. Mapeamento Completo de Recursos (Funcionalidades)

Baseado na especificação aprovada e nas **7 telas de referência do RingCentral Events** fornecidas:

### Módulo 1: Autenticação & Gestão da Organização (Multi-tenancy)
*(Referência: `Tela de login.png`, `Tela inicial.png`, `Tela gerenciar organização.png`, `Tela perfil.png`)*

- **1.1 Tela de Login & Acesso:**
  - Login com e-mail corporativo e senha criptografada.
  - Preparado para login social/SSO (Google, LinkedIn).
  - Recuperação de senha segura via e-mail.
- **1.2 Painel Inicial (Dashboard):**
  - Barra de navegação superior com logo, abas (*Início, Análise, Configurações*) e seletor de organização.
  - Menu de perfil no canto superior direito: dados do usuário logado, status do plano, troca de idioma e botão de logout.
  - Tabela de Eventos com paginação, busca e filtros (*Todos, Rascunhos, Publicados, Concluídos*).
  - Cada evento exibe: Thumbnail/Banner, Nome, Tag de Tipo (`Webinar`), Data/Hora com fuso horário, Quantidade de Inscritos, Tag de Status (`Rascunho`, `Publicado`, `Ao Vivo`) e menu de ações rápidas (`...` para editar, duplicar ou excluir).
  - Botão de ação em destaque: **"Criar evento"**.
- **1.3 Gestão da Organização:**
  - Aba **Perfil**: Nome da empresa, e-mail oficial de contato, descrição "Sobre", upload de logo (96x96 px) e links externos (Site institucional, LinkedIn, X, Facebook).
  - Aba **Equipe**: Listagem de membros com níveis de permissão (*Administrador* e *Membro*) e botão para convidar novos usuários por e-mail.
  - Aba **Configurações de Envio de E-mail**: Configuração do remetente oficial para que os e-mails de confirmação e lembretes saiam com o nome da empresa.

---

### Módulo 2: Criação & Gestão do Evento
*(Referência: `Tela criar evento.png`, `Tela criar evento 2.png`, `Tela criar evento 3.png`)*

- **2.1 Wizard de Criação (Passo a Passo Guiado):**
  - **Passo 1 (Informações Básicas):**
    - Nome do evento (obrigatório).
    - Data e hora de início e término com seletores intuitivos de calendário e horário.
    - Seleção de Fuso Horário (ex: `(GMT-03:00) Horário de Brasília`).
    - Tipo de Evento: 100% focado e predefinido como **Webinar** (sem opções de eventos híbridos ou mega-conferências, simplificando o fluxo para criação ágil em 1 clique).
    - Ilustração em tempo real demonstrando a experiência da transmissão.
  - **Passo 2 (Descrição & Detalhes):**
    - Editor de texto rico (negrito, itálico, listas, links, parágrafos) para descrever a agenda e os objetivos do webinar.
    - Preview dinâmico da landing page no painel lateral direito.
- **2.2 Área de Gestão do Evento (Workspace Interno):**
  - Cabeçalho com botão de retorno à lista, título da aba ativa e botões rápidos: **"Pré-visualizar inscrição"** e **"Pré-visualizar evento"**.
  - Menu lateral esquerdo do evento:
    - Identificação visual: Nome do evento, data formatada e botão de status (**"Publicar evento"**).
    - Botão **"Duplicar evento"**.
    - Navegação entre as 6 abas principais:
      1. ⊞ **Visão geral**
      2. 📄 **Página de inscrições**
      3. ✏️ **Configuração**
      4. ✉️ **Marketing**
      5. 📊 **Análises**
      6. 🎥 **Gravações**

---

### Módulo 3: Aba Visão Geral & Página de Inscrições
- **3.1 Aba Visão Geral:**
  - Card de **Guia de Configuração Rápida** com checklist interativo para orientar o organizador até a publicação.
  - Card Principal do Evento com miniatura editável, tags, datas de início/fim e os dois links estratégicos:
    - 👥 **Link de Inscrição da Plateia:** Botão de 1 clique para copiar o link da landing page.
    - 🎙️ **Link do Backstage para Oradores:** Botão de 1 clique para copiar o link exclusivo dos palestrantes.
- **3.2 Aba Página de Inscrições:**
  - **Sub-aba Layout da Landing Page:**
    - Opção *Clássico*: Layout estruturado padrão, limpo, responsivo para celular e computador.
    - Opção *Avançado*: Customização com tipografia, banner expandido e campos customizados.
    - Configurações da página: Mensagem personalizada de sucesso pós-inscrição, limite máximo de vagas e janela de datas para inscrições.
    - **Detecção Automática de Fuso Horário:** A landing page identifica o fuso do visitante e exibe a data/hora exata no horário local dele.
    - **Botões "Adicionar ao Calendário":** Na tela de confirmação, botões de 1 clique para Google Calendar, Outlook e download de arquivo `.ics` (aumenta o comparecimento em mais de 50%).
  - **Sub-aba Formulário de Inscrição (Form Builder):**
    - Campos obrigatórios padrão: *Nome Completo* e *E-mail*.
    - Adição de campos básicos: *Texto curto*, *Parágrafo*, *Múltipla escolha (radio)*, *Caixas de seleção (checkbox)*.
    - Adição de campos avançados: *Data*, *País/Estado*, *Cargo/Empresa*, *Aceite de Termos de Privacidade/LGPD*, *Campos ocultos (UTMs para rastreamento de marketing)*.

---

### Módulo 4: Aba Configurações & Gestão de Conteúdo
- **4.1 Sub-aba Básico:**
  - Regras de acesso: Aberto a qualquer inscrito ou restrito a e-mails autorizados.
  - Chaves de ativação/desativação: Ativar/desativar Chat, Ativar/desativar Perguntas (Q&A), Ativar/desativar Enquetes, Ativar/desativar Lista pública de participantes.
  - Gravação automática: Opção de gravar automaticamente ao iniciar o palco (ativado por padrão).
- **4.2 Sub-aba Branding:**
  - Upload de logotipo do evento.
  - Upload de banner de topo (header) da página de inscrição.
  - Definição da paleta de cores: Cor Primária (botões e destaques), Cor de Fundo e Cor do Texto.
- **4.3 Sub-aba Palco & Mídia:**
  - Plano de fundo do palco virtual (Virtual Backdrop).
  - Upload de vídeos curtos institucionais para exibição durante o evento.
  - Barra inferior de avisos (*Ticker / Disclaimers*) para mensagens importantes na tela.
  - Botão de acesso direto ao **Estúdio do Organizador**.
- **4.4 Sub-aba Speakers (Palestrantes):**
  - Cadastro completo: Nome, e-mail, cargo, empresa, mini-biografia e foto.
  - Gerador de link seguro e pessoal para cada palestrante entrar direto no Backstage.

---

### Módulo 5: O Palco ao Vivo & Estúdio (Experiência de Transmissão)
*(O coração da plataforma - 100% no navegador, sem precisar de programas externos. Dimensionado para até 100 participantes simultâneos com latência ultrabaixa <300ms)*

```
             ESTÚDIO DE TRANSMISSÃO NATIVO
  ┌───────────────────────────────────────────────┬──────────────┐
  │  PALCO AO VIVO (No Ar)                        │ CHAT & Q&A   │
  │  ┌────────────────────┐ ┌───────────────────┐ │ [Chat] [Q&A] │
  │  │   Palestrante 1    │ │  Apresentação     │ │              │
  │  │   (Câmera/Mic)     │ │  (Slides/PDF)     │ │ Maria: Olá!  │
  │  └────────────────────┘ └───────────────────┘ │ João: Dúvida?│
  │                                               │              │
  │  ┌──────────────────────────────────────────┐ │ [Enquetes]   │
  │  │ ⚡ LIVE CTA: "Agende sua Reunião [Acessar]│ │              │
  │  └──────────────────────────────────────────┘ │ [Ações Host] │
  ├───────────────────────────────────────────────┤              │
  │  CAMARIM / BASTIDORES (Backstage)             │ [Lançar CTA] │
  │  [Palestrante 2 aguardando] [Mídia de espera] │ [Moderar]    │
  │  Controles: [Ligar Cam] [Mutar] [Compartilhar]│              │
  └───────────────────────────────────────────────┴──────────────┘
```

- **5.0 Lobby / Pré-teste de Dispositivos (Pre-flight Check):**
  - Antes de entrar no Backstage, palestrantes testam câmera, microfone e saída de áudio.
  - Medidor de áudio em tempo real (barra verde oscilante) para confirmar se o som está funcionando antes da entrada.
- **5.1 Backstage (Camarim Virtual):**
  - Área reservada onde palestrantes e organizadores conversam por voz e vídeo antes de entrarem "no ar".
  - Reconexão automática transparente em caso de instabilidade pontual de internet.
- **5.2 Controle do Palco (Host Studio):**
  - Botão principal: **"Entrar ao Vivo" (Go Live)** e **"Encerrar Transmissão"**.
  - O organizador pode colocar ou tirar qualquer palestrante do palco com apenas 1 clique (*"Adicionar ao Palco"* / *"Mover para Backstage"*).
  - Modos de exibição do palco: Grid de palestrantes lado a lado, Palestrante em destaque (Spotlight) ou Palestrante + Compartilhamento de tela.
- **5.3 Experiência da Plateia (Espectador):**
  - Entrada sem fricção pelo link do evento (Magic Link, sem senha).
  - Player de vídeo de alta definição em WebRTC puro (<300ms de latência para até 100 espectadores).
  - Painel lateral de interação:
    - **Chat:** Mensagens em tempo real com badges visuais (Organizador, Palestrante).
    - **Perguntas & Respostas (Q&A):** Envio de dúvidas com votação (upvote) da plateia e marcação de "Respondida".
    - **Enquetes (Polls):** Votação ao vivo com exibição instantânea de porcentagens e gráficos.
    - **Reações Visuais:** Emojis flutuantes animados (👏, ❤️, 🔥, 💡).
- **5.4 Live CTA (Chamada para Ação ao Vivo / Conversão de Leads):**
  - O organizador pode acionar um banner em destaque no topo da transmissão ou do chat com título, subtítulo e botão de link externo (ex: *"Agende uma demonstração gratuita com nosso time"* ou *"Garanta sua vaga com desconto especial"*).
- **5.5 Moderação & Segurança ao Vivo:**
  - Organizadores podem excluir mensagens inadequadas com 1 clique e silenciar/bloquear participantes problemáticos do chat.

---

### Módulo 6: Marketing & Automação de E-mails
- **6.1 E-mails Pré-configurados (Gatilhos Automáticos):**
  - **E-mail 1 (Confirmação Imediata):** Enviado no instante da inscrição, com os detalhes do evento, botões de adicionar ao calendário e link exclusivo de acesso.
  - **E-mail 2 (Lembrete 24h):** Disparado exatamente 24 horas antes do evento começar.
  - **E-mail 3 (Lembrete 1h):** Disparado 1 hora antes do início com o botão em destaque *"Entrar na Sala"*.
  - **E-mail 4 (Pós-Evento & Avaliação):** Enviado 30 minutos após o encerramento do evento, agradecendo a presença e exibindo o link da pesquisa de satisfação e da gravação.
- **6.2 Customização de Mensagens:**
  - O organizador pode editar o assunto e o texto de cada e-mail ou desativar envios específicos com uma chave seletora (*toggle*).

---

### Módulo 7: Pós-Evento, Análises & Gravações
- **7.1 Aba Análises (Analytics):**
  - **Métricas Principais:** Total de Inscritos, Total de Participantes Presentes, Taxa de Comparecimento (% Attendance Rate) e Tempo Médio de Permanência.
  - **Engajamento:** Total de mensagens enviadas no chat, perguntas no Q&A, votos computados nas enquetes e cliques no Live CTA.
  - **Exportação de Leads (CSV):** Botão para baixar a planilha completa contendo nome, e-mail, respostas do formulário de inscrição, se compareceu ao evento, quanto tempo assistiu e se clicou no CTA.
- **7.2 Construtor de Pesquisa de Satisfação (Survey Builder):**
  - Formulário exibido na tela do participante assim que o organizador clica em *"Encerrar Evento"*.
  - Perguntas personalizáveis (Escala de 1 a 5 estrelas, Nota NPS de 0 a 10 e campo aberto para feedback).
- **7.3 Aba Gravações:**
  - Vídeo do webinar processado automaticamente na nuvem ao final da transmissão.
  - Player interno para o organizador assistir e botão de download em formato `.mp4`.
- **7.4 Página de Replay Automática (Captação Contínua de Leads):**
  - Assim que o webinar é encerrado, o link da Landing Page se transforma automaticamente em página de replay sob demanda: novos visitantes continuam preenchendo o formulário de inscrição para liberar o acesso à gravação.

---

## 4. Cronograma de Desenvolvimento em Fases (Roadmap)

Para garantir visibilidade, previsibilidade e entregas funcionais frequentes, o projeto é estruturado em **4 Fases Sequenciais**:

```
FASE 1: Fundação & Casca Navegável (Semana 1)
├── Setup Next.js 15, Tailwind CSS e Design System
├── Tela de Login & Perfil do Usuário
├── Dashboard com Lista de Eventos e Status
├── Tela de Gerenciamento da Organização
└── Wizard Completo de Criação de Eventos (Passos 1 e 2)
    └── [Entrega Funcional: Navegação 100% funcional]

FASE 2: Gestão do Evento & Inscrições (Semana 2)
├── Aba Visão Geral com Cards e Links Rápidos
├── Aba Página de Inscrições & Formulário Dinâmico
├── Landing Page Pública do Evento (/e/[slug])
├── Aba Configurações (Básico, Branding, Speakers)
└── Banco de Dados PostgreSQL & Integração com Prisma
    └── [Entrega Funcional: Evento configurável e inscrições funcionando]

FASE 3: Palco, Backstage & Engajamento (Semana 3)
├── Integração do Motor de Vídeo WebRTC no Navegador
├── Camarim Virtual (Backstage) para Palestrantes
├── Estúdio de Controle do Palco para o Organizador
├── Chat em Tempo Real, Q&A com Votação e Enquetes
└── Reações com Emojis Flutuantes
    └── [Entrega Funcional: Transmissão ao vivo completa sem OBS]

FASE 4: Marketing, Análises & Gravação (Semana 4)
├── Disparo Automático de E-mails e Lembretes
├── Painel de Métricas e Exportação de Leads em CSV
├── Construtor de Pesquisa de Satisfação Pós-Evento
└── Player e Processamento de Gravações
    └── [Entrega Funcional: Plataforma pronta para produção]
```

---

## 5. Critérios de Aceite (Definition of Done)

Uma tarefa ou tela só é considerada concluída quando atende aos seguintes requisitos:
1. **Fidelidade Visual:** Respeita o design limpo, moderno e profissional observado nas telas de referência do RingCentral Events.
2. **Responsividade:** Funciona perfeitamente em telas de computadores (desktop/notebook) e celulares (mobile).
3. **Sem Travamentos:** Transição fluida entre abas, validação de campos obrigatórios e mensagens claras de aviso ao usuário.
4. **Código Limpo:** Totalmente documentado, tipado em TypeScript e sem erros no console ou terminal.

---

Este documento serve como a **Bússola Oficial** do projeto. Todas as telas, componentes e regras desenvolvidas daqui em diante seguirão rigorosamente as definições contidas aqui.
