import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

export default async function ResourcesPage() {
  const resources = await prisma.resource.findMany({
    include: { module: true },
    orderBy: [{ moduleId: "asc" }, { week: "asc" }],
  });

  const grouped = resources.reduce<Record<string, typeof resources>>((acc, r) => {
    const key = r.module ? `Module ${r.module.number} — ${r.module.title}` : "General";
    acc[key] = acc[key] ? [...acc[key], r] : [r];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Resource library</h1>
      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-[var(--color-ink)]/50">No resources uploaded yet.</p>
      )}
      {Object.entries(grouped).map(([group, items]) => (
        <Card key={group}>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">{group}</div>
          <ul className="mt-3 space-y-2">
            {items.map((r) => (
              <li key={r.id}>
                <a href={r.url} className="text-sm text-[var(--color-navy)] underline">
                  {r.title}
                </a>
                <span className="ml-2 text-xs text-[var(--color-ink)]/40">{r.type}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
