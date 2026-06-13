"use client";

import AppShell from "@/components/AppShell";
import { projects, sites } from "@/lib/mockData";

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  on_track: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", label: "On Track", dot: "#22c55e" },
  at_risk: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", label: "At Risk", dot: "#f59e0b" },
  over_budget: { bg: "rgba(239,68,68,0.12)", text: "#f87171", label: "Over Budget", dot: "#ef4444" },
  completed: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", label: "Completed", dot: "#64748b" },
};

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProjectsPage() {
  const totalBudget = projects.reduce((s, p) => s + p.budget.total, 0);
  const totalSpent = projects.reduce((s, p) => s + p.budget.spent, 0);
  const overBudgetProjects = projects.filter((p) => p.status === "over_budget");

  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#4b5563" }}>
            Admin · Projects
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
            Projects &amp; Budgets
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {projects.length} active projects across {sites.length} sites
          </p>
        </div>

        {/* Portfolio summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Portfolio Budget", value: formatCurrency(totalBudget), color: "#f59e0b" },
            { label: "Total Spent to Date", value: formatCurrency(totalSpent), color: "#14b8a6" },
            {
              label: "Budget Utilization",
              value: `${Math.round((totalSpent / totalBudget) * 100)}%`,
              color: totalSpent > totalBudget ? "#ef4444" : "#22c55e",
            },
            {
              label: "Projects at Risk / Over",
              value: `${overBudgetProjects.length + projects.filter((p) => p.status === "at_risk").length}`,
              color: "#f87171",
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl p-4"
              style={{ background: "#161b27", border: "1px solid #2a3347" }}
            >
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>
                {c.label}
              </p>
              <p className="text-2xl font-bold" style={{ color: c.color }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Over budget alert */}
        {overBudgetProjects.length > 0 && (
          <div
            className="rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
                Budget Alert — {overBudgetProjects.length} project(s) over budget
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {overBudgetProjects.map((p) => p.name).join(", ")} —{" "}
                {overBudgetProjects[0].overBudgetPct}% over approved budget. Escalation recommended.
              </p>
            </div>
          </div>
        )}

        {/* Project cards */}
        <div className="space-y-4">
          {projects.map((proj) => {
            const site = sites.find((s) => s.id === proj.site);
            const st = statusConfig[proj.status] ?? statusConfig.on_track;
            const doneMilestones = proj.milestones.filter((m) => m.done).length;
            const milestonePercent = Math.round((doneMilestones / proj.milestones.length) * 100);
            const spentPercent = Math.min((proj.budget.spent / proj.budget.total) * 100, 130);
            const isOverBudget = proj.status === "over_budget";
            const overAmount = isOverBudget ? proj.budget.spent - proj.budget.total : 0;

            return (
              <div
                key={proj.id}
                className="rounded-xl p-5"
                style={{
                  background: "#161b27",
                  border: `1px solid ${isOverBudget ? "rgba(239,68,68,0.3)" : "#2a3347"}`,
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold" style={{ color: "#e2e8f0" }}>
                        {proj.name}
                      </h3>
                      {isOverBudget && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse"
                          style={{ background: "rgba(239,68,68,0.18)", color: "#f87171" }}
                        >
                          ⚠ 12% Over Budget
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "#64748b" }}>
                      <span>
                        {site?.flag} {site?.name}, {proj.country}
                      </span>
                      <span>·</span>
                      <span>Phase: {proj.phase}</span>
                      <span>·</span>
                      <span>PM: {proj.pm}</span>
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: "#4b5563" }}>
                      {proj.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: st.bg, color: st.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                      {st.label}
                    </span>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      Deadline: {formatDate(proj.deadline)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Milestone progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#64748b" }}>
                        Milestone Progress
                      </span>
                      <span className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>
                        {doneMilestones}/{proj.milestones.length} complete
                      </span>
                    </div>
                    {/* Bar */}
                    <div className="h-2 rounded-full mb-3" style={{ background: "#2a3347" }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${milestonePercent}%`,
                          background:
                            proj.status === "on_track"
                              ? "#14b8a6"
                              : proj.status === "at_risk"
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                    {/* Milestone steps */}
                    <div className="space-y-1">
                      {proj.milestones.map((m, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={
                              m.done
                                ? { background: "rgba(20,184,166,0.2)", color: "#2dd4bf" }
                                : { background: "#2a3347", color: "#4b5563" }
                            }
                          >
                            {m.done ? "✓" : (i + 1).toString()}
                          </span>
                          <span style={{ color: m.done ? "#64748b" : "#94a3b8" }}>{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Budget vs Actual */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#64748b" }}>
                        Budget vs Actual Spend
                      </span>
                      {isOverBudget && (
                        <span className="text-xs font-semibold" style={{ color: "#f87171" }}>
                          +{formatCurrency(overAmount)} over
                        </span>
                      )}
                    </div>
                    {/* Budget bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#64748b" }}>
                        <span>Approved budget</span>
                        <span style={{ color: "#e2e8f0" }}>{formatCurrency(proj.budget.total)}</span>
                      </div>
                      <div className="relative h-5 rounded-lg overflow-visible" style={{ background: "#2a3347" }}>
                        {/* Budget line */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 z-10"
                          style={{ left: "100%", background: "#64748b" }}
                        />
                        {/* Spent bar */}
                        <div
                          className="h-5 rounded-lg flex items-center justify-end pr-2 text-xs font-medium transition-all"
                          style={{
                            width: `${Math.min(spentPercent, 100)}%`,
                            background: isOverBudget
                              ? "linear-gradient(90deg, #dc2626, #ef4444)"
                              : proj.status === "at_risk"
                              ? "linear-gradient(90deg, #d97706, #f59e0b)"
                              : "linear-gradient(90deg, #0d9488, #14b8a6)",
                            color: isOverBudget ? "#fca5a5" : "#ccfbf1",
                          }}
                        >
                          {spentPercent > 20 && `${Math.round(spentPercent)}%`}
                        </div>
                      </div>
                      {/* Labels */}
                      <div className="flex justify-between text-xs mt-1.5">
                        <span style={{ color: "#64748b" }}>
                          Spent:{" "}
                          <span style={{ color: isOverBudget ? "#f87171" : "#e2e8f0", fontWeight: 600 }}>
                            {formatCurrency(proj.budget.spent)}
                          </span>
                        </span>
                        <span style={{ color: "#64748b" }}>
                          Remaining:{" "}
                          <span
                            style={{
                              color: isOverBudget ? "#f87171" : "#4ade80",
                              fontWeight: 600,
                            }}
                          >
                            {isOverBudget
                              ? `−${formatCurrency(overAmount)}`
                              : formatCurrency(proj.budget.total - proj.budget.spent)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Mini breakdown */}
                    <div className="rounded-lg p-3 text-xs space-y-1.5" style={{ background: "#1a1f2e" }}>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }}>Budget utilization</span>
                        <span
                          style={{
                            color: isOverBudget ? "#f87171" : proj.status === "at_risk" ? "#fbbf24" : "#4ade80",
                            fontWeight: 600,
                          }}
                        >
                          {Math.round((proj.budget.spent / proj.budget.total) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: "#64748b" }}>Milestone completion</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{milestonePercent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
