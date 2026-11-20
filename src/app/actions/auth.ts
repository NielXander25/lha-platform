"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { endSession, getCurrentUser, hashPassword, homeFor, startSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkVerificationCode, needsEmailVerification, sendVerificationCode } from "@/lib/verification";
import { nextStudentCode } from "@/lib/students";

export type FormState = { error?: string; fields?: Record<string, string> };

const fieldsOf = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$") && k !== "password").map(([k, v]) => [k, v as string]));

const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

/* ---------- Log in ---------- */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", fields: fieldsOf(fd) };

  // Simple brute-force protection: too many recent failures for this email blocks login for a while.
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  const failures = await prisma.auditLog.count({ where: { action: "auth.login_failed", entityId: email, createdAt: { gte: since } } });
  if (failures >= MAX_FAILED_LOGINS) {
    return { error: `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`, fields: fieldsOf(fd) };
  }

  let user = await prisma.user.findUnique({ where: { email } });

  // First-run bootstrap: the very first administrator is created from ADMIN_EMAIL / ADMIN_PASSWORD.
  if (!user && email === process.env.ADMIN_EMAIL?.toLowerCase() && password === process.env.ADMIN_PASSWORD) {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins === 0) {
      user = await prisma.user.create({
        data: { email, name: "Administrator", role: "ADMIN", passwordHash: await hashPassword(password) },
      });
      await audit({ actorId: user.id, action: "auth.admin_bootstrapped", entity: "User", entityId: user.id });
    }
  }

  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    await audit({ action: "auth.login_failed", entity: "User", entityId: email });
    return { error: "That email and password don't match.", fields: fieldsOf(fd) };
  }

  await startSession(user.id);
  if (needsEmailVerification(user)) {
    // Send a code if they don't already have a usable one.
    const live = await prisma.emailCode.count({ where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } } });
    if (!live) await sendVerificationCode(user);
    redirect("/verify-email");
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : homeFor(user.role));
}

export async function logout() {
  await endSession();
  redirect("/");
}

/* ---------- Register ---------- */

const AccountSchema = z.object({
  name: z.string().trim().min(3, "Enter your full name."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number."),
  password: z.string().min(8, "Use at least 8 characters for your password."),
  consent: z.literal("on", { error: "Please agree to how we use your information." }),
});

async function createAccount(fd: FormData) {
  const parsed = AccountSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;
  const { name, email, phone, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists. Log in instead." } as const;
  }
  return { data: { name, email, phone, passwordHash: await hashPassword(password) } } as const;
}

export async function registerStudent(_: FormState, fd: FormData): Promise<FormState> {
  const account = await createAccount(fd);
  if ("error" in account) return { error: account.error, fields: fieldsOf(fd) };

  const pkg = String(fd.get("package") ?? "");
  const course = String(fd.get("course") ?? "");
  const [chosenPackage, chosenCourse] = await Promise.all([
    pkg ? prisma.package.findFirst({ where: { code: pkg, active: true } }) : null,
    course ? prisma.course.findFirst({ where: { slug: course, active: true } }) : null,
  ]);

  // Student IDs are sequential; retry if two people register at the same moment.
  let user;
  for (let attempt = 0; attempt < 5 && !user; attempt++) {
    try {
      user = await prisma.user.create({
        data: {
          ...account.data,
          role: "STUDENT",
          student: {
            create: {
              studentCode: await nextStudentCode(),
              packageId: chosenPackage?.id,
              courses: chosenCourse ? { create: { courseId: chosenCourse.id } } : undefined,
            },
          },
        },
        include: { student: true },
      });
    } catch (e) {
      if (!(e instanceof Error && e.message.includes("Unique constraint"))) throw e;
    }
  }
  if (!user) return { error: "Something went wrong. Please try again.", fields: fieldsOf(fd) };

  await audit({ actorId: user.id, action: "student.registered", entity: "StudentProfile", entityId: user.student?.id, details: { studentCode: user.student?.studentCode } });
  await startSession(user.id);
  if (needsEmailVerification(user)) {
    await sendVerificationCode(user);
    redirect("/verify-email");
  }
  redirect("/portal/profile");
}

/* ---------- Email verification ---------- */

export async function verifyEmail(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!needsEmailVerification(user)) redirect(homeFor(user.role));
  const result = await checkVerificationCode(user.id, String(fd.get("code") ?? ""));
  if (!result.ok) return { error: result.message };
  await audit({ actorId: user.id, action: "auth.email_verified", entity: "User", entityId: user.id });
  redirect(`${user.role === "TUTOR" ? "/tutor/profile" : "/portal/profile"}?ok=${encodeURIComponent("Email confirmed. Welcome!")}`);
}

export async function resendVerificationCode(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!needsEmailVerification(user)) redirect(homeFor(user.role));
  const result = await sendVerificationCode(user);
  redirect(`/verify-email?${result.ok ? "sent=1" : `error=${encodeURIComponent(result.message)}`}`);
}

/* ---------- Password ---------- */

const NewPasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: z.string().min(8, "Use at least 8 characters for your new password."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "The two new passwords don't match.", path: ["confirm"] })
  .refine((d) => d.password !== d.current, { message: "Choose a password different from the current one.", path: ["password"] });

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const parsed = NewPasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!(await verifyPassword(parsed.data.current, user.passwordHash))) return { error: "Your current password isn't right." };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password), mustChangePassword: false } });
  await audit({ actorId: user.id, action: "auth.password_changed", entity: "User", entityId: user.id });
  redirect(`${homeFor(user.role)}?ok=${encodeURIComponent("Password saved. Use it next time you log in.")}`);
}
