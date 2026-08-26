import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

export default async function CalendarPage() {
  const events = await prisma.calendarEvent.findMany({ orderBy: { date: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Programme calendar</h1>
      <div className="space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-[var(--color-ink)]/50">No events scheduled yet.</p>
        )}
        {events.map((e) => (
          <Card key={e.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-display text-lg text-[var(--color-navy)]">{e.title}</div>
                <div className="mt-1 text-sm text-[var(--color-ink)]/60">
                  {formatDate(e.date)} {e.time ? `· ${e.time}` : ""}
                </div>
              </div>
              {e.meetingLink && (
                <a
                  href={e.meetingLink}
                  className="rounded-lg bg-[var(--color-navy)] px-3 py-2 text-xs font-medium text-white"
                >
                  Join session
                </a>
              )}
            </div>
            {e.description && <p className="mt-3 text-sm text-[var(--color-ink)]/70">{e.description}</p>}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--color-ink)]/50">
              {e.facilitator && <span>Facilitator: {e.facilitator}</span>}
              {e.preparation && <span>Prep: {e.preparation}</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
