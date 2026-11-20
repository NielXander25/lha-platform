import Link from "next/link";
import { AddTutorForm } from "@/components/tutor-login-forms";
import { Card, ErrorBanner, PageHeader, firstString } from "@/components/admin-ui";
import { StatusBadge } from "@/components/portal-ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TUTOR_STATUS } from "@/lib/tutors";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminTutorsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["ADMIN"]);
  const params = await searchParams;
  const status = firstString(params.status);
  const [tutors, counts] = await Promise.all([
    prisma.tutor.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { courses: { select: { approved: true } }, _count: { select: { credentials: true } } },
    }),
    prisma.tutor.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div>
      <PageHeader title="Tutors & approvals" description="Add tutors, give them logins, and approve the courses each one can teach." />
      <ErrorBanner message={firstString(params.error)} />
      <div className="mb-5 flex flex-wrap gap-2">
        {[undefined, ...Object.keys(TUTOR_STATUS)].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/tutors?status=${s}` : "/admin/tutors"}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              status === s ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-white text-slate-600",
            )}
          >
            {s ? `${TUTOR_STATUS[s as keyof typeof TUTOR_STATUS].label} (${count(s)})` : "All"}
          </Link>
        ))}
      </div>

      <Card className="divide-y divide-slate-100">
        {tutors.map((t) => {
          const st = TUTOR_STATUS[t.status as keyof typeof TUTOR_STATUS] ?? TUTOR_STATUS.PENDING;
          const approvedCourses = t.courses.filter((c) => c.approved).length;
          return (
            <Link key={t.id} href={`/admin/tutors/${t.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="truncate text-sm text-slate-500">
                  {t.email} · {t.courses.length ? `${approvedCourses}/${t.courses.length} courses approved` : t.subjects || "No courses yet"}
                  {t._count.credentials ? ` · ${t._count.credentials} file(s)` : ""}
                  {t.userId ? "" : " · added by staff"}
                </p>
              </div>
              <StatusBadge label={st.label} tone={st.tone} />
            </Link>
          );
        })}
        {tutors.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No tutors here.</p>}
      </Card>

      <h2 className="mb-1 mt-10 text-lg font-semibold text-slate-900">Add a tutor</h2>
      <p className="mb-4 text-sm text-slate-500">Tutors can&apos;t sign up on the website. Add them here to give them a login.</p>
      <Card className="p-5">
        <AddTutorForm />
      </Card>
    </div>
  );
}
