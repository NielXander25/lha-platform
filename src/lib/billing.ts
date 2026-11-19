import "server-only";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export const CYCLES = { MONTHLY: 1, QUARTERLY: 3 } as const;
export type Cycle = keyof typeof CYCLES;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  UNDER_REVIEW: "Under review",
  VERIFIED: "Verified",
  PARTIALLY_PAID: "Partially paid",
  OVERPAID: "Overpaid",
  FAILED: "Failed",
  REVERSED: "Reversed",
  REFUNDED: "Refunded",
};

const code = (n: number) => randomBytes(n).toString("hex").toUpperCase();
const yymm = () => new Date().toISOString().slice(2, 7).replace("-", "");

export const newReference = (prefix: "PSK" | "TRF") => `LHA-${prefix}-${yymm()}-${code(5)}`;

export function priceFor(pkg: { monthlyPrice: number; quarterlyPrice: number }, cycle: Cycle) {
  return cycle === "QUARTERLY" ? pkg.quarterlyPrice : pkg.monthlyPrice;
}

/**
 * The invoice the student should pay now for their chosen package and billing cycle.
 * Reuses an open invoice if nothing changed; otherwise voids it and issues a fresh one.
 */
export async function openInvoiceFor(studentId: string) {
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    include: { package: true },
  });
  if (!student.package) throw new Error("Choose a package first.");
  const cycle = student.billingCycle as Cycle;
  const amount = priceFor(student.package, cycle);

  const open = await prisma.invoice.findFirst({
    where: { studentId, status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
    include: { subscription: true },
    orderBy: { createdAt: "desc" },
  });
  if (open) {
    const same = open.subscription.packageId === student.package.id && open.subscription.cycle === cycle && open.amount === amount;
    // Never void an invoice that has money on it; finance resolves those.
    if (same || open.amountPaid > 0) return open;
    await prisma.$transaction([
      prisma.invoice.update({ where: { id: open.id }, data: { status: "VOID" } }),
      prisma.subscription.update({ where: { id: open.subscriptionId }, data: { status: "CANCELLED" } }),
    ]);
  }

  return prisma.invoice.create({
    data: {
      number: `INV-${yymm()}-${code(3)}`,
      amount,
      student: { connect: { id: studentId } },
      subscription: {
        create: {
          studentId,
          packageId: student.package.id,
          cycle,
          months: CYCLES[cycle],
          amount,
        },
      },
    },
    include: { subscription: true },
  });
}

/**
 * Apply a server-verified result to a payment. Idempotent: only a payment that is still
 * PENDING or UNDER_REVIEW can change, so duplicate webhooks or double clicks do nothing.
 */
export async function settlePayment(input: {
  paymentId: string;
  outcome: "SUCCESS" | "FAILED";
  amountReceived?: number; // whole Naira actually received
  gatewayTransaction?: string;
  gatewayResponse?: Prisma.InputJsonValue;
  bankReference?: string;
  actorId?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUniqueOrThrow({
      where: { id: input.paymentId },
      include: { invoice: { include: { subscription: true } } },
    });

    if (input.outcome === "FAILED") {
      const { count } = await tx.payment.updateMany({
        where: { id: payment.id, status: { in: ["PENDING", "UNDER_REVIEW"] } },
        data: { status: "FAILED", gatewayResponse: input.gatewayResponse, verifiedById: input.actorId ?? null, verifiedAt: new Date() },
      });
      if (count) await audit({ actorId: input.actorId, action: "payment.failed", entity: "Payment", entityId: payment.id }, tx);
      return { changed: count > 0, activated: false };
    }

    const received = input.amountReceived ?? 0;
    const status = received === payment.amountExpected ? "VERIFIED" : received < payment.amountExpected ? "PARTIALLY_PAID" : "OVERPAID";

    // The status guard is what makes this safe to call more than once.
    const { count } = await tx.payment.updateMany({
      where: { id: payment.id, status: { in: ["PENDING", "UNDER_REVIEW"] } },
      data: {
        status,
        amountReceived: received,
        gatewayTransaction: input.gatewayTransaction,
        gatewayResponse: input.gatewayResponse,
        bankReference: input.bankReference,
        verifiedById: input.actorId ?? null,
        verifiedAt: new Date(),
      },
    });
    if (!count) return { changed: false, activated: false };

    const invoice = payment.invoice;
    const amountPaid = invoice.amountPaid + received;
    const paid = amountPaid >= invoice.amount;
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { amountPaid, status: paid ? "PAID" : "PARTIALLY_PAID", paidAt: paid ? new Date() : null },
    });

    let activated = false;
    if (paid && invoice.subscription.status === "PENDING") {
      const now = new Date();
      // A renewal starts when the current subscription ends; a first subscription starts now.
      const current = await tx.subscription.findFirst({
        where: { studentId: invoice.studentId, status: "ACTIVE", endsAt: { gt: now } },
        orderBy: { endsAt: "desc" },
      });
      const startsAt = current?.endsAt ?? now;
      const endsAt = new Date(startsAt);
      endsAt.setMonth(endsAt.getMonth() + invoice.subscription.months);
      await tx.subscription.update({ where: { id: invoice.subscriptionId }, data: { status: "ACTIVE", startsAt, endsAt } });
      await tx.studentProfile.updateMany({
        where: { id: invoice.studentId, status: { in: ["AWAITING_PAYMENT", "PAYMENT_PENDING", "PAYMENT_VERIFIED"] } },
        data: { status: "AWAITING_ALLOCATION" },
      });
      activated = true;
    }

    await audit(
      {
        actorId: input.actorId,
        action: `payment.${status.toLowerCase()}`,
        entity: "Payment",
        entityId: payment.id,
        details: { reference: payment.reference, method: payment.method, expected: payment.amountExpected, received, activated },
      },
      tx,
    );
    return { changed: true, activated };
  });
}
