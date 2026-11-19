import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { reviewTutor, setCourseCompetency, toggleTutor } from "../../actions";
import { FlashMessage, one, Panel, StatusBadge } from "@/components/portal-ui";
import { fieldClass } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TUTOR_STATUS } from "@/lib/tutors";
import { DAYS_SHORT, formatTime, totalHours } from "@/lib/schedule";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
const MODE = { IN_PERSON: "In person", ONLINE: "Online", BOTH: "In person or online" } as Record<string, string>;

export default async function TutorReview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  await requireUser(["ADMIN"]);
  const { id } = await params;
  const sp = await searchParams;
  const tutor = await prisma.tutor.findUnique({
    where: { id },
    include: {
      department: true,
      courses: { include: { course: true }, orderBy: { course: { code: "asc" } } },
      credentials: { select: { id: true, fileName: true, size: true } },
    },
  });
  if (!tutor) notFound();
  const [slots, location] = await Promise.all([
    tutor.userId ? prisma.availability.findMany({ where: { userId: tutor.userId, kind: "AVAILABLE" }, orderBy: [{ day: "asc" }, { startMin: "asc" }] }) : [],
    tutor.preferredLocationId ? prisma.location.findUnique({ where: { id: tutor.preferredLocationId } }) : null,
  ]);
  const st = TUTOR_STATUS[tutor.status as keyof typeof TUTOR_STATUS] ?? TUTOR_STATUS.PENDING;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/tutors" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="size-4" /> All tutors
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{tutor.name}</h1>
          <p className="text-sm text-slate-500">{tutor.email}{tutor.phone ? ` · ${tutor.phone}` : ""}</p>
        </div>
        <StatusBadge label={st.label} tone={st.tone} />
      </header>
      <FlashMessage ok={one(sp.ok)} error={one(sp.error)} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold text-slate-900">Profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Department", tutor.department?.name ?? "—"],
              ["Qualifications", tutor.qualifications ?? "—"],
              ["Experience", tutor.experienceYears != null ? `${tutor.experienceYears} year(s)` : "—"],
              ["Teaching mode", MODE[tutor.teachingMode] ?? tutor.teachingMode],
              ["Preferred location", location?.name ?? "No preference"],
              ["Workload", `Up to ${tutor.maxWeeklyHours} h/week · max ${tutor.maxClassCapacity} per class`],
              ["Bio", tutor.bio ?? "—"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[8rem_1fr] gap-2">
                <dt className="text-slate-500">{k}</dt>
                <dd className="whitespace-pre-line text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-sm font-semibold text-slate-900">Credentials</h3>
          {tutor.credentials.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {tutor.credentials.map((c) => (
                <li key={c.id}><a href={`/api/files/credential/${c.id}`} target="_blank" className="font-medium text-brand-700 underline">{c.fileName}</a></li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">None uploaded.</p>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="font-semibold text-slate-900">Course competencies</h2>
            <p className="mt-1 text-sm text-slate-500">Only approved courses count for matching.</p>
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {tutor.courses.map((tc) => (
                <li key={tc.courseId} className="flex items-center justify-between gap-3 py-2">
                  <span className="font-medium text-slate-800">{tc.course.code ? `${tc.course.code}: ` : ""}{tc.course.title}</span>
                  <form action={setCourseCompetency}>
                    <input type="hidden" name="tutorId" value={tutor.id} />
                    <input type="hidden" name="courseId" value={tc.courseId} />
                    <input type="hidden" name="approved" value={String(!tc.approved)} />
                    <button className={tc.approved ? "text-xs font-semibold text-rose-600 hover:underline" : "rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"}>
                      {tc.approved ? "Revoke" : "Approve"}
                    </button>
                  </form>
                </li>
              ))}
              {tutor.courses.length === 0 && <li className="py-2 text-slate-500">No courses chosen.</li>}
            </ul>
          </Panel>

          <Panel>
            <h2 className="font-semibold text-slate-900">Availability</h2>
            {slots.length ? (
              <>
                <p className="mt-1 text-sm text-slate-500">{totalHours(slots)} h/week</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {slots.map((s) => <li key={s.id}>{DAYS_SHORT[s.day]} {formatTime(s.startMin)} – {formatTime(s.endMin)}</li>)}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Not set.</p>
            )}
          </Panel>

          <Panel>
            <h2 className="font-semibold text-slate-900">Decision</h2>
            <form action={reviewTutor} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={tutor.id} />
              <textarea name="note" rows={2} defaultValue={tutor.reviewNote ?? ""} placeholder="Note to the tutor (optional; shown if rejected)" className={fieldClass} />
              <div className="flex flex-wrap gap-2">
                <button name="decision" value="APPROVED" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Approve tutor</button>
                <button name="decision" value="REJECTED" className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700">Reject</button>
                {tutor.status === "APPROVED" && (
                  <button name="decision" value="SUSPENDED" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Suspend</button>
                )}
              </div>
            </form>
            {tutor.status === "APPROVED" && (
              <form action={toggleTutor} className="mt-3">
                <input type="hidden" name="id" value={tutor.id} />
                <button className="text-xs font-semibold text-brand-700 hover:underline">
                  {tutor.active ? "Hide from public listings" : "Show on public listings"}
                </button>
              </form>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
