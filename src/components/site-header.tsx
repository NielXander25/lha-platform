import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "./logo";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/tutorials", label: "Tutorials" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#f7f8fd]/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-brand-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/tutorials"
          className="hidden whitespace-nowrap rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 md:block"
        >
          Find a tutorial
        </Link>

        {/* Phone menu: a native <details> so it works without JavaScript. */}
        <details className="group md:hidden">
          <summary
            aria-label="Menu"
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white text-brand-800 [&::-webkit-details-marker]:hidden"
          >
            <Menu className="size-5" />
          </summary>
          <nav className="absolute inset-x-0 top-full border-b border-slate-200 bg-white px-4 py-3 shadow-lg">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 font-medium text-slate-700 hover:bg-brand-50">
                {l.label}
              </Link>
            ))}
            <Link
              href="/tutorials"
              className="mt-2 block rounded-full bg-brand-600 px-4 py-3 text-center font-semibold text-white"
            >
              Find a tutorial
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
