import Link from "next/link";
import { connection } from "next/server";
import { updateEnrollment } from "./actions";
import { Card, ErrorBanner, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { ENROLLMENT_STATUSES, STATUS_LABELS, STATUS_STYLES, type EnrollmentStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cn, formatPrice } from "@/lib/utils";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function EnrollmentsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const statusParam = firstString(params.status);
  const status = ENROLLMENT_STATUSES.find((s) => s === statusParam);

  const [enrollments, counts, tutors, locations] = await Promise.all([
    prisma.enrollment.findMany({
      where: status ? { status } : undefined,
      include: { student: true, course: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.groupBy({ by: ["status"], _count: true }),
    prisma.tutor.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { active: true }, orderBy: [{ isOnline: "desc" }, { name: "asc" }] }),
  ]);

  const countFor = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);
  const locationName = new Map(locations.map((l) => [l.id, l.isOnline ? l.name : `${l.name} (${l.city})`]));

  return (
    <div>
      <PageHeader title="Enrolments" description="Assign a tutor and a location to each student enrolment." />
      <ErrorBanner message={firstString(params.error)} />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterPill href="/admin" active={!status} label={`All (${total})`} />
        {ENROLLMENT_STATUSES.map((s) => (
          <FilterPill key={s} href={`/admin?status=${s}`} active={status === s} label={`${STATUS_LABELS[s]} (${countFor(s)})`} />
        ))}
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-12 text-center text-stone-500">
          No enrolments yet. They will appear here when students enrol from the{" "}
          <Link href="/tutorials" className="font-semibold text-brand-700 underline">tutorials page</Link>.
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollments.map((e) => {
            const st = e.status as EnrollmentStatus;
            return (
              <Card key={e.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-stone-900">{e.student.name}</p>
                    <p className="text-sm text-stone-500">
                      {e.student.email} · {e.student.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[st])}>
                      {STATUS_LABELS[st] ?? e.status}
                    </span>
                    <p className="mt-1.5 text-xs text-stone-400">
                      {e.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <p>
                    <span className="text-stone-500">Course:</span>{" "}
                    <span className="font-medium text-stone-800">{e.course.title}</span>{" "}
                    <span className="text-stone-500">({formatPrice(e.course.price)}/{e.course.billingUnit})</span>
                  </p>
                  <p>
                    <span className="text-stone-500">Preferred location:</span>{" "}
                    <span className="font-medium text-stone-800">
                      {e.preferredLocationId ? locationName.get(e.preferredLocationId) ?? "Unavailable" : "No preference"}
                    </span>
                  </p>
                </div>
                {e.notes && <p className="mt-2 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">“{e.notes}”</p>}

                <form key={e.updatedAt.getTime()} action={updateEnrollment} className="mt-4 grid gap-3 border-t border-stone-100 pt-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                  <input type="hidden" name="enrollmentId" value={e.id} />
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tutor</span>
                    <select name="tutorId" defaultValue={e.tutorId ?? ""} className={inputClass}>
                      <option value="">— Unassigned —</option>
                      {tutors.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} · {t.subjects}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Location</span>
                    <select name="locationId" defaultValue={e.locationId ?? e.preferredLocationId ?? ""} className={inputClass}>
                      <option value="">— Unassigned —</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{locationName.get(l.id)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Status</span>
                    <select name="status" defaultValue={e.status} className={inputClass}>
                      {ENROLLMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </label>
                  <SubmitButton>Save</SubmitButton>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium",
        active ? "border-brand-600 bg-brand-600 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-brand-300",
      )}
    >
      {label}
    </Link>
  );
}
