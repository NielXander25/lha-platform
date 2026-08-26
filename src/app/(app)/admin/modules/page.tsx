import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { createModule } from "./actions";

export default async function AdminModulesPage() {
  const modules = await prisma.module.findMany({
    orderBy: { number: "asc" },
    include: { assessment: true, resources: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Modules</h1>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">Add a module</div>
        <form action={createModule} className="mt-3 flex flex-wrap gap-2">
          <input name="number" type="number" required placeholder="No." className="w-20 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <input name="title" required placeholder="Module title" className="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary">Create</Button>
        </form>
      </Card>

      <Card className="!p-0">
        <div className="divide-y divide-[var(--color-line)]">
          {modules.map((m) => (
            <Link key={m.id} href={`/admin/modules/${m.id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-[var(--color-surface-alt)]">
              <span>Module {m.number} — {m.title}</span>
              <span className="text-xs text-[var(--color-ink)]/50">
                {m.resources.length} resources · {m.assessment ? "assessment set" : "no assessment"}
              </span>
            </Link>
          ))}
          {modules.length === 0 && <p className="px-5 py-6 text-sm text-[var(--color-ink)]/50">No modules yet.</p>}
        </div>
      </Card>
    </div>
  );
}
