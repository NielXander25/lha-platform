import { Trash2 } from "lucide-react";
import { deleteCredential, saveTutorProfile, uploadCredential } from "../actions";
import { FlashMessage, one, Panel, StepHeader } from "@/components/portal-ui";
import { Submit, TextField, fieldClass } from "@/components/forms";
import { currentTutor } from "@/lib/current";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function TutorProfile({ searchParams }: { searchParams: SearchParams }) {
  const { user, tutor } = await currentTutor();
  const params = await searchParams;
  const [departments, locations, credentials] = await Promise.all([
    prisma.department.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.location.findMany({ where: { active: true }, orderBy: [{ kind: "desc" }, { name: "asc" }] }),
    prisma.tutorCredential.findMany({ where: { tutorId: tutor.id }, select: { id: true, fileName: true, size: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <StepHeader step="Step 1 of 3" title="Profile & qualifications" />
      <FlashMessage ok={one(params.ok)} error={one(params.error)} />
      <Panel>
        <form action={saveTutorProfile} className="grid gap-4 sm:grid-cols-2">
          <TextField label="Phone number" name="phone" type="tel" defaultValue={user.phone ?? tutor.phone ?? ""} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Department <span className="font-normal text-slate-400">(optional)</span></span>
            <select name="departmentId" defaultValue={tutor.departmentId ?? ""} className={`${fieldClass} mt-1.5`}>
              <option value="">Not in a department / other</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Qualifications</span>
            <textarea name="qualifications" required rows={3} defaultValue={tutor.qualifications ?? ""} placeholder="e.g. B.Eng Electrical Engineering (First Class), AFIT 2023; M.Sc in view" className={`${fieldClass} mt-1.5`} />
          </label>
          <TextField label="Years of teaching experience" name="experienceYears" type="number" defaultValue={tutor.experienceYears?.toString() ?? ""} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Teaching mode</span>
            <select name="teachingMode" defaultValue={tutor.teachingMode} className={`${fieldClass} mt-1.5`}>
              <option value="IN_PERSON">In person on campus</option>
              <option value="ONLINE">Online</option>
              <option value="BOTH">Both</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Preferred location <span className="font-normal text-slate-400">(optional)</span></span>
            <select name="preferredLocationId" defaultValue={tutor.preferredLocationId ?? ""} className={`${fieldClass} mt-1.5`}>
              <option value="">No preference</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <TextField label="Maximum teaching hours per week" name="maxWeeklyHours" type="number" defaultValue={String(tutor.maxWeeklyHours)} />
          <TextField label="Maximum students per class" name="maxClassCapacity" type="number" defaultValue={String(tutor.maxClassCapacity)} />
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Short bio <span className="font-normal text-slate-400">(optional)</span></span>
            <textarea name="bio" rows={2} defaultValue={tutor.bio ?? ""} className={`${fieldClass} mt-1.5`} />
          </label>
          <div className="sm:col-span-2"><Submit>Save and continue</Submit></div>
        </form>
      </Panel>

      <Panel>
        <h2 className="font-semibold text-slate-900">Supporting credentials</h2>
        <p className="mt-1 text-sm text-slate-600">Certificates, transcripts or ID. PDF, JPG or PNG, up to 5 MB each. Only administrators can see them.</p>
        <form action={uploadCredential} className="mt-4 flex flex-wrap items-center gap-3">
          <input type="file" name="file" required accept="application/pdf,image/png,image/jpeg" className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand-700 sm:w-auto" />
          <Submit className="px-5 py-2.5 text-sm">Upload</Submit>
        </form>
        {credentials.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {credentials.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <a href={`/api/files/credential/${c.id}`} className="truncate font-medium text-brand-700 underline">{c.fileName}</a>
                <form action={deleteCredential}>
                  <input type="hidden" name="id" value={c.id} />
                  <button aria-label={`Remove ${c.fileName}`} className="text-rose-600"><Trash2 className="size-4" /></button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
