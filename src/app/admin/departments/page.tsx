import { connection } from "next/server";
import { createDepartment, toggleDepartment } from "../actions";
import { ActiveBadge, Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminDepartmentsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  await requireUser(["ADMIN"]);
  const params = await searchParams;
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <div>
      <PageHeader title="Departments" description="Engineering departments students can filter tutorials by." />
      <ErrorBanner message={firstString(params.error)} />

      <Card className="divide-y divide-slate-100">
        {departments.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <p className="font-medium text-slate-900">{d.name}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">{d._count.courses} course{d._count.courses === 1 ? "" : "s"}</span>
              <ActiveBadge active={d.active} />
              <form action={toggleDepartment}>
                <input type="hidden" name="id" value={d.id} />
                <button className="text-xs font-semibold text-brand-700 hover:underline">{d.active ? "Hide" : "Show"}</button>
              </form>
            </div>
          </div>
        ))}
      </Card>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-slate-900">Add a department</h2>
      <Card className="p-5">
        <form action={createDepartment} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="Name"><input name="name" required placeholder="e.g. Chemical Engineering" className={inputClass} /></Field>
          <SubmitButton>Add department</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
