import Link from "next/link";
import { PageHeader, firstString } from "@/components/admin-ui";
import { StatusBadge } from "@/components/portal-ui";
import { fieldClass } from "@/components/forms";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STUDENT_STATUS_LABELS } from "@/lib/students";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AdminStudents({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["ADMIN", "SUPPORT", "FINANCE"]);
  const params = await searchParams;
  const status = firstString(params.status);
  const q = firstString(params.q)?.trim();

  const students = await prisma.studentProfile.findMany({
    where: {
      ...(status && { status }),
      ...(q && {
        OR: [
          { studentCode: { contains: q, mode: "insensitive" } },
          { matricNumber: { contains: q, mode: "insensitive" } },
          { user: { name: { contains: q, mode: "insensitive" } } },
          { user: { email: { contains: q, mode: "insensitive" } } },
        ],
      }),
    },
    include: { user: { select: { name: true, email: true } }, department: true, package: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Students" description="Everyone who has registered, with where they are in the process." />
      <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_16rem_auto]">
        <input name="q" defaultValue={q} placeholder="Search name, email, student ID or matric no." className={fieldClass} />
        <select name="status" defaultValue={status ?? ""} className={fieldClass}>
          <option value="">All statuses</option>
          {Object.entries(STUDENT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Department / level</th>
              <th className="px-4 py-3">Package</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-700">{s.user.name}</Link>
                  <p className="text-xs text-slate-500">{s.studentCode} · {s.user.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{s.department?.name ?? "—"}<br /><span className="text-xs">{s.level ?? ""}</span></td>
                <td className="px-4 py-3 text-slate-600">{s.package?.name ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge label={STUDENT_STATUS_LABELS[s.status] ?? s.status} /></td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-500">No students match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
