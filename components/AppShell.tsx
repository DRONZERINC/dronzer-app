"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export default function AppShell({ children, requiredRole }: AppShellProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "admin" ? "/admin" : "/employee");
    }
  }, [user, isLoading, router, requiredRole]);

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: "#0d1117" }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold animate-pulse"
            style={{ background: "#f59e0b", color: "#0d1117" }}
          >
            D
          </div>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Loading…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0d1117" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: "#0d1117" }}>
        {children}
      </main>
    </div>
  );
}
