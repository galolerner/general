"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Building2, Settings, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { logoutAction } from "@/app/(shared)/logout";

type Tab = { href: string; label: string; icon: React.ReactNode };

const ADMIN_TABS: Tab[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} /> },
  { href: "/admin/candidates", label: "Candidatos", icon: <Users size={14} /> },
  { href: "/admin/clients", label: "Clientes", icon: <Building2 size={14} /> },
  { href: "/admin/config/tests", label: "Configuración", icon: <Settings size={14} /> },
];

const CLIENT_TABS: Tab[] = [
  { href: "/portal", label: "Candidatos", icon: <Users size={14} /> },
  { href: "/portal/liquidation", label: "Liquidación", icon: <Building2 size={14} /> },
];

export function Header({
  role,
  userLabel,
  userBadge,
}: {
  role: "ADMIN" | "CLIENT";
  userLabel: string;
  userBadge: string;
}) {
  const pathname = usePathname();
  const tabs = role === "ADMIN" ? ADMIN_TABS : CLIENT_TABS;
  const [pending, start] = useTransition();

  return (
    <header className="px-8 border-b border-border bg-surface flex items-center justify-between h-14 flex-shrink-0 z-50 relative">
      <div className="flex items-center gap-3 min-w-[160px] text-text">
        <Logo height={28} withTagline={false} />
        <span className="font-bold text-[9px] tracking-[3px] uppercase text-accent border-l border-border pl-3 opacity-80">
          SHIELD
        </span>
      </div>

      <nav className="flex h-full items-stretch flex-1 justify-center">
        {tabs.map((t) => {
          const active =
            pathname === t.href ||
            (t.href !== "/portal" && t.href !== "/admin/dashboard" && pathname.startsWith(t.href)) ||
            (t.href === "/admin/config/tests" && pathname.startsWith("/admin/config"));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={
                "flex items-center gap-2 px-8 text-[10px] font-bold tracking-[1.5px] uppercase border-b-2 transition " +
                (active
                  ? "text-accent border-accent"
                  : "text-text-dim border-transparent hover:text-text hover:border-border2")
              }
            >
              <span className="opacity-70">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex gap-2 items-center min-w-[160px] justify-end">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-border text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-text">{userLabel}</span>
          <span className="text-[9px] tracking-[1.5px] uppercase text-text-dim border-l border-border pl-2">
            {userBadge}
          </span>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => logoutAction())}
          className="btn btn-ghost btn-sm"
          title="Cerrar sesión"
        >
          <LogOut size={12} />
        </button>
      </div>
    </header>
  );
}
