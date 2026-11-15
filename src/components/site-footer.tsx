import Link from "next/link";
import { SITE } from "@/lib/constants";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-brand-950 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo light />
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">{SITE.tagline}</p>
          <p className="max-w-xs text-sm text-brand-200/80">
            Paid tutorials for Air Force Institute of Technology (AFIT) students, held right on
            campus.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-white">Explore</h3>
          <Link href="/tutorials" className="block hover:text-white">Tutorials & pricing</Link>
          <Link href="/#about" className="block hover:text-white">About us</Link>
          <Link href="/#how-it-works" className="block hover:text-white">How it works</Link>
        </div>
        <div className="space-y-2 text-sm">
          <h3 className="font-semibold text-white">Get in touch</h3>
          <a href={`mailto:${SITE.email}`} className="block hover:text-white">{SITE.email}</a>
          <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="block hover:text-white">{SITE.phone}</a>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-brand-200/60">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  );
}
