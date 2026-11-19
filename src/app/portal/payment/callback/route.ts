import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { confirmPaystackReference } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

// Paystack sends the student back here after checkout. We verify server-side before showing anything.
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref") ?? "";
  const to = (msg: Record<string, string>) =>
    NextResponse.redirect(new URL(`/portal/payment?${new URLSearchParams(msg)}`, request.url));

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/portal/payment", request.url));

  // Only the student who owns the invoice can trigger verification from here.
  const owned = await prisma.payment.findFirst({ where: { reference, invoice: { student: { userId: user.id } } } });
  if (!owned) return to({ error: "We couldn't find that payment." });

  try {
    const outcome = await confirmPaystackReference(reference);
    const { result } = outcome;
    if (result === "success" && outcome.activated) (await import("@/lib/matching/respond")).scheduleMatching();
    if (result === "success" || result === "already") return to({ ok: "Payment confirmed. Thank you!" });
    if (result === "failed") return to({ error: "The payment didn't go through. You haven't been charged; please try again." });
    if (result === "review") return to({ ok: "We received your payment and our finance team is checking it." });
    return to({ ok: "Your payment is still processing. Refresh this page in a minute." });
  } catch {
    return to({ error: "We couldn't confirm the payment with Paystack yet. Refresh this page in a minute." });
  }
}
