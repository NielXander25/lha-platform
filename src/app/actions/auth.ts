"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { endSession, hashPassword, homeFor, startSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  redirect("/portal/profile");
}

export async function registerTutor(_: FormState, fd: FormData): Promise<FormState> {
  const account = await createAccount(fd);
  if ("error" in account) return { error: account.error, fields: fieldsOf(fd) };

  // An admin may already have added this person as a tutor; link the account instead of duplicating.
  const existing = await prisma.tutor.findUnique({ where: { email: account.data.email } });
  if (existing?.userId) return { error: "An account with that email already exists. Log in instead.", fields: fieldsOf(fd) };

  const user = await prisma.user.create({
    data: {
      ...account.data,
      role: "TUTOR",
      tutor: existing
        ? { connect: { id: existing.id } }
        : { create: { name: account.data.name, email: account.data.email, phone: account.data.phone, subjects: "" } },
    },
  });
  await audit({ actorId: user.id, action: "tutor.registered", entity: "User", entityId: user.id });
  await startSession(user.id);
  redirect("/tutor/profile");
}
