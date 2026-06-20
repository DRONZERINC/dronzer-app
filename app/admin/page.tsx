"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { sites } from "@/lib/mockData";
import { getEmployees, type Employee } from "@/lib/supabase/employees";
import { getProjects, isOverBudget, type Project } from "@/lib/supabase/projects";

const DOC_TYPES = [
  { type: "Contracts",            count: 0, icon: "📋" },
  { type: "HSE Reports",          count: 0, icon: "🛡️" },
  { type: "Engineering Drawings", count: 0, icon: "📐" },
  { type: "HR Documents",         count: 0, icon: "👤" },
  { type: "Invoices",             count: 0, icon: "💵" },
];

const priorityColors: Record<string, { bg: string; text: string }> = {
  high:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
  medium: { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  low:    { bg: "rgba(100,116,139,0.15)", text: "#94a3b8" },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects,  setProjects]  = useState<Project[]>([]);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(() => {});
    getProjects().then(setProjects).catch(() => {});
  }, []);

  const activeEmployees   = employees.filter((e) => e.status === "active");
  const totalHeadcount    = activeEmployees.length;
  const siteHeadcounts    = sites.map((s) => ({
    ...s,
    headcount: activeEmployees.filter((e) => e.site === s.id).length,
  }));
  const maxHeadcount      = Math.max(...siteHeadcounts.map((s) => s.headcount), 1);

  const activeProjects    = projects.filter((p) => p.status !== "archived");
  const openProjectsCount = activeProjects.length;
  const overBudgetCount   = activeProjects.filter(isOverBudget).length;
  const atRiskCount       = activeProjects.filter((p) => p.status === "at_risk" && !isOverBudget(p)).length;

  const companyName     = user?.companyName     ?? "Your Company";
  const companyIndustry = user?.companyIndustry ?? "";
  const asOf = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#4b5563" }}>
            Operations Overview
          </p>
          <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
            {companyName}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
            {companyIndustry ? `${companyIndustry} · ` : ""}As of {asOf}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Headcount", value: totalHeadcount,         sub: `${sites.length} active sites`,   color: "#14b8a6", icon: "👥" },
            { label: "Active Projects", value: openProjectsCount,       sub: `${overBudgetCount} over budget`, color: "#f59e0b", icon: "📊" },
            { label: "Open Tasks",      value: 0,                       sub: "Across all sites",               color: "#818cf8", icon: "✓"  },
            { label: "Documents",       value: (0).toLocaleString(),    sub: "Total on record",                color: "#34d399", icon: "📁" },
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

          {/* Headcount by site */}
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
              {siteHeadcounts.map((site) => (
                <div key={site.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{site.flag}</span>
                      <span className="text-sm" style={{ color: "#e2e8f0" }}>{site.name}</span>
                      <span className="text-xs" style={{ color: "#4b5563" }}>{site.country}</span>
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
            <div className="flex gap-3 mt-5 pt-4" style={{ borderTop: "1px solid #2a3347" }}>
              {siteHeadcounts.map((site) => (
                <div key={site.id} className="flex-1 text-center">
                  <div className="text-xs font-bold" style={{ color: site.color }}>
                    {totalHeadcount === 0 ? 0 : Math.round((site.headcount / totalHeadcount) * 100)}%
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: "#4b5563" }}>
                    {site.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document repository */}
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
              {DOC_TYPES.map((dt) => (
                <div key={dt.type} className="flex items-center gap-3">
                  <span className="text-base w-6">{dt.icon}</span>
                  <span className="text-sm flex-1" style={{ color: "#94a3b8" }}>{dt.type}</span>
                  <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{dt.count}</span>
                  <div className="w-20 h-1.5 rounded-full" style={{ background: "#2a3347" }}>
                    <div className="h-1.5 rounded-full" style={{ width: "0%", background: "#818cf8" }} />
                  </div>
                </div>
              ))}
            </div>
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "#1a1f2e", color: "#64748b" }}
            >
              <p className="font-medium mb-2" style={{ color: "#94a3b8" }}>Recent uploads</p>
              <p className="text-center py-2" style={{ color: "#4b5563" }}>
                No documents uploaded yet
              </p>
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
              0 open
            </span>
          </div>
          <p className="text-sm text-center py-6" style={{ color: "#4b5563" }}>
            No open tasks yet
          </p>
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
                <span style={{ color: "#94a3b8" }}> · {atRiskCount} at risk</span>
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
