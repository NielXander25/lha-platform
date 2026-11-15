import { connection } from "next/server";
import { createLocation, toggleLocation } from "../actions";
import { ActiveBadge, Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminLocationsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const locations = await prisma.location.findMany({
    orderBy: [{ kind: "desc" }, { name: "asc" }],
    include: { _count: { select: { assignments: true } } },
  });

  return (
    <div>
      <PageHeader title="Locations" description="Lecture rooms and halls on campus where tutorials hold." />
      <ErrorBanner message={firstString(params.error)} />

      <Card className="divide-y divide-slate-100">
        {locations.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium text-slate-900">{l.name}</p>
              <p className="text-sm text-slate-500">{l.kind}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">{l._count.assignments} tutorial{l._count.assignments === 1 ? "" : "s"}</span>
              <ActiveBadge active={l.active} />
              <form action={toggleLocation}>
                <input type="hidden" name="id" value={l.id} />
                <button className="text-xs font-semibold text-brand-700 hover:underline">{l.active ? "Hide" : "Show"}</button>
              </form>
            </div>
          </div>
        ))}
      </Card>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">Add a location</h2>
      <Card className="p-5">
        <form action={createLocation} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Name"><input name="name" required placeholder="e.g. LR 401 or Hall C2" className={inputClass} /></Field>
          <Field label="Type">
            <select name="kind" defaultValue="Lecture room" className={inputClass}>
              <option>Lecture room</option>
              <option>Hall</option>
              <option>Laboratory</option>
              <option>Online</option>
            </select>
          </Field>
          <SubmitButton>Add location</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
