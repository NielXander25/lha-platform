# Founders × Learning Hub Africa — Leadership Development Programme Platform

Phase 1 (launch-critical MVP) build — see the project roadmap for what's in later phases.

Public marketing site, participant login/dashboard, calendar, modules with a live
auto-scoring assessment engine, pod system (with rep-only Session Nugget + Pod
Feedback submission), resource library, announcements, session feedback, project/
capstone tracker, certificate requests, policy acknowledgment, and an admin console
for managing participants, pods, modules (incl. an assessment builder), announcements,
certificate status, and policies.

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS v4 · PostgreSQL · Prisma ORM ·
Auth.js (NextAuth v5, credentials + JWT sessions) · React Server Components +
Server Actions throughout (no separate REST API layer).

## Getting started

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and AUTH_SECRET
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

> **Note:** `prisma generate` could not be run in the build sandbox this project was
> generated in (its network egress can't reach `binaries.prisma.sh`). This is a
> sandbox limitation only — it runs normally on a real machine, in CI, or on Vercel.
> Run `npx prisma generate` (and `migrate dev`) as your first step locally before
> `npm run dev` or `npm run build`.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000` or your prod domain) |
| `NEXT_PUBLIC_APP_URL` | Same, exposed to the client |

A free Postgres instance from Neon, Supabase, or Railway all work fine with
`DATABASE_URL` as-is.

### Seed data

`npx prisma db seed` creates:
- 9 pods
- 1 Super Admin: `admin@foundersxlha.org`
- 6 facilitators (one per module) and 6 mentors
- 6 modules with calendar events; Module 1 has a sample assessment
- 18 sample participants (2 per pod, first one as pod rep)
- 6 capstone milestones (weeks 7–12)
- 3 starter policies and a welcome announcement

**All seeded accounts use the password `Passw0rd!`.** Change this before using real
participant data — the seed script is for local development and demoing only.

## Project structure

```
prisma/schema.prisma       full data model (users, pods, modules, assessments,
                            pod sessions, certificates, capstone, etc.)
prisma/seed.ts              seed script
src/lib/auth.ts             NextAuth v5 config
src/middleware.ts           route protection + admin gating
src/app/(app)/              everything behind login (participant + admin)
src/app/login, /, /faq, …   public site
```

Server Actions live next to the pages that use them (`actions.ts` files) rather than
in a separate API layer — this keeps DB writes co-located with the forms that
trigger them.

## What's deliberately out of scope for this phase

Per the build roadmap, these are Phase 2/3 items and are stubbed or absent:
- Automated reminders and email sequences
- Attendance tracking (spec recommends a simple check-in button over a Teams API
  integration — not yet built)
- Certificate **payment** processing (the paid-certificate request is recorded in
  the database; wiring it to Paystack/another gateway is a follow-up)
- Automated certificate generation (PDF)
- Advanced analytics/reporting beyond the admin overview counts

## Deploying

Works out of the box on Vercel: connect the repo, set the environment variables
above, and add a Postgres database (Vercel Postgres, Neon, or Supabase all work).
Run migrations against the production database once (`npx prisma migrate deploy`)
before or during your first deploy.
