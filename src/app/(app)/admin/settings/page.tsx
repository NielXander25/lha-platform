import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createPolicy } from "./actions";

export default async function AdminSettingsPage() {
  const policies = await prisma.policy.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Settings</h1>

      <Card>
        <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
          Policies participants must acknowledge
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {policies.map((p) => <li key={p.id}>{p.title}</li>)}
          {policies.length === 0 && <p className="text-[var(--color-ink)]/50">None published yet.</p>}
        </ul>
        <form action={createPolicy} className="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
          <input name="title" required placeholder="Policy title" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <textarea name="content" required rows={4} placeholder="Policy text" className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          <Button type="submit" variant="secondary">Publish policy</Button>
        </form>
      </Card>
    </div>
  );
}
