"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, BookOpen, Building2, ClipboardList, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Tutor assignments", icon: ClipboardList },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/pricing", label: "Pricing", icon: Banknote },
  { href: "/admin/departments", label: "Departments", icon: Building2 },
  { href: "/admin/tutors", label: "Tutors", icon: Users },
  { href: "/admin/locations", label: "Locations", icon: MapPin },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
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
