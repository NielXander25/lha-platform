import { PublicNav } from "@/components/public/PublicNav";

const POLICIES = [
  "Code of Conduct",
  "Participation Policy",
  "Assessment Policy",
  "Certification Policy",
  "Privacy Policy",
  "Programme Terms",
  "Communication Guidelines",
];

export default function PublicPoliciesPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-3xl text-[var(--color-navy)]">Programme policies</h1>
        <p className="mt-4 text-[var(--color-ink)]/70">
          Admitted participants review and acknowledge each policy inside the platform. An
          overview:
        </p>
        <ul className="mt-6 space-y-2">
          {POLICIES.map((p) => (
            <li key={p} className="rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm">
              {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
