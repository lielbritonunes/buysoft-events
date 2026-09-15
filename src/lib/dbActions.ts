"use server";

import { prisma } from "./prisma";
import { sendConfirmationEmail, sendBroadcastEmailToAttendees } from "./emailService";

// Ensure default organization exists
export async function getOrCreateOrganization() {
  let org = await prisma.organization.findFirst({
    include: { members: true, youtubeIntegration: true },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Buysoft Organization",
        email: "lielbritonunesbuysoft@gmail.com",
        about: "Líder em soluções digitais e eventos corporativos de alta performance.",
        website: "https://buysoft.com.br",
        twitter: "https://x.com/buysoft",
        linkedin: "https://linkedin.com/company/buysoft",
        facebook: "https://facebook.com/buysoft",
        planName: "Trial Ativo (até 100 participantes)",
        members: {
          create: [
            {
              name: "Eliel Nunes",
              email: "lielbritonunesbuysoft@gmail.com",
              role: "admin",
              avatarInitials: "EN",
            },
            {
              name: "Ana Souza",
              email: "ana.souza@buysoft.com.br",
              role: "member",
              avatarInitials: "AS",
            },
          ],
        },
      },
      include: { members: true, youtubeIntegration: true },
    });
  }

  return org;
}

// Get all events with counts and speakers
export async function getEvents() {
  await getOrCreateOrganization(); // ensure DB seeded

  const events = await prisma.event.findMany({
    include: {
      speakers: true,
      formFields: { orderBy: { orderIndex: "asc" } },
      registrations: true,
      series: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (events.length === 0) {
    const org = await getOrCreateOrganization();
    const newEvent = await prisma.event.create({
      data: {
        title: "Lançamento de Produtos Buysoft 2026",
        description:
          "Conheça os novos recursos da plataforma, melhores práticas para engajar audiências e demonstrações ao vivo com nossos especialistas.",
        startDate: "2026-10-12T17:00",
        endDate: "2026-10-12T18:00",
        timezone: "(GMT-03:00) Horário de Brasília",
        status: "published",
        maxAttendees: 100,
        organizationId: org!.id,
        speakers: {
          create: [
            {
              name: "Eliel Nunes",
              email: "eliel@buysoft.com.br",
              role: "Head de Produto",
              company: "Buysoft",
              bio: "Especialista em produtos digitais e comunicação corporativa.",
            },
            {
              name: "Carlos Mendes",
              email: "carlos.mendes@tech.com",
              role: "Arquiteto de Soluções",
              company: "Tech Lead",
              bio: "Engenheiro sênior com foco em transmissões em tempo real.",
            },
          ],
        },
        formFields: {
          create: [
            { label: "Nome completo", type: "text", required: true, orderIndex: 0 },
            { label: "Seu melhor e-mail", type: "text", required: true, orderIndex: 1 },
            { label: "Empresa", type: "text", required: true, orderIndex: 2 },
            { label: "Cargo", type: "text", required: false, orderIndex: 3 },
          ],
        },
      },
      include: {
        speakers: true,
        formFields: { orderBy: { orderIndex: "asc" } },
        registrations: true,
      },
    });
    return [newEvent];
  }

  return events;
}

// Get single event by ID
export async function getEventById(id: string) {
  return await prisma.event.findUnique({
    where: { id },
    include: {
      speakers: true,
      formFields: { orderBy: { orderIndex: "asc" } },
      registrations: true,
      organization: true,
      series: true,
      chatMessages: { where: { isDeleted: false }, orderBy: { createdAt: "asc" } },
      questions: { orderBy: { upvotes: "desc" } },
      polls: { include: { votes: true }, orderBy: { createdAt: "desc" } },
      liveCtas: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

// Create new webinar event
export async function createEvent(data: {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  timezone: string;
}) {
  const org = await getOrCreateOrganization();

  const newEvent = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      timezone: data.timezone,
      status: "draft",
      maxAttendees: 100,
      organizationId: org!.id,
      formFields: {
        create: [
          { label: "Nome completo", type: "text", required: true, orderIndex: 0 },
          { label: "E-mail de contato", type: "text", required: true, orderIndex: 1 },
          { label: "Empresa", type: "text", required: false, orderIndex: 2 },
        ],
      },
    },
    include: {
      speakers: true,
      formFields: { orderBy: { orderIndex: "asc" } },
      registrations: true,
      series: true,
    },
  });

  // Automatically create unlisted YouTube Live broadcast if integration is active
  try {
    const { createYouTubeLiveBroadcastForEvent } = await import("./youtubeService");
    const ytEvent = await createYouTubeLiveBroadcastForEvent(newEvent.id);
    if (ytEvent) {
      return ytEvent;
    }
  } catch (ytErr) {
    console.warn("Could not auto-create YouTube live broadcast:", ytErr);
  }

  return newEvent;
}

// Manually sync or regenerate YouTube Live broadcast for an existing event
export async function syncEventWithYouTube(eventId: string) {
  const { createYouTubeLiveBroadcastForEvent } = await import("./youtubeService");
  return await createYouTubeLiveBroadcastForEvent(eventId);
}

// Update event details or settings
export async function updateEvent(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    timezone: string;
    status: string;
    maxAttendees: number;
    logoUrl: string | null;
    bannerUrl: string | null;
    layoutType: string;
    advancedTheme: string;
    confirmationMessage: string | null;
    customLandingJson?: string | null;
    customEmailsJson: string | null;
    seriesId: string | null;
    chatEnabled: boolean;
    qaEnabled: boolean;
    pollsEnabled: boolean;
    attendeeListVisible: boolean;
    autoRecord: boolean;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  }>
) {
  return await prisma.event.update({
    where: { id },
    data,
    include: {
      speakers: true,
      formFields: { orderBy: { orderIndex: "asc" } },
      registrations: true,
      series: true,
    },
  });
}

// Add speaker
export async function addSpeaker(
  eventId: string,
  data: { name: string; email: string; role: string; company: string; bio?: string }
) {
  return await prisma.speaker.create({
    data: {
      eventId,
      name: data.name,
      email: data.email,
      role: data.role,
      company: data.company,
      bio: data.bio || "",
    },
  });
}

// Delete speaker
export async function deleteSpeaker(speakerId: string) {
  return await prisma.speaker.delete({
    where: { id: speakerId },
  });
}

// Save form fields
export async function saveFormFields(
  eventId: string,
  fields: Array<{ label: string; type: string; required: boolean; orderIndex: number; optionsJson?: string }>
) {
  await prisma.formField.deleteMany({ where: { eventId } });

  return await prisma.formField.createMany({
    data: fields.map((f, i) => ({
      eventId,
      label: f.label,
      type: f.type,
      required: f.required,
      optionsJson: f.optionsJson || null,
      orderIndex: i,
    })),
  });
}

// Register attendee
export async function registerAttendee(
  eventId: string,
  data: { attendeeName: string; attendeeEmail: string; responses: Record<string, string> }
) {
  const existing = await prisma.registration.findFirst({
    where: { eventId, attendeeEmail: data.attendeeEmail },
    include: { event: true },
  });

  if (existing) {
    return existing;
  }

  const reg = await prisma.registration.create({
    data: {
      eventId,
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      responsesJson: JSON.stringify(data.responses),
    },
    include: { event: true },
  });

  // Asynchronously trigger automated confirmation email
  try {
    const formattedDate = new Date(reg.event.startDate).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.NODE_ENV === "production"
        ? (process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
            : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://buysoft-events.vercel.app"))
        : "http://localhost:3000");
    const magicLinkUrl = `${baseUrl}/live/${reg.event.id}?token=${reg.magicLinkToken}`;

    sendConfirmationEmail({
      attendeeEmail: reg.attendeeEmail,
      attendeeName: reg.attendeeName || "Participante",
      eventTitle: reg.event.title,
      eventDate: formattedDate,
      magicLinkUrl,
      logoUrl: reg.event.logoUrl,
    }).catch((err) => console.error("Error sending confirmation email:", err));
  } catch (err) {
    console.error("Error formatting confirmation email:", err);
  }

  return reg;
}

// Broadcast email to all attendees
export async function dispatchBroadcastEmail(
  eventId: string,
  subject: string,
  bodyTemplate: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "https://buysoft-events.vercel.app" : "http://localhost:3000")
) {
  return await sendBroadcastEmailToAttendees({
    eventId,
    subject,
    bodyTemplate,
    baseUrl,
  });
}

// ==========================================
// PHASE 3: REAL-TIME ENGAGEMENT & STAGE ACTIONS
// ==========================================

// Get Live Room State for polling / sync
export async function getLiveRoomState(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      status: true,
      chatEnabled: true,
      qaEnabled: true,
      pollsEnabled: true,
      attendeeListVisible: true,
      autoRecord: true,
      primaryColor: true,
      speakers: true,
      youtubeBroadcastId: true,
      youtubeStreamKey: true,
      youtubeRtmpUrl: true,
      youtubeEmbedUrl: true,
      chatMessages: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
      },
      questions: {
        orderBy: { upvotes: "desc" },
      },
      polls: {
        include: { votes: true },
        orderBy: { createdAt: "desc" },
      },
      liveCtas: {
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return event;
}

// Send chat message
export async function sendChatMessage(
  eventId: string,
  senderName: string,
  senderRole: "host" | "speaker" | "attendee",
  text: string
) {
  return await prisma.chatMessage.create({
    data: {
      eventId,
      senderName,
      senderRole,
      text,
    },
  });
}

// Delete chat message (moderation)
export async function deleteChatMessage(messageId: string) {
  return await prisma.chatMessage.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });
}

