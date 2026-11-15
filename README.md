# Learning Hub Africa

Website and admin tool for Learning Hub Africa's paid tutorials for Air Force Institute of Technology (AFIT) students.

- **Public site** (no sign-up; students are visitors): home page about the organisation, a tutorials
  catalogue (by course code, e.g. MTH 101) with the three pricing tiers and department/level (100–500)/venue filters (`/tutorials`), and a page per tutorial
  showing its tutors, locations and schedules, with WhatsApp/phone/email contact buttons.
- **Admin** (`/admin`, password protected): assign tutors to tutorials along with a location (and an
  optional schedule), manage courses (level, departments), pricing tiers, departments, tutors and locations.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma + PostgreSQL (Neon) · deployed on Vercel

## Getting started

```bash
cp .env.example .env      # set DATABASE_URL, DIRECT_URL and ADMIN_PASSWORD
npm install
npx prisma migrate deploy # create the tables
npm run db:seed           # load starter pricing tiers, departments, courses, tutors and AFIT venues
npm run dev
```

Open http://localhost:3000. The admin area is at http://localhost:3000/admin. The browser asks for a
username and password: use any username and the `ADMIN_PASSWORD` from `.env`.

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

- Replace the shared admin password with proper staff accounts.
- Replace the placeholder course titles, tutors, schedules and contact details (`src/lib/constants.ts`).
