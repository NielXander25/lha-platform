import { connection } from "next/server";
import { createTutor, toggleTutor } from "../actions";
import { ActiveBadge, Card, ErrorBanner, Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminTutorsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const tutors = await prisma.tutor.findMany({
    orderBy: { name: "asc" },
    include: { assignments: { select: { course: { select: { title: true } } } } },
  });

  return (
    <div>
      <PageHeader title="Tutors" description="Only active tutors can be assigned, and inactive tutors are hidden from visitors." />
      <ErrorBanner message={firstString(params.error)} />

      <div className="grid gap-4 md:grid-cols-2">
        {tutors.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-stone-900">{t.name}</p>
                <p className="text-sm text-stone-500">{t.email}{t.phone ? ` · ${t.phone}` : ""}</p>
              </div>
              <ActiveBadge active={t.active} />
            </div>
            <p className="mt-3 text-sm"><span className="text-stone-500">Subjects:</span> {t.subjects}</p>
            {t.bio && <p className="mt-1 text-sm text-stone-600">{t.bio}</p>}
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
              <span className="text-stone-500">
                {t.assignments.length
                  ? `Teaches: ${[...new Set(t.assignments.map((a) => a.course.title))].join(", ")}`
                  : "Not assigned to any tutorial"}
              </span>
              <form action={toggleTutor}>
                <input type="hidden" name="id" value={t.id} />
                <button className="text-xs font-semibold text-brand-700 hover:underline">{t.active ? "Deactivate" : "Activate"}</button>
              </form>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 mt-10 text-lg font-semibold text-stone-900">Add a tutor</h2>
      <Card className="p-5">
        <form action={createTutor} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input name="name" required className={inputClass} /></Field>
          <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
          <Field label="Phone"><input name="phone" type="tel" className={inputClass} /></Field>
          <Field label="Subjects (comma-separated)"><input name="subjects" required placeholder="Mathematics, Physics" className={inputClass} /></Field>
          <div className="sm:col-span-2"><Field label="Short bio"><textarea name="bio" rows={2} className={inputClass} /></Field></div>
          <div><SubmitButton>Add tutor</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
