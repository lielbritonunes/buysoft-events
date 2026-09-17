import nodemailer from "nodemailer";
import { prisma } from "./prisma";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = process.env.SMTP_FROM || "Buysoft Events <eventos@buysoft.com.br>";

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, secure, user, pass, from };
}

export async function createTransporter() {
  const cfg = getEmailConfig();
  if (!cfg) {
    return null;
  }
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
  });
}

export function buildConfirmationHtml(params: {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  magicLinkUrl: string;
  organizationName?: string;
  logoUrl?: string | null;
}) {
  const { attendeeName, eventTitle, eventDate, magicLinkUrl, organizationName = "Buysoft do Brasil", logoUrl } = params;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrição Confirmada: ${eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    ${
                      logoUrl
                        ? `<img src="${logoUrl}" alt="Logo" style="height: 32px; max-width: 140px; object-fit: contain;">`
                        : `<div style="display: inline-block; font-size: 18px; font-weight: 800; color: #090d16; letter-spacing: -0.5px;">Buysoft <span style="display: inline-block; width: 6px; height: 6px; background-color: #00b4fb; border-radius: 1px; vertical-align: 2px; margin: 0 3px;"></span> Events</div>`
                    }
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: #059669; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
                      Vaga Confirmada
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                Olá, ${attendeeName}!
              </h1>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                Sua inscrição para o webinar oficial <strong>"${eventTitle}"</strong> foi confirmada com sucesso.
              </p>

              <!-- Event Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">
                      Data & Horário da Transmissão
                    </div>
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
                      📅 ${eventDate}
                    </div>
                    <div style="font-size: 12px; color: #64748b;">
                      🌐 Acesso 100% online no navegador (sem downloads ou instalação).
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${magicLinkUrl}" target="_blank" style="display: inline-block; background-color: #00b4fb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,180,251,0.25);">
                      Entrar na Sala do Webinar
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; text-align: center; color: #94a3b8; line-height: 1.5;">
                Este é o seu link individual de acesso sem senha. No dia e horário marcado, basta clicar no botão acima.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0 0 6px;">${organizationName} • Tecnologia em Eventos Corporativos</p>
              <p style="margin: 0;">Você recebeu esta mensagem porque se inscreveu no webinar.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Send automated confirmation email right after registration
export async function sendConfirmationEmail(params: {
  attendeeEmail: string;
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  magicLinkUrl: string;
  logoUrl?: string | null;
}) {
  const { attendeeEmail, attendeeName, eventTitle, eventDate, magicLinkUrl, logoUrl } = params;

  const html = buildConfirmationHtml({
    attendeeName,
    eventTitle,
    eventDate,
    magicLinkUrl,
    logoUrl,
  });

  const transporter = await createTransporter();

  if (!transporter) {
    console.log(`[EMAIL SIMULADOR] (Nenhuma chave SMTP configurada em .env)`);
    console.log(`✉️ Para: ${attendeeEmail}`);
    console.log(`📌 Assunto: Inscrição Confirmada: ${eventTitle}`);
    console.log(`🔗 Link de Acesso: ${magicLinkUrl}`);
    return {
      success: true,
      mode: "simulated",
      message: "E-mail simulado com sucesso (configure SMTP no .env para envio real)",
    };
  }

  try {
    const cfg = getEmailConfig()!;
    const info = await transporter.sendMail({
      from: cfg.from,
      to: `"${attendeeName}" <${attendeeEmail}>`,
      subject: `Inscrição Confirmada: ${eventTitle}`,
      html,
    });
    console.log(`[EMAIL REAL ENVIADO] MessageId: ${info.messageId} para ${attendeeEmail}`);
    return {
      success: true,
      mode: "sent",
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error("[EMAIL ERROR] Falha no disparo:", err);
    return {
      success: false,
      error: err.message,
    };
  }
}

// Send broadcast email to all registered attendees of an event
export async function sendBroadcastEmailToAttendees(params: {
  eventId: string;
  subject: string;
  bodyTemplate: string;
  baseUrl: string;
}) {
  const { eventId, subject, bodyTemplate, baseUrl } = params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { registrations: true },
  });

  if (!event) throw new Error("Evento não encontrado");
  if (!event.registrations || event.registrations.length === 0) {
    return { sentCount: 0, failedCount: 0, message: "Nenhum participante inscrito ainda." };
  }

  const transporter = await createTransporter();
  let sentCount = 0;
  let failedCount = 0;

  for (const reg of event.registrations) {
    const attendeeName = reg.attendeeName || "Participante";
    const attendeeEmail = reg.attendeeEmail;
    const magicLinkUrl = `${baseUrl}/live/${event.id}?token=${reg.magicLinkToken}`;

    const formattedDate = new Date(event.startDate).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    const personalizedSubject = subject
      .replace(/\{\{nome\}\}/g, attendeeName)
      .replace(/\{\{titulo_webinar\}\}/g, event.title)
      .replace(/\{\{data_horario\}\}/g, formattedDate);

    const personalizedBody = bodyTemplate
      .replace(/\{\{nome\}\}/g, attendeeName)
      .replace(/\{\{titulo_webinar\}\}/g, event.title)
      .replace(/\{\{data_horario\}\}/g, formattedDate)
      .replace(/\{\{link_acesso\}\}/g, magicLinkUrl);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; border: 1px solid #e2e8f0;">
    <div style="font-weight: bold; font-size: 16px; color: #00b4fb; margin-bottom: 20px;">Buysoft Events</div>
    <div style="white-space: pre-line; line-height: 1.6; font-size: 14px; margin-bottom: 24px;">${personalizedBody}</div>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${magicLinkUrl}" style="background: #00b4fb; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; font-size: 13px; display: inline-block;">
        Acessar Sala do Webinar
      </a>
    </div>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
      Buysoft do Brasil • ${event.title}
    </div>
  </div>
</body>
</html>
    `.trim();

    if (transporter) {
      try {
        const cfg = getEmailConfig()!;
        await transporter.sendMail({
          from: cfg.from,
          to: `"${attendeeName}" <${attendeeEmail}>`,
          subject: personalizedSubject,
          html,
        });
        sentCount++;
      } catch (e) {
        console.error(`Failed to send email to ${attendeeEmail}:`, e);
        failedCount++;
      }
    } else {
      console.log(`[BROADCAST SIMULADO] Disparado para: ${attendeeEmail} | Assunto: ${personalizedSubject}`);
      sentCount++;
    }
  }

  return {
    sentCount,
    failedCount,
    mode: transporter ? "real" : "simulated",
  };
}
