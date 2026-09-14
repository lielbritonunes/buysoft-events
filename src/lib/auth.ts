import * as jose from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "buysoft_session";
export const MFA_COOKIE_NAME = "buysoft_mfa_challenge";

// JWT Secret key (at least 32 bytes)
const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "buysoft_events_super_secure_jwt_secret_key_2026_enterprise_grade_security"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  mfaEnabled: boolean;
}

export interface MfaChallengePayload {
  userId: string;
  email: string;
  rememberMe?: boolean;
}

/**
 * Hash a plain text password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plain text password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a signed session JWT
 */
export async function createSessionToken(user: SessionUser, rememberMe: boolean = false): Promise<string> {
  const expirationTime = rememberMe ? "30d" : "7d";

  return new jose.SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    avatarInitials: user.avatarInitials,
    avatarUrl: user.avatarUrl,
    mfaEnabled: user.mfaEnabled,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(JWT_SECRET_KEY);
}

/**
 * Verify a session JWT and return its payload
 */
export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: (payload.role as string) || "organizer",
      organizationId: payload.organizationId as string,
      avatarInitials: (payload.avatarInitials as string) || "EN",
      avatarUrl: (payload.avatarUrl as string) || null,
      mfaEnabled: Boolean(payload.mfaEnabled),
    };
  } catch {
    return null;
  }
}

/**
 * Create a short-lived MFA challenge token (valid for 5 minutes)
 */
export async function createMfaChallengeToken(payload: MfaChallengePayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(JWT_SECRET_KEY);
}

/**
 * Verify an MFA challenge token
 */
export async function verifyMfaChallengeToken(token: string): Promise<MfaChallengePayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      rememberMe: Boolean(payload.rememberMe),
    };
  } catch {
    return null;
  }
}

/**
 * Set the session cookie in the HTTP response
 */
export async function setSessionCookie(token: string, rememberMe: boolean = false) {
  const cookieStore = await cookies();
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/**
 * Remove session cookie (Logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(MFA_COOKIE_NAME);
}

/**
 * Read the current session directly from cookies
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;

    return await verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Seed or get default administrator user if no user exists in DB
 */
export async function ensureDefaultAdminUser() {
  // Find or create default organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Buysoft Organization",
        email: "lielbritonunes@gmail.com",
        about: "Líder em soluções digitais e eventos corporativos de alta performance.",
        website: "https://buysoft.com.br",
        planName: "Trial Ativo (até 100 participantes)",
      },
    });
  }

  const defaultPassword = "Buysoft@2026";
  const passwordHash = await hashPassword(defaultPassword);

  const adminEmails = ["lielbritonunes@gmail.com", "lielbritonunesbuysoft@gmail.com"];

  for (const email of adminEmails) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: "Eliel Nunes",
          email,
          passwordHash,
          role: "admin",
          avatarInitials: "EN",
          organizationId: org.id,
          mfaEnabled: false,
        },
      });
    }
  }
}
