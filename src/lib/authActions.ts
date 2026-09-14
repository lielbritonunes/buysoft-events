"use server";

import crypto from "crypto";
import { prisma } from "./prisma";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  createMfaChallengeToken,
  verifyMfaChallengeToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  ensureDefaultAdminUser,
} from "./auth";
import {
  generateTotpSecret,
  generateTotpCode,
  verifyTotpCode,
  getTotpUri,
  generateQrCodeDataUrl,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
} from "./totpService";

export interface ActionResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
  requiresMfa?: boolean;
  challengeToken?: string;
}

/**
 * 1. Login with email & password
 */
export async function loginAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult> {
  await ensureDefaultAdminUser();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "true";

  if (!email || !password) {
    return { success: false, error: "E-mail e senha são obrigatórios." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user || !user.passwordHash) {
    return { success: false, error: "Credenciais inválidas. Verifique os dados digitados." };
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return { success: false, error: "Credenciais inválidas. Verifique os dados digitados." };
  }

  // If MFA is enabled, trigger MFA challenge
  if (user.mfaEnabled) {
    const challengeToken = await createMfaChallengeToken({
      userId: user.id,
      email: user.email,
      rememberMe,
    });

    return {
      success: true,
      requiresMfa: true,
      challengeToken,
    };
  }

  // Issue session cookie directly
  const sessionToken = await createSessionToken(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      avatarInitials: user.avatarInitials,
      avatarUrl: user.avatarUrl,
      mfaEnabled: false,
    },
    rememberMe
  );

  await setSessionCookie(sessionToken, rememberMe);

  return { success: true, requiresMfa: false };
}

/**
 * 2. Verify MFA challenge (Google Authenticator or Backup Code)
 */
export async function verifyMfaChallengeAction(
  challengeToken: string,
  code: string
): Promise<ActionResult> {
  const challenge = await verifyMfaChallengeToken(challengeToken);
  if (!challenge) {
    return { success: false, error: "Sessão de verificação expirada. Faça login novamente." };
  }

  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
  });

  if (!user || !user.mfaSecret) {
    return { success: false, error: "Configuração de MFA não encontrada." };
  }

  const cleanCode = code.trim();
  let isValid = false;

  // Check if standard 6-digit TOTP
  if (/^\d{6}$/.test(cleanCode)) {
    isValid = verifyTotpCode(user.mfaSecret, cleanCode);
  } else {
    // Check backup codes
    if (user.mfaBackupCodes) {
      try {
        const hashedCodes: string[] = JSON.parse(user.mfaBackupCodes);
        const { valid, remainingHashedCodes } = verifyAndConsumeBackupCode(cleanCode, hashedCodes);
        if (valid) {
          isValid = true;
          // Persist remaining backup codes
          await prisma.user.update({
            where: { id: user.id },
            data: { mfaBackupCodes: JSON.stringify(remainingHashedCodes) },
          });
        }
      } catch (e) {
        console.error("Error parsing backup codes:", e);
      }
    }
  }

  if (!isValid) {
    return { success: false, error: "Código incorreto. Tente novamente ou use um código de backup." };
  }

  // Issue session cookie
  const sessionToken = await createSessionToken(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      avatarInitials: user.avatarInitials,
      avatarUrl: user.avatarUrl,
      mfaEnabled: true,
    },
    challenge.rememberMe
  );

  await setSessionCookie(sessionToken, challenge.rememberMe);

  return { success: true };
}

/**
 * 3. Register a new user & new organization
 */
export async function registerAction(
  prevState: any,
  formData: FormData
): Promise<ActionResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const organizationName = (formData.get("organizationName") as string)?.trim();

  if (!name || !email || !password || !organizationName) {
    return { success: false, error: "Todos os campos são obrigatórios." };
  }

  if (password.length < 8) {
    return { success: false, error: "A senha deve ter pelo menos 8 caracteres." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: "Este e-mail já está cadastrado. Faça login para continuar." };
  }

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: organizationName,
      email,
    },
  });

  const passwordHash = await hashPassword(password);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Create admin user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "admin",
      organizationId: org.id,
      avatarInitials: initials || "EN",
      mfaEnabled: false,
    },
  });

  const sessionToken = await createSessionToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    organizationId: newUser.organizationId,
    avatarInitials: newUser.avatarInitials,
    mfaEnabled: false,
  });

  await setSessionCookie(sessionToken, true);

  return { success: true };
}

/**
 * 4. Setup MFA for currently logged in user
 */
export async function setupMfaAction(): Promise<ActionResult<{ secret: string; qrCodeUrl: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const secret = generateTotpSecret();
  const otpauthUri = getTotpUri(session.email, secret);
  const qrCodeUrl = await generateQrCodeDataUrl(otpauthUri);

  return {
    success: true,
    data: { secret, qrCodeUrl },
  };
}

/**
 * 5. Confirm and enable MFA
 */
export async function enableMfaAction(
  secret: string,
  verificationCode: string
): Promise<ActionResult<{ backupCodes: string[] }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const cleanCode = verificationCode.trim();
  const isValid = verifyTotpCode(secret, cleanCode);

  if (!isValid) {
    return {
      success: false,
      error: "Código de 6 dígitos inválido. Certifique-se de que o relógio do seu smartphone esteja correto.",
    };
  }

  const { plainCodes, hashedCodes } = generateBackupCodes();

  await prisma.user.update({
    where: { id: session.id },
    data: {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaBackupCodes: JSON.stringify(hashedCodes),
    },
  });

  // Re-issue updated session cookie
  const updatedSessionToken = await createSessionToken({
    ...session,
    mfaEnabled: true,
  });
  await setSessionCookie(updatedSessionToken, true);

  return {
    success: true,
    data: { backupCodes: plainCodes },
  };
}

