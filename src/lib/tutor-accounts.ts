import "server-only";
import { randomInt } from "node:crypto";
import { audit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";
import { sendMail, siteUrl } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// No look-alike characters (0/O, 1/l/I), so it's easy to read out or type from a message.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
export function temporaryPassword() {
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick(4)}-${pick(4)}-${pick(4)}`;
}

export type IssuedLogin =
  | { ok: true; name: string; email: string; password: string; emailed: boolean; created: boolean }
  | { ok: false; message: string };

/**
 * Gives a tutor a login (or a fresh password if they already have one).
 * Tutors can't sign up themselves; only an admin creates their accounts.
 */
export async function issueTutorLogin(tutorId: string, actorId: string): Promise<IssuedLogin> {
  const tutor = await prisma.tutor.findUnique({ where: { id: tutorId }, include: { user: true } });
  if (!tutor) return { ok: false, message: "Tutor not found." };
  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  let email: string;
  const created = !tutor.user;

  if (tutor.user) {
    email = tutor.user.email;
    await prisma.$transaction([
      prisma.user.update({ where: { id: tutor.user.id }, data: { passwordHash, mustChangePassword: true, active: true } }),
      prisma.session.deleteMany({ where: { userId: tutor.user.id } }),
    ]);
    await audit({ actorId, action: "tutor.password_reset", entity: "Tutor", entityId: tutor.id });
  } else {
    email = tutor.email.toLowerCase();
    const clash = await prisma.user.findUnique({ where: { email } });
    if (clash) return { ok: false, message: `${email} already belongs to another account (${clash.role.toLowerCase()}). Use a different email for this tutor.` };
    const user = await prisma.user.create({
      data: {
        name: tutor.name,
        email,
        phone: tutor.phone,
        role: "TUTOR",
        passwordHash,
        mustChangePassword: true,
        emailVerifiedAt: new Date(), // the admin vouches for the address
        tutor: { connect: { id: tutor.id } },
      },
    });
    await audit({ actorId, action: "tutor.login_created", entity: "Tutor", entityId: tutor.id, details: { userId: user.id } });
  }

  const first = tutor.name.split(" ")[0];
  const emailed = await sendMail({
    to: email,
    subject: created ? "Your Learning Hub Africa tutor account" : "Your new Learning Hub Africa password",
    heading: created ? "Your tutor account is ready" : "Your password was reset",
    paragraphs: [
      `Hi ${first},`,
      created
        ? "Learning Hub Africa has created a tutor account for you. Log in with the details below; you'll be asked to choose your own password straight away."
        : "An administrator has reset your password. Log in with the temporary password below, then choose a new one.",
      `Email: ${email}`,
      `Temporary password: ${password}`,
      ...(created ? ["Once you're in, add your profile, the courses you can teach and your weekly availability so we can match students to you."] : []),
    ],
    button: { label: "Log in", href: `${siteUrl()}/login` },
  });
  return { ok: true, name: tutor.name, email, password, emailed, created };
}
