import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { submitSessionFeedback } from "./actions";

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-[var(--color-navy)]">Session feedback</h1>
      {sent && (
        <Card className="!border-green-200 !bg-green-50 text-sm text-[var(--color-ok)]">
          Thanks — your feedback has been submitted.
        </Card>
      )}
      <Card>
        <form action={submitSessionFeedback} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">How useful was today&apos;s session? (1–5)</label>
            <select name="usefulnessScore" required className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="">Select a score</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">How clear was the facilitator? (1–5)</label>
            <select name="clarityScore" required className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm">
              <option value="">Select a score</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Most valuable thing from today&apos;s session</label>
            <textarea name="mostValuable" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">What could have been better?</label>
            <textarea name="couldImprove" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Anything else the programme team should know?</label>
            <textarea name="otherNotes" rows={2} className="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm" />
          </div>
          <Button type="submit">Submit feedback</Button>
        </form>
      </Card>
    </div>
  );
}
