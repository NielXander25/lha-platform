import Link from "next/link";
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

const stats = [
  { value: "By course code", label: "Tutorials follow your course outline" },
  { value: "Per course", label: "Clear prices per semester" },
  { value: "On campus", label: "Lecture rooms and halls you know" },
  { value: "Small groups", label: "So every question gets answered" },
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
    title: "Small, focused groups",
    body: "Small classes mean you can ask questions, get them answered and actually understand the work.",
  },
];

const steps = [
  {
    icon: Search,
    title: "Find your course",
    body: "Search by faculty and level to find the course you need help with, with prices up front.",
  },
  {
    icon: GraduationCap,
    title: "Meet the tutor",
    body: "Each course page shows who teaches it, where the tutorials hold and when.",
  },
  {
    icon: CalendarCheck,
    title: "Get in touch",
    body: "Call, email or WhatsApp us and we'll help you get started.",
  },
  {
    icon: BookOpen,
    title: "Start learning",
    body: "Attend your tutorials and walk into your exams prepared.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] size-[36rem] rounded-full bg-sun-300/30 blur-3xl"
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
                  className="absolute -bottom-2 left-0 h-3 w-full text-sun-400"
                  preserveAspectRatio="none"
                >
                  <path d="M2 9c60-6 160-8 296-3" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-600">
              Learning Hub Africa offers paid tutorials for Air Force Institute of Technology
              courses like MTH 101, PHY 101 and CHM 101. Our tutors explain the hard parts clearly
              and prepare you for tests and exams, right on campus.
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
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-stone-500">Featured tutorial</p>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  Now running
                </span>
              </div>
              <p className="mt-4 font-display text-2xl font-semibold text-brand-950">
                <span className="block text-sm font-bold tracking-wide text-sun-600">MTH 101</span>
                Elementary Mathematics I
              </p>
              <div className="mt-5 space-y-3 text-sm text-stone-600">
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
                <span>
                  <span className="font-display text-2xl font-semibold text-brand-800">₦15,000</span>
                  <span className="text-sm text-brand-900/70"> / semester</span>
                </span>
              </div>
            </div>
            <div className="absolute -bottom-14 left-8 hidden items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-lg sm:flex">
              <Building2 className="size-8 rounded-lg bg-sun-300/60 p-1.5 text-sun-600" />
              <div className="text-sm">
                <p className="font-semibold text-stone-800">Right on campus</p>
                <p className="text-stone-500">Lecture rooms & halls at AFIT</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display text-3xl font-semibold text-brand-700">{s.value}</p>
              <p className="mt-1 text-sm text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sun-600">About us</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              Helping AFIT students learn, not just cram.
            </h2>
            <p className="mt-5 leading-relaxed text-stone-600">
              Learning Hub Africa was founded on a simple idea: with the right guidance, every
              student can thrive. Large lecture halls leave many students behind, so we bring
              together tutors who know each course inside out and the students who need them.
            </p>
            <p className="mt-4 leading-relaxed text-stone-600">
              From mathematics to physics and chemistry, our tutorials follow your AFIT course
              outline and are measured by one thing: how well our students do.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-stone-200 bg-white p-6">
                <v.icon className="size-10 rounded-xl bg-brand-50 p-2 text-brand-600" />
                <h3 className="mt-4 text-lg font-semibold text-stone-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-sun-400">How it works</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Finding the right tutorial takes four simple steps.
          </h2>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <div className="flex items-center justify-between">
                  <s.icon className="size-8 text-sun-300" />
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
        <div className="relative overflow-hidden rounded-3xl bg-sun-400 px-8 py-14 text-center sm:px-16">
          <div aria-hidden className="absolute -right-16 -top-16 size-64 rounded-full bg-sun-300" />
          <div aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-sun-500/40" />
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
