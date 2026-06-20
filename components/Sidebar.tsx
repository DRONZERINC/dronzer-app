"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

const employeeNav = [
  { href: "/employee", label: "Dashboard", icon: "⊞" },
  { href: "/employee/tasks", label: "My Tasks", icon: "✓" },
  { href: "/employee/leave", label: "Leave", icon: "📅" },
  { href: "/employee/payroll", label: "Payroll", icon: "💳" },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: "⊞" },
  { href: "/admin/projects", label: "Projects & Budgets", icon: "📊" },
  { href: "/admin/files", label: "File Upload", icon: "📁" },
  { href: "/admin/workforce", label: "Workforce", icon: "👥" },
  { href: "/admin/reports", label: "Reports", icon: "📋" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const nav = user?.role === "admin" ? adminNav : employeeNav;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/employee") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="flex flex-col w-60 shrink-0 h-full"
      style={{ background: "#111827", borderRight: "1px solid #1f2937" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #1f2937" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "#f59e0b", color: "#0d1117" }}
          >
            D
          </div>
          <span className="text-lg font-bold" style={{ color: "#f59e0b" }}>
            Dronzer
          </span>
        </div>
        <p className="text-xs mt-1.5 truncate" style={{ color: "#4b5563" }}>
          {user?.companyName
            ? user.companyName.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 4)
            : "Co"}{" "}
          · {user?.role === "admin" ? "Admin" : "Employee"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: active ? "rgba(245,158,11,0.12)" : "transparent",
                color: active ? "#f59e0b" : "#9ca3af",
                fontWeight: active ? 600 : 400,
              }}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid #1f2937" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}
          >
            {user?.name?.slice(0, 2).toUpperCase() ?? "??"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "#e2e8f0" }}>
              {user?.name}
            </p>
            <p className="text-xs truncate" style={{ color: "#4b5563" }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: "#6b7280" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#ef4444";
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#6b7280";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <span className="text-base w-5 text-center">⏻</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
