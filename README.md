# Learning Hub Africa

Website and admin tool for Learning Hub Africa's paid tutorials.

- **Public site**: home page about the organisation, a tutorials catalogue with prices (`/tutorials`), course pages with an enrolment form.
- **Admin** (`/admin`, password protected): review enrolments and assign each one a tutor and a location, manage course prices, tutors and locations.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma + SQLite (local dev)

## Getting started

```bash
cp .env.example .env      # then set ADMIN_PASSWORD
npm install
npm run db:push           # create the local SQLite database
npm run db:seed           # load sample courses, tutors and locations
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
| `npm run db:seed` | Load sample data |
| `npm run db:reset` | Wipe the database and reseed |
| `npm run db:studio` | Browse the data in Prisma Studio |

## Data model

`Course` (with price) · `Tutor` · `Location` · `Student` · `Enrollment` (student + course, with an
assigned tutor, an assigned location and a status: Pending → Assigned → Active → Completed / Cancelled).

## Before going live

- Switch the Prisma datasource to PostgreSQL (SQLite files don't persist on serverless hosts).
- Replace the shared admin password with proper staff accounts.
- Replace the sample courses, prices, tutors, locations and contact details.
