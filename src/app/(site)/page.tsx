import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  MapPin,
  Building2,
  Search,
  Target,
  Users,
} from "lucide-react";
import { PricingCards } from "@/components/pricing-tiers";
import { LEVELS, PRICE_UNIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const stats = [
  { value: "100–500", label: "Level courses, by course code" },
  { value: "Engineering", label: "Every AFIT engineering department" },
  { value: "On campus", label: "Lecture rooms and halls you know" },
  { value: "3 options", label: "General class, 2-to-1 or 1-on-1" },
];

const values = [
  {
    icon: BadgeCheck,
    title: "Tutors who know the course",
    body: "Our tutors are top graduates and postgraduates who have mastered the courses they teach.",
  },
  {
    icon: Target,
    title: "Built around your exams",
    body: "Tutorials follow your course outline, with past questions and test practice before every exam.",
  },
  {
    icon: MapPin,
    title: "Right here on campus",
    body: "Tutorials hold in AFIT lecture rooms and halls, from LR 101 to Hall C3, so there's no travelling.",
  },
  {
    icon: Users,
    title: "Choose your class size",
    body: "Join the general class, share a tutor with one other student, or go one-on-one.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Find your course",
    body: "Pick your department and level to find the course you need help with, with prices up front.",
  },
  {
    icon: GraduationCap,
    title: "Meet the tutor",
    body: "Each course page shows who teaches it, where the tutorials hold and when.",
  },
  {
    icon: CalendarCheck,
    title: "Pick a class size and pay",
    body: "Choose general class, two-to-one or one-on-one, then pay online for your course.",
  },
  {
    icon: BookOpen,
    title: "Start learning",
    body: "Attend your tutorials and walk into your exams prepared.",
  },
];

export default async function HomePage() {
  await connection();
  const [departments, tiers] = await Promise.all([
    prisma.department.findMany({ where: { active: true }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.pricingTier.findMany({ orderBy: [{ sortOrder: "asc" }, { price: "asc" }] }),
  ]);
  const fromPrice = tiers.length ? Math.min(...tiers.map((t) => t.price)) : null;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] size-[36rem] rounded-full bg-accent-300/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-12rem] left-[-10%] size-[30rem] rounded-full bg-brand-200/40 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
              Tutorials for AFIT students
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-brand-950 sm:text-5xl lg:text-6xl">
              Pass your courses with a tutor who{" "}
              <span className="relative whitespace-nowrap text-brand-600">
                gets it
                <svg
                  aria-hidden
                  viewBox="0 0 300 12"
                  className="absolute -bottom-2 left-0 h-3 w-full text-accent-400"
                  preserveAspectRatio="none"
                >
                  <path d="M2 9c60-6 160-8 296-3" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Learning Hub Africa offers paid tutorials for engineering students at the Air Force
              Institute of Technology, from 100 to 500 Level. Our tutors explain the hard parts
              clearly and prepare you for tests and exams, right on campus.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/tutorials"
                className="group inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
              >
                Explore tutorials & prices
                <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-full px-5 py-3.5 text-base font-semibold text-brand-800 transition hover:bg-brand-50"
              >
                How it works
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-500">Featured tutorial</p>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Now running
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-brand-950">
                <span className="block text-sm font-bold tracking-wide text-accent-600">MTH 101</span>
                Elementary Mathematics I
              </p>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p className="flex items-center gap-3">
                  <GraduationCap className="size-4 text-brand-600" /> Mathematics tutor
                </p>
                <p className="flex items-center gap-3">
                  <MapPin className="size-4 text-brand-600" /> LR 101, AFIT
                </p>
                <p className="flex items-center gap-3">
                  <CalendarCheck className="size-4 text-brand-600" /> Mon & Wed, 4:00 pm
                </p>
              </div>
              <div className="mt-6 flex items-end justify-between rounded-2xl bg-brand-50 p-4">
                <span className="text-sm font-medium text-brand-900">Price</span>
                {fromPrice != null && (
                  <span>
                    <span className="text-sm text-brand-900/70">from </span>
                    <span className="font-display text-2xl font-semibold text-brand-800">{formatPrice(fromPrice)}</span>
                  </span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-14 left-8 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-lg sm:flex">
              <Building2 className="size-8 rounded-lg bg-accent-300/60 p-1.5 text-accent-600" />
              <div className="text-sm">
                <p className="font-semibold text-slate-800">Right on campus</p>
                <p className="text-slate-500">Lecture rooms & halls at AFIT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-semibold text-brand-700">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">About us</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              Helping AFIT students learn, not just cram.
            </h2>
            <p className="mt-5 leading-relaxed text-slate-600">
              Learning Hub Africa was founded on a simple idea: with the right guidance, every
              student can thrive. Large lecture halls leave many students behind, so we bring
              together tutors who know each course inside out and the students who need them.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              From 100 Level mathematics, physics and chemistry to 500 Level departmental courses,
              our tutorials follow your AFIT course outline and are measured by one thing: how well
              our students do.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <v.icon className="size-10 rounded-xl bg-brand-50 p-2 text-brand-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Who it&apos;s for</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Every engineering department, 100 to 500 Level.
          </h2>
          <p className="mt-4 max-w-2xl text-slate-600">
            Choose your department or level to see the tutorials for your courses.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <li key={d.name}>
                <Link
                  href={`/tutorials?department=${encodeURIComponent(d.name)}`}
                  className="group flex h-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#f7f8fd] px-4 py-3.5 font-medium text-slate-800 transition hover:border-brand-300 hover:bg-brand-50"
                >
                  {d.name}
                  <ArrowRight className="size-4 shrink-0 text-brand-600 transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-slate-500">By level:</span>
            {LEVELS.map((level) => (
              <Link
                key={level}
                href={`/tutorials?level=${encodeURIComponent(level)}`}
                className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                {level}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {tiers.length > 0 && (
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-600">Pricing</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
            Three ways to learn. You choose.
          </h2>
          <p className="mb-10 mt-4 max-w-2xl text-slate-600">
            The same prices apply to every course, {PRICE_UNIT}. Pick the class size that suits you,
            choose your course and pay online.
          </p>
          <PricingCards tiers={tiers} href={() => "/tutorials"} cta="Choose a course" />
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Finding the right tutorial takes four simple steps.
          </h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <s.icon className="size-8 text-accent-300" />
                  <span className="font-display text-4xl font-semibold text-white/15">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-100/80">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-accent-400 px-8 py-14 text-center sm:px-16">
          <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-accent-300" />
          <div aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-accent-500/40" />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              Struggling with a course this semester?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-950/80">
              See every course we offer, compare prices, and find out who teaches it and where the
              tutorials hold.
            </p>
            <Link
              href="/tutorials"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-brand-900 px-7 py-4 text-base font-semibold text-white transition hover:bg-brand-950"
            >
              View tutorials & pricing
              <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
