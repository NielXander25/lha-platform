import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { grantFreeAccess, setStudentSuspended } from "../../actions";
import { FlashMessage, Panel, StatusBadge } from "@/components/portal-ui";
import { PackageMark, StageMark } from "@/components/student-marks";
import { requireUser } from "@/lib/auth";
import { PAYMENT_STATUS_LABELS } from "@/lib/billing";
import { ALLOCATION_TONE, describeSessions } from "@/lib/classes";
import { ALLOCATION_STATUS_LABELS } from "@/lib/matching/run";
import { prisma } from "@/lib/prisma";
import { DAYS_SHORT, formatTime } from "@/lib/schedule";
import { STUDENT_STATUS_LABELS } from "@/lib/students";
import { formatPrice } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeZone: "Africa/Lagos" });

export default async function StudentDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const viewer = await requireUser(["ADMIN", "SUPPORT", "FINANCE"]);
  const { id } = await params;
  const sp = await searchParams;
  const s = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      department: true,
      package: true,
      courses: { include: { course: true } },
      timetableEntries: { orderBy: [{ day: "asc" }, { startMin: "asc" }] },
      timetableUploads: { select: { id: true, fileName: true, createdAt: true } },
      invoices: { include: { payments: true, subscription: { include: { package: true } } }, orderBy: { createdAt: "desc" } },
      subscriptions: { where: { status: "ACTIVE" }, include: { package: true }, orderBy: { endsAt: "desc" } },
      allocations: { include: { course: true, class: { include: { tutor: true, sessions: true } } } },
    },
  });
  if (!s) notFound();
  const availability = await prisma.availability.findMany({ where: { userId: s.userId }, orderBy: [{ day: "asc" }, { startMin: "asc" }] });

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-700">
        <ArrowLeft className="size-4" /> All students
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-950 sm:text-3xl">{s.user.name}</h1>
          <p className="text-sm text-slate-500">{s.studentCode} · {s.user.email}{s.user.phone ? ` · ${s.user.phone}` : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PackageMark code={s.package?.code} name={s.package?.name} />
          <StageMark status={s.status} />
          <span className="text-xs text-slate-500">{STUDENT_STATUS_LABELS[s.status] ?? s.status}</span>
        </div>
      </header>

      <FlashMessage ok={typeof sp.ok === "string" ? sp.ok : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />
      {s.subscriptions[0] && (
        <Panel className="text-sm">
          <p className="font-semibold text-slate-900">
            Active subscription: {s.subscriptions[0].package.name}
            {s.subscriptions[0].cycle === "COMPLIMENTARY" && <span className="ml-2"><StatusBadge label="Free access" tone="info" /></span>}
          </p>
          <p className="text-slate-500">Until {s.subscriptions[0].endsAt ? dateFmt.format(s.subscriptions[0].endsAt) : "—"}</p>
        </Panel>
      )}
      {viewer.role === "ADMIN" && s.subscriptions.length === 0 && (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Free access</p>
            <p className="text-slate-500">For testing or scholarships. Activates the chosen package without payment and is recorded in the audit log.</p>
          </div>
          <form action={grantFreeAccess} className="flex items-center gap-2">
            <input type="hidden" name="studentId" value={s.id} />
            <select name="months" defaultValue="1" className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" aria-label="Months">
              <option value="1">1 month</option>
              <option value="3">3 months</option>
            </select>
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Give free access</button>
          </form>
        </Panel>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold text-slate-900">Academic profile</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Institution", s.institution],
              ["Department", s.department?.name ?? "—"],
              ["Level", s.level ?? "—"],
              ["Semester", s.semester === "FIRST" ? "First" : s.semester === "SECOND" ? "Second" : "—"],
              ["Matric no.", s.matricNumber ?? "—"],
              ["Package", s.package ? `${s.package.name} (${s.billingCycle === "QUARTERLY" ? "3 months" : "monthly"})` : "—"],
              ["Teaching mode", s.teachingMode.replace("_", " ").toLowerCase()],
              ["Courses", s.courses.map((c) => c.course.code ?? c.course.title).join(", ") || "—"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-2"><dt className="text-slate-500">{k}</dt><dd className="text-slate-800">{v}</dd></div>
            ))}
          </dl>
          {viewer.role === "ADMIN" && (
            <form action={setStudentSuspended} className="mt-5">
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="suspend" value={String(s.status !== "SUSPENDED")} />
              <button className="text-sm font-semibold text-rose-600 hover:underline">
                {s.status === "SUSPENDED" ? "Lift suspension" : "Suspend student"}
              </button>
            </form>
          )}
        </Panel>

        <Panel>
          <h2 className="font-semibold text-slate-900">Timetable {s.timetableConfirmed ? <StatusBadge label="Confirmed" tone="good" /> : <StatusBadge label="Not confirmed" tone="warn" />}</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {s.timetableEntries.map((e) => (
              <li key={e.id}>{DAYS_SHORT[e.day]} {formatTime(e.startMin)}–{formatTime(e.endMin)} · <strong>{e.courseCode}</strong>{e.venue ? ` · ${e.venue}` : ""}{e.source === "EXTRACTED" && <span className="text-xs text-slate-500"> (read automatically)</span>}</li>
            ))}
            {s.timetableEntries.length === 0 && <li className="text-slate-500">No lectures entered.</li>}
          </ul>
          {s.timetableUploads.length > 0 && (
            <p className="mt-3 text-sm">
              Uploads:{" "}
              {s.timetableUploads.map((u, i) => (
                <span key={u.id}>{i > 0 && ", "}<a href={`/api/files/timetable/${u.id}`} target="_blank" className="text-brand-700 underline">{u.fileName}</a></span>
              ))}
            </p>
          )}
          <h3 className="mt-5 text-sm font-semibold text-slate-900">Availability</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {availability.map((a) => (
              <li key={a.id} className={a.kind === "UNAVAILABLE" ? "text-rose-600" : ""}>
                {DAYS_SHORT[a.day]} {formatTime(a.startMin)}–{formatTime(a.endMin)} {a.kind === "UNAVAILABLE" && "(not available)"}
              </li>
            ))}
            {availability.length === 0 && <li className="text-slate-500">Not set.</li>}
          </ul>
        </Panel>
      </div>

      <Panel>
        <h2 className="font-semibold text-slate-900">Tutors</h2>
        {s.courses.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No courses chosen yet.</p>
        ) : s.subscriptions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Tutors are matched once the student has an active subscription (paid, or free access above).
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {s.courses.map(({ course }) => {
              const a = s.allocations.find((x) => x.courseId === course.id);
              const waiting = !a || ["AWAITING_ALLOCATION", "CONFLICT_DETECTED"].includes(a.status);
              return (
                <li key={course.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-900">{course.code ?? course.title}</span>
                    <span className="block text-slate-500">
                      {a?.class ? `${a.class.tutor.name} · ${describeSessions(a.class.sessions)}` : a?.reason ?? "Not matched yet"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge label={a ? ALLOCATION_STATUS_LABELS[a.status] ?? a.status : "Not run yet"} tone={a ? ALLOCATION_TONE[a.status] : "neutral"} />
                    {a && viewer.role !== "FINANCE" && (
                      <Link href={`/admin/matching/${a.id}`} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
                        {waiting ? "Assign tutor" : "View"}
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-900">Invoices & payments</h2>
        {s.invoices.length === 0 && <p className="mt-3 text-sm text-slate-500">No invoices yet.</p>}
        {s.invoices.map((inv) => (
          <div key={inv.id} className="mt-4 rounded-xl border border-slate-200 p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-semibold text-slate-900">{inv.number} · {inv.subscription.package.name}</span>
              <span>{formatPrice(inv.amountPaid)} / {formatPrice(inv.amount)} · <StatusBadge label={inv.status} /></span>
            </div>
            <p className="mt-1 text-slate-500">
              Subscription {inv.subscription.status.toLowerCase()}
              {inv.subscription.startsAt && ` · ${dateFmt.format(inv.subscription.startsAt)} – ${inv.subscription.endsAt ? dateFmt.format(inv.subscription.endsAt) : ""}`}
            </p>
            <ul className="mt-2 space-y-1">
              {inv.payments.map((p) => (
                <li key={p.id} className="text-slate-600">
                  {p.method === "PAYSTACK" ? "Paystack" : "Transfer"} {p.reference} · {formatPrice(p.amountReceived ?? p.amountExpected)} · {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Panel>
    </div>
  );
}
