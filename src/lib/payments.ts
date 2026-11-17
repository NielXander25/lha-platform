import "server-only";
import { settlePayment } from "@/lib/billing";
import { verifyTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

/**
 * Confirm a Paystack payment by asking Paystack directly (never trusting the browser or the
 * webhook body), then settle it. Safe to call repeatedly for the same reference.
 */
export async function confirmPaystackReference(reference: string) {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment || payment.method !== "PAYSTACK") return { result: "unknown" as const };
  if (!["PENDING", "UNDER_REVIEW"].includes(payment.status)) return { result: "already" as const, status: payment.status };

  const tx = await verifyTransaction(reference);
  const response = { id: tx.id, status: tx.status, amount: tx.amount, currency: tx.currency, paid_at: tx.paid_at };

  if (tx.reference !== reference) return { result: "mismatch" as const };

  if (tx.status === "success") {
    if (tx.currency !== "NGN") {
      // Never activate on a currency we don't expect; leave it for finance to review.
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "UNDER_REVIEW", gatewayResponse: response } });
      return { result: "review" as const };
    }
    const { activated } = await settlePayment({
      paymentId: payment.id,
      outcome: "SUCCESS",
      amountReceived: Math.floor(tx.amount / 100),
      gatewayTransaction: String(tx.id),
      gatewayResponse: response,
    });
    return { result: "success" as const, activated };
  }

  if (tx.status === "failed" || tx.status === "reversed") {
    await settlePayment({ paymentId: payment.id, outcome: "FAILED", gatewayResponse: response });
    return { result: "failed" as const };
  }

  // "abandoned", "ongoing", "pending": nothing to do yet.
  return { result: "pending" as const };
}
