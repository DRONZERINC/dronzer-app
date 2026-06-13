"use client";

import Link from "next/link";
import AppShell from "@/components/AppShell";
import { sites, adminTasks, documentStats, projects, company } from "@/lib/mockData";

const totalHeadcount = sites.reduce((s, x) => s + x.headcount, 0);
const maxHeadcount = Math.max(...sites.map((s) => s.headcount));

const priorityColors: Record<string, { bg: string; text: string }> = {
  high: { bg: "rgba(239,68,68,0.12)", text: "#f87171" },
  medium: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24" },
  low: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
};

const openProjectsCount = projects.length;
const overBudgetCount = projects.filter((p) => p.status === "over_budget").length;
const atRiskCount = projects.filter((p) => p.status === "at_risk").length;

export default function AdminDashboard() {
  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#4b5563" }}>
            Operations Overview
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
            {company.name}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {company.industry} · {company.region} · As of June 2026
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Headcount", value: totalHeadcount, sub: `${sites.length} active sites`, color: "#14b8a6", icon: "👥" },
            { label: "Active Projects", value: openProjectsCount, sub: `${overBudgetCount} over budget`, color: "#f59e0b", icon: "📊" },
            { label: "Open Tasks", value: adminTasks.length, sub: "Across all sites", color: "#818cf8", icon: "✓" },
            { label: "Documents", value: documentStats.total.toLocaleString(), sub: "Total on record", color: "#34d399", icon: "📁" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-4"
              style={{ background: "#161b27", border: "1px solid #2a3347" }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs uppercase tracking-wide" style={{ color: "#64748b" }}>
                  {card.label}
                </span>
                <span className="text-lg">{card.icon}</span>
              </div>
              <p className="text-3xl font-bold" style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Headcount by site chart */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#161b27", border: "1px solid #2a3347" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                Headcount by Site
              </h2>
              <span className="text-xs" style={{ color: "#64748b" }}>
                Total: {totalHeadcount}
              </span>
            </div>
            <div className="space-y-4">
              {sites.map((site) => (
                <div key={site.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{site.flag}</span>
                      <span className="text-sm" style={{ color: "#e2e8f0" }}>
                        {site.name}
                      </span>
                      <span className="text-xs" style={{ color: "#4b5563" }}>
                        {site.country}
                      </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: site.color }}>
                      {site.headcount}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "#2a3347" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(site.headcount / maxHeadcount) * 100}%`,
                        background: site.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Site breakdown percentages */}
            <div className="flex gap-3 mt-5 pt-4" style={{ borderTop: "1px solid #2a3347" }}>
              {sites.map((site) => (
                <div key={site.id} className="flex-1 text-center">
                  <div
                    className="text-xs font-bold"
                    style={{ color: site.color }}
                  >
                    {Math.round((site.headcount / totalHeadcount) * 100)}%
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#4b5563" }}>
                    {site.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document stats */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#161b27", border: "1px solid #2a3347" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                Document Repository
              </h2>
              <Link
                href="/admin/files"
                className="text-xs px-2.5 py-1 rounded-lg transition-all"
                style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
              >
                Upload →
              </Link>
            </div>
            <div className="space-y-2.5 mb-4">
              {documentStats.byType.map((dt) => (
                <div key={dt.type} className="flex items-center gap-3">
                  <span className="text-base w-6">{dt.icon}</span>
                  <span className="text-sm flex-1" style={{ color: "#94a3b8" }}>
                    {dt.type}
                  </span>
                  <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>
                    {dt.count}
                  </span>
                  <div className="w-20 h-1.5 rounded-full" style={{ background: "#2a3347" }}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(dt.count / documentStats.total) * 100}%`,
                        background: "#818cf8",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "#1a1f2e", color: "#64748b" }}
            >
              <p className="font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                Recent uploads
              </p>
              {documentStats.recentUploads.map((doc) => (
                <div key={doc.name} className="flex items-center gap-2 py-1" style={{ borderBottom: "1px solid #2a3347" }}>
                  <span style={{ color: "#4b5563" }}>•</span>
                  <span className="truncate flex-1" style={{ color: "#94a3b8" }}>
                    {doc.name}
                  </span>
                  <span style={{ color: "#4b5563", whiteSpace: "nowrap" }}>{doc.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Open tasks */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#161b27", border: "1px solid #2a3347" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
              Open Tasks — All Sites
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
            >
              {adminTasks.length} open
            </span>
          </div>
          <div className="space-y-2">
            {adminTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ background: "#1a1f2e" }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: priorityColors[task.priority].bg.replace("0.12)", "1)").replace("0.15)", "1)") }}
                />
                <span className="text-sm flex-1" style={{ color: "#e2e8f0" }}>
                  {task.title}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "#252d3d", color: "#64748b" }}
                >
                  {task.site}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: priorityColors[task.priority].bg,
                    color: priorityColors[task.priority].text,
                  }}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Projects alert banner */}
        {(overBudgetCount > 0 || atRiskCount > 0) && (
          <div
            className="mt-4 rounded-xl px-5 py-3 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <span className="text-lg">⚠️</span>
            <div className="text-sm">
              <span style={{ color: "#f87171", fontWeight: 600 }}>
                {overBudgetCount} project{overBudgetCount > 1 ? "s" : ""} over budget
              </span>
              {atRiskCount > 0 && (
                <span style={{ color: "#94a3b8" }}>
                  {" "}· {atRiskCount} at risk
                </span>
              )}
            </div>
            <Link
              href="/admin/projects"
              className="ml-auto text-xs px-3 py-1 rounded-lg"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
            >
              View Projects →
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
