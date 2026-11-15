import { connection } from "next/server";
import { createLocation, toggleLocation } from "../actions";
import { ActiveBadge, Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminLocationsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const locations = await prisma.location.findMany({
    orderBy: [{ isOnline: "desc" }, { city: "asc" }, { name: "asc" }],
    include: { _count: { select: { assignments: true } } },
  });

  return (
    <div>
      <PageHeader title="Locations" description="Learning centres, home-tutoring areas and online classes." />
      <ErrorBanner message={firstString(params.error)} />

      <Card className="divide-y divide-stone-100">
        {locations.map((l) => (
          <div key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium text-stone-900">
                {l.name} {l.isOnline && <span className="ml-1 rounded bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-800">Online</span>}
              </p>
              <p className="text-sm text-stone-500">{[l.address, l.city].filter(Boolean).join(", ")}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-stone-500">{l._count.assignments} tutorial assignment{l._count.assignments === 1 ? "" : "s"}</span>
              <ActiveBadge active={l.active} />
              <form action={toggleLocation}>
                <input type="hidden" name="id" value={l.id} />
                <button className="text-xs font-semibold text-brand-700 hover:underline">{l.active ? "Hide" : "Show"}</button>
              </form>
            </div>
          </div>
        ))}
      </Card>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-stone-900">Add a location</h2>
      <Card className="p-5">
        <form action={createLocation} className="grid gap-4 sm:grid-cols-3">
          <Field label="Name"><input name="name" required placeholder="e.g. Yaba Learning Centre" className={inputClass} /></Field>
          <Field label="City"><input name="city" required className={inputClass} /></Field>
          <Field label="Address"><input name="address" className={inputClass} /></Field>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" name="isOnline" className="size-4 accent-brand-600" /> This is an online option
          </label>
          <div className="sm:col-span-3"><SubmitButton>Add location</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
