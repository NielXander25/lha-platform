import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import type { NavItem } from "@/components/app-nav";
import { requireUser, STAFF_ROLES } from "@/lib/auth";

export const metadata: Metadata = { title: "Staff dashboard", robots: { index: false } };

const NAV: (NavItem & { roles: string[] })[] = [
  { href: "/admin", label: "Overview", icon: "dashboard", exact: true, roles: ["ADMIN", "FINANCE", "SUPPORT"] },
  { href: "/admin/students", label: "Students", icon: "students", roles: ["ADMIN", "SUPPORT", "FINANCE"] },
  { href: "/admin/tutors", label: "Tutors & approvals", icon: "approvals", roles: ["ADMIN"] },
  { href: "/admin/payments", label: "Payments", icon: "payment", roles: ["ADMIN", "FINANCE"] },
  { href: "/admin/assignments", label: "Public tutor listings", icon: "assignments", roles: ["ADMIN"] },
  { href: "/admin/courses", label: "Courses", icon: "courses", roles: ["ADMIN"] },
  { href: "/admin/pricing", label: "Packages", icon: "pricing", roles: ["ADMIN"] },
  { href: "/admin/departments", label: "Departments", icon: "departments", roles: ["ADMIN"] },
  { href: "/admin/locations", label: "Locations", icon: "locations", roles: ["ADMIN"] },
  { href: "/admin/staff", label: "Staff accounts", icon: "staff", roles: ["ADMIN"] },
  { href: "/admin/audit", label: "Audit log", icon: "audit", roles: ["ADMIN", "FINANCE"] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(STAFF_ROLES);
  const title = { ADMIN: "Administrator", FINANCE: "Finance", SUPPORT: "Support" }[user.role] ?? "Staff";
  return (
    <AppShell title={title} user={user} nav={NAV.filter((n) => n.roles.includes(user.role)).map((n) => ({ href: n.href, label: n.label, icon: n.icon, exact: n.exact }))}>
      {children}
    </AppShell>
  );
}
