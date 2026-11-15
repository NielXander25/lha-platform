import Link from "next/link";
import { connection } from "next/server";
import { createCourse, toggleCourse, updateCoursePrice } from "../actions";
import { ActiveBadge, Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminCoursesPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const courses = await prisma.course.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    include: { _count: { select: { enrollments: true } } },
  });

  return (
    <div>
      <PageHeader title="Courses & prices" description="Set what students see on the tutorials page." />
      <ErrorBanner message={firstString(params.error)} />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Course</th>
              <th className="px-4 py-3 font-semibold">Enrolments</th>
              <th className="px-4 py-3 font-semibold">Price (NGN)</th>
              <th className="px-4 py-3 font-semibold">Visibility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {courses.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <Link href={`/tutorials/${c.slug}`} className="font-medium text-stone-900 hover:text-brand-700">{c.title}</Link>
                  <p className="text-xs text-stone-500">{c.category} · {c.level}</p>
                </td>
                <td className="px-4 py-3 text-stone-600">{c._count.enrollments}</td>
                <td className="px-4 py-3">
                  <form action={updateCoursePrice} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input name="price" type="number" min={0} step={500} defaultValue={c.price} className={`${inputClass} w-28`} aria-label="Price" />
                    <span className="text-stone-400">/</span>
                    <input name="billingUnit" defaultValue={c.billingUnit} className={`${inputClass} w-24`} aria-label="Billing unit" />
                    <SubmitButton variant="ghost">Save</SubmitButton>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form action={toggleCourse} className="flex items-center gap-3">
                    <input type="hidden" name="id" value={c.id} />
                    <ActiveBadge active={c.active} />
                    <button className="text-xs font-semibold text-brand-700 hover:underline">{c.active ? "Hide" : "Show"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-stone-900">Add a course</h2>
      <Card className="p-5">
        <form action={createCourse} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2"><Field label="Title"><input name="title" required className={inputClass} /></Field></div>
          <Field label="Subject / category"><input name="category" required placeholder="e.g. Mathematics" className={inputClass} /></Field>
          <Field label="Level"><input name="level" required placeholder="e.g. Senior Secondary" className={inputClass} /></Field>
          <Field label="Price (NGN)"><input name="price" type="number" min={0} step={500} required className={inputClass} /></Field>
          <Field label="Charged per"><input name="billingUnit" defaultValue="month" required className={inputClass} /></Field>
          <Field label="Sessions / week"><input name="sessionsPerWeek" type="number" min={1} max={14} defaultValue={2} required className={inputClass} /></Field>
          <Field label="Session length (mins)"><input name="sessionLengthMins" type="number" min={15} step={15} defaultValue={60} required className={inputClass} /></Field>
          <div className="sm:col-span-2 lg:col-span-4"><Field label="Short summary"><input name="summary" required className={inputClass} /></Field></div>
          <div className="sm:col-span-2 lg:col-span-4"><Field label="Full description"><textarea name="description" rows={3} required className={inputClass} /></Field></div>
          <div><SubmitButton>Add course</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
