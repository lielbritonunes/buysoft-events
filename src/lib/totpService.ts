import crypto from "crypto";
import QRCode from "qrcode";

// Base32 RFC 4648 Alphabet
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encode a Buffer to a Base32 string
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode a Base32 string to a Buffer
 */
export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const index = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a cryptographically secure random Base32 TOTP secret (20 bytes / 160 bits)
 */
export function generateTotpSecret(): string {
  const randomBytes = crypto.randomBytes(20);
  return base32Encode(randomBytes);
}

/**
 * Calculate TOTP 6-digit code for a given secret and counter (RFC 6238 / RFC 4226)
 */
export function generateTotpCode(secretBase32: string, timeStep: number = 30, timestampMs: number = Date.now()): string {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(timestampMs / 1000 / timeStep);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const codeInt =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const token = (codeInt % 1_000_000).toString().padStart(6, "0");
  return token;
}

/**
 * Verify a 6-digit TOTP code against a secret with ±1 time window drift (30 seconds before/after)
 */
export function verifyTotpCode(
  secretBase32: string,
  userCode: string,
  timeStep: number = 30,
  window: number = 1
): boolean {
  if (!userCode || userCode.trim().length !== 6) return false;
  const sanitizedCode = userCode.trim();

  const now = Date.now();
  const stepMs = timeStep * 1000;

  for (let i = -window; i <= window; i++) {
    const targetTime = now + i * stepMs;
    const expected = generateTotpCode(secretBase32, timeStep, targetTime);
    if (crypto.timingSafeEqual(Buffer.from(sanitizedCode), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}

/**
 * Generate standard otpauth URI for Google Authenticator / 1Password
 */
export function getTotpUri(email: string, secretBase32: string, issuer: string = "Buysoft Events"): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const encodedIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generate QR code as a base64 Data URL
 */
export async function generateQrCodeDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    width: 250,
    margin: 2,
    color: {
      dark: "#090d16",
      light: "#ffffff",
    },
  });
}

/**
 * Generate 8 random backup codes (format: XXXX-XXXX) and their SHA-256 hashes
 */
export function generateBackupCodes(): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // readable chars (excluding easily confused 0/O, 1/I)

  for (let i = 0; i < 8; i++) {
    let part1 = "";
    let part2 = "";
    const rand = crypto.randomBytes(8);
    for (let j = 0; j < 4; j++) {
      part1 += chars[rand[j] % chars.length];
      part2 += chars[rand[j + 4] % chars.length];
    }
    const code = `${part1}-${part2}`;
    plainCodes.push(code);

    const hash = crypto.createHash("sha256").update(code).digest("hex");
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
}

/**
 * Verify and consume a backup code from the hashed list
 */
export function verifyAndConsumeBackupCode(
  inputCode: string,
  hashedCodes: string[]
): { valid: boolean; remainingHashedCodes: string[] } {
  const normalized = inputCode.trim().toUpperCase();
  const inputHash = crypto.createHash("sha256").update(normalized).digest("hex");

  const index = hashedCodes.indexOf(inputHash);
  if (index !== -1) {
    const updated = [...hashedCodes];
    updated.splice(index, 1);
    return { valid: true, remainingHashedCodes: updated };
  }

  return { valid: false, remainingHashedCodes: hashedCodes };
}
