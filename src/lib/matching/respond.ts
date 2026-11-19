import "server-only";
import { after } from "next/server";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { runMatching, syncStudentStatuses } from "./run";

/**
 * Re-run matching after the current response is sent (payments, approvals, availability
 * changes and declines can all open up new matches). Errors are logged, never shown to users.
 */
export function scheduleMatching() {
  after(async () => {
    try {
      await runMatching(null);
    } catch (error) {
      console.error("Matching run failed", error);
    }
  });
}

/** Tutor accepts or declines a proposed class. */
export async function tutorRespond(classId: string, tutorId: string, accept: boolean, actorId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const cls = await tx.tutorialClass.findFirst({ where: { id: classId, tutorId, status: "AWAITING_TUTOR" }, include: { members: true } });
    if (!cls) return { ok: false, message: "This request is no longer waiting for you." };
    const memberIds = cls.members.filter((m) => m.status !== "DECLINED").map((m) => m.studentId);

    if (accept) {
      await tx.tutorialClass.update({ where: { id: classId }, data: { status: "AWAITING_STUDENTS" } });
      await tx.allocation.updateMany({ where: { classId }, data: { status: "AWAITING_STUDENT_CONFIRMATION" } });
    } else {
      await tx.tutorialClass.update({ where: { id: classId }, data: { status: "CANCELLED" } });
      // Back to the queue, and never offer this tutor for these requests again.
      const allocs = await tx.allocation.findMany({ where: { classId } });
      for (const a of allocs) {
        await tx.allocation.update({
          where: { id: a.id },
          data: { status: "AWAITING_ALLOCATION", classId: null, score: null, reason: "Tutor declined; re-matching", excludedTutorIds: { push: tutorId } },
        });
      }
    }
    await audit({ actorId, action: accept ? "class.tutor_accepted" : "class.tutor_declined", entity: "TutorialClass", entityId: classId, details: { students: memberIds } }, tx);
    return { ok: true, message: accept ? "Accepted. We've asked the student(s) to confirm." : "Declined. We'll find another tutor." };
  });
  if (result.ok && !accept) scheduleMatching();
  return result;
}

/** Student accepts or declines a proposed class (after the tutor has accepted). */
export async function studentRespond(classId: string, studentId: string, accept: boolean, actorId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const cls = await tx.tutorialClass.findFirst({
      where: { id: classId, status: { in: ["AWAITING_STUDENTS", "CONFIRMED"] }, members: { some: { studentId, status: "PROPOSED" } } },
      include: { members: true, package: true },
    });
    if (!cls) return { ok: false, message: "This proposal is no longer open." };

    await tx.classMember.update({
      where: { classId_studentId: { classId, studentId } },
      data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
    });

    if (accept) {
      const others = cls.members.filter((m) => m.studentId !== studentId && m.status !== "DECLINED");
      const allAccepted = others.every((m) => m.status === "ACCEPTED");
      if (cls.status === "CONFIRMED") {
        // Joining a group that is already running.
        await tx.allocation.updateMany({ where: { classId, studentId }, data: { status: "CONFIRMED", reason: null } });
      } else if (allAccepted) {
        await tx.tutorialClass.update({ where: { id: classId }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
        await tx.allocation.updateMany({ where: { classId }, data: { status: "CONFIRMED", reason: null } });
      }
    } else {
      await tx.allocation.updateMany({
        where: { classId, studentId },
        data: { status: "AWAITING_ALLOCATION", classId: null, score: null, reason: "Student declined; re-matching", excludedClassIds: { push: classId } },
      });
      const remaining = cls.members.filter((m) => m.studentId !== studentId && m.status !== "DECLINED");
      // Private and semi-private classes only exist with their full set of students.
      if (cls.package.code !== "GENERAL" || remaining.length === 0) {
        await tx.tutorialClass.update({ where: { id: classId }, data: { status: "CANCELLED" } });
        await tx.allocation.updateMany({ where: { classId }, data: { status: "AWAITING_ALLOCATION", classId: null, score: null, reason: "Classmate declined; re-matching" } });
      } else if (cls.status === "AWAITING_STUDENTS" && remaining.every((m) => m.status === "ACCEPTED")) {
        await tx.tutorialClass.update({ where: { id: classId }, data: { status: "CONFIRMED", confirmedAt: new Date() } });
        await tx.allocation.updateMany({ where: { classId }, data: { status: "CONFIRMED", reason: null } });
      }
    }
    await syncStudentStatuses(tx, cls.members.map((m) => m.studentId));
    await audit({ actorId, action: accept ? "class.student_accepted" : "class.student_declined", entity: "TutorialClass", entityId: classId, details: { studentId } }, tx);
    return { ok: true, message: accept ? "Confirmed. See you in class!" : "Declined. We'll look for another option." };
  });
  if (result.ok && !accept) scheduleMatching();
  return result;
}

/** Staff cancel a class; its students go back to the matching queue. */
export async function cancelClass(classId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    const cls = await tx.tutorialClass.update({ where: { id: classId }, data: { status: "CANCELLED" }, include: { members: true } });
    await tx.allocation.updateMany({ where: { classId }, data: { status: "AWAITING_ALLOCATION", classId: null, score: null, reason: "Class cancelled by staff" } });
    await syncStudentStatuses(tx, cls.members.map((m) => m.studentId));
    await audit({ actorId, action: "class.cancelled", entity: "TutorialClass", entityId: classId }, tx);
  });
}