// Ask question in Q&A
export async function askQuestion(eventId: string, askerName: string, text: string) {
  return await prisma.question.create({
    data: {
      eventId,
      askerName,
      text,
    },
  });
}

// Upvote question
export async function upvoteQuestion(questionId: string) {
  return await prisma.question.update({
    where: { id: questionId },
    data: {
      upvotes: { increment: 1 },
    },
  });
}

// Mark question as answered
export async function markQuestionAnswered(questionId: string) {
  return await prisma.question.update({
    where: { id: questionId },
    data: { isAnswered: true },
  });
}

// Create and activate poll
export async function createPoll(eventId: string, question: string, options: string[]) {
  return await prisma.poll.create({
    data: {
      eventId,
      question,
      optionsJson: JSON.stringify(options),
      isActive: true,
    },
    include: { votes: true },
  });
}

// Vote on poll
export async function votePoll(pollId: string, optionIndex: number, voterId: string) {
  // Check if user already voted
  const existing = await prisma.pollVote.findFirst({
    where: { pollId, voterId },
  });

  if (existing) {
    return existing;
  }

  return await prisma.pollVote.create({
    data: {
      pollId,
      optionIndex,
      voterId,
    },
  });
}

// Trigger / Update Live CTA
export async function setLiveCta(
  eventId: string,
  data: { title: string; buttonText: string; buttonUrl: string; isActive: boolean }
) {
  // Deactivate existing
  await prisma.liveCta.updateMany({
    where: { eventId },
    data: { isActive: false },
  });

  if (!data.isActive) return null;

  return await prisma.liveCta.create({
    data: {
      eventId,
      title: data.title,
      buttonText: data.buttonText,
      buttonUrl: data.buttonUrl,
      isActive: true,
    },
  });
}

