import { connection } from "next/server";
import { updatePackage } from "../actions";
import { Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminPackagesPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const packages = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <PageHeader title="Packages" description="Prices, class sizes and session rules. Changes apply to new invoices; existing invoices keep their price." />
      <ErrorBanner message={firstString(params.error)} />
      <div className="space-y-4">
        {packages.map((p) => (
          <Card key={p.id} className="p-5">
            <form key={JSON.stringify(p)} action={updatePackage} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="id" value={p.id} />
              <Field label="Name"><input name="name" defaultValue={p.name} required className={inputClass} /></Field>
              <Field label="Students : tutor"><input name="ratio" defaultValue={p.ratio} required className={inputClass} /></Field>
              <Field label="Monthly fee (NGN)"><input name="monthlyPrice" type="number" min={0} step={500} defaultValue={p.monthlyPrice} required className={inputClass} /></Field>
              <Field label="3 months upfront (NGN)"><input name="quarterlyPrice" type="number" min={0} step={500} defaultValue={p.quarterlyPrice} required className={inputClass} /></Field>
              <Field label="Class capacity"><input name="capacity" type="number" min={1} defaultValue={p.capacity} required className={inputClass} /></Field>
              <Field label="Sessions per week"><input name="sessionsPerWeek" type="number" min={1} defaultValue={p.sessionsPerWeek} required className={inputClass} /></Field>
              <Field label="Session length (mins)"><input name="sessionMinutes" type="number" min={15} step={15} defaultValue={p.sessionMinutes} required className={inputClass} /></Field>
              <div className="sm:col-span-2 lg:col-span-4"><Field label="Description"><input name="description" defaultValue={p.description} required className={inputClass} /></Field></div>
              <div><SubmitButton>Save</SubmitButton></div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
