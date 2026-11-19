import Link from "next/link";
import { rejectTransfer, verifyTransfer } from "../actions";
import { PageHeader, firstString } from "@/components/admin-ui";
import { FlashMessage, Panel, StatusBadge } from "@/components/portal-ui";
import { fieldClass } from "@/lib/ui";
import { requireUser } from "@/lib/auth";
import { PAYMENT_STATUS_LABELS } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { cn, formatPrice } from "@/lib/utils";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });

export default async function AdminPayments({ searchParams }: { searchParams: SearchParams }) {
  await requireUser(["ADMIN", "FINANCE"]);
  const params = await searchParams;
  const status = firstString(params.status);

  const include = { invoice: { include: { student: { include: { user: { select: { name: true, email: true } } } }, subscription: { include: { package: true } } } } } as const;
  const [review, payments, totals] = await Promise.all([
    prisma.payment.findMany({ where: { status: "UNDER_REVIEW" }, include, orderBy: { createdAt: "asc" } }),
    prisma.payment.findMany({ where: status ? { status } : { status: { not: "UNDER_REVIEW" } }, include, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.payment.groupBy({ by: ["status"], _count: true, _sum: { amountReceived: true } }),
  ]);
  const verifiedTotal = totals.filter((t) => ["VERIFIED", "OVERPAID", "PARTIALLY_PAID"].includes(t.status)).reduce((s, t) => s + (t._sum.amountReceived ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description={`Verified to date: ${formatPrice(verifiedTotal)}. Paystack payments verify automatically; bank transfers are matched here.`} />
      <FlashMessage ok={firstString(params.ok)} error={firstString(params.error)} />

      <Panel>
        <h2 className="font-semibold text-slate-900">Bank transfers to verify ({review.length})</h2>
        <p className="mt-1 text-sm text-slate-500">
          Find the matching credit on the bank statement first. Enter the amount that actually arrived and the statement reference; never verify from a screenshot.
        </p>
        <div className="mt-4 space-y-4">
          {review.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span>
                  <span className="font-semibold text-slate-900">{p.invoice.student.user.name}</span>{" "}
                  <span className="text-slate-500">({p.invoice.student.studentCode})</span>
                </span>
                <span className="font-semibold">{formatPrice(p.amountExpected)} expected</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {p.invoice.subscription.package.name} · invoice {p.invoice.number} · submitted {dateFmt.format(p.createdAt)}
              </p>
              {p.payerNote && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">“{p.payerNote}”</p>}
              <form action={verifyTransfer} className="mt-3 grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
                <input type="hidden" name="paymentId" value={p.id} />
                <input name="amountReceived" type="number" min={1} required defaultValue={p.amountExpected} className={fieldClass} aria-label="Amount received" />
                <input name="bankReference" required placeholder="Bank statement reference" className={fieldClass} aria-label="Bank reference" />
                <button className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Verify</button>
              </form>
              <form action={rejectTransfer} className="mt-2">
                <input type="hidden" name="paymentId" value={p.id} />
                <button className="text-xs font-semibold text-rose-600 hover:underline">Not found in bank records</button>
              </form>
            </div>
          ))}
          {review.length === 0 && <p className="text-sm text-slate-500">Nothing to verify.</p>}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">All payments</h2>
          <div className="flex flex-wrap gap-1.5">
            {[undefined, "VERIFIED", "PENDING", "PARTIALLY_PAID", "OVERPAID", "FAILED", "REVERSED", "REFUNDED"].map((s) => (
              <Link
                key={s ?? "all"}
                href={s ? `/admin/payments?status=${s}` : "/admin/payments"}
                className={cn("rounded-full border px-2.5 py-1 text-xs font-medium", status === s ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 text-slate-600")}
              >
                {s ? PAYMENT_STATUS_LABELS[s] : "All"}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Student</th><th className="py-2 pr-3">Method / reference</th><th className="py-2 pr-3">Amount</th><th className="py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-3 text-slate-600">{dateFmt.format(p.createdAt)}</td>
                  <td className="py-2 pr-3">{p.invoice.student.user.name}<br /><span className="text-xs text-slate-500">{p.invoice.student.studentCode}</span></td>
                  <td className="py-2 pr-3 text-slate-600">{p.method === "PAYSTACK" ? "Paystack" : "Transfer"}<br /><span className="font-mono text-xs">{p.reference}</span>{p.bankReference && <span className="block text-xs">Bank ref {p.bankReference}</span>}</td>
                  <td className="py-2 pr-3">{formatPrice(p.amountReceived ?? p.amountExpected)}</td>
                  <td className="py-2"><StatusBadge label={PAYMENT_STATUS_LABELS[p.status] ?? p.status} tone={p.status === "VERIFIED" ? "good" : p.status === "FAILED" || p.status === "REVERSED" ? "bad" : "warn"} /></td>
                </tr>
              ))}
              {payments.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No payments.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
