# Learning Hub Africa

Website and admin tool for Learning Hub Africa's paid tutorials for Air Force Institute of Technology (AFIT) students.

- **Public site** (no sign-up; students are visitors): home page about the organisation, a tutorials
  catalogue (by course code, e.g. MTH 101) with per-semester prices and department/level (100–500)/venue filters (`/tutorials`), and a page per tutorial
  showing its tutors, locations and schedules, with WhatsApp/phone/email contact buttons.
- **Admin** (`/admin`, password protected): assign tutors to tutorials along with a location (and an
  optional schedule), manage courses (price, level, departments), departments, tutors and locations.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma + SQLite (local dev)

## Getting started

```bash
cp .env.example .env      # then set ADMIN_PASSWORD
npm install
npm run db:push           # create the local SQLite database
npm run db:seed           # load starter departments, courses, tutors and AFIT venues
npm run dev
```

Open http://localhost:3000. The admin area is at http://localhost:3000/admin. The browser asks for a
username and password: use any username and the `ADMIN_PASSWORD` from `.env`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:push` | Sync the Prisma schema to the database |
| `npm run db:seed` | Load starter data (only into an empty database) |
| `npm run db:reset` | Delete the local database and reload the starter data |
| `npm run db:studio` | Browse the data in Prisma Studio |

## Data model

`Department` (engineering departments) · `Course` (course code, level 100–500, price per semester, linked to the departments that take it) · `Tutor` · `Location` (campus venue, e.g. LR 101, Hall C1) · `Assignment` (a tutor teaching a course at a location,
with an optional schedule). A course can have several assignments, e.g. the same course in LR 101 and Hall C1.

## Before going live

- Switch the Prisma datasource to PostgreSQL (SQLite files don't persist on serverless hosts).
- Replace the shared admin password with proper staff accounts.
- Replace the placeholder course titles, prices, tutors, schedules and contact details (`src/lib/constants.ts`).
