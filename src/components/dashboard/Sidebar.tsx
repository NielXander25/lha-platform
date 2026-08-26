"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Library,
  Megaphone,
  MessageSquare,
  Rocket,
  Award,
  ShieldCheck,
  LogOut,
  Settings,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ElementType };

const participantNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/pod", label: "My Pod", icon: Users },
  { href: "/resources", label: "Resources", icon: Library },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/project", label: "Project / Capstone", icon: Rocket },
  { href: "/certificate", label: "Certificate", icon: Award },
  { href: "/policies", label: "Policies", icon: ShieldCheck },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/participants", label: "Participants", icon: Users },
  { href: "/admin/pods", label: "Pods", icon: Users },
  { href: "/admin/modules", label: "Modules", icon: BookOpen },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/admin");
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const nav = isAdminArea && isAdmin ? adminNav : participantNav;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[var(--color-line)] bg-[var(--color-navy-deep)] text-white">
      <div className="px-5 py-6">
        <Link href="/dashboard" className="font-display text-lg">
          Founders <span className="text-[var(--color-gold)]">×</span> LHA
        </Link>
        <p className="mt-1 text-xs text-white/50">{isAdminArea ? "Admin console" : "Participant platform"}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href={isAdminArea ? "/dashboard" : "/admin"}
            className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm text-[var(--color-gold-light)] hover:bg-white/5"
          >
            <ShieldCheck size={17} />
            {isAdminArea ? "Back to participant view" : "Admin console"}
          </Link>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="px-2 py-2 text-xs text-white/50">Signed in as</div>
        <div className="px-2 pb-2 text-sm">{name}</div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
