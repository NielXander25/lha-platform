import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Student portal", robots: { index: false } };

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["STUDENT"]);
  return (
    <AppShell
      title="Student portal"
      user={user}
      nav={[
        { href: "/portal", label: "Dashboard", icon: "dashboard", exact: true },
        { href: "/portal/profile", label: "Academic profile", icon: "profile" },
        { href: "/portal/courses", label: "Courses & package", icon: "courses" },
        { href: "/portal/timetable", label: "Timetable", icon: "timetable" },
        { href: "/portal/availability", label: "Availability", icon: "availability" },
        { href: "/portal/payment", label: "Payment", icon: "payment" },
        { href: "/account/password", label: "Change password", icon: "password" },
      ]}
    >
      {children}
    </AppShell>
  );
}
