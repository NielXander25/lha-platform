// Weekly time helpers. Days are 0 = Monday ... 6 = Sunday; times are minutes from midnight.

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const SLOT_MINUTES = 30;
export const GRID_START = 7 * 60; // 07:00
export const GRID_END = 21 * 60; // 21:00

export function formatTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "14:30" -> 870. Returns null for anything invalid. */
export function parseTime(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export const toHHMM = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export type Range = { day: number; startMin: number; endMin: number };

/** Merge selected slot start times into contiguous ranges per day. */
export function slotsToRanges(slots: { day: number; startMin: number }[]): Range[] {
  const byDay = new Map<number, number[]>();
  for (const s of slots) byDay.set(s.day, [...(byDay.get(s.day) ?? []), s.startMin]);
  const out: Range[] = [];
  for (const [day, starts] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    const sorted = [...new Set(starts)].sort((a, b) => a - b);
    let start = sorted[0];
    let prev = sorted[0];
    for (const t of sorted.slice(1)) {
      if (t !== prev + SLOT_MINUTES) {
        out.push({ day, startMin: start, endMin: prev + SLOT_MINUTES });
        start = t;
      }
      prev = t;
    }
    out.push({ day, startMin: start, endMin: prev + SLOT_MINUTES });
  }
  return out;
}

export const overlaps = (a: Range, b: Range) =>
  a.day === b.day && a.startMin < b.endMin && b.startMin < a.endMin;

export function totalHours(ranges: Range[]) {
  return ranges.reduce((sum, r) => sum + (r.endMin - r.startMin), 0) / 60;
}
