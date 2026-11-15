import Link from "next/link";
import { Logo } from "./logo";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/tutorials", label: "Tutorials & pricing" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#fbfaf7]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/tutorials"
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Find a tutorial
        </Link>
      </div>
    </header>
  );
}
