"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  ScrollText,
  ShieldCheck,
  Shuffle,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  dashboard: LayoutDashboard,
  profile: UserRound,
  courses: BookOpen,
  timetable: FileText,
  availability: CalendarClock,
  payment: CreditCard,
  assignments: ClipboardList,
  pricing: Banknote,
  departments: Building2,
  tutors: Users,
  locations: MapPin,
  students: GraduationCap,
  approvals: ShieldCheck,
  audit: ScrollText,
  staff: UserCog,
  matching: Shuffle,
} as const;

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

export function AppNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 md:mx-0 md:flex-col md:overflow-visible md:px-0">
      {items.map(({ href, label, icon, exact }) => {
        const Icon = ICONS[icon];
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
              active ? "bg-white/10 text-white" : "text-brand-100/70 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
