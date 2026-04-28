"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/config/tests", label: "Pruebas" },
  { href: "/admin/config/positions", label: "Puestos & Riesgo" },
  { href: "/admin/config/currency", label: "Moneda" },
];

export function ConfigTabs() {
  const path = usePathname() ?? "";
  return (
    <nav className="border-b border-border bg-surface flex">
      {TABS.map((t) => {
        const active = path.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              "px-6 py-3 text-[10px] font-bold tracking-[1.5px] uppercase transition border-b-2 " +
              (active
                ? "text-accent border-accent"
                : "text-text-dim border-transparent hover:text-text")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