// ==========================================
// PHASE 5: EVENT ACTIONS & SERIES MANAGEMENT
// ==========================================

// Duplicate Event
export async function duplicateEvent(id: string) {
  const original = await prisma.event.findUnique({
    where: { id },
    include: {
      speakers: true,
      formFields: true,
    },
  });
  if (!original) throw new Error("Evento não encontrado");

  return await prisma.event.create({
    data: {
      title: `(Cópia) ${original.title}`,
      description: original.description,
      startDate: original.startDate,
      endDate: original.endDate,
      timezone: original.timezone,
      status: "draft",
      maxAttendees: original.maxAttendees,
      logoUrl: original.logoUrl,
      bannerUrl: original.bannerUrl,
      primaryColor: original.primaryColor,
      backgroundColor: original.backgroundColor,
      textColor: original.textColor,
      layoutType: original.layoutType,
      advancedTheme: original.advancedTheme,
      confirmationMessage: original.confirmationMessage,
      organizationId: original.organizationId,
      seriesId: original.seriesId,
      speakers: {
        create: original.speakers.map((s) => ({
          name: s.name,
          email: s.email,
          role: s.role,
          company: s.company,
          bio: s.bio,
        })),
      },
      formFields: {
        create: original.formFields.map((f) => ({
          label: f.label,
          type: f.type,
          required: f.required,
          orderIndex: f.orderIndex,
        })),
      },
    },
    include: {
      speakers: true,
      formFields: true,
      registrations: true,
      series: true,
    },
  });
}

