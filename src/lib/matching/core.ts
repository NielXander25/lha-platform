// Pure scheduling and scoring logic for the matching engine. No database access here, so it
// can be tested in isolation. Time is handled as 30-minute slots: slot = day * 1440 + minute.

import { GRID_END, GRID_START, SLOT_MINUTES, type Range } from "@/lib/schedule";

export type Mode = "IN_PERSON" | "ONLINE" | "BOTH";
export type Slots = Set<number>;

export const slot = (day: number, min: number) => day * 1440 + min;

/** Every bookable slot in the week (the same hours the availability grid shows). */
export function allSlots(): Slots {
  const out = new Set<number>();
  for (let day = 0; day < 7; day++) for (let m = GRID_START; m < GRID_END; m += SLOT_MINUTES) out.add(slot(day, m));
  return out;
}

export function rangesToSlots(ranges: Range[]): Slots {
  const out = new Set<number>();
  for (const r of ranges) {
    const start = Math.floor(r.startMin / SLOT_MINUTES) * SLOT_MINUTES;
    for (let m = start; m < r.endMin; m += SLOT_MINUTES) out.add(slot(r.day, m));
  }
  return out;
}

/** Free time = what someone marked available, minus everything that blocks it. */
export function freeSlots(available: Range[], blocked: Range[]): Slots {
  const free = rangesToSlots(available);
  for (const s of rangesToSlots(blocked)) free.delete(s);
  return free;
}

export function intersect(...sets: Slots[]): Slots {
  if (sets.length === 0) return new Set();
  const [first, ...rest] = [...sets].sort((a, b) => a.size - b.size);
  const out = new Set<number>();
  for (const s of first) if (rest.every((r) => r.has(s))) out.add(s);
  return out;
}

export const hours = (slots: Slots) => (slots.size * SLOT_MINUTES) / 60;

export function contains(free: Slots, sessions: Range[]) {
  return [...rangesToSlots(sessions)].every((s) => free.has(s));
}

/**
 * Choose `count` weekly sessions of `minutes` each, on different days, fully inside `free`.
 * Prefers days spread through the week, then earlier start times. Returns null if impossible.
 */
export function findSessions(free: Slots, count: number, minutes: number): Range[] | null {
  const need = Math.ceil(minutes / SLOT_MINUTES);
  const firstWindow = new Map<number, number>(); // day -> earliest start that fits
  for (let day = 0; day < 7; day++) {
    for (let m = GRID_START; m + minutes <= GRID_END; m += SLOT_MINUTES) {
      let ok = true;
      for (let i = 0; i < need && ok; i++) ok = free.has(slot(day, m + i * SLOT_MINUTES));
      if (ok) {
        firstWindow.set(day, m);
        break;
      }
    }
  }
  const days = [...firstWindow.keys()];
  if (days.length < count) return null;

  let best: number[] | null = null;
  let bestGap = -1;
  for (const combo of combinations(days, count)) {
    const gap = count === 1 ? 7 : Math.min(...combo.slice(1).map((d, i) => d - combo[i]));
    if (gap > bestGap) {
      best = combo;
      bestGap = gap;
    }
  }
  return best!.map((day) => ({ day, startMin: firstWindow.get(day)!, endMin: firstWindow.get(day)! + minutes }));
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [head, ...tail] = items;
  return [...combinations(tail, k - 1).map((c) => [head, ...c]), ...combinations(tail, k)];
}

/** The mode a class would run in for these people, or null if they can't agree. */
export function classMode(modes: Mode[]): "IN_PERSON" | "ONLINE" | null {
  const inPerson = modes.every((m) => m === "IN_PERSON" || m === "BOTH");
  if (inPerson) return "IN_PERSON"; // campus first: tutorials are held at AFIT
  const online = modes.every((m) => m === "ONLINE" || m === "BOTH");
  return online ? "ONLINE" : null;
}

/* ---------- Scoring ---------- */

export type Weights = { competence: number; schedule: number; experience: number; requirements: number; workload: number };

export const DEFAULT_WEIGHTS: Weights = { competence: 35, schedule: 30, experience: 15, requirements: 10, workload: 10 };

export type ScoreInput = {
  sameDepartment: boolean; // tutor's department matches the student's
  overlapHours: number; // shared free time between student(s) and tutor
  neededHours: number; // weekly hours the class needs
  experienceYears: number;
  modeExact: boolean; // tutor's stated mode equals the student's stated mode
  committedHours: number; // tutor's weekly hours already booked
  maxWeeklyHours: number;
};

export type ScoreBreakdown = Weights & { total: number };

/**
 * Score a candidate from 0 to 100. Each factor is 0..1, multiplied by its weight; weights are
 * normalised so they always add up to 100. Hard constraints are checked before this is called.
 */
export function score(input: ScoreInput, weights: Weights): ScoreBreakdown {
  const factors: Weights = {
    // Approval for the course is a hard rule; a tutor from the student's own department ranks higher.
    competence: input.sameDepartment ? 1 : 0.8,
    // More shared free time than strictly needed means a more comfortable, reschedulable fit.
    schedule: Math.min(1, input.overlapHours / Math.max(1, input.neededHours * 2)),
    experience: Math.min(input.experienceYears, 10) / 10,
    requirements: input.modeExact ? 1 : 0.7,
    // Prefer tutors with lighter loads so work is spread fairly.
    workload: input.maxWeeklyHours > 0 ? Math.max(0, 1 - input.committedHours / input.maxWeeklyHours) : 0,
  };
  const sum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const parts = Object.fromEntries(
    (Object.keys(factors) as (keyof Weights)[]).map((k) => [k, Math.round(((factors[k] * weights[k]) / sum) * 1000) / 10]),
  ) as Weights;
  const total = Math.round(Object.values(parts).reduce((a, b) => a + b, 0) * 10) / 10;
  return { ...parts, total };
}
