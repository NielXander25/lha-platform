// Sample data so the site has something to show (university course tutorials). All prices, tutors and
// locations below are placeholders: replace them with the real ones.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const course = (
  code: string,
  title: string,
  category: string,
  level: string,
  price: number,
  summary: string,
  description: string,
  sessionsPerWeek = 2,
  sessionLengthMins = 120,
) => ({
  slug: code.toLowerCase().replace(/\s+/g, "-"),
  code,
  title,
  category,
  level,
  price,
  billingUnit: "semester",
  summary,
  description,
  sessionsPerWeek,
  sessionLengthMins,
});

const courses = [
  course("MTH 101", "Elementary Mathematics I", "Sciences", "100 Level", 35000,
    "Sets, real numbers, sequences, quadratics, trigonometry and complex numbers.",
    "Step-by-step tutorials through the full MTH 101 course outline, with worked examples, weekly practice questions and past-question sessions before tests and exams."),
  course("MTH 102", "Elementary Mathematics II", "Sciences", "100 Level", 35000,
    "Differentiation, integration and their applications.",
    "Build a solid foundation in calculus: limits, differentiation techniques, integration and applications, with plenty of exam-style practice."),
  course("PHY 101", "General Physics I", "Sciences", "100 Level", 35000,
    "Mechanics, motion, work, energy and properties of matter.",
    "Clear explanations of core mechanics concepts and lots of calculation practice, so you can tackle theory and problem questions with confidence."),
  course("CHM 101", "General Chemistry I", "Sciences", "100 Level", 35000,
    "Atomic structure, bonding, stoichiometry and the periodic table.",
    "Covers the CHM 101 outline with simplified notes, worked calculations and past questions from recent semesters."),
  course("BIO 101", "General Biology I", "Sciences", "100 Level", 30000,
    "Cell biology, heredity, evolution and the diversity of living things.",
    "Concept-focused tutorials with diagrams, summaries and test-style questions to help you understand and remember the material."),
  course("CSC 101", "Introduction to Computer Science", "Sciences", "100 Level", 30000,
    "Computer basics, problem solving, algorithms and an introduction to programming.",
    "Practical tutorials that cover the theory you'll be examined on, plus hands-on help writing your first programs."),
  course("STA 111", "Descriptive Statistics", "Sciences", "100 Level", 30000,
    "Data presentation, measures of location and dispersion, and probability basics.",
    "Learn to handle statistics questions quickly and accurately, with formula sheets and timed practice."),
  course("ECO 101", "Principles of Economics I", "Social Sciences", "100 Level", 30000,
    "Demand and supply, elasticity, consumer behaviour and production.",
    "Understand the theory, draw the graphs correctly and write strong exam answers, with past questions in every session."),
  course("ACC 101", "Introduction to Financial Accounting", "Management Sciences", "100 Level", 30000,
    "Double entry, the ledger, trial balance and final accounts.",
    "Practice-heavy tutorials that take you from bookkeeping basics to preparing final accounts confidently."),
  course("MTH 201", "Mathematical Methods I", "Sciences", "200 Level", 40000,
    "Real-variable calculus, series, partial differentiation and vector analysis.",
    "Tutorials that break down MTH 201's tougher topics, with weekly problem sets and exam preparation."),
  course("EEE 201", "Circuit Theory I", "Engineering", "200 Level", 45000,
    "Circuit laws, network theorems, AC analysis and transients.",
    "Work through circuit analysis problems step by step with an engineer, from Kirchhoff's laws to AC circuits."),
  course("MEE 211", "Engineering Mechanics (Statics)", "Engineering", "200 Level", 45000,
    "Forces, equilibrium, trusses, friction and centroids.",
    "Free-body diagrams and problem-solving techniques for statics, with lots of past-question practice."),
];

