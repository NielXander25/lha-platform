import Link from "next/link";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/#programme", label: "Programme" },
  { href: "/#modules", label: "Modules" },
  { href: "/#facilitators", label: "Facilitators" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-lg font-semibold text-[var(--color-navy)]">
          Founders <span className="text-[var(--color-gold)]">×</span> LHA
        </Link>
        <nav className="hidden gap-6 text-sm font-medium text-[var(--color-ink)]/80 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[var(--color-navy)]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button href="/login" variant="secondary" className="!px-3 !py-2 text-xs md:!px-4 md:!py-2.5 md:text-sm">
            Participant Login
          </Button>
        </div>
      </div>
    </header>
  );
}
