import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Tutor portal", robots: { index: false } };

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["TUTOR"]);
  return (
    <AppShell
      title="Tutor portal"
      user={user}
      nav={[
        { href: "/tutor", label: "Dashboard", icon: "dashboard", exact: true },
        { href: "/tutor/profile", label: "Profile & credentials", icon: "profile" },
        { href: "/tutor/courses", label: "Courses I teach", icon: "courses" },
        { href: "/tutor/availability", label: "Availability", icon: "availability" },
        { href: "/account/password", label: "Change password", icon: "password" },
      ]}
    >
      {children}
    </AppShell>
  );
}
