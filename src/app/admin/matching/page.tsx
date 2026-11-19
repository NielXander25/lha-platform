import Link from "next/link";
import { Play } from "lucide-react";
import { adminCancelClass, runMatchingNow, saveMatchingWeights } from "../actions";
import { Field, PageHeader, SubmitButton, firstString, inputClass } from "@/components/admin-ui";
import { FlashMessage, Panel, StatusBadge } from "@/components/portal-ui";
import { requireUser } from "@/lib/auth";
import { ALLOCATION_TONE, CLASS_STATUS, describeSessions, modeLabel } from "@/lib/classes";
import { ALLOCATION_STATUS_LABELS, getWeights } from "@/lib/matching/run";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MatchingPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser(["ADMIN", "SUPPORT"]);
  const params = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const [queue, classes, weights, lastRun] = await Promise.all([
    prisma.allocation.findMany({
      where: { status: { in: ["AWAITING_ALLOCATION", "CONFLICT_DETECTED"] } },
      include: { student: { include: { user: { select: { name: true } }, package: true } }, course: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.tutorialClass.findMany({
      where: { status: { not: "CANCELLED" } },
      include: {
        course: true,
        package: true,
        tutor: true,
        location: true,
        sessions: true,
        members: { include: { student: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    getWeights(),
    prisma.auditLog.findFirst({ where: { action: "matching.run" }, orderBy: { createdAt: "desc" } }),
  ]);
  const pending = classes.filter((c) => c.status !== "CONFIRMED");
  const confirmed = classes.filter((c) => c.status === "CONFIRMED");
  const conflicts = queue.filter((q) => q.status === "CONFLICT_DETECTED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Matching & classes"
        description="The engine matches paid students with approved tutors, checking qualifications, free time, workload, teaching mode, venue and package size. Runs automatically after payments, approvals and availability changes."
      />
      <FlashMessage ok={firstString(params.ok)} error={firstString(params.error)} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Waiting in queue", value: queue.length - conflicts, tone: "text-amber-600" },
          { label: "Conflicts", value: conflicts, tone: "text-rose-600" },
          { label: "Awaiting confirmation", value: pending.length, tone: "text-brand-800" },
          { label: "Confirmed classes", value: confirmed.length, tone: "text-emerald-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className={`font-display text-3xl font-semibold ${s.tone}`}>{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {isAdmin && (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {lastRun ? <>Last run {lastRun.createdAt.toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" })}.</> : "Matching hasn't run yet."}
          </p>
          <form action={runMatchingNow}>
            <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              <Play className="size-4" /> Run matching now
            </button>
          </form>
        </Panel>
      )}

      <Panel>
        <h2 className="font-semibold text-slate-900">Queue ({queue.length})</h2>
        <p className="mt-1 text-sm text-slate-500">Paid students the engine couldn&apos;t match yet, with the reason. Open one to see the full decision or assign a tutor by hand.</p>
        <ul className="mt-4 divide-y divide-slate-100">
          {queue.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/matching/${a.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-slate-50">
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900">
                    {a.student.user.name} · {a.course.code ?? a.course.title}
                  </span>
                  <span className="block text-sm text-slate-500">{a.student.package?.name} · {a.reason ?? "Not run yet"}</span>
                </span>
                <StatusBadge label={ALLOCATION_STATUS_LABELS[a.status] ?? a.status} tone={ALLOCATION_TONE[a.status]} />
              </Link>
            </li>
          ))}
          {queue.length === 0 && <li className="py-3 text-sm text-slate-500">Nobody is waiting.</li>}
        </ul>
      </Panel>

      {[{ title: "Awaiting confirmation", list: pending }, { title: "Confirmed classes", list: confirmed }].map(({ title, list }) => (
        <Panel key={title}>
          <h2 className="font-semibold text-slate-900">{title} ({list.length})</h2>
          <div className="mt-4 space-y-3">
            {list.map((c) => {
              const st = CLASS_STATUS[c.status as keyof typeof CLASS_STATUS];
              const members = c.members.filter((m) => m.status !== "DECLINED");
              return (
                <div key={c.id} className="rounded-xl border border-slate-200 p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {c.course.code ?? c.course.title} · {c.package.name} · {c.tutor.name}
                        {c.manual && <span className="ml-2 text-xs font-normal text-slate-500">(assigned by staff)</span>}
                      </p>
                      <p className="text-slate-600">{describeSessions(c.sessions)} · {modeLabel(c.mode)}{c.location ? ` · ${c.location.name}` : ""}</p>
                    </div>
                    <StatusBadge label={st.label} tone={st.tone} />
                  </div>
                  <p className="mt-2 text-slate-500">
                    Students:{" "}
                    {members.map((m, i) => (
                      <span key={m.studentId}>
                        {i > 0 && ", "}
                        <Link href={`/admin/students/${m.studentId}`} className="text-brand-700 hover:underline">{m.student.user.name}</Link>
                        {m.status === "ACCEPTED" ? " ✓" : " (pending)"}
                      </span>
                    ))}
                  </p>
                  {isAdmin && (
                    <form action={adminCancelClass} className="mt-2">
                      <input type="hidden" name="classId" value={c.id} />
                      <button className="text-xs font-semibold text-rose-600 hover:underline">Cancel class</button>
                    </form>
                  )}
                </div>
              );
            })}
            {list.length === 0 && <p className="text-sm text-slate-500">None.</p>}
          </div>
        </Panel>
      ))}

      {isAdmin && (
        <Panel>
          <h2 className="font-semibold text-slate-900">Ranking weights</h2>
          <p className="mt-1 text-sm text-slate-500">After the hard rules, qualified tutors are ranked by these weights (must add up to 100).</p>
          <form action={saveMatchingWeights} className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:items-end">
            <Field label="Subject competence"><input name="competence" type="number" min={0} max={100} defaultValue={weights.competence} className={inputClass} /></Field>
            <Field label="Schedule fit"><input name="schedule" type="number" min={0} max={100} defaultValue={weights.schedule} className={inputClass} /></Field>
            <Field label="Experience"><input name="experience" type="number" min={0} max={100} defaultValue={weights.experience} className={inputClass} /></Field>
            <Field label="Student needs"><input name="requirements" type="number" min={0} max={100} defaultValue={weights.requirements} className={inputClass} /></Field>
            <Field label="Workload balance"><input name="workload" type="number" min={0} max={100} defaultValue={weights.workload} className={inputClass} /></Field>
            <SubmitButton>Save weights</SubmitButton>
          </form>
        </Panel>
      )}
    </div>
  );
}
