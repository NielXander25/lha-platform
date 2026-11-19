import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { confirmPaystackReference } from "@/lib/payments";
import { validWebhookSignature } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

// Paystack calls this for payment events. The signature proves it came from Paystack; we still
// re-verify each charge through the API before acting on it.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!validWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string; transaction_reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad payload", { status: 400 });
  }
  const reference = event.data?.reference ?? event.data?.transaction_reference;

  if (event.event === "charge.success" && reference) {
    await confirmPaystackReference(reference);
  } else if (reference && (event.event === "refund.processed" || event.event === "charge.dispute.create")) {
    // Money left our account: flag the payment for finance. Access changes are decided by staff.
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (payment && payment.status !== "REVERSED") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: event.event === "refund.processed" ? "REFUNDED" : "REVERSED" } });
      await audit({ action: `payment.${event.event}`, entity: "Payment", entityId: payment.id, details: { reference } });
    }
  }

  // Always 200 for a valid signature so Paystack doesn't retry events we've handled or ignore.
  return NextResponse.json({ received: true });
}
