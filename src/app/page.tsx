import { PublicNav } from "@/components/public/PublicNav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const MODULES = [
  { n: 1, title: "Foundations of Leadership" },
  { n: 2, title: "Self-Awareness & Emotional Intelligence" },
  { n: 3, title: "Communication & Influence" },
  { n: 4, title: "Systems Thinking & Problem Solving" },
  { n: 5, title: "Building & Leading Teams" },
  { n: 6, title: "Leading Change in African Contexts" },
];

const FACILITATORS_COUNT = 6;
const MENTORS_COUNT = 6;
const PODS_COUNT = 9;
const PARTICIPANTS_COUNT = 80;

export default function Home() {
  return (
    <div>
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-navy-deep)] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.2fr_0.8fr] md:py-28">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-gold-light)]">
              19 Sept &mdash; 12 Dec 2026 &middot; Cohort One
            </p>
            <h1 className="font-display text-4xl leading-tight md:text-6xl">
              A twelve-week operating system for the leaders Africa is building.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/75">
              The Leadership Development Programme by The Founders and Learning Hub Africa
              pairs six core modules with pod-based practice and a real-world capstone &mdash;
              not another leadership course you forget by Monday.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/apply" className="!bg-[var(--color-gold)] !text-[var(--color-ink)] hover:!opacity-90">
                Apply to the programme
              </Button>
              <Button href="/login" variant="secondary" className="!border-white/30 !bg-transparent !text-white hover:!bg-white/10">
                Already admitted? Log in
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 self-center">
            {[
              [`${PARTICIPANTS_COUNT}`, "participants"],
              [`${PODS_COUNT}`, "pods"],
              [`${FACILITATORS_COUNT}`, "facilitators"],
              [`${MENTORS_COUNT}`, "mentors"],
            ].map(([n, label]) => (
              <div key={label} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <div className="font-display text-3xl text-[var(--color-gold-light)]">{n}</div>
                <div className="text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl text-[var(--color-navy)]">How the twelve weeks work</h2>
        <p className="mt-3 max-w-2xl text-[var(--color-ink)]/70">
          Six weeks of core modules, six weeks of a practical capstone &mdash; run in parallel with
          weekly pod discussions so learning turns into practice, not just notes.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card>
            <div className="font-display text-lg text-[var(--color-navy)]">Saturday sessions</div>
            <p className="mt-2 text-sm text-[var(--color-ink)]/70">
              Live core-module teaching, hosted on Microsoft Teams, with an assessment to close
              out each module.
            </p>
          </Card>
          <Card>
            <div className="font-display text-lg text-[var(--color-navy)]">Thursday pod sessions</div>
            <p className="mt-2 text-sm text-[var(--color-ink)]/70">
              Nine pods of participants work through case studies and submit a weekly Session
              Nugget together.
            </p>
          </Card>
          <Card>
            <div className="font-display text-lg text-[var(--color-navy)]">Practical capstone</div>
            <p className="mt-2 text-sm text-[var(--color-ink)]/70">
              The final six weeks put participants on a real project, mentored by one of six
              programme mentors.
            </p>
          </Card>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="bg-[var(--color-surface-alt)] py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="font-display text-3xl text-[var(--color-navy)]">The six modules</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <Card key={m.n} className="!bg-white">
                <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-gold)]">
                  Module {String(m.n).padStart(2, "0")}
                </div>
                <div className="mt-2 font-display text-lg text-[var(--color-navy)]">{m.title}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section id="apply" className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-3xl text-[var(--color-navy)]">Ready to apply?</h2>
        <p className="mx-auto mt-3 max-w-xl text-[var(--color-ink)]/70">
          Applications are reviewed on a rolling basis through our screening form. It takes about
          ten minutes.
        </p>
        <div className="mt-6">
          <Button href="/apply">Start your application</Button>
        </div>
      </section>

      <footer className="border-t border-[var(--color-line)] bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 text-sm text-[var(--color-ink)]/60 md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} The Founders &times; Learning Hub Africa</span>
          <div className="flex gap-4">
            <a href="/policies-public" className="hover:text-[var(--color-navy)]">Policies</a>
            <a href="/faq" className="hover:text-[var(--color-navy)]">FAQ</a>
            <a href="/contact" className="hover:text-[var(--color-navy)]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
