import "server-only";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import type { Range } from "@/lib/schedule";
import {
  DEFAULT_WEIGHTS,
  allSlots,
  classMode,
  contains,
  findSessions,
  freeSlots,
  hours,
  intersect,
  rangesToSlots,
  score,
  type Mode,
  type ScoreBreakdown,
  type Slots,
  type Weights,
} from "./core";

type Tx = Prisma.TransactionClient;
const WEIGHTS_KEY = "matching.weights";
const LOCK_KEY = 4242; // serialises matching runs across servers

export const ALLOCATION_STATUS_LABELS: Record<string, string> = {
  AWAITING_ALLOCATION: "Awaiting allocation",
  CONFLICT_DETECTED: "Conflict detected",
  AWAITING_TUTOR_CONFIRMATION: "Awaiting tutor",
  AWAITING_STUDENT_CONFIRMATION: "Awaiting student",
  CONFIRMED: "Confirmed",
};

export async function getWeights(db: Tx | typeof prisma = prisma): Promise<Weights> {
  const row = await db.setting.findUnique({ where: { key: WEIGHTS_KEY } });
  return { ...DEFAULT_WEIGHTS, ...((row?.value as Partial<Weights>) ?? {}) };
}

export async function saveWeights(weights: Weights) {
  await prisma.setting.upsert({ where: { key: WEIGHTS_KEY }, update: { value: weights }, create: { key: WEIGHTS_KEY, value: weights } });
}

/* ---------- Loading everything the engine needs ---------- */

async function loadContext(tx: Tx) {
  const now = new Date();
  const [weights, packages, tutors, students, classes, locations] = await Promise.all([
    getWeights(tx),
    tx.package.findMany(),
    tx.tutor.findMany({
      where: { status: "APPROVED", active: true },
      include: { courses: { where: { approved: true }, select: { courseId: true } }, user: { include: { availability: true } } },
    }),
    tx.studentProfile.findMany({
      // Only students with a verified, current subscription can be matched (hard rule 3).
      where: {
        status: { notIn: ["SUSPENDED", "COMPLETED"] },
        packageId: { not: null },
        subscriptions: { some: { status: "ACTIVE", endsAt: { gt: now } } },
      },
      include: {
        user: { include: { availability: true } },
        timetableEntries: true,
        courses: { include: { course: true } },
        subscriptions: { where: { status: "ACTIVE" }, orderBy: { startsAt: "asc" }, take: 1 },
      },
    }),
    tx.tutorialClass.findMany({ where: { status: { not: "CANCELLED" } }, include: { sessions: true, members: true } }),
    tx.location.findMany({ where: { active: true }, orderBy: [{ kind: "desc" }, { name: "asc" }] }),
  ]);

  const tutorBusy = new Map<string, Range[]>();
  const studentBusy = new Map<string, Range[]>();
  const venueBusy = new Map<string, Range[]>();
  const push = (m: Map<string, Range[]>, k: string, r: Range[]) => m.set(k, [...(m.get(k) ?? []), ...r]);
  for (const c of classes) {
    push(tutorBusy, c.tutorId, c.sessions);
    if (c.locationId) push(venueBusy, c.locationId, c.sessions);
    for (const m of c.members) if (m.status !== "DECLINED") push(studentBusy, m.studentId, c.sessions);
  }

  return { weights, packages, tutors, students, classes, locations, tutorBusy, studentBusy, venueBusy, push };
}

type Ctx = Awaited<ReturnType<typeof loadContext>>;
type Student = Ctx["students"][number];
type Tutor = Ctx["tutors"][number];
type AllocationRow = Prisma.AllocationGetPayload<object>;

const bookedHours = (ctx: Ctx, tutorId: string) =>
  (ctx.tutorBusy.get(tutorId) ?? []).reduce((h, r) => h + (r.endMin - r.startMin) / 60, 0);

