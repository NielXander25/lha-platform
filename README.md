# Learning Hub Africa

Website and admin tool for Learning Hub Africa's paid tutorials for Air Force Institute of Technology (AFIT) students.

Built in milestones from the Paid Tutorial Management System specification.

**Milestone 1 (done):**
- **Public site**: home page, AFIT course catalogue, packages and pricing.
- **Accounts & roles**: students, tutors, administrators, finance officers and support officers, with
  hashed passwords, 14-day sessions, login lockout after repeated failures and role checks on every page and action.
- **Student registration**: account → academic profile → courses, package (monthly or 3 months) and
  teaching mode → required timetable upload (read automatically by AI, Claude if `ANTHROPIC_API_KEY` is
  set or Google Gemini if `GEMINI_API_KEY` is set, then reviewed and corrected by the student) → weekly availability → payment.
  Each student gets an ID (e.g. `LHA-26-0001`) and a registration status.
- **Tutor registration**: profile, qualifications, credential uploads, courses, teaching mode, workload
  and weekly availability. Admins approve the tutor and each course competency.
- **Payments**: invoices and subscriptions; Paystack (server-side verification, signed webhooks,
  idempotent settlement) once `PAYSTACK_SECRET_KEY` is set; bank transfers reconciled by finance against
  the bank statement reference. Payment activates the subscription and queues the student for allocation.
- **Staff dashboard**: overview figures, students, tutor approvals, payments, packages, courses,
  departments, locations, staff accounts and an audit log.

**Milestone 2 (matching):** a constraint-based engine matches paid students with approved tutors. Hard
rules first (course approval, verified subscription, shared free time around lectures and other classes,
tutor workload, teaching mode, a free venue for in-person classes, package size: 1:1, exactly 2:1, or a
group up to capacity), then weighted ranking (subject 35, schedule 30, experience 15, needs 10, workload
10; editable). Tutors accept, then students accept; declines re-queue the request. Runs automatically
after payments, approvals and availability changes, or on demand; every decision is logged with scores
and rejection reasons, and staff can assign a tutor by hand (rules still enforced).

**Next:** class scheduling,
calendar sync, notifications (email/push/WhatsApp), complaints and feedback, and reports.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL (Neon) · deployed on Vercel

## Getting started

```bash
cp .env.example .env      # set DATABASE_URL, DIRECT_URL, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npx prisma migrate deploy # create the tables
npm run db:seed           # load starter pricing tiers, departments, courses, tutors and AFIT venues
npm run dev
```

Open http://localhost:3000. Log in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` to create the first
administrator; after that, add other staff under **Staff accounts**.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Apply migrations, seed if empty, production build / serve |
| `npm run db:migrate` | Create and apply a migration after changing the schema |
| `npm run db:seed` | Load starter data (only into an empty database) |
| `npm run db:reset` | Wipe the database and reload the starter data |
| `npm run db:studio` | Browse the data in Prisma Studio |

## Data model

`Department` (engineering departments) · `PricingTier` (the three class sizes and prices, same for every course) · `Course` (course code, level 100–500, linked to the departments that take it) · `Tutor` · `Location` (campus venue, e.g. LR 101, Hall C1) · `Assignment` (a tutor teaching a course at a location,
with an optional schedule). A course can have several assignments, e.g. the same course in LR 101 and Hall C1.

## Before going live

- Connect Paystack on the checkout page (`src/app/(site)/checkout/page.tsx`).
- Replace the shared admin password with proper staff accounts.
- Replace the placeholder course titles, tutors, schedules and contact details (`src/lib/constants.ts`).
