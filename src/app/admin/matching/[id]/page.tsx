import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { manualAssign } from "../../actions";
import { firstString, inputClass } from "@/components/admin-ui";
import { FlashMessage, Panel, StatusBadge } from "@/components/portal-ui";
import { requireUser } from "@/lib/auth";
import { ALLOCATION_TONE, describeSessions, modeLabel } from "@/lib/classes";
import { ALLOCATION_STATUS_LABELS } from "@/lib/matching/run";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
type Decision = {
  at: string;
  package: string;
  course: string;
  notQualified?: number;
  candidates: { tutor: string; partners?: string[]; joinExisting?: boolean; score: number; breakdown: Record<string, number> }[];
  rejected: { tutor: string; reasons: string[] }[];
  outcome: string;
};

export default async function AllocationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const user = await requireUser(["ADMIN", "SUPPORT"]);
  const { id } = await params;
  const sp = await searchParams;
  const a = await prisma.allocation.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { name: true } }, package: true } },
      course: true,
      class: { include: { tutor: true, location: true, sessions: true } },
    },
  });
  if (!a) notFound();
  const decision = a.decision as Decision | null;
  // Any approved tutor can be chosen; the label says whether they're ready to be matched.
  const allTutors = await prisma.tutor.findMany({
    where: { status: "APPROVED", active: true },
    include: { courses: { where: { courseId: a.courseId } }, user: { select: { availability: { where: { kind: "AVAILABLE" }, select: { id: true } } } } },
    orderBy: { name: "asc" },
  });
  const tutors = allTutors
    .map((t) => ({
      id: t.id,
      name: t.name,
      teaches: t.courses.some((c) => c.approved),
      hasTimes: Boolean(t.user?.availability.length),
    }))
    .sort((x, y) => Number(y.hasTimes) - Number(x.hasTimes) || Number(y.teaches) - Number(x.teaches));
  const courseCode = a.course.code ?? a.course.title;
  const waiting = ["AWAITING_ALLOCATION", "CONFLICT_DETECTED"].includes(a.status);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/matching" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="size-4" /> Matching & classes
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-950 sm:text-3xl">
            {a.student.user.name} · {a.course.code ?? a.course.title}
          </h1>
          <p className="text-sm text-slate-500">
            <Link href={`/admin/students/${a.studentId}`} className="text-brand-700 hover:underline">{a.student.studentCode}</Link> · {a.student.package?.name}
          </p>
        </div>
        <StatusBadge label={ALLOCATION_STATUS_LABELS[a.status] ?? a.status} tone={ALLOCATION_TONE[a.status]} />
      </header>
      <FlashMessage ok={firstString(sp.ok)} error={firstString(sp.error)} />

      {a.class && (
        <Panel>
          <h2 className="font-semibold text-slate-900">Class</h2>
          <p className="mt-2 text-sm text-slate-700">
            {a.class.tutor.name} · {describeSessions(a.class.sessions)} · {modeLabel(a.class.mode)}{a.class.location ? ` · ${a.class.location.name}` : ""}
          </p>
        </Panel>
      )}
      {a.reason && <Panel><h2 className="font-semibold text-slate-900">Why it&apos;s waiting</h2><p className="mt-2 text-sm text-slate-700">{a.reason}</p></Panel>}

      <Panel>
        <h2 className="font-semibold text-slate-900">Matching decision</h2>
        {!decision ? (
          <p className="mt-2 text-sm text-slate-500">Matching hasn&apos;t evaluated this request yet.</p>
        ) : (
          <div className="mt-3 space-y-4 text-sm">
            <p className="text-slate-600">
              {new Date(decision.at).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })} · <strong>{decision.outcome}</strong>
            </p>
            <div>
              <h3 className="font-semibold text-slate-800">Eligible candidates (ranked)</h3>
              {decision.candidates.length ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="py-1 pr-3">Tutor</th><th className="py-1 pr-3">Score</th><th className="py-1 pr-3">Subject</th><th className="py-1 pr-3">Schedule</th><th className="py-1 pr-3">Experience</th><th className="py-1 pr-3">Needs</th><th className="py-1">Workload</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {decision.candidates.map((c, i) => (
                        <tr key={i}>
                          <td className="py-1.5 pr-3 font-medium">
                            {c.tutor}
                            {c.joinExisting && <span className="text-xs text-slate-500"> (existing group)</span>}
                            {c.partners?.length ? <span className="block text-xs text-slate-500">with {c.partners.join(", ")}</span> : null}
                          </td>
                          <td className="py-1.5 pr-3 font-semibold">{c.score}</td>
                          {["competence", "schedule", "experience", "requirements", "workload"].map((k) => (
                            <td key={k} className="py-1.5 pr-3 text-slate-600">{c.breakdown[k]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-1 text-slate-500">None.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Rejected</h3>
              <ul className="mt-1 space-y-1 text-slate-600">
                {decision.rejected.map((r, i) => <li key={i}><strong>{r.tutor}</strong>: {r.reasons.join("; ")}</li>)}
                {decision.notQualified ? <li>{decision.notQualified} other tutor(s) aren&apos;t approved for this course.</li> : null}
                {decision.rejected.length === 0 && !decision.notQualified && <li>None.</li>}
              </ul>
            </div>
          </div>
        )}
      </Panel>

      {user.role === "ADMIN" && waiting && (
        <Panel>
          <h2 className="font-semibold text-slate-900">Assign a tutor by hand</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pick a tutor and we find a time that suits both of them. If the tutor isn&apos;t set up for {courseCode} yet, this approves them for it.
            The tutor then accepts on their dashboard.
          </p>
          {tutors.length ? (
            <form action={manualAssign} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="allocationId" value={a.id} />
              <select name="tutorId" required className={`${inputClass} sm:w-96`}>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {!t.hasTimes ? " (hasn't set available times)" : t.teaches ? ` (teaches ${courseCode})` : ` (will be approved for ${courseCode})`}
                  </option>
                ))}
              </select>
              <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">Assign</button>
            </form>
          ) : (
            <p className="mt-3 text-sm text-amber-700">
              There are no approved tutors yet. Ask tutors to apply at /register/tutor, then approve them under Tutors &amp; approvals.
            </p>
          )}
          {tutors.length > 0 && tutors.every((t) => !t.hasTimes) && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              None of your tutors have set their available times, so no class time can be found yet. Tutors set times by logging in and opening Availability.
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}