function studentFree(ctx: Ctx, s: Student): Slots {
  const avail = s.user.availability;
  return freeSlots(
    avail.filter((a) => a.kind === "AVAILABLE"),
    [...avail.filter((a) => a.kind === "UNAVAILABLE"), ...s.timetableEntries, ...(ctx.studentBusy.get(s.id) ?? [])],
  );
}

function tutorFree(ctx: Ctx, t: Tutor): Slots {
  const avail = t.user?.availability ?? [];
  return freeSlots(
    avail.filter((a) => a.kind === "AVAILABLE"),
    [...avail.filter((a) => a.kind === "UNAVAILABLE"), ...(ctx.tutorBusy.get(t.id) ?? [])],
  );
}

function venueFree(ctx: Ctx, locationId: string): Slots {
  const free = allSlots();
  for (const s of rangesToSlots(ctx.venueBusy.get(locationId) ?? [])) free.delete(s);
  return free;
}

/** Sessions (and a venue for in-person classes) inside `free`, or the reason there are none. */
function place(ctx: Ctx, free: Slots, mode: "IN_PERSON" | "ONLINE", pkg: Ctx["packages"][number], preferredLocationId: string | null) {
  const first = findSessions(free, pkg.sessionsPerWeek, pkg.sessionMinutes);
  if (!first) return { reason: "No shared free time" } as const;
  if (mode === "ONLINE") return { sessions: first, locationId: null } as const;
  const venues = [...ctx.locations].sort((a, b) => (a.id === preferredLocationId ? -1 : b.id === preferredLocationId ? 1 : 0));
  for (const v of venues) {
    const sessions = findSessions(intersect(free, venueFree(ctx, v.id)), pkg.sessionsPerWeek, pkg.sessionMinutes);
    if (sessions) return { sessions, locationId: v.id } as const;
  }
  return { reason: "No venue free at the shared times" } as const;
}

/* ---------- Matching one request ---------- */

type Candidate = {
  tutor: Tutor;
  partnerIds: string[]; // other students in the new class (semi-private / group)
  joinClassId?: string; // join an existing group class instead of creating one
  sessions: Range[];
  locationId: string | null;
  mode: "IN_PERSON" | "ONLINE";
  score: ScoreBreakdown;
};

type Decision = {
  notQualified: number; // tutors not approved for this course (not listed individually)
  at: string;
  package: string;
  course: string;
  candidates: { tutor: string; partners?: string[]; joinExisting?: boolean; score: number; breakdown: ScoreBreakdown }[];
  rejected: { tutor: string; reasons: string[] }[];
  outcome: string;
};

function scoreFor(ctx: Ctx, t: Tutor, students: Student[], overlap: Slots, neededHours: number): ScoreBreakdown {
  const parts = students.map((s) =>
    score(
      {
        sameDepartment: Boolean(t.departmentId && t.departmentId === s.departmentId),
        overlapHours: hours(overlap),
        neededHours,
        experienceYears: t.experienceYears ?? 0,
        modeExact: t.teachingMode === s.teachingMode,
        committedHours: bookedHours(ctx, t.id),
        maxWeeklyHours: t.maxWeeklyHours,
      },
      ctx.weights,
    ),
  );
  // Average across students so a group candidate is judged by how well it suits everyone.
  const avg = (k: keyof ScoreBreakdown) => Math.round((parts.reduce((a, p) => a + p[k], 0) / parts.length) * 10) / 10;
  return { competence: avg("competence"), schedule: avg("schedule"), experience: avg("experience"), requirements: avg("requirements"), workload: avg("workload"), total: avg("total") };
}

