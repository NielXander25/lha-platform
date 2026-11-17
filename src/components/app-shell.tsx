import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { AppNav, type NavItem } from "./app-nav";
import { Logo } from "./logo";

/** Sidebar layout shared by the student portal, tutor portal and staff dashboard. */
export function AppShell({
  title,
  nav,
  user,
  children,
}: {
  title: string;
  nav: NavItem[];
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr]">
      <aside className="flex flex-col gap-5 bg-brand-950 p-4 md:sticky md:top-0 md:h-screen md:p-5">
        <div className="flex items-center justify-between gap-3">
          <Logo light />
        </div>
        <p className="hidden text-xs font-semibold uppercase tracking-wider text-brand-200/50 md:block">{title}</p>
        <AppNav items={nav} />
        <div className="mt-auto hidden space-y-3 border-t border-white/10 pt-4 md:block">
          <div className="text-sm">
            <p className="truncate font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-brand-100/60">{user.email}</p>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm text-brand-100/60 hover:text-white">
            <ExternalLink className="size-4" /> View website
          </Link>
          <form action={logout}>
            <button className="flex items-center gap-2 text-sm text-brand-100/60 hover:text-white">
              <LogOut className="size-4" /> Log out
            </button>
          </form>
        </div>
        <form action={logout} className="md:hidden">
          <button className="flex items-center gap-2 text-sm text-brand-100/70">
            <LogOut className="size-4" /> Log out ({user.name.split(" ")[0]})
          </button>
        </form>
      </aside>
      <main className="min-w-0 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
