import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Announcements</h1>
      <div className="space-y-3">
        {announcements.length === 0 && (
          <p className="text-sm text-[var(--color-ink)]/50">No announcements yet.</p>
        )}
        {announcements.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between">
              <div className="font-display text-lg text-[var(--color-navy)]">{a.title}</div>
              {a.pinned && <Badge tone="gold">Pinned</Badge>}
            </div>
            <p className="mt-2 text-sm text-[var(--color-ink)]/70">{a.body}</p>
            <div className="mt-3 text-xs text-[var(--color-ink)]/40">
              {formatDate(a.createdAt)} {a.author && `· ${a.author.fullName}`}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
