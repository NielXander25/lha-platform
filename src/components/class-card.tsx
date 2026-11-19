import { CalendarDays, MapPin, UserRound, Users } from "lucide-react";
import { StatusBadge } from "@/components/portal-ui";
import { CLASS_STATUS, describeSessions, modeLabel } from "@/lib/classes";

type ClassLike = {
  id: string;
  status: string;
  mode: string;
  course: { code: string | null; title: string };
  package: { name: string };
  tutor: { name: string };
  location: { name: string } | null;
  sessions: { day: number; startMin: number; endMin: number }[];
  members: { status: string; student: { user: { name: string } } }[];
};

/** A class summary used on the student and tutor dashboards. `actions` renders accept/decline buttons. */
export function ClassCard({ c, viewer, actions, note }: { c: ClassLike; viewer: "student" | "tutor"; actions?: React.ReactNode; note?: string }) {
  const st = CLASS_STATUS[c.status as keyof typeof CLASS_STATUS];
  const members = c.members.filter((m) => m.status !== "DECLINED");
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{c.course.code ? `${c.course.code}: ` : ""}{c.course.title}</p>
          <p className="text-xs text-slate-500">{c.package.name}</p>
        </div>
        {st && <StatusBadge label={st.label} tone={st.tone} />}
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
        <li className="flex gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-600" /> {describeSessions(c.sessions)}</li>
        <li className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" /> {c.location ? c.location.name : modeLabel(c.mode)}</li>
        {viewer === "student" ? (
          <li className="flex gap-2"><UserRound className="mt-0.5 size-4 shrink-0 text-brand-600" /> Tutor: {c.tutor.name}</li>
        ) : (
          <li className="flex gap-2"><Users className="mt-0.5 size-4 shrink-0 text-brand-600" /> {members.length} student{members.length === 1 ? "" : "s"}: {members.map((m) => m.student.user.name).join(", ")}</li>
        )}
      </ul>
      {note && <p className="mt-3 text-sm text-slate-600">{note}</p>}
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function RespondButtons({ action, classId }: { action: (fd: FormData) => void; classId: string }) {
  return (
    <>
      <form action={action}>
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="accept" value="true" />
        <button className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">Accept</button>
      </form>
      <form action={action}>
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="accept" value="false" />
        <button className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Decline</button>
      </form>
    </>
  );
}
