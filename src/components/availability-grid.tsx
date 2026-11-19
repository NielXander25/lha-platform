"use client";

import { useRef, useState } from "react";
import { DAYS_SHORT, GRID_END, GRID_START, SLOT_MINUTES, formatTime, type Range } from "@/lib/schedule";
import { cn } from "@/lib/utils";

type Mode = "AVAILABLE" | "UNAVAILABLE" | "CLEAR";
const key = (day: number, start: number) => `${day}:${start}`;
const SLOTS = Array.from({ length: (GRID_END - GRID_START) / SLOT_MINUTES }, (_, i) => GRID_START + i * SLOT_MINUTES);

function rangesToSet(ranges: Range[]) {
  const set = new Set<string>();
  for (const r of ranges) for (let t = r.startMin; t < r.endMin; t += SLOT_MINUTES) set.add(key(r.day, t));
  return set;
}

/**
 * Weekly grid in 30-minute slots. Tap or drag to mark times. `blocked` shows fixed commitments
 * (e.g. lectures) that can't be selected. Writes JSON into hidden inputs for the surrounding form.
 */
export function AvailabilityGrid({
  available,
  unavailable,
  blocked = [],
  allowUnavailable = true,
}: {
  available: Range[];
  unavailable: Range[];
  blocked?: (Range & { label: string })[];
  allowUnavailable?: boolean;
}) {
  const [cells, setCells] = useState(() => {
    const m = new Map<string, "AVAILABLE" | "UNAVAILABLE">();
    rangesToSet(available).forEach((k) => m.set(k, "AVAILABLE"));
    rangesToSet(unavailable).forEach((k) => m.set(k, "UNAVAILABLE"));
    return m;
  });
  const [mode, setMode] = useState<Mode>("AVAILABLE");
  const dragging = useRef(false);

  const blockedMap = new Map<string, string>();
  for (const b of blocked) for (let t = b.startMin; t < b.endMin; t += SLOT_MINUTES) blockedMap.set(key(b.day, t), b.label);

  const paint = (k: string) => {
    if (blockedMap.has(k)) return;
    setCells((prev) => {
      const next = new Map(prev);
      if (mode === "CLEAR") next.delete(k);
      else next.set(k, mode);
      return next;
    });
  };

  const serialize = (kind: "AVAILABLE" | "UNAVAILABLE") =>
    JSON.stringify(
      [...cells.entries()]
        .filter(([k, v]) => v === kind && !blockedMap.has(k))
        .map(([k]) => {
          const [day, startMin] = k.split(":").map(Number);
          return { day, startMin };
        }),
    );

  const hours = [...cells.values()].filter((v) => v === "AVAILABLE").length * (SLOT_MINUTES / 60);
  const modes: { value: Mode; label: string; swatch: string }[] = [
    { value: "AVAILABLE", label: "Available", swatch: "bg-emerald-500" },
    ...(allowUnavailable ? [{ value: "UNAVAILABLE" as Mode, label: "Not available", swatch: "bg-rose-400" }] : []),
    { value: "CLEAR", label: "Erase", swatch: "bg-white ring-1 ring-slate-300" },
  ];

  return (
    <div>
      <input type="hidden" name="available" value={serialize("AVAILABLE")} />
      <input type="hidden" name="unavailable" value={serialize("UNAVAILABLE")} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Tap or drag to mark:</span>
        {modes.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMode(m.value)}
            aria-pressed={mode === m.value}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
              mode === m.value ? "border-brand-600 bg-brand-50 text-brand-800" : "border-slate-200 bg-white text-slate-600",
            )}
          >
            <span className={cn("size-3 rounded-sm", m.swatch)} /> {m.label}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-500">{hours} h/week available</span>
      </div>

      <div
        className="touch-none overflow-x-auto rounded-xl border border-slate-200 bg-white select-none"
        onPointerUp={() => (dragging.current = false)}
        onPointerLeave={() => (dragging.current = false)}
      >
        <table className="w-full min-w-[560px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-16 border-b border-slate-200 p-1.5" />
              {DAYS_SHORT.map((d) => (
                <th key={d} className="border-b border-slate-200 p-1.5 font-semibold text-slate-600">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((t) => (
              <tr key={t}>
                <td className="whitespace-nowrap border-r border-slate-100 px-1.5 text-right align-top text-[10px] text-slate-400">
                  {t % 60 === 0 ? formatTime(t) : ""}
                </td>
                {DAYS_SHORT.map((_, day) => {
                  const k = key(day, t);
                  const lecture = blockedMap.get(k);
                  const state = cells.get(k);
                  return (
                    <td
                      key={k}
                      title={lecture ?? `${DAYS_SHORT[day]} ${formatTime(t)}`}
                      onPointerDown={(e) => {
                        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
                        dragging.current = true;
                        paint(k);
                      }}
                      onPointerEnter={() => dragging.current && paint(k)}
                      className={cn(
                        "h-5 border border-slate-100 p-0",
                        t % 60 === 0 && "border-t-slate-200",
                        lecture
                          ? "cursor-not-allowed bg-[repeating-linear-gradient(45deg,#cbd5e1_0_3px,#f1f5f9_3px_7px)]"
                          : state === "AVAILABLE"
                            ? "cursor-pointer bg-emerald-500"
                            : state === "UNAVAILABLE"
                              ? "cursor-pointer bg-rose-400"
                              : "cursor-pointer hover:bg-brand-50",
                      )}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {blocked.length > 0 && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block size-3 rounded-sm bg-[repeating-linear-gradient(45deg,#cbd5e1_0_2px,#f1f5f9_2px_4px)]" />
          Striped slots are your lectures and can&apos;t be booked.
        </p>
      )}
    </div>
  );
}