/** Hard checks that don't depend on time. Returns reasons the tutor can't take this request. */
function tutorBlockers(ctx: Ctx, t: Tutor, courseId: string, students: Student[], alloc: AllocationRow, neededHours: number) {
  const reasons: string[] = [];
  if (!t.courses.some((c) => c.courseId === courseId)) reasons.push("Not approved for this course");
  if (alloc.excludedTutorIds.includes(t.id)) reasons.push("Declined this request before");
  if (!classMode([t.teachingMode as Mode, ...students.map((s) => s.teachingMode as Mode)])) reasons.push("Teaching mode doesn't match");
  const booked = bookedHours(ctx, t.id);
  if (t.maxWeeklyHours - booked < neededHours) reasons.push(`Workload full (${booked} of ${t.maxWeeklyHours} h booked)`);
  if (!t.user?.availability.some((a) => a.kind === "AVAILABLE")) reasons.push("No availability set");
  return reasons;
}

function evaluate(ctx: Ctx, alloc: AllocationRow, pending: AllocationRow[], onlyTutorId?: string) {
  const student = ctx.students.find((s) => s.id === alloc.studentId)!;
  const pkg = ctx.packages.find((p) => p.id === student.packageId)!;
  const course = student.courses.find((c) => c.courseId === alloc.courseId)!.course;
  const courseName = course.code ?? course.title;
  const neededHours = (pkg.sessionsPerWeek * pkg.sessionMinutes) / 60;
  const sFree = studentFree(ctx, student);
  const tutors = ctx.tutors.filter((t) => !onlyTutorId || t.id === onlyTutorId);
  const candidates: Candidate[] = [];
  const rejected: Decision["rejected"] = [];
  const reject = (t: Tutor, reasons: string[]) => rejected.push({ tutor: t.name, reasons });
  const studentById = (id: string) => ctx.students.find((s) => s.id === id)!;

  // Other waiting requests for the same course and package (possible classmates).
  const peers = pending.filter((p) => p.id !== alloc.id && p.courseId === alloc.courseId && studentById(p.studentId).packageId === pkg.id);

  if (pkg.code === "GENERAL") {
    // First try joining an existing group class that still has room and fits the student's time.
    for (const c of ctx.classes) {
      if (c.courseId !== alloc.courseId || c.packageId !== pkg.id || alloc.excludedClassIds.includes(c.id)) continue;
      const t = ctx.tutors.find((x) => x.id === c.tutorId);
      if (!t || (onlyTutorId && t.id !== onlyTutorId)) continue;
      const members = c.members.filter((m) => m.status !== "DECLINED");
      if (members.length >= Math.min(pkg.capacity, t.maxClassCapacity)) continue;
      if (members.some((m) => m.studentId === student.id)) continue;
      const mode = student.teachingMode === "BOTH" || student.teachingMode === c.mode;
      if (!mode || !contains(sFree, c.sessions)) continue;
      candidates.push({ tutor: t, partnerIds: [], joinClassId: c.id, sessions: c.sessions, locationId: c.locationId, mode: c.mode as "IN_PERSON" | "ONLINE", score: scoreFor(ctx, t, [student], intersect(sFree, rangesToSlots(c.sessions)), neededHours) });
    }
  }

  for (const t of tutors) {
    const blockers = tutorBlockers(ctx, t, alloc.courseId, [student], alloc, neededHours);
    if (blockers.length) {
      reject(t, blockers);
      continue;
    }
    const tFree = tutorFree(ctx, t);

    if (pkg.code === "SEMI_PRIVATE") {
      // Exactly two students with overlapping free time, plus a tutor free at the same time.
      const partners = peers.filter((p) => !p.excludedTutorIds.includes(t.id));
      if (partners.length === 0) {
        reject(t, ["No second student available yet"]);
        continue;
      }
      const reasons = new Set<string>();
      for (const p of partners) {
        const partner = studentById(p.studentId);
        const mode = classMode([t.teachingMode as Mode, student.teachingMode as Mode, partner.teachingMode as Mode]);
        if (!mode) {
          reasons.add("Teaching mode doesn't match the partner");
          continue;
        }
        const free = intersect(sFree, studentFree(ctx, partner), tFree);
        const placed = place(ctx, free, mode, pkg, t.preferredLocationId);
        if ("reason" in placed) {
          reasons.add(placed.reason ?? "No shared free time");
          continue;
        }
        const sc = scoreFor(ctx, t, [student, partner], free, neededHours);
        // Same academic level breaks ties.
        if (partner.level === student.level) sc.total += 0.01;
        candidates.push({ tutor: t, partnerIds: [partner.id], sessions: placed.sessions, locationId: placed.locationId, mode, score: sc });
      }
      if (!candidates.some((c) => c.tutor.id === t.id)) reject(t, [...reasons]);
      continue;
    }

    const mode = classMode([t.teachingMode as Mode, student.teachingMode as Mode])!;
    let free = intersect(sFree, tFree);
    const partnerIds: string[] = [];
    if (pkg.code === "GENERAL") {
      // Grow the group greedily: add each waiting classmate (same level first) as long as
      // everyone still shares enough free time. This picks times that suit the most students.
      const cap = Math.min(pkg.capacity, t.maxClassCapacity) - 1;
      const pool = peers
        .map((p) => ({ p, s: studentById(p.studentId) }))
        .filter(({ p, s }) => !p.excludedTutorIds.includes(t.id) && (s.teachingMode === "BOTH" || s.teachingMode === mode))
        .sort((a, b) => Number(b.s.level === student.level) - Number(a.s.level === student.level));
      for (const { s } of pool) {
        if (partnerIds.length >= cap) break;
        const narrowed = intersect(free, studentFree(ctx, s));
        if (!("reason" in place(ctx, narrowed, mode, pkg, t.preferredLocationId))) {
          free = narrowed;
          partnerIds.push(s.id);
        }
      }
    }
    const placed = place(ctx, free, mode, pkg, t.preferredLocationId);
    if ("reason" in placed) {
      reject(t, [placed.reason ?? "No shared free time"]);
      continue;
    }
    candidates.push({ tutor: t, partnerIds, sessions: placed.sessions, locationId: placed.locationId, mode, score: scoreFor(ctx, t, [student], free, neededHours) });
  }

  // Groups: prefer filling an existing class over starting a new one; otherwise highest score wins.
  candidates.sort(
    (a, b) =>
      Number(Boolean(b.joinClassId)) - Number(Boolean(a.joinClassId)) ||
      (pkg.code === "GENERAL" ? b.partnerIds.length - a.partnerIds.length : 0) ||
      b.score.total - a.score.total,
  );
  const best = candidates[0] ?? null;

  const qualifiedRejections = rejected.filter((r) => !r.reasons.includes("Not approved for this course"));
  const notQualified = rejected.length - qualifiedRejections.length;
  const noTutorForCourse = !ctx.tutors.some((t) => t.courses.some((c) => c.courseId === alloc.courseId));
  const waitingForPartner = pkg.code === "SEMI_PRIVATE" && peers.length === 0;
  const status = best ? "MATCHED" : noTutorForCourse || waitingForPartner ? "AWAITING_ALLOCATION" : "CONFLICT_DETECTED";
  const reason = best
    ? null
    : noTutorForCourse
      ? `No approved tutor for ${courseName} yet`
      : waitingForPartner
        ? `Waiting for a second Semi-Private student taking ${courseName}`
        : summarise(qualifiedRejections);

  const decision: Decision = {
    notQualified,
    at: new Date().toISOString(),
    package: pkg.name,
    course: courseName,
    candidates: candidates.slice(0, 10).map((c) => ({
      tutor: c.tutor.name,
      partners: c.partnerIds.map((id) => studentById(id).studentCode),
      joinExisting: Boolean(c.joinClassId),
      score: Math.round(c.score.total * 10) / 10,
      breakdown: c.score,
    })),
    rejected: qualifiedRejections,
    outcome: best ? `Proposed ${best.tutor.name}${best.joinClassId ? " (existing group)" : ""}` : (reason ?? "No match"),
  };
  return { best, status, reason, decision, pkg, student, allRejected: rejected };
}

