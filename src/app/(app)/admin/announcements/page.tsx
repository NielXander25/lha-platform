import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { createAnnouncement, deleteAnnouncement } from "./actions";

export default async function AdminAnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({ orderBy: [{ pinned: "desc" }, { createdAt: "desc" }] });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Announcements</h1>

      <Card>
        <form action={createAnnouncement} className="space-y-3">
          <input name="title" required placeholder="Title" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="body" required rows={3} placeholder="Message" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="pinned" className="accent-[var(--color-navy)]" /> Pin to top
          </label>
          <Button type="submit" variant="secondary">Post</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {announcements.map((a) => {
          const boundDelete = deleteAnnouncement.bind(null, a.id);
          return (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg text-[var(--color-navy)]">{a.title}</span>
                    {a.pinned && <Badge tone="gold">Pinned</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink)]/70">{a.body}</p>
                  <p className="mt-1 text-xs text-[var(--color-ink)]/40">{formatDate(a.createdAt)}</p>
                </div>
                <form action={boundDelete}>
                  <button type="submit" className="text-xs text-[var(--color-danger)]">Delete</button>
                </form>
              </div>
            </Card>
          );
        })}
        {announcements.length === 0 && <p className="text-sm text-[var(--color-ink)]/50">No announcements yet.</p>}
      </div>
    </div>
  );
}
