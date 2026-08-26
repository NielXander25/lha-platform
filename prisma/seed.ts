import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Passw0rd!"; // every seeded account uses this — change after first login

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // --- Pods ---
  const podNames = [
    "Pod 1 — Baobab", "Pod 2 — Acacia", "Pod 3 — Iroko", "Pod 4 — Palm",
    "Pod 5 — Mahogany", "Pod 6 — Ebony", "Pod 7 — Kola", "Pod 8 — Shea", "Pod 9 — Tamarind",
  ];
  const pods = [];
  for (const name of podNames) {
    pods.push(await prisma.pod.upsert({ where: { name }, update: {}, create: { name } }));
  }

  // --- Super Admin ---
  await prisma.user.upsert({
    where: { email: "admin@foundersxlha.org" },
    update: {},
    create: {
      email: "admin@foundersxlha.org",
      passwordHash,
      fullName: "Programme Admin",
      role: "SUPER_ADMIN",
    },
  });

  // --- Facilitators ---
  const moduleTitles = [
    "Foundations of Leadership",
    "Self-Awareness & Emotional Intelligence",
    "Communication & Influence",
    "Systems Thinking & Problem Solving",
    "Building & Leading Teams",
    "Leading Change in African Contexts",
  ];
  const facilitators = [];
  for (let i = 0; i < moduleTitles.length; i++) {
    facilitators.push(
      await prisma.user.upsert({
        where: { email: `facilitator${i + 1}@foundersxlha.org` },
        update: {},
        create: {
          email: `facilitator${i + 1}@foundersxlha.org`,
          passwordHash,
          fullName: `Facilitator ${i + 1}`,
          role: "FACILITATOR",
        },
      })
    );
  }

  // --- Modules + one sample assessment ---
  for (let i = 0; i < moduleTitles.length; i++) {
    const mod = await prisma.module.upsert({
      where: { number: i + 1 },
      update: {},
      create: {
        number: i + 1,
        title: moduleTitles[i],
        description: `Core module ${i + 1} of the Leadership Development Programme.`,
        facilitatorId: facilitators[i].id,
        availability: "AUTOMATED",
        availableFrom: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.calendarEvent.upsert({
      where: { moduleId: mod.id },
      update: {},
      create: {
        moduleId: mod.id,
        title: `${moduleTitles[i]} — Live Session`,
        date: new Date(Date.now() + i * 7 * 24 * 60 * 60 * 1000),
        time: "10:00 AM WAT",
        facilitator: facilitators[i].fullName,
        meetingLink: "https://teams.microsoft.com/l/meetup-join/sample",
      },
    });

    if (i === 0) {
      const existing = await prisma.assessment.findUnique({ where: { moduleId: mod.id } });
      if (!existing) {
        await prisma.assessment.create({
          data: {
            moduleId: mod.id,
            title: "Module 1 Assessment",
            questions: {
              create: [
                {
                  type: "MULTIPLE_CHOICE",
                  prompt: "Which of these best describes servant leadership?",
                  options: [
                    { id: "opt1", text: "Leading by prioritising the team's growth and needs" },
                    { id: "opt2", text: "Leading by strict top-down control" },
                    { id: "opt3", text: "Avoiding decisions to keep everyone happy" },
                  ],
                  correctAnswer: "opt1",
                  order: 0,
                },
                {
                  type: "LONG_ANSWER",
                  prompt: "Describe a time you had to lead without formal authority. What worked?",
                  order: 1,
                },
              ],
            },
          },
        });
      }
    }
  }

  // --- Mentors ---
  const mentors = [];
  for (let i = 0; i < 6; i++) {
    mentors.push(
      await prisma.user.upsert({
        where: { email: `mentor${i + 1}@foundersxlha.org` },
        update: {},
        create: {
          email: `mentor${i + 1}@foundersxlha.org`,
          passwordHash,
          fullName: `Mentor ${i + 1}`,
          role: "MENTOR",
        },
      })
    );
  }

  // --- Participants (sample of ~18, 2 per pod, first one as rep) ---
  for (let p = 0; p < pods.length; p++) {
    for (let m = 0; m < 2; m++) {
      const idx = p * 2 + m;
      const email = `participant${idx + 1}@foundersxlha.org`;
      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash,
          fullName: `Participant ${idx + 1}`,
          role: "PARTICIPANT",
          podId: pods[p].id,
          isPodRepresentative: m === 0,
        },
      });
    }
  }

  // --- Milestones (capstone weeks 7-12) ---
  const milestoneTitles = [
    "Problem identification",
    "Research & stakeholder mapping",
    "Proposed solution draft",
    "Feedback & iteration",
    "Implementation / pilot",
    "Final submission & presentation",
  ];
  for (let i = 0; i < milestoneTitles.length; i++) {
    await prisma.milestone.upsert({
      where: { week: i + 7 },
      update: {},
      create: { week: i + 7, title: milestoneTitles[i] },
    });
  }

  // --- Policies ---
  const policies = [
    { slug: "code-of-conduct", title: "Code of Conduct", content: "Participants are expected to engage respectfully with facilitators, mentors, and fellow participants at all times." },
    { slug: "assessment-policy", title: "Assessment Policy", content: "Each module assessment must be completed within one week of the live session. Late submissions may affect certification eligibility." },
    { slug: "certification-policy", title: "Certification Policy", content: "A free Certificate of Completion is issued to participants who complete all modules and the capstone project. A paid Certified Leadership Development Certificate is available on request." },
  ];
  for (const pol of policies) {
    await prisma.policy.upsert({ where: { slug: pol.slug }, update: {}, create: pol });
  }

  // --- Sample announcement ---
  await prisma.announcement.upsert({
    where: { id: "seed-announcement-1" },
    update: {},
    create: {
      id: "seed-announcement-1",
      title: "Welcome to Cohort One",
      body: "We're excited to have you. Your first live session is Module 1 — check your dashboard for the date and Teams link.",
      pinned: true,
    },
  });

  console.log("Seed complete.");
  console.log(`All seeded accounts use the password: ${PASSWORD}`);
  console.log("Admin login: admin@foundersxlha.org");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
