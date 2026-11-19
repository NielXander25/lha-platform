import Link from "next/link";
import { PageHeader } from "@/components/admin-ui";
import { Panel } from "@/components/portal-ui";
import { requireUser, STAFF_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminOverview() {
  const user = await requireUser(STAFF_ROLES);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    students,
    activeSubs,
    pendingTransfers,
    verifiedThisMonth,
    approvedTutors,
    pendingTutors,
    awaitingAllocation,
    byDepartment,
    byPackage,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.subscription.count({ where: { status: "ACTIVE", endsAt: { gt: now } } }),
    prisma.payment.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.payment.aggregate({ where: { status: { in: ["VERIFIED", "OVERPAID", "PARTIALLY_PAID"] }, verifiedAt: { gte: monthStart } }, _sum: { amountReceived: true }, _count: true }),
    prisma.tutor.count({ where: { status: "APPROVED", active: true } }),
    prisma.tutor.count({ where: { status: "PENDING", userId: { not: null } } }),
    prisma.studentProfile.count({ where: { status: "AWAITING_ALLOCATION" } }),
    prisma.studentProfile.groupBy({ by: ["departmentId"], _count: true }),
    prisma.subscription.groupBy({ by: ["packageId"], where: { status: "ACTIVE", endsAt: { gt: now } }, _count: true, _sum: { amount: true } }),
  ]);
  const [departments, packages] = await Promise.all([
    prisma.department.findMany({ select: { id: true, name: true } }),
    prisma.package.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const deptName = new Map(departments.map((d) => [d.id, d.name]));
  const finance = user.role !== "SUPPORT";

  const stats = [
    { label: "Registered students", value: students, href: "/admin/students" },
    { label: "Active subscriptions", value: activeSubs, href: "/admin/students?status=AWAITING_ALLOCATION" },
    ...(finance
      ? [
          { label: "Transfers to verify", value: pendingTransfers, href: "/admin/payments", alert: pendingTransfers > 0 },
          { label: "Verified this month", value: formatPrice(verifiedThisMonth._sum.amountReceived ?? 0), href: "/admin/payments?status=VERIFIED" },
        ]
      : []),
    { label: "Approved tutors", value: approvedTutors, href: "/admin/tutors" },
    { label: "Tutor applications", value: pendingTutors, href: "/admin/tutors?status=PENDING", alert: pendingTutors > 0 },
    { label: "Awaiting allocation", value: awaitingAllocation, href: "/admin/students?status=AWAITING_ALLOCATION", alert: awaitingAllocation > 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description={`Signed in as ${user.name}.`} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300">
            <p className={`font-display text-2xl font-semibold sm:text-3xl ${s.alert ? "text-amber-600" : "text-brand-800"}`}>{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="font-semibold text-slate-900">Students by department</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {byDepartment.sort((a, b) => b._count - a._count).map((d) => (
              <li key={d.departmentId ?? "none"} className="flex justify-between gap-3">
                <span className="text-slate-700">{d.departmentId ? deptName.get(d.departmentId) : "Not set yet"}</span>
                <span className="font-semibold text-slate-900">{d._count}</span>
              </li>
            ))}
            {byDepartment.length === 0 && <li className="text-slate-500">No students yet.</li>}
          </ul>
        </Panel>
        {finance && (
          <Panel>
            <h2 className="font-semibold text-slate-900">Active subscriptions by package</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {packages.map((p) => {
                const row = byPackage.find((b) => b.packageId === p.id);
                return (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="text-slate-700">{p.name}</span>
                    <span className="font-semibold text-slate-900">
                      {row?._count ?? 0} · {formatPrice(row?._sum.amount ?? 0)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
