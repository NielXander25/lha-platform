import { PublicNav } from "@/components/public/PublicNav";

const FAQS = [
  { q: "Who is this programme for?", a: "Early-to-mid career professionals across Africa who want structured, practical leadership development rather than a one-off workshop." },
  { q: "Is the programme free?", a: "The core programme and Certificate of Completion are free for admitted participants. A paid Certified Leadership Development Certificate (₦15,000) is optional." },
  { q: "Do I need a laptop?", a: "No — the platform is mobile-first and works on Android and iPhone browsers. Live sessions run through Microsoft Teams, which also works on mobile." },
  { q: "What happens if I miss a session?", a: "Recordings are posted where available, and your pod representative can help you catch up on discussion." },
  { q: "How is the programme structured?", a: "Six weeks of core modules (Saturdays) with weekly pod sessions (Thursdays), followed by a six-week practical capstone with mentorship." },
];

export default function FAQPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-3xl text-[var(--color-navy)]">Frequently asked questions</h1>
        <div className="mt-8 divide-y divide-[var(--color-line)]">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="cursor-pointer list-none font-medium text-[var(--color-ink)]">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-[var(--color-ink)]/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
