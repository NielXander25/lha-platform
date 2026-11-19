import "server-only";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

// Grows the course catalogue from students' timetables: any real-looking course code that isn't
// in the catalogue yet is added, and existing courses learn which departments take them.

/**
 * Find the course code in a timetable label: "mth101", "MTH-101", "AFIT-EEE305", "EEE 305 (Lab)"
 * all give "MTH 101" / "EEE 305". Returns null for things that aren't course codes ("FREE PERIOD").
 */
export function normaliseCourseCode(raw: string): string | null {
  const m = /(?:^|[^A-Za-z])([A-Za-z]{2,4})[\s\-_.]*(\d{3}[A-Za-z]?)(?![0-9])/.exec(raw);
  return m ? `${m[1].toUpperCase()} ${m[2].toUpperCase()}` : null;
}

/** "GET 303" when a course has no real title yet (its title is just its code). */
export const courseLabel = (c: { code: string | null; title: string }) =>
  c.code && c.title !== c.code ? `${c.code}: ${c.title}` : (c.code ?? c.title);

const SUBJECTS: [RegExp, string][] = [
  [/^(MTH|MAT|MAS)$/, "Mathematics"],
  [/^PHY$/, "Physics"],
  [/^(CHM|CHE|CHY)$/, "Chemistry"],
  [/^BIO$/, "Biology"],
  [/^(STA|STS)$/, "Statistics"],
  [/^(CSC|COS|CMP)$/, "Computer Science"],
  [/^(GST|GNS|GES)$/, "General Studies"],
  [/^(EEE|ELE|EEN)$/, "Electrical Engineering"],
  [/^(MEE|MEC|MCE)$/, "Mechanical Engineering"],
  [/^(MCT|MTR|MTE)$/, "Mechatronics Engineering"],
  [/^(CVE|CVL|CIV|CEG)$/, "Civil Engineering"],
  [/^(AEE|AER|AEN|ASE)$/, "Aerospace Engineering"],
  [/^(AUE|AUT|ATE)$/, "Automotive Engineering"],
  [/^(TCE|TEL|TLE)$/, "Telecommunication Engineering"],
  [/^(ICE|ICT)$/, "Information Communication Engineering"],
  [/^(MME|MSE|MET)$/, "Metallurgical and Materials Engineering"],
  [/^(ENG|GEN|EGR)$/, "Engineering"],
];

export function subjectFor(code: string) {
  const prefix = code.split(" ")[0];
  return SUBJECTS.find(([re]) => re.test(prefix))?.[1] ?? "General";
}

/** "EEE 307" -> "300 Level"; falls back to the student's own level. */
export function levelFor(code: string, fallback: string | null) {
  const digit = Number(code.split(" ")[1]?.[0]);
  return digit >= 1 && digit <= 5 ? `${digit}00 Level` : (fallback ?? "100 Level");
}

/**
 * Learn courses from a student's timetable. Safe to call repeatedly.
 * Returns the catalogue course ids that appear on the timetable.
 */
export async function learnCoursesFromTimetable(studentId: string, actorId?: string | null) {
  const student = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentId },
    include: { timetableEntries: { select: { courseCode: true, courseTitle: true } } },
  });

  // One entry per course code, keeping any title we were given.
  const found = new Map<string, string | null>();
  for (const e of student.timetableEntries) {
    const code = normaliseCourseCode(e.courseCode);
    if (code && (!found.has(code) || (!found.get(code) && e.courseTitle))) found.set(code, e.courseTitle?.trim() || null);
  }
  if (found.size === 0) return [];

  const existing = await prisma.course.findMany({ select: { id: true, code: true, title: true, addedFromTimetable: true } });
  const byCode = new Map(existing.filter((c) => c.code).map((c) => [normaliseCourseCode(c.code!) ?? c.code!, c]));
  const ids: string[] = [];
  const added: string[] = [];

  for (const [code, title] of found) {
    let course = byCode.get(code);
    if (!course) {
      let slug = slugify(code);
      for (let i = 2; await prisma.course.findUnique({ where: { slug } }); i++) slug = `${slugify(code)}-${i}`;
      const created = await prisma.course.create({
        data: {
          slug,
          code,
          title: title ?? code,
          category: subjectFor(code),
          level: levelFor(code, student.level),
          summary: `Tutorials for ${code}${title ? `: ${title}` : ""}.`,
          description: `Step-by-step tutorials that follow the ${code} course outline, with worked examples and past-question practice before tests and exams.`,
          addedFromTimetable: true,
          ...(student.departmentId && { departments: { connect: { id: student.departmentId } } }),
        },
        select: { id: true, code: true, title: true, addedFromTimetable: true },
      });
      course = created;
      byCode.set(code, created);
      added.push(code);
    } else {
      // Fill in a better title for a course we learned earlier with only its code.
      if (course.addedFromTimetable && title && course.title === course.code) {
        await prisma.course.update({ where: { id: course.id }, data: { title } });
      }
      // The catalogue learns which departments take each course.
      if (student.departmentId) {
        await prisma.course.update({ where: { id: course.id }, data: { departments: { connect: { id: student.departmentId } } } });
      }
    }
    ids.push(course.id);
  }

  if (added.length) {
    await audit({ actorId, action: "course.learned_from_timetable", entity: "Course", details: { added, studentCode: student.studentCode } });
  }
  return ids;
}
