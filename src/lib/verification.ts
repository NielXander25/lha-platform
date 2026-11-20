import "server-only";
import { createHash, randomInt } from "node:crypto";
import type { User } from "@prisma/client";
import { emailConfigured, sendMail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const CODE_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;

/** Students and tutors confirm their email; staff accounts are created by an admin. */
export function needsEmailVerification(user: Pick<User, "role" | "emailVerifiedAt">) {
  return emailConfigured() && !user.emailVerifiedAt && (user.role === "STUDENT" || user.role === "TUTOR");
}

const hashCode = (userId: string, code: string) => createHash("sha256").update(`${userId}:${code}`).digest("hex");

export type SendResult = { ok: true } | { ok: false; message: string };

/** Emails a fresh 6-digit code, replacing any earlier one. Rate limited per account. */
export async function sendVerificationCode(user: Pick<User, "id" | "email" | "name">): Promise<SendResult> {
  const recent = await prisma.emailCode.findMany({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < RESEND_SECONDS * 1000) {
    return { ok: false, message: "We've just sent a code. Please wait a minute before asking for another." };
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    return { ok: false, message: "Too many codes requested. Please try again in an hour." };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.$transaction([
    prisma.emailCode.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.emailCode.create({ data: { userId: user.id, codeHash: hashCode(user.id, code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000) } }),
  ]);
  const sent = await sendMail({
    to: user.email,
    subject: `${code} is your Learning Hub Africa code`,
    heading: "Confirm your email",
    paragraphs: [`Hi ${user.name.split(" ")[0]},`, `Enter this code to confirm your email address. It expires in ${CODE_MINUTES} minutes.`],
    code,
  });
  if (!sent) return { ok: false, message: "We couldn't send the email just now. Please try again shortly." };
  return { ok: true };
}

/** Checks a code. On success the account is marked verified. */
export async function checkVerificationCode(userId: string, raw: string): Promise<SendResult> {
  const code = raw.replace(/\D/g, "");
  if (code.length !== 6) return { ok: false, message: "Enter the 6-digit code from the email." };
  const current = await prisma.emailCode.findFirst({ where: { userId, usedAt: null }, orderBy: { createdAt: "desc" } });
  if (!current || current.expiresAt < new Date() || current.attempts >= MAX_ATTEMPTS) {
    return { ok: false, message: "That code has expired. Tap “Send a new code” below." };
  }
  if (current.codeHash !== hashCode(userId, code)) {
    const attempts = current.attempts + 1;
    await prisma.emailCode.update({ where: { id: current.id }, data: { attempts } });
    return {
      ok: false,
      message: attempts >= MAX_ATTEMPTS ? "Too many wrong tries. Tap “Send a new code” below." : "That code isn't right. Check the email and try again.",
    };
  }
  await prisma.$transaction([
    prisma.emailCode.update({ where: { id: current.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } }),
  ]);
  return { ok: true };
}