/**
 * 6. Disable MFA
 */
export async function disableMfaAction(verificationCodeOrPassword: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!user || !user.mfaEnabled) {
    return { success: true };
  }

  let authorized = false;

  // Check if input is TOTP code
  if (user.mfaSecret && /^\d{6}$/.test(verificationCodeOrPassword.trim())) {
    authorized = verifyTotpCode(user.mfaSecret, verificationCodeOrPassword.trim());
  }

  // Check if input is password
  if (!authorized && user.passwordHash) {
    authorized = await verifyPassword(verificationCodeOrPassword, user.passwordHash);
  }

  if (!authorized) {
    return { success: false, error: "Código de autenticação ou senha incorretos." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaBackupCodes: null,
    },
  });

  const updatedSessionToken = await createSessionToken({
    ...session,
    mfaEnabled: false,
  });
  await setSessionCookie(updatedSessionToken, true);

  return { success: true };
}

/**
 * 7. Logout action
 */
export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
}

/**
 * 8. Invite team member
 */
export async function inviteTeamMemberAction(
  email: string,
  role: string = "organizer"
): Promise<ActionResult<{ inviteUrl: string }>> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Apenas administradores podem convidar membros." };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check if user is already in this org
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });
  if (existingUser && existingUser.organizationId === session.organizationId) {
    return { success: false, error: "Este usuário já faz parte desta organização." };
  }

  // Expire in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.inviteToken.create({
    data: {
      email: cleanEmail,
      role,
      organizationId: session.organizationId,
      expiresAt,
    },
  });

  const inviteUrl = `/invite/${invite.token}`;

  return {
    success: true,
    data: { inviteUrl },
  };
}

/**
 * 9. Accept invite
 */
export async function acceptInviteAction(
  token: string,
  name: string,
  password: string
): Promise<ActionResult> {
  const invite = await prisma.inviteToken.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invite || invite.expiresAt < new Date()) {
    return { success: false, error: "Este convite é inválido ou já expirou." };
  }

  if (password.length < 8) {
    return { success: false, error: "A senha deve ter pelo menos 8 caracteres." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: invite.email },
  });

  if (existingUser) {
    return { success: false, error: "Já existe uma conta com este e-mail. Faça login." };
  }

  const passwordHash = await hashPassword(password);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const newUser = await prisma.user.create({
    data: {
      name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      organizationId: invite.organizationId,
      avatarInitials: initials || "MB",
      mfaEnabled: false,
    },
  });

  // Consume invite
  await prisma.inviteToken.delete({ where: { id: invite.id } });

  const sessionToken = await createSessionToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    organizationId: newUser.organizationId,
    avatarInitials: newUser.avatarInitials,
    mfaEnabled: false,
  });

  await setSessionCookie(sessionToken, true);

  return { success: true };
}

/**
 * 10. Get all users in the organization
 */
export async function getOrganizationUsersAction() {
  const session = await getSession();
  if (!session) return [];

  return prisma.user.findMany({
    where: { organizationId: session.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarInitials: true,
      avatarUrl: true,
      mfaEnabled: true,
      authProvider: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * 11. Remove team member
 */
export async function removeTeamUserAction(userId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { success: false, error: "Apenas administradores podem remover membros." };
  }

  if (session.id === userId) {
    return { success: false, error: "Você não pode remover seu próprio usuário." };
  }

  await prisma.user.delete({
    where: { id: userId, organizationId: session.organizationId },
  });

  return { success: true };
}

/**
 * 12. Get currently logged in user session
 */
export async function getCurrentUserAction() {
  return getSession();
}

/**
 * 13. Forgot Password - generate reset token
 */
export async function forgotPasswordAction(
  email: string
): Promise<ActionResult<{ devResetLink?: string }>> {
  const cleanEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

  if (!user) {
    return { success: true };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    },
  });

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://buysoft-events.vercel.app"))
      : "http://localhost:3000");
  const resetUrl = `${appUrl}/reset-password/${token}`;

  try {
    const { createTransporter } = await import("./emailService");
    const transporter = await createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Buysoft Events <${user.email}>`,
        to: user.email,
        subject: "Redefinição de Senha - Buysoft Events",
        html: `
        <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; color: #0f172a;">
          <div style="font-size: 18px; font-weight: bold; color: #00b4fb; margin-bottom: 20px;">Buysoft Events</div>
          <p style="font-size: 14px; line-height: 1.6;">Olá, <b>${user.name}</b>!</p>
          <p style="font-size: 14px; line-height: 1.6;">Recebemos uma solicitação para redefinir a senha da sua conta corporativa.</p>
          <div style="margin: 28px 0; text-align: center;">
            <a href="${resetUrl}" style="background: #00b4fb; color: #ffffff; padding: 12px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 13px;">
              Redefinir Minha Senha
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">Este link expira em 1 hora. Se você não solicitou a alteração de senha, pode ignorar esta mensagem.</p>
        </div>
        `.trim(),
      });
    }
  } catch (err) {
    console.error("Erro ao enviar e-mail de recuperação:", err);
  }

  return {
    success: true,
  };
}

/**
 * 14. Reset Password - update user password with valid token
 */
export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<ActionResult> {
  if (!token || newPassword.length < 8) {
    return { success: false, error: "A nova senha deve ter no mínimo 8 caracteres." };
  }

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return {
      success: false,
      error: "Link de recuperação inválido ou expirado. Por favor, solicite um novo link.",
    };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  return { success: true };
}



