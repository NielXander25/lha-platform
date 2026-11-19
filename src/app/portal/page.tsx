import Link from "next/link";
import { respondToProposal } from "./actions";
import { ClassCard, RespondButtons } from "@/components/class-card";
import { currentStudent } from "@/lib/current";
import { prisma } from "@/lib/prisma";
import { Checklist, FlashMessage, Notice, one, Panel, StatusBadge } from "@/components/portal-ui";
import { ONBOARDING_STEPS, STUDENT_STATUS_LABELS, studentProgress } from "@/lib/students";
import { formatPrice } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" });

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function PortalHome({ searchParams }: { searchParams: SearchParams }) {
  const { user, student } = await currentStudent();
  const params = await searchParams;
  const [{ done, pendingPayment }, subscription, courses, pkg, memberships, allocations] = await Promise.all([
    studentProgress(student.id),
    prisma.subscription.findFirst({ where: { studentId: student.id, status: "ACTIVE" }, orderBy: { endsAt: "desc" }, include: { package: true } }),
    prisma.studentCourse.findMany({ where: { studentId: student.id }, include: { course: true } }),
    student.packageId ? prisma.package.findUnique({ where: { id: student.packageId } }) : null,
    prisma.classMember.findMany({
      where: { studentId: student.id, status: { not: "DECLINED" }, class: { status: { not: "CANCELLED" } } },
      include: { class: { include: { course: true, package: true, tutor: true, location: true, sessions: true, members: { include: { student: { include: { user: { select: { name: true } } } } } } } } },
    }),
    prisma.allocation.findMany({ where: { studentId: student.id }, include: { course: true } }),
  ]);
  const toConfirm = memberships.filter((m) => m.status === "PROPOSED" && m.class.status !== "AWAITING_TUTOR");
  const others = memberships.filter((m) => !toConfirm.includes(m));
  const waiting = allocations.filter((a) => ["AWAITING_ALLOCATION", "CONFLICT_DETECTED"].includes(a.status));

  const status = student.status;
  const tone = status === "ACTIVE" || status === "AWAITING_ALLOCATION" || status === "ALLOCATED" ? "good" : status === "SUSPENDED" ? "bad" : "warn";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Welcome back,</p>
        <h1 className="font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{user.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1 font-mono text-slate-700 ring-1 ring-slate-200">{student.studentCode}</span>
          <StatusBadge label={STUDENT_STATUS_LABELS[status] ?? status} tone={tone} />
        </div>
      </header>

      <FlashMessage ok={one(params.ok)} error={one(params.error)} />
      {toConfirm.length > 0 && (
        <Panel className="border-brand-300 ring-2 ring-brand-500/10">
          <h2 className="font-semibold text-slate-900">Your tutor is ready. Please confirm</h2>
          <p className="mt-1 text-sm text-slate-500">We matched you with a tutor at a time that suits you both. Accept to confirm your class.</p>
          <div className="mt-4 space-y-3">
            {toConfirm.map((m) => <ClassCard key={m.classId} c={m.class} viewer="student" actions={<RespondButtons action={respondToProposal} classId={m.classId} />} />)}
          </div>
        </Panel>
      )}
      {status === "AWAITING_ALLOCATION" && toConfirm.length === 0 && (
        <Notice tone="success">
          Your subscription is active. We&apos;re matching you with a tutor and will let you know as soon as your classes are scheduled.
        </Notice>
      )}
      {pendingPayment && <Notice tone="info">Your bank transfer is being checked by our finance team.</Notice>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <h2 className="font-semibold text-slate-900">Your registration</h2>
          <Checklist
            items={ONBOARDING_STEPS.map((s) => ({
              label: s.label,
              href: s.href,
              done: done[s.key],
              note: s.key === "payment" && pendingPayment && !done.payment ? "Transfer under review" : undefined,
            }))}
          />
        </Panel>

        <div className="space-y-6">
          <Panel>
            <h2 className="font-semibold text-slate-900">Subscription</h2>
            {subscription ? (
              <div className="mt-3 text-sm text-slate-700">
                <p className="font-display text-xl font-semibold text-brand-900">{subscription.package.name}</p>
                <p className="mt-1">
                  {subscription.cycle === "COMPLIMENTARY"
                    ? "Free access from Learning Hub"
                    : `${formatPrice(subscription.amount)} · ${subscription.months === 1 ? "monthly" : `${subscription.months} months`}`}
                </p>
                <p className="mt-1 text-slate-500">
                  Active until {subscription.endsAt ? dateFmt.format(subscription.endsAt) : "—"}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                No active subscription yet.{" "}
                {pkg && (
                  <>
                    Chosen package: <strong>{pkg.name}</strong>.{" "}
                  </>
                )}
                <Link href="/portal/payment" className="font-semibold text-brand-700 underline">Go to payment</Link>
              </p>
            )}
          </Panel>
          <Panel>
            <h2 className="font-semibold text-slate-900">Courses</h2>
            {courses.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {courses.map((c) => (
                  <li key={c.courseId} className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800">
                    {c.course.code ?? c.course.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                None chosen yet. <Link href="/portal/courses" className="font-semibold text-brand-700 underline">Choose courses</Link>
              </p>
            )}
          </Panel>
          <Panel>
            <h2 className="font-semibold text-slate-900">Tutor & classes</h2>
            {others.length > 0 && (
              <div className="mt-3 space-y-3">
                {others.map((m) => (
                  <ClassCard
                    key={m.classId}
                    c={m.class}
                    viewer="student"
                    note={m.class.status === "AWAITING_TUTOR" ? "We've asked the tutor to confirm. You'll be asked to accept next." : m.status === "ACCEPTED" && m.class.status === "AWAITING_STUDENTS" ? "You've accepted. Waiting for your classmate." : undefined}
                  />
                ))}
              </div>
            )}
            {waiting.length > 0 && (
              <p className="mt-3 text-sm text-slate-600">
                Still finding a tutor for {waiting.map((a) => a.course.code ?? a.course.title).join(", ")}. We&apos;ll let you know as soon as there&apos;s a match.
              </p>
            )}
            {others.length === 0 && waiting.length === 0 && toConfirm.length === 0 && (
              <p className="mt-3 text-sm text-slate-600">Your tutor and class times will appear here once you&apos;ve been matched.</p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
