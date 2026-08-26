import { PublicNav } from "@/components/public/PublicNav";

export default function ContactPage() {
  return (
    <div>
      <PublicNav />
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-3xl text-[var(--color-navy)]">Contact the programme team</h1>
        <p className="mt-4 text-[var(--color-ink)]/70">
          For questions about the Leadership Development Programme, reach the programme team at{" "}
          <a className="text-[var(--color-navy)] underline" href="mailto:programme@foundersxlha.org">
            programme@foundersxlha.org
          </a>.
        </p>
      </div>
    </div>
  );
}
