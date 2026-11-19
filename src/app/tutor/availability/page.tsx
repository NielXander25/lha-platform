import { saveTutorAvailability } from "../actions";
import { AvailabilityGrid } from "@/components/availability-grid";
import { FlashMessage, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit } from "@/components/forms";
import { currentTutor } from "@/lib/current";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TutorAvailability({ searchParams }: { searchParams: SearchParams }) {
  const { user } = await currentTutor();
  const params = await searchParams;
  const slots = await prisma.availability.findMany({ where: { userId: user.id } });

  return (
    <div className="max-w-4xl">
      <StepHeader step="Step 3 of 3" title="When can you teach?" description="Mark the weekly times you're available. This repeats every week; update it whenever your schedule changes." />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />
      <Panel>
        <form action={saveTutorAvailability} className="space-y-5">
          <AvailabilityGrid
            available={slots.filter((s) => s.kind === "AVAILABLE")}
            unavailable={slots.filter((s) => s.kind === "UNAVAILABLE")}
          />
          <Submit>Save availability</Submit>
        </form>
      </Panel>
    </div>
  );
}
