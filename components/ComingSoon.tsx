"use client";

import AppShell from "./AppShell";
import { UserRole } from "@/lib/auth";

export default function ComingSoon({ title, role }: { title: string; role?: UserRole }) {
  return (
    <AppShell requiredRole={role}>
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-5"
          style={{ background: "#1e2433", border: "1px solid #2a3347" }}
        >
          🚧
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#e2e8f0" }}>
          {title}
        </h1>
        <p className="text-sm" style={{ color: "#64748b" }}>
          This module is coming in a future release.
        </p>
      </div>
    </AppShell>
  );
}
