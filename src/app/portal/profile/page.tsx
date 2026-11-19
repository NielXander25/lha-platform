import { saveProfile } from "../actions";
import { ChoiceCards, FieldGroup } from "@/components/choice-cards";
import { FlashMessage, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit, TextField } from "@/components/forms";
import { LEVELS, shortDepartment } from "@/lib/constants";
import { currentStudent } from "@/lib/current";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function ProfileStep({ searchParams }: { searchParams: SearchParams }) {
  const { user, student } = await currentStudent();
  const params = await searchParams;
  const departments = await prisma.department.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl">
      <StepHeader step="Step 1 of 5" title="Academic profile" description="Tell us where and what you study." />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />
      <Panel>
        <form action={saveProfile} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Phone number" name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" />
            <TextField label="Institution" name="institution" defaultValue={student.institution} />
          </div>

          <FieldGroup label="Department">
            <ChoiceCards
              name="departmentId"
              defaultValue={student.departmentId}
              options={departments.map((d) => ({ value: d.id, label: shortDepartment(d.name), hint: "Engineering" }))}
            />
          </FieldGroup>

          <FieldGroup label="Level">
            <ChoiceCards
              name="level"
              size="sm"
              columns="grid-cols-3 sm:grid-cols-5"
              defaultValue={student.level}
              options={LEVELS.map((l) => ({ value: l, label: l.replace(" Level", "L") }))}
            />
          </FieldGroup>

          <FieldGroup label="Semester">
            <ChoiceCards
              name="semester"
              size="sm"
              columns="grid-cols-2"
              defaultValue={student.semester}
              options={[
                { value: "FIRST", label: "First semester" },
                { value: "SECOND", label: "Second semester" },
              ]}
            />
          </FieldGroup>

          <TextField label="Matriculation number" name="matricNumber" required={false} defaultValue={student.matricNumber ?? ""} />
          <Submit>Save and continue</Submit>
        </form>
      </Panel>
    </div>
  );
}
