import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin-nav";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-6 bg-brand-950 p-4 md:min-h-screen md:p-5">
        <Logo light />
        <p className="hidden text-xs font-semibold uppercase tracking-wider text-brand-200/50 md:block">Admin</p>
        <AdminNav />
        <Link href="/" className="mt-auto hidden items-center gap-2 text-sm text-brand-100/60 hover:text-white md:flex">
          <ExternalLink className="size-4" /> View website
        </Link>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
