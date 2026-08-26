import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/utils";
import { requestPaidCertificate } from "./actions";

const completionTone: Record<string, "neutral" | "warn" | "ok"> = {
  NOT_ELIGIBLE: "neutral",
  ELIGIBLE: "warn",
  ISSUED: "ok",
};

const paidTone: Record<string, "neutral" | "warn" | "ok"> = {
  NOT_REQUESTED: "neutral",
  REQUESTED: "warn",
  PAID: "warn",
  PROCESSING: "warn",
  ISSUED: "ok",
};

export default async function CertificatePage() {
  const session = await auth();
  const cert = await prisma.certificate.findUnique({ where: { userId: session!.user.id } });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Certificates</h1>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-lg text-[var(--color-navy)]">Certificate of Completion</div>
            <p className="text-sm text-[var(--color-ink)]/60">Free · Soft copy · Issued when completion requirements are met</p>
          </div>
          <Badge tone={completionTone[cert?.completionStatus ?? "NOT_ELIGIBLE"]}>
            {(cert?.completionStatus ?? "NOT_ELIGIBLE").replace("_", " ")}
          </Badge>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-lg text-[var(--color-navy)]">Certified Leadership Development Certificate</div>
            <p className="text-sm text-[var(--color-ink)]/60">
              Paid — {formatNaira(1500000)} · Delivery fee charged separately for hard copy
            </p>
          </div>
          <Badge tone={paidTone[cert?.paidStatus ?? "NOT_REQUESTED"]}>
            {(cert?.paidStatus ?? "NOT_REQUESTED").replace("_", " ")}
          </Badge>
        </div>

        {(!cert || cert.paidStatus === "NOT_REQUESTED") && (
          <form action={requestPaidCertificate} className="mt-4 space-y-3 border-t border-[var(--color-line)] pt-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="wantsHardCopy" className="accent-[var(--color-navy)]" />
              I also want a hard copy (delivery fee paid separately)
            </label>
            <input
              name="deliveryAddress"
              placeholder="Delivery address (if hard copy requested)"
              className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
            <Button type="submit" variant="secondary">Request certificate</Button>
            <p className="text-xs text-[var(--color-ink)]/40">
              Payment is coordinated by the programme team after your request is recorded.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
