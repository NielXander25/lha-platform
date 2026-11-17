import { Checklist, FlashMessage, Notice, one, Panel, StatusBadge } from "@/components/portal-ui";
import { currentTutor } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { totalHours } from "@/lib/schedule";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const STATUS = {
  PENDING: { label: "Awaiting approval", tone: "warn" },
  APPROVED: { label: "Approved", tone: "good" },
  REJECTED: { label: "Not approved", tone: "bad" },
  SUSPENDED: { label: "Suspended", tone: "bad" },
} as const;

export default async function TutorHome({ searchParams }: { searchParams: SearchParams }) {
  const { user, tutor } = await currentTutor();
  const params = await searchParams;
  const [courses, slots, credentials] = await Promise.all([
    prisma.tutorCourse.findMany({ where: { tutorId: tutor.id }, include: { course: true } }),
    prisma.availability.findMany({ where: { userId: user.id, kind: "AVAILABLE" } }),
    prisma.tutorCredential.count({ where: { tutorId: tutor.id } }),
  ]);
  const status = STATUS[tutor.status as keyof typeof STATUS] ?? STATUS.PENDING;
  const profileDone = Boolean(tutor.qualifications && tutor.experienceYears !== null && tutor.phone);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Welcome,</p>
        <h1 className="font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{user.name}</h1>
        <div className="mt-3"><StatusBadge label={status.label} tone={status.tone} /></div>
      </header>
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />

      {tutor.status === "PENDING" && (
        <Notice>Complete the steps below. Our team will review your profile and approve the courses you can teach.</Notice>
      )}
      {tutor.status === "REJECTED" && tutor.reviewNote && <Notice tone="error">Reviewer note: {tutor.reviewNote}</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <h2 className="font-semibold text-slate-900">Your application</h2>
          <Checklist
            items={[
              { label: "Profile & qualifications", href: "/tutor/profile", done: profileDone, note: credentials ? `${credentials} credential file(s) uploaded` : "Upload certificates or transcripts" },
              { label: "Courses you can teach", href: "/tutor/courses", done: courses.length > 0 },
              { label: "Weekly availability", href: "/tutor/availability", done: slots.length > 0 },
            ]}
          />
        </Panel>
        <div className="space-y-6">
          <Panel>
            <h2 className="font-semibold text-slate-900">Courses</h2>
            {courses.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {courses.map((c) => (
                  <li key={c.courseId} className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">{c.course.code ?? c.course.title}</span>
                    <StatusBadge label={c.approved ? "Approved" : "Pending review"} tone={c.approved ? "good" : "neutral"} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">None chosen yet.</p>
            )}
          </Panel>
          <Panel>
            <h2 className="font-semibold text-slate-900">Workload</h2>
            <p className="mt-3 text-sm text-slate-600">
              {totalHours(slots)} h/week available · up to {tutor.maxWeeklyHours} h/week teaching · max {tutor.maxClassCapacity} students per class
            </p>
          </Panel>
          <Panel>
            <h2 className="font-semibold text-slate-900">Classes</h2>
            <p className="mt-3 text-sm text-slate-600">Allocation requests and your class schedule will appear here once you&apos;re approved.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
