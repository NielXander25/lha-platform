import { saveProfile } from "../actions";
import { FlashMessage, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit, TextField, fieldClass } from "@/components/forms";
import { LEVELS } from "@/lib/constants";
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
        <form action={saveProfile} className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone number" name="phone" type="tel" defaultValue={user.phone ?? ""} autoComplete="tel" />
          <TextField label="Institution" name="institution" defaultValue={student.institution} />
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Department</span>
            <select name="departmentId" required defaultValue={student.departmentId ?? ""} className={`${fieldClass} mt-1.5`}>
              <option value="" disabled>Choose your department…</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Level</span>
            <select name="level" required defaultValue={student.level ?? ""} className={`${fieldClass} mt-1.5`}>
              <option value="" disabled>Choose…</option>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Semester</span>
            <select name="semester" required defaultValue={student.semester ?? ""} className={`${fieldClass} mt-1.5`}>
              <option value="" disabled>Choose…</option>
              <option value="FIRST">First semester</option>
              <option value="SECOND">Second semester</option>
            </select>
          </label>
          <div className="sm:col-span-2">
            <TextField label="Matriculation number" name="matricNumber" required={false} defaultValue={student.matricNumber ?? ""} />
          </div>
          <div className="sm:col-span-2">
            <Submit>Save and continue</Submit>
          </div>
        </form>
      </Panel>
    </div>
  );
}