// Delete Event
export async function deleteEvent(id: string) {
  return await prisma.event.delete({ where: { id } });
}

// Get all series for organization
export async function getSeries() {
  const org = await getOrCreateOrganization();
  return await prisma.series.findMany({
    where: { organizationId: org!.id },
    include: {
      events: {
        include: {
          speakers: true,
          registrations: true,
        },
        orderBy: { startDate: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Create new series
export async function createSeries(data: { title: string; description?: string; bannerUrl?: string }) {
  const org = await getOrCreateOrganization();
  return await prisma.series.create({
    data: {
      title: data.title,
      description: data.description || "",
      bannerUrl: data.bannerUrl,
      organizationId: org!.id,
    },
    include: {
      events: true,
    },
  });
}

// Delete series
export async function deleteSeries(id: string) {
  return await prisma.series.delete({ where: { id } });
}

// Add/remove event to/from series
export async function addEventToSeries(eventId: string, seriesId: string | null) {
  return await prisma.event.update({
    where: { id: eventId },
    data: { seriesId },
    include: { series: true },
  });
}

// Get series by ID
export async function getSeriesById(id: string) {
  return await prisma.series.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          speakers: true,
          registrations: true,
          formFields: { orderBy: { orderIndex: "asc" } },
        },
        orderBy: { startDate: "asc" },
      },
      organization: true,
    },
  });
}

// Register for multiple/all events in a series
export async function registerSeriesAttendee(
  seriesId: string,
  data: { attendeeName: string; attendeeEmail: string; responses: Record<string, string>; selectedEventIds?: string[] }
) {
  const series = await prisma.series.findUnique({
    where: { id: seriesId },
    include: { events: true },
  });
  if (!series) throw new Error("Série não encontrada");

  const targetEvents = data.selectedEventIds && data.selectedEventIds.length > 0
    ? series.events.filter((e) => data.selectedEventIds!.includes(e.id))
    : series.events;

  const results = [];
  for (const ev of targetEvents) {
    const reg = await registerAttendee(ev.id, {
      attendeeName: data.attendeeName,
      attendeeEmail: data.attendeeEmail,
      responses: data.responses,
    });
    results.push(reg);
  }
  return results;
}

// Update organization profile, SMTP and settings
export async function updateOrganizationAction(orgId: string, data: any) {
  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      name: data.name,
      email: data.email,
      about: data.about,
      website: data.website,
      twitter: data.twitter,
      facebook: data.facebook,
      linkedin: data.linkedin,
      customSmtpEnabled: data.customSmtpEnabled ?? false,
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort ? parseInt(data.smtpPort, 10) : 587,
      smtpSecure: data.smtpSecure ?? false,
      smtpUser: data.smtpUser,
      smtpPass: data.smtpPass,
      smtpSendersJson: data.smtpSendersJson,
      defaultSender: data.defaultSender,
    },
    include: { members: true, youtubeIntegration: true },
  });
  return updated;
}

// Test SMTP connection and dispatch test email
export async function testSmtpConnectionAction(config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  testRecipient: string;
}) {
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.verify();

    await transporter.sendMail({
      from: config.from,
      to: config.testRecipient,
      subject: "Teste de Conexão SMTP - Buysoft Events",
      html: `
      <div style="font-family: sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: #0f172a;">
        <div style="color: #00b4fb; font-weight: bold; font-size: 16px; margin-bottom: 12px;">Buysoft Events</div>
        <p style="font-size: 14px; margin: 0 0 12px;">Parabéns! O servidor SMTP da sua organização foi conectado e validado com sucesso.</p>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 12px; color: #64748b;">
          <div><b>Host:</b> ${config.host}:${config.port}</div>
          <div><b>Remetente Autorizado:</b> ${config.from}</div>
        </div>
      </div>
      `.trim(),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Falha ao conectar com o servidor SMTP." };
  }
}

// Disconnect YouTube integration for an organization
export async function disconnectYouTubeAction(orgId: string) {
  await prisma.youTubeIntegration.deleteMany({
    where: { organizationId: orgId },
  });
  return { success: true };
}