const tutors = [
  { name: "Adaeze Okafor", email: "adaeze.okafor@example.com", phone: "+234 800 000 0001", subjects: "Mathematics, Statistics", bio: "First-class Mathematics graduate, MSc in Applied Mathematics." },
  { name: "Kwame Mensah", email: "kwame.mensah@example.com", phone: "+234 800 000 0002", subjects: "Physics, Engineering", bio: "Electrical engineer who has tutored 100–300 level students for 5 years." },
  { name: "Fatima Bello", email: "fatima.bello@example.com", phone: "+234 800 000 0003", subjects: "Chemistry, Biology", bio: "Biochemistry graduate, currently completing an MSc." },
  { name: "Chinedu Eze", email: "chinedu.eze@example.com", phone: "+234 800 000 0004", subjects: "Computer Science, Mathematics", bio: "Software developer and Computer Science graduate." },
  { name: "Amina Diallo", email: "amina.diallo@example.com", phone: "+234 800 000 0005", subjects: "Economics, Accounting", bio: "Chartered accountant with a BSc in Economics." },
];

const locations = [
  { name: "Online (Live video)", city: "Anywhere", isOnline: true },
  { name: "Akoka Study Centre", city: "Lagos", address: "Near UNILAG main gate, Akoka" },
  { name: "Bodija Study Centre", city: "Ibadan", address: "Near UI, Bodija" },
  { name: "Ile-Ife Study Centre", city: "Ile-Ife", address: "Near OAU campus" },
  { name: "Nsukka Study Centre", city: "Nsukka", address: "Near UNN campus" },
];

async function main() {
  for (const c of courses) {
    await prisma.course.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const t of tutors) {
    await prisma.tutor.upsert({ where: { email: t.email }, update: t, create: t });
  }
  if ((await prisma.location.count()) === 0) {
    await prisma.location.createMany({ data: locations });
  }
  // Sample assignments: [course slug, tutor email, location name, schedule]
  const assignments: [string, string, string, string][] = [
    ["mth-101", "adaeze.okafor@example.com", "Akoka Study Centre", "Tue & Thu, 4:00 pm"],
    ["mth-101", "chinedu.eze@example.com", "Online (Live video)", "Sat, 10:00 am & Sun, 4:00 pm"],
    ["mth-102", "adaeze.okafor@example.com", "Akoka Study Centre", "Mon & Wed, 4:00 pm"],
    ["phy-101", "kwame.mensah@example.com", "Bodija Study Centre", "Tue & Thu, 5:00 pm"],
    ["phy-101", "kwame.mensah@example.com", "Online (Live video)", "Sat, 2:00 pm"],
    ["chm-101", "fatima.bello@example.com", "Nsukka Study Centre", "Mon & Wed, 5:00 pm"],
    ["bio-101", "fatima.bello@example.com", "Online (Live video)", "Tue & Fri, 7:00 pm"],
    ["csc-101", "chinedu.eze@example.com", "Ile-Ife Study Centre", "Wed & Fri, 4:00 pm"],
    ["sta-111", "adaeze.okafor@example.com", "Online (Live video)", "Mon & Thu, 7:00 pm"],
    ["eco-101", "amina.diallo@example.com", "Bodija Study Centre", "Mon & Wed, 3:00 pm"],
    ["acc-101", "amina.diallo@example.com", "Online (Live video)", "Tue & Thu, 7:00 pm"],
    ["mth-201", "adaeze.okafor@example.com", "Online (Live video)", "Sat & Sun, 11:00 am"],
    ["eee-201", "kwame.mensah@example.com", "Ile-Ife Study Centre", "Tue & Thu, 4:00 pm"],
  ];
  if ((await prisma.assignment.count()) === 0) {
    for (const [slug, email, locationName, schedule] of assignments) {
      const [course, tutor, location] = await Promise.all([
        prisma.course.findUniqueOrThrow({ where: { slug } }),
        prisma.tutor.findUniqueOrThrow({ where: { email } }),
        prisma.location.findFirstOrThrow({ where: { name: locationName } }),
      ]);
      await prisma.assignment.create({
        data: { courseId: course.id, tutorId: tutor.id, locationId: location.id, schedule },
      });
    }
  }

  console.log(`Seeded ${courses.length} courses, ${tutors.length} tutors, ${locations.length} locations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
