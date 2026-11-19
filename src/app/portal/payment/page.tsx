import Link from "next/link";
import { Building, CreditCard } from "lucide-react";
import { startPaystackPayment, submitBankTransfer } from "../actions";
import { FlashMessage, Notice, one, Panel, StatusBadge, StepHeader } from "@/components/portal-ui";
import { Submit } from "@/components/forms";
import { fieldClass } from "@/lib/ui";
import { PAYMENT_STATUS_LABELS, priceFor, type Cycle } from "@/lib/billing";
import { BANK } from "@/lib/constants";
import { currentStudent } from "@/lib/current";
import { paystackConfigured } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { studentProgress } from "@/lib/students";
import { formatPrice } from "@/lib/utils";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;
const dateFmt = new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });

export default async function PaymentStep({ searchParams }: { searchParams: SearchParams }) {
  const { student } = await currentStudent();
  const params = await searchParams;
  const [{ done }, pkg, invoices] = await Promise.all([
    studentProgress(student.id),
    student.packageId ? prisma.package.findUnique({ where: { id: student.packageId } }) : null,
    prisma.invoice.findMany({
      where: { studentId: student.id, status: { not: "VOID" } },
      include: { payments: { orderBy: { createdAt: "desc" } }, subscription: { include: { package: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ready = done.profile && done.courses && done.timetable && done.availability;
  const open = invoices.find((i) => i.status === "UNPAID" || i.status === "PARTIALLY_PAID");
  const transferPending = open?.payments.some((p) => p.method === "BANK_TRANSFER" && p.status === "UNDER_REVIEW");
  const cycle = student.billingCycle as Cycle;
  const amount = open ? open.amount - open.amountPaid : pkg ? priceFor(pkg, cycle) : 0;
  const payments = invoices.flatMap((i) => i.payments.map((p) => ({ ...p, invoice: i })));

  return (
    <div className="max-w-3xl space-y-6">
      <StepHeader step="Step 5 of 5" title="Payment" description="Your subscription starts as soon as your payment is verified." />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />

      {!ready ? (
        <Notice tone="warning">
          Finish the earlier steps first. <Link href="/portal" className="font-semibold underline">See what&apos;s left</Link>
        </Notice>
      ) : done.payment ? (
        <Notice tone="success">Your payment is verified and your subscription is active.</Notice>
      ) : (
        <>
          <Panel>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">You&apos;re paying for</p>
                <p className="font-display text-xl font-semibold text-brand-950">{pkg?.name}</p>
                <p className="text-sm text-slate-600">{cycle === "QUARTERLY" ? "Three months upfront" : "One month"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Amount due</p>
                <p className="font-display text-3xl font-semibold text-slate-900">{formatPrice(amount)}</p>
                {open && <p className="text-xs text-slate-500">Invoice {open.number}</p>}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Want a different package or to pay for three months? <Link href="/portal/courses" className="font-semibold text-brand-700 underline">Change it here</Link>.
            </p>
          </Panel>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel>
              <CreditCard className="size-9 rounded-xl bg-brand-50 p-2 text-brand-600" />
              <h2 className="mt-3 font-semibold text-slate-900">Pay online</h2>
              <p className="mt-1 text-sm text-slate-600">Card, bank transfer or USSD through Paystack. Activates instantly.</p>
              {paystackConfigured() ? (
                <form action={startPaystackPayment} className="mt-4">
                  <Submit className="w-full">Pay {formatPrice(amount)} with Paystack</Submit>
                </form>
              ) : (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Online payment is coming soon. Please use bank transfer for now.</p>
              )}
            </Panel>

            <Panel>
              <Building className="size-9 rounded-xl bg-brand-50 p-2 text-brand-600" />
              <h2 className="mt-3 font-semibold text-slate-900">Pay by bank transfer</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Bank</dt><dd className="text-right font-medium">{BANK.bankName}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Account name</dt><dd className="text-right font-medium">{BANK.accountName}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Account number</dt><dd className="text-right font-mono font-medium">{BANK.accountNumber}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Narration</dt><dd className="text-right font-mono font-medium">{student.studentCode}</dd></div>
              </dl>
              {transferPending ? (
                <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">Your transfer is under review. We&apos;ll activate your subscription once it&apos;s matched to our bank records.</p>
              ) : (
                <form action={submitBankTransfer} className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">After paying, tell us about the transfer</span>
                    <textarea
                      name="payerNote"
                      required
                      rows={3}
                      placeholder="Name on the account you paid from, date, and the bank's reference if you have it"
                      className={`${fieldClass} mt-1.5`}
                    />
                  </label>
                  <Submit className="w-full">I&apos;ve made the transfer</Submit>
                  <p className="text-xs text-slate-500">Screenshots aren&apos;t needed: we confirm every transfer against our bank statement.</p>
                </form>
              )}
            </Panel>
          </div>
        </>
      )}

      {payments.length > 0 && (
        <Panel>
          <h2 className="font-semibold text-slate-900">Payment history</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>
                  <span className="block font-medium text-slate-900">
                    {p.method === "PAYSTACK" ? "Paystack" : "Bank transfer"} · {formatPrice(p.amountReceived ?? p.amountExpected)}
                  </span>
                  <span className="text-slate-500">{dateFmt.format(p.createdAt)} · {p.reference}</span>
                </span>
                <StatusBadge
                  label={PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                  tone={p.status === "VERIFIED" || p.status === "OVERPAID" ? "good" : p.status === "FAILED" || p.status === "REVERSED" ? "bad" : "warn"}
                />
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
