import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { prisma } from "@/lib/prisma";
import { needsEmailVerification } from "@/lib/verification";

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const ROLES = ["STUDENT", "TUTOR", "ADMIN", "FINANCE", "SUPPORT"] as const;
export type Role = (typeof ROLES)[number];
export const STAFF_ROLES: Role[] = ["ADMIN", "FINANCE", "SUPPORT"];

export { SESSION_COOKIE };
const SESSION_DAYS = 14;

/* ---------- Passwords (scrypt, per-password random salt) ---------- */

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/* ---------- Sessions ---------- */

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

// The signed-in user for this request, or null. Cached per request.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { id: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return session.user;
});

/** Use in pages/layouts: sends visitors without the right role elsewhere. */
export async function requireUser(roles?: readonly Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (needsEmailVerification(user)) redirect("/verify-email");
  if (roles && !roles.includes(user.role as Role)) redirect(homeFor(user.role));
  return user;
}

/** Use in Server Actions and route handlers: throws instead of redirecting. */
export async function assertRole(roles: readonly Role[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role as Role) || needsEmailVerification(user)) throw new Error("Unauthorized");
  return user;
}

export function homeFor(role: string) {
  if (role === "STUDENT") return "/portal";
  if (role === "TUTOR") return "/tutor";
  return "/admin";
}
