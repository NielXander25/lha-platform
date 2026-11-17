import { saveAvailability } from "../actions";
import { AvailabilityGrid } from "@/components/availability-grid";
import { FlashMessage, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit } from "@/components/forms";
import { currentStudent } from "@/lib/current";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function AvailabilityStep({ searchParams }: { searchParams: SearchParams }) {
  const { user, student } = await currentStudent();
  const params = await searchParams;
  const [slots, lectures] = await Promise.all([
    prisma.availability.findMany({ where: { userId: user.id } }),
    prisma.timetableEntry.findMany({ where: { studentId: student.id } }),
  ]);

  return (
    <div className="max-w-4xl">
      <StepHeader
        step="Step 4 of 5"
        title="When are you free?"
        description="Mark the times you can attend tutorials. Mark other commitments (church, work, sports…) as not available. Your lectures are already blocked."
      />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />
      <Panel>
        <form action={saveAvailability} className="space-y-5">
          <AvailabilityGrid
            available={slots.filter((s) => s.kind === "AVAILABLE")}
            unavailable={slots.filter((s) => s.kind === "UNAVAILABLE")}
            blocked={lectures.map((l) => ({ day: l.day, startMin: l.startMin, endMin: l.endMin, label: `${l.courseCode} (lecture)` }))}
          />
          <Submit>Save and continue</Submit>
        </form>
      </Panel>
    </div>
  );
}
