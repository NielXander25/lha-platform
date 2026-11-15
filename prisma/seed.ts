// Sample data so the site has something to show. All prices, tutors and
// locations below are placeholders: replace them with the real ones.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const courses = [
  {
    slug: "primary-maths-english",
    title: "Primary Maths & English",
    category: "Foundations",
    level: "Primary",
    summary: "Build strong numeracy and literacy foundations for Primary 1–6.",
    description:
      "One-on-one or small-group lessons covering number work, reading comprehension, phonics, spelling and composition. Lessons follow the national curriculum and move at your child's pace.",
    price: 25000,
    sessionsPerWeek: 2,
    sessionLengthMins: 60,
  },
  {
    slug: "common-entrance-prep",
    title: "Common Entrance Preparation",
    category: "Exam Prep",
    level: "Primary",
    summary: "Focused preparation for secondary school entrance examinations.",
    description:
      "Timed practice papers, quantitative and verbal reasoning drills, and targeted revision in Mathematics and English so pupils walk into the exam confident.",
    price: 35000,
    sessionsPerWeek: 3,
    sessionLengthMins: 60,
  },
  {
    slug: "jss-mathematics",
    title: "Junior Secondary Mathematics",
    category: "Mathematics",
    level: "Junior Secondary",
    summary: "Close gaps and get ahead in JSS 1–3 Mathematics.",
    description:
      "Algebra, geometry, statistics and problem solving, taught step by step with plenty of worked examples and weekly progress checks.",
    price: 30000,
    sessionsPerWeek: 2,
    sessionLengthMins: 60,
  },
  {
    slug: "jss-basic-science",
    title: "Basic Science & Technology",
    category: "Sciences",
    level: "Junior Secondary",
    summary: "Hands-on understanding of Basic Science and Basic Technology.",
    description:
      "Concept-first lessons with simple experiments and real-life examples that make science stick, aligned with the JSS curriculum.",
    price: 28000,
    sessionsPerWeek: 2,
    sessionLengthMins: 60,
  },
  {
    slug: "sss-mathematics",
    title: "Senior Secondary Mathematics",
    category: "Mathematics",
    level: "Senior Secondary",
    summary: "Master SSS Mathematics and Further Mathematics topics.",
    description:
      "Covers the full SSS syllabus including calculus, trigonometry, vectors and statistics, with exam-style questions in every session.",
    price: 40000,
    sessionsPerWeek: 2,
    sessionLengthMins: 90,
  },
  {
    slug: "sss-physics-chemistry",
    title: "Physics & Chemistry",
    category: "Sciences",
    level: "Senior Secondary",
    summary: "Make sense of the hardest science subjects in senior school.",
    description:
      "Clear explanations of core principles, calculation practice and past-question walkthroughs for both Physics and Chemistry.",
    price: 45000,
    sessionsPerWeek: 2,
    sessionLengthMins: 90,
  },
  {
    slug: "waec-neco-prep",
    title: "WAEC / NECO Intensive",
    category: "Exam Prep",
    level: "Senior Secondary",
    summary: "An intensive revision programme for final school examinations.",
    description:
      "Subject-by-subject revision, past papers under timed conditions and marking-scheme coaching across your chosen subjects.",
    price: 50000,
    sessionsPerWeek: 3,
    sessionLengthMins: 90,
  },
  {
    slug: "jamb-utme-prep",
    title: "JAMB UTME Preparation",
    category: "Exam Prep",
    level: "Senior Secondary",
    summary: "Score high on UTME with CBT practice and targeted coaching.",
    description:
      "Computer-based test practice, Use of English, and your three chosen subjects, with mock exams and score tracking.",
    price: 45000,
    sessionsPerWeek: 3,
    sessionLengthMins: 90,
  },
  {
    slug: "french-beginners",
    title: "French for Beginners",
    category: "Languages",
    level: "All levels",
    summary: "Speak, read and write everyday French.",
    description:
      "Conversational lessons focused on speaking confidence, grammar essentials and vocabulary for school and travel.",
    price: 30000,
    sessionsPerWeek: 2,
    sessionLengthMins: 60,
  },
  {
    slug: "coding-for-teens",
    title: "Coding for Teens",
    category: "Technology",
    level: "Junior & Senior Secondary",
    summary: "Learn to build websites and games with real code.",
    description:
      "Project-based lessons in HTML, CSS, JavaScript and Python. Students finish with a portfolio of things they've built themselves.",
    price: 40000,
    sessionsPerWeek: 2,
    sessionLengthMins: 90,
  },
];

const tutors = [
  { name: "Adaeze Okafor", email: "adaeze.okafor@example.com", phone: "+234 800 000 0001", subjects: "Mathematics, Further Mathematics", bio: "Mathematics graduate with 6 years of secondary-school tutoring." },
  { name: "Kwame Mensah", email: "kwame.mensah@example.com", phone: "+234 800 000 0002", subjects: "Physics, Chemistry", bio: "Engineer who loves making science practical." },
  { name: "Fatima Bello", email: "fatima.bello@example.com", phone: "+234 800 000 0003", subjects: "English, Literature, Primary", bio: "Primary and junior-secondary literacy specialist." },
  { name: "Chinedu Eze", email: "chinedu.eze@example.com", phone: "+234 800 000 0004", subjects: "Computer Science, Mathematics", bio: "Software developer teaching coding to teenagers." },
  { name: "Amina Diallo", email: "amina.diallo@example.com", phone: "+234 800 000 0005", subjects: "French, English", bio: "Bilingual teacher with DELF examiner experience." },
];

const locations = [
  { name: "Online (Live video)", city: "Anywhere", isOnline: true },
  { name: "Lekki Learning Centre", city: "Lagos", address: "12 Admiralty Way, Lekki Phase 1" },
  { name: "Ikeja Learning Centre", city: "Lagos", address: "5 Allen Avenue, Ikeja" },
  { name: "Wuse Learning Centre", city: "Abuja", address: "Plot 20, Wuse Zone 4" },
  { name: "Home tutoring – Port Harcourt", city: "Port Harcourt", address: "Tutor visits the student's home" },
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
  console.log(`Seeded ${courses.length} courses, ${tutors.length} tutors, ${locations.length} locations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