function summarise(rejected: Decision["rejected"]) {
  const counts = new Map<string, number>();
  for (const r of rejected) for (const reason of r.reasons) counts.set(reason, (counts.get(reason) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  return top.length ? top.map(([r, n]) => `${r} (${n} tutor${n === 1 ? "" : "s"})`).join("; ") : "No suitable tutor";
}

/* ---------- Writing results ---------- */

async function apply(tx: Tx, ctx: Ctx, alloc: AllocationRow, pending: AllocationRow[], result: ReturnType<typeof evaluate>, manual: boolean) {
  const { best, decision } = result;
  if (!best) {
    await tx.allocation.update({ where: { id: alloc.id }, data: { status: result.status, reason: result.reason, score: null, decision, classId: null } });
    return false;
  }

  let classId = best.joinClassId;
  let classStatus = "AWAITING_TUTOR";
  const studentIds = [alloc.studentId, ...best.partnerIds];

  if (classId) {
    const existing = ctx.classes.find((c) => c.id === classId)!;
    classStatus = existing.status;
    await tx.classMember.create({ data: { classId, studentId: alloc.studentId } });
    existing.members.push({ classId, studentId: alloc.studentId, status: "PROPOSED", respondedAt: null });
  } else {
    const created = await tx.tutorialClass.create({
      data: {
        courseId: alloc.courseId,
        packageId: result.pkg.id,
        tutorId: best.tutor.id,
        locationId: best.locationId,
        mode: best.mode,
        manual,
        sessions: { create: best.sessions.map(({ day, startMin, endMin }) => ({ day, startMin, endMin })) },
        members: { create: studentIds.map((studentId) => ({ studentId })) },
      },
      include: { sessions: true, members: true },
    });
    classId = created.id;
    ctx.classes.push(created);
    ctx.push(ctx.tutorBusy, best.tutor.id, best.sessions);
    if (best.locationId) ctx.push(ctx.venueBusy, best.locationId, best.sessions);
  }
  for (const id of studentIds) ctx.push(ctx.studentBusy, id, best.sessions);

  const status = classStatus === "AWAITING_TUTOR" ? "AWAITING_TUTOR_CONFIRMATION" : "AWAITING_STUDENT_CONFIRMATION";
  for (const id of studentIds) {
    const a = id === alloc.studentId ? alloc : pending.find((p) => p.studentId === id && p.courseId === alloc.courseId)!;
    await tx.allocation.update({
      where: { id: a.id },
      data: { status, classId, reason: manual ? "Manually assigned by staff" : null, score: best.score.total, decision: { ...decision, outcome: id === alloc.studentId ? decision.outcome : `Grouped with ${result.student.studentCode}` } },
    });
  }
  return true;
}

/** Make sure every paid student has one allocation row per course they asked for. */
async function ensureAllocations(tx: Tx, ctx: Ctx) {
  const rows = ctx.students.flatMap((s) => s.courses.map((c) => ({ studentId: s.id, courseId: c.courseId })));
  if (rows.length) await tx.allocation.createMany({ data: rows, skipDuplicates: true });
}

function pendingAllocations(ctx: Ctx, all: AllocationRow[]) {
  const eligible = new Map(ctx.students.map((s) => [s.id, s]));
  const wanted = new Set(ctx.students.flatMap((s) => s.courses.map((c) => `${s.id}:${c.courseId}`)));
  // Earliest-paid students are matched first.
  const paidAt = (id: string) => eligible.get(id)?.subscriptions[0]?.startsAt?.getTime() ?? Infinity;
  return all
    .filter((a) => ["AWAITING_ALLOCATION", "CONFLICT_DETECTED"].includes(a.status) && wanted.has(`${a.studentId}:${a.courseId}`))
    .sort((a, b) => paidAt(a.studentId) - paidAt(b.studentId) || a.createdAt.getTime() - b.createdAt.getTime());
}

async function withLock<T>(fn: (tx: Tx) => Promise<T>) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${LOCK_KEY})`;
      return fn(tx);
    },
    { timeout: 60_000, maxWait: 20_000 },
  );
}

/** Match every waiting request. Safe to call any time; runs are serialised by a database lock. */
export async function runMatching(actorId?: string | null) {
  return withLock(async (tx) => {
    const ctx = await loadContext(tx);
    await ensureAllocations(tx, ctx);
    const all = await tx.allocation.findMany();
    let pending = pendingAllocations(ctx, all);
    const summary = { considered: pending.length, matched: 0, waiting: 0, conflicts: 0 };

    while (pending.length) {
      const alloc = pending[0];
      const result = evaluate(ctx, alloc, pending);
      const matched = await apply(tx, ctx, alloc, pending, result, false);
      const done = new Set([alloc.id]);
      if (matched) {
        summary.matched += 1 + result.best!.partnerIds.length;
        for (const id of result.best!.partnerIds) {
          const p = pending.find((x) => x.studentId === id && x.courseId === alloc.courseId);
          if (p) done.add(p.id);
        }
      } else if (result.status === "CONFLICT_DETECTED") summary.conflicts++;
      else summary.waiting++;
      pending = pending.filter((p) => !done.has(p.id));
    }

    await syncStudentStatuses(tx, ctx.students.map((s) => s.id));
    await audit({ actorId, action: "matching.run", entity: "Allocation", details: summary }, tx);
    return summary;
  });
}

/** Staff choose the tutor; the engine still enforces every hard rule and finds the times. */
export async function assignManually(allocationId: string, tutorId: string, actorId: string) {
  return withLock(async (tx) => {
    const ctx = await loadContext(tx);
    const alloc = await tx.allocation.findUniqueOrThrow({ where: { id: allocationId } });
    if (!["AWAITING_ALLOCATION", "CONFLICT_DETECTED"].includes(alloc.status)) return { ok: false, message: "This request is no longer waiting." };
    if (!ctx.students.some((s) => s.id === alloc.studentId)) return { ok: false, message: "This student doesn't have an active, verified subscription." };
    const pending = pendingAllocations(ctx, await tx.allocation.findMany());
    const result = evaluate(ctx, alloc, pending, tutorId);
    if (!result.best) {
      const why = result.allRejected.find((r) => r.reasons.length)?.reasons.join("; ") ?? result.reason ?? "No valid times";
      return { ok: false, message: `Can't assign this tutor: ${why}.` };
    }
    await apply(tx, ctx, alloc, pending, result, true);
    await syncStudentStatuses(tx, [alloc.studentId, ...result.best.partnerIds]);
    await audit({ actorId, action: "matching.manual_assign", entity: "Allocation", entityId: alloc.id, details: { tutorId } }, tx);
    return { ok: true, message: `Proposed ${result.best.tutor.name}. Waiting for the tutor to confirm.` };
  });
}

/** Students with at least one confirmed class are "Allocated"; paid students still waiting stay in the queue. */
export async function syncStudentStatuses(tx: Tx, studentIds: string[]) {
  if (!studentIds.length) return;
  const confirmed = await tx.allocation.findMany({ where: { studentId: { in: studentIds }, status: "CONFIRMED" }, select: { studentId: true } });
  const withClass = new Set(confirmed.map((c) => c.studentId));
  await tx.studentProfile.updateMany({ where: { id: { in: [...withClass] }, status: "AWAITING_ALLOCATION" }, data: { status: "ALLOCATED" } });
  await tx.studentProfile.updateMany({ where: { id: { in: studentIds.filter((id) => !withClass.has(id)) }, status: "ALLOCATED" }, data: { status: "AWAITING_ALLOCATION" } });
}
