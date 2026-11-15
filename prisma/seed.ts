// Starter data for Learning Hub Africa (AFIT tutorials).
// Course titles, descriptions, tutors and schedules are placeholders:
// edit them in the admin area or here.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const course = (
  code: string,
  title: string,
  category: string,
  summary: string,
  description: string,
) => ({
  slug: code.toLowerCase().replace(/\s+/g, "-"),
  code,
  title,
  category,
  level: "100 Level",
  summary,
  description,
  sessionsPerWeek: 2,
  sessionLengthMins: 120,
});

const courses = [
  course("MTH 101", "Elementary Mathematics I", "Mathematics",
    "Sets, real numbers, indices, logarithms, quadratics, sequences and series, and trigonometry.",
    "Step-by-step tutorials through the MTH 101 course outline, with worked examples, practice questions and past-question sessions before tests and exams."),
  course("MTH 103", "Elementary Mathematics III", "Mathematics",
    "Vectors, coordinate geometry and other MTH 103 topics.",
    "Clear explanations of every MTH 103 topic, plenty of practice problems and revision sessions ahead of tests and exams."),
  course("PHY 101", "General Physics I", "Physics",
    "Mechanics: units, motion, Newton's laws, work, energy and properties of matter.",
    "Concept-first tutorials with lots of calculation practice, so you can tackle both theory and problem questions in PHY 101 with confidence."),
  course("PHY 107", "General Physics Practical I", "Physics",
    "Experiments, measurements, error analysis, graphs and writing up practical reports.",
    "Get comfortable with the PHY 107 experiments: what to measure, how to plot and analyse results, and how to write reports that score well."),
  course("CHM 101", "General Chemistry I", "Chemistry",
    "Atomic structure, chemical bonding, stoichiometry and the periodic table.",
    "Simplified notes, worked calculations and past questions covering the CHM 101 course outline."),
];

const tiers = [
  { name: "General class", ratio: "Group : 1 tutor", description: "Join the general class and learn alongside other students with one tutor.", price: 5000, sortOrder: 1 },
  { name: "Two-to-one", ratio: "2 students : 1 tutor", description: "You and one other student share a tutor for closer attention.", price: 7000, sortOrder: 2 },
  { name: "One-on-one", ratio: "1 student : 1 tutor", description: "Private tutorials: just you and the tutor, at your pace.", price: 10000, sortOrder: 3 },
];

const departments = [
  "Electrical Engineering",
  "Mechatronics Engineering",
  "Mechanical Engineering",
  "Aerospace Engineering",
  "Civil Engineering",
  "Telecommunication Engineering",
  "Information Communication Engineering",
  "Metallurgical and Materials Engineering",
  "Automotive Engineering",
];

const tutors = [
  { name: "Tutor One", email: "tutor1@example.com", subjects: "Mathematics", bio: "Replace with a real tutor." },
  { name: "Tutor Two", email: "tutor2@example.com", subjects: "Physics", bio: "Replace with a real tutor." },
  { name: "Tutor Three", email: "tutor3@example.com", subjects: "Chemistry", bio: "Replace with a real tutor." },
];

const locations = [
  ...["LR 101", "LR 102", "LR 201", "LR 202", "LR 301", "LR 302"].map((name) => ({ name, kind: "Lecture room" })),
  ...["Hall A", "Hall B1", "Hall B3", "Hall C1", "Hall C3"].map((name) => ({ name, kind: "Hall" })),
];

// [course code, tutor email, location, schedule]
const assignments: [string, string, string, string][] = [
  ["MTH 101", "tutor1@example.com", "LR 101", "Mon & Wed, 4:00 pm"],
  ["MTH 103", "tutor1@example.com", "LR 102", "Tue & Thu, 4:00 pm"],
  ["PHY 101", "tutor2@example.com", "LR 201", "Mon & Wed, 4:00 pm"],
  ["PHY 107", "tutor2@example.com", "Hall B1", "Fri, 3:00 pm"],
  ["CHM 101", "tutor3@example.com", "Hall C1", "Tue & Thu, 5:00 pm"],
];

async function main() {
  if ((await prisma.course.count()) > 0) {
    console.log("Database already has data. Run `npm run db:reset` to replace it with the starter data.");
    return;
  }
  await prisma.pricingTier.createMany({ data: tiers });
  await prisma.department.createMany({ data: departments.map((name) => ({ name })) });
  // The 100 Level courses are general courses taken by every department.
  const allDepartments = (await prisma.department.findMany({ select: { id: true } })).map(({ id }) => ({ id }));
  for (const data of courses) {
    await prisma.course.create({ data: { ...data, departments: { connect: allDepartments } } });
  }
  await prisma.tutor.createMany({ data: tutors });
  await prisma.location.createMany({ data: locations });
  for (const [code, email, locationName, schedule] of assignments) {
    const [c, t, l] = await Promise.all([
      prisma.course.findFirstOrThrow({ where: { code } }),
      prisma.tutor.findUniqueOrThrow({ where: { email } }),
      prisma.location.findUniqueOrThrow({ where: { name: locationName } }),
    ]);
    await prisma.assignment.create({ data: { courseId: c.id, tutorId: t.id, locationId: l.id, schedule } });
  }
  console.log(`Seeded ${departments.length} departments, ${courses.length} courses, ${tutors.length} tutors, ${locations.length} locations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
