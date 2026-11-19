import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in student's profile (redirects anyone else). */
export const currentStudent = cache(async () => {
  const user = await requireUser(["STUDENT"]);
  const student = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
  if (!student) redirect("/");
  return { user, student };
});

/** The signed-in tutor's profile (redirects anyone else). */
export const currentTutor = cache(async () => {
  const user = await requireUser(["TUTOR"]);
  const tutor = await prisma.tutor.findUnique({ where: { userId: user.id } });
  if (!tutor) redirect("/");
  return { user, tutor };
});
