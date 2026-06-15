"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { sites } from "@/lib/mockData";
import {
  getProjects, createProject, updateProject,
  archiveProject, deleteProject, isOverBudget,
  type Project, type ProjectInsert,
} from "@/lib/supabase/projects";
import {
  getProjectExpenses, addExpense, deleteExpense,
  CATEGORIES, categoryColor,
  type ProjectExpense, type ExpenseCategory,
} from "@/lib/supabase/expenses";

// ── helpers ───────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  on_track:  { bg: "rgba(34,197,94,0.12)",   text: "#4ade80", label: "On Track",  dot: "#22c55e" },
  at_risk:   { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24", label: "At Risk",   dot: "#f59e0b" },
  completed: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", label: "Completed", dot: "#64748b" },
  archived:  { bg: "rgba(100,116,139,0.10)", text: "#64748b", label: "Archived",  dot: "#4b5563" },
};

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function today() {
  return new Date().toISOString().split("T")[0];
}

const siteCountry: Record<string, string> = {
  ruwais: "UAE", dammam: "Saudi Arabia", duqm: "Oman", doha: "Qatar",
};

const inp = "w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all";
const inpSm = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-all";
const inpStyle = { background: "#1a1f2e", border: "1px solid #2a3347", color: "#e2e8f0" };
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = "#f59e0b");
const onBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
  (e.target.style.borderColor = "#2a3347");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "#94a3b8" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const emptyForm = (): Partial<ProjectInsert> => ({
  status: "on_track", milestone_pct: 0, budget_amount: 0, actual_spend: 0,
});

// ── component ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const { user } = useAuth();

  // projects
  const [projects,   setProjects]   = useState<Project[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [filter,     setFilter]     = useState<"active" | "archived" | "all">("active");

  // project form (add/edit)
  const [formOpen,   setFormOpen]   = useState(false);
  const [formMode,   setFormMode]   = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [form,       setForm]       = useState<Partial<ProjectInsert>>(emptyForm());
  const [formSaving, setFormSaving] = useState(false);
  const [formError,  setFormError]  = useState("");

  // confirmations
  const [archiveTarget, setArchiveTarget] = useState<Project | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // cost entries
  const [expandedId,      setExpandedId]      = useState<string | null>(null);
  const [expenses,        setExpenses]        = useState<Record<string, ProjectExpense[]>>({});
  const [expLoading,      setExpLoading]      = useState<string | null>(null);
  const [expForm,         setExpForm]         = useState<{ date: string; category: ExpenseCategory; amount: string; description: string }>({
    date: today(), category: "Labour", amount: "", description: "",
  });
  const [expAdding,  setExpAdding]  = useState(false);
  const [expError,   setExpError]   = useState("");
  const [deletingExp, setDeletingExp] = useState<string | null>(null);

  // ── data loading ─────────────────────────────────────────────────────────────

  const loadProjects = useCallback(async () => {
    setLoading(true); setFetchError("");
    try { setProjects(await getProjects()); }
    catch (e: unknown) { setFetchError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  async function loadExpenses(projectId: string) {
    setExpLoading(projectId);
    try {
      const data = await getProjectExpenses(projectId);
      setExpenses((prev) => ({ ...prev, [projectId]: data }));
    } catch {}
    finally { setExpLoading(null); }
  }

  async function toggleExpenses(projectId: string) {
    if (expandedId === projectId) { setExpandedId(null); return; }
    setExpandedId(projectId);
    setExpForm({ date: today(), category: "Labour", amount: "", description: "" });
    setExpError("");
    await loadExpenses(projectId);
  }

  // ── computed ─────────────────────────────────────────────────────────────────

  const visible        = projects.filter((p) =>
    filter === "active" ? p.status !== "archived" :
    filter === "archived" ? p.status === "archived" : true
  );
  const activeProjects  = projects.filter((p) => p.status !== "archived");
  const overBudgetList  = activeProjects.filter(isOverBudget);
  const atRiskList      = activeProjects.filter((p) => p.status === "at_risk" && !isOverBudget(p));
  const totalBudget     = activeProjects.reduce((s, p) => s + p.budget_amount, 0);
  const totalSpent      = activeProjects.reduce((s, p) => s + p.actual_spend, 0);

  // ── project form handlers ────────────────────────────────────────────────────

  function openAdd() {
    setFormMode("add"); setEditTarget(null);
    setForm(emptyForm()); setFormError(""); setFormOpen(true);
  }
  function openEdit(p: Project) {
    setFormMode("edit"); setEditTarget(p);
    setForm({
      name: p.name, site: p.site ?? undefined, country: p.country ?? undefined,
      status: p.status === "archived" ? "on_track" : p.status,
      phase: p.phase ?? undefined, deadline: p.deadline ?? undefined,
      pm: p.pm ?? undefined, description: p.description ?? undefined,
      milestone_pct: p.milestone_pct, budget_amount: p.budget_amount,
      actual_spend: p.actual_spend,
    });
    setFormError(""); setFormOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormSaving(true); setFormError("");
    try {
      const payload: ProjectInsert = {
        name: form.name!, site: form.site || null, country: form.country || null,
        status: form.status ?? "on_track", phase: form.phase || null,
        deadline: form.deadline || null, pm: form.pm || null,
        description: form.description || null,
        milestone_pct: Number(form.milestone_pct ?? 0),
        budget_amount: Number(form.budget_amount ?? 0),
        actual_spend: Number(form.actual_spend ?? 0),
      };
      if (formMode === "add") await createProject(payload);
      else await updateProject(editTarget!.id, payload);
      setFormOpen(false); await loadProjects();
    } catch (e: unknown) { setFormError(e instanceof Error ? e.message : "Failed to save"); }
    finally { setFormSaving(false); }
  }

  async function handleArchive() {
    if (!archiveTarget) return; setActionLoading(true);
    try { await archiveProject(archiveTarget.id); setArchiveTarget(null); await loadProjects(); }
    finally { setActionLoading(false); }
  }
  async function handleRestore(p: Project) {
    try { await updateProject(p.id, { status: "on_track" }); await loadProjects(); } catch {}
  }
  async function handleDelete() {
    if (!deleteTarget || deleteConfirm !== deleteTarget.name) return; setActionLoading(true);
    try { await deleteProject(deleteTarget.id); setDeleteTarget(null); setDeleteConfirm(""); await loadProjects(); }
    finally { setActionLoading(false); }
  }

  // ── expense handlers ─────────────────────────────────────────────────────────

  async function handleAddExpense(projectId: string) {
    if (!expForm.amount || Number(expForm.amount) <= 0) {
      setExpError("Enter a valid amount."); return;
    }
    setExpAdding(true); setExpError("");
    try {
      await addExpense({
        project_id:  projectId,
        amount:      Number(expForm.amount),
        date:        expForm.date,
        category:    expForm.category,
        description: expForm.description || null,
        created_by:  user?.email ?? null,
      });
      setExpForm({ date: today(), category: "Labour", amount: "", description: "" });
      await loadExpenses(projectId);
      await loadProjects(); // refresh actual_spend on the card
    } catch (e: unknown) { setExpError(e instanceof Error ? e.message : "Failed to add"); }
    finally { setExpAdding(false); }
  }

  async function handleDeleteExpense(expenseId: string, projectId: string) {
    setDeletingExp(expenseId);
    try {
      await deleteExpense(expenseId);
      await loadExpenses(projectId);
      await loadProjects();
    } catch {}
    finally { setDeletingExp(null); }
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#4b5563" }}>Admin · Projects</p>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>Projects &amp; Budgets</h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {activeProjects.length} active project{activeProjects.length !== 1 ? "s" : ""} across {sites.length} sites
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #2a3347" }}>
              {(["active", "archived", "all"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-2 text-xs font-medium capitalize transition-all"
                  style={{ background: filter === f ? "rgba(245,158,11,0.15)" : "#161b27", color: filter === f ? "#f59e0b" : "#64748b" }}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={openAdd} className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "#f59e0b", color: "#0d1117" }}>
              + Add Project
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {filter !== "archived" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Portfolio Budget", value: formatCurrency(totalBudget), color: "#f59e0b" },
              { label: "Total Spent to Date",    value: formatCurrency(totalSpent),  color: "#14b8a6" },
              { label: "Budget Utilization",
                value: totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : "—",
                color: totalSpent > totalBudget ? "#ef4444" : "#22c55e" },
              { label: "Projects at Risk / Over",
                value: `${overBudgetList.length + atRiskList.length}`,
                color: "#f87171" },
            ].map((c) => (
              <div key={c.label} className="rounded-xl p-4" style={{ background: "#161b27", border: "1px solid #2a3347" }}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "#64748b" }}>{c.label}</p>
                <p className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Over-budget alert */}
        {overBudgetList.length > 0 && filter !== "archived" && (
          <div className="rounded-xl px-5 py-3.5 mb-6 flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>
                Budget Alert — {overBudgetList.length} project{overBudgetList.length > 1 ? "s" : ""} over budget
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {overBudgetList.map((p) => {
                  const pct = Math.round(((p.actual_spend - p.budget_amount) / p.budget_amount) * 100);
                  return `${p.name} (${pct}% over)`;
                }).join(" · ")} — Escalation recommended.
              </p>
            </div>
          </div>
        )}

        {/* Loading / error / empty */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-lg animate-pulse flex items-center justify-center text-sm font-bold"
                style={{ background: "#f59e0b", color: "#0d1117" }}>D</div>
              <p className="text-sm" style={{ color: "#64748b" }}>Loading projects…</p>
            </div>
          </div>
        ) : fetchError ? (
          <div className="p-8 text-center text-sm" style={{ color: "#ef4444" }}>{fetchError}</div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl p-12 text-center" style={{ background: "#161b27", border: "1px solid #2a3347" }}>
            <p className="text-sm" style={{ color: "#64748b" }}>No projects found.</p>
          </div>
        ) : (

          <div className="space-y-4">
            {visible.map((proj) => {
              const site       = sites.find((s) => s.id === proj.site);
              const over       = isOverBudget(proj);
              const overAmount = over ? proj.actual_spend - proj.budget_amount : 0;
              const overPct    = over ? Math.round((overAmount / proj.budget_amount) * 100) : 0;
              const spentPct   = proj.budget_amount > 0
                ? Math.min((proj.actual_spend / proj.budget_amount) * 100, 130) : 0;
              const st         = statusConfig[proj.status] ?? statusConfig.on_track;
              const isArchived = proj.status === "archived";
              const isExpanded = expandedId === proj.id;
              const projExpenses = expenses[proj.id] ?? [];

              return (
                <div key={proj.id} className="rounded-xl overflow-hidden"
                  style={{ background: "#161b27", border: `1px solid ${over ? "rgba(239,68,68,0.3)" : "#2a3347"}`, opacity: isArchived ? 0.6 : 1 }}>

                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-semibold" style={{ color: "#e2e8f0" }}>{proj.name}</h3>
                          {over && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold animate-pulse"
                              style={{ background: "rgba(239,68,68,0.18)", color: "#f87171" }}>
                              ⚠ {overPct}% Over Budget
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "#64748b" }}>
                          {site && <span>{site.flag} {site.name}, {proj.country}</span>}
                          {proj.phase && <><span>·</span><span>Phase: {proj.phase}</span></>}
                          {proj.pm    && <><span>·</span><span>PM: {proj.pm}</span></>}
                        </div>
                        {proj.description && (
                          <p className="text-xs mt-1.5" style={{ color: "#4b5563" }}>{proj.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                          style={{ background: st.bg, color: st.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                        {proj.deadline && (
                          <span className="text-xs" style={{ color: "#64748b" }}>Deadline: {formatDate(proj.deadline)}</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <button onClick={() => openEdit(proj)} className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Edit</button>
                          {isArchived ? (
                            <button onClick={() => handleRestore(proj)} className="text-xs px-2.5 py-1 rounded-lg"
                              style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>Restore</button>
                          ) : (
                            <button onClick={() => setArchiveTarget(proj)} className="text-xs px-2.5 py-1 rounded-lg"
                              style={{ background: "rgba(100,116,139,0.12)", color: "#94a3b8" }}>Archive</button>
                          )}
                          <button onClick={() => { setDeleteTarget(proj); setDeleteConfirm(""); }}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>Delete</button>
                        </div>
                      </div>
                    </div>

                    {/* Progress + Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Milestone */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#64748b" }}>Milestone Progress</span>
                          <span className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>{proj.milestone_pct}% complete</span>
                        </div>
                        <div className="h-2 rounded-full mb-3" style={{ background: "#2a3347" }}>
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${proj.milestone_pct}%`, background: proj.status === "at_risk" ? "#f59e0b" : over ? "#ef4444" : "#14b8a6" }} />
                        </div>
                        <div className="rounded-lg px-3 py-2 text-xs" style={{ background: "#1a1f2e" }}>
                          <div className="flex justify-between">
                            <span style={{ color: "#64748b" }}>Completion</span>
                            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{proj.milestone_pct}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Budget */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#64748b" }}>Budget vs Actual Spend</span>
                          {over && <span className="text-xs font-semibold" style={{ color: "#f87171" }}>+{formatCurrency(overAmount)} over</span>}
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1" style={{ color: "#64748b" }}>
                            <span>Approved budget</span>
                            <span style={{ color: "#e2e8f0" }}>{formatCurrency(proj.budget_amount)}</span>
                          </div>
                          <div className="relative h-5 rounded-lg overflow-visible" style={{ background: "#2a3347" }}>
                            <div className="absolute top-0 bottom-0 w-0.5 z-10" style={{ left: "100%", background: "#64748b" }} />
                            <div className="h-5 rounded-lg flex items-center justify-end pr-2 text-xs font-medium transition-all"
                              style={{
                                width: `${Math.min(spentPct, 100)}%`,
                                background: over ? "linear-gradient(90deg,#dc2626,#ef4444)" : proj.status === "at_risk" ? "linear-gradient(90deg,#d97706,#f59e0b)" : "linear-gradient(90deg,#0d9488,#14b8a6)",
                                color: over ? "#fca5a5" : "#ccfbf1",
                              }}>
                              {spentPct > 20 && `${Math.round(spentPct)}%`}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs mt-1.5">
                            <span style={{ color: "#64748b" }}>Spent: <span style={{ color: over ? "#f87171" : "#e2e8f0", fontWeight: 600 }}>{formatCurrency(proj.actual_spend)}</span></span>
                            <span style={{ color: "#64748b" }}>Remaining: <span style={{ color: over ? "#f87171" : "#4ade80", fontWeight: 600 }}>
                              {over ? `−${formatCurrency(overAmount)}` : formatCurrency(proj.budget_amount - proj.actual_spend)}
                            </span></span>
                          </div>
                        </div>
                        <div className="rounded-lg p-3 text-xs space-y-1.5" style={{ background: "#1a1f2e" }}>
                          <div className="flex justify-between">
                            <span style={{ color: "#64748b" }}>Budget utilization</span>
                            <span style={{ color: over ? "#f87171" : proj.status === "at_risk" ? "#fbbf24" : "#4ade80", fontWeight: 600 }}>
                              {proj.budget_amount > 0 ? `${Math.round((proj.actual_spend / proj.budget_amount) * 100)}%` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: "#64748b" }}>Milestone completion</span>
                            <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{proj.milestone_pct}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Entries toggle */}
                    <div className="mt-4 pt-4" style={{ borderTop: "1px solid #1e2433" }}>
                      <button
                        onClick={() => toggleExpenses(proj.id)}
                        className="flex items-center gap-2 text-xs font-medium transition-all"
                        style={{ color: isExpanded ? "#f59e0b" : "#64748b" }}
                      >
                        <span>{isExpanded ? "▾" : "▸"}</span>
                        <span>Cost Entries</span>
                        {projExpenses.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                            {projExpenses.length}
                          </span>
                        )}
                        <span style={{ color: "#4b5563" }}>— logged spend that drives Actual Spend above</span>
                      </button>
                    </div>
                  </div>

                  {/* ── COST ENTRIES PANEL ── */}
                  {isExpanded && (
                    <div style={{ borderTop: "1px solid #1e2433", background: "#111827" }}>
                      <div className="p-5">

                        {/* Add expense form */}
                        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#94a3b8" }}>Log New Cost Entry</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                          <input
                            type="date" value={expForm.date}
                            onChange={(e) => setExpForm((p) => ({ ...p, date: e.target.value }))}
                            className={inpSm} style={inpStyle} onFocus={onFocus} onBlur={onBlur}
                          />
                          <select
                            value={expForm.category}
                            onChange={(e) => setExpForm((p) => ({ ...p, category: e.target.value as ExpenseCategory }))}
                            className={inpSm} style={inpStyle} onFocus={onFocus} onBlur={onBlur}
                          >
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <input
                            type="number" min={0} placeholder="Amount (USD)"
                            value={expForm.amount}
                            onChange={(e) => setExpForm((p) => ({ ...p, amount: e.target.value }))}
                            className={inpSm} style={inpStyle} onFocus={onFocus} onBlur={onBlur}
                          />
                          <input
                            placeholder="Description (optional)"
                            value={expForm.description}
                            onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))}
                            className={`${inpSm} md:col-span-1`} style={inpStyle} onFocus={onFocus} onBlur={onBlur}
                          />
                          <button
                            onClick={() => handleAddExpense(proj.id)}
                            disabled={expAdding}
                            className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                            style={{ background: expAdding ? "#92400e" : "#f59e0b", color: "#0d1117", cursor: expAdding ? "not-allowed" : "pointer" }}
                          >
                            {expAdding ? "Adding…" : "+ Add"}
                          </button>
                        </div>
                        {expError && (
                          <p className="text-xs mb-3 px-3 py-1.5 rounded-lg"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>{expError}</p>
                        )}

                        {/* Expense list */}
                        {expLoading === proj.id ? (
                          <p className="text-xs py-4 text-center" style={{ color: "#64748b" }}>Loading entries…</p>
                        ) : projExpenses.length === 0 ? (
                          <p className="text-xs py-4 text-center" style={{ color: "#4b5563" }}>No cost entries yet. Log the first one above.</p>
                        ) : (
                          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #2a3347" }}>
                            <table className="w-full">
                              <thead>
                                <tr style={{ borderBottom: "1px solid #2a3347" }}>
                                  {["Date", "Category", "Amount", "Description", "Logged by", ""].map((h) => (
                                    <th key={h} className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "#4b5563", background: "#161b27" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {projExpenses.map((exp) => (
                                  <tr key={exp.id} style={{ borderBottom: "1px solid #1a1f2e" }}>
                                    <td className="px-3 py-2.5 text-xs" style={{ color: "#94a3b8" }}>{formatDate(exp.date)}</td>
                                    <td className="px-3 py-2.5">
                                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: `${categoryColor[exp.category]}20`, color: categoryColor[exp.category] }}>
                                        {exp.category}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: "#e2e8f0" }}>
                                      {formatCurrency(exp.amount)}
                                    </td>
                                    <td className="px-3 py-2.5 text-xs" style={{ color: "#64748b" }}>{exp.description || "—"}</td>
                                    <td className="px-3 py-2.5 text-xs" style={{ color: "#4b5563" }}>{exp.created_by || "—"}</td>
                                    <td className="px-3 py-2.5 text-right">
                                      <button
                                        onClick={() => handleDeleteExpense(exp.id, proj.id)}
                                        disabled={deletingExp === exp.id}
                                        className="text-xs px-2 py-0.5 rounded transition-all"
                                        style={{ color: "#ef4444", opacity: deletingExp === exp.id ? 0.5 : 1 }}
                                      >
                                        {deletingExp === exp.id ? "…" : "✕"}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr style={{ borderTop: "1px solid #2a3347", background: "#161b27" }}>
                                  <td colSpan={2} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Total</td>
                                  <td className="px-3 py-2 text-xs font-bold" style={{ color: over ? "#f87171" : "#f59e0b" }}>
                                    {formatCurrency(projExpenses.reduce((s, e) => s + e.amount, 0))}
                                  </td>
                                  <td colSpan={3} />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT PROJECT MODAL ── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]" style={{ background: "#161b27", border: "1px solid #2a3347" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>
                {formMode === "add" ? "Add Project" : "Edit Project"}
              </h2>
              <button onClick={() => setFormOpen(false)} style={{ color: "#64748b" }}>✕</button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Field label="Project Name *">
                <input required value={form.name ?? ""} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Site">
                  <select value={form.site ?? ""} onChange={(e) => { const id = e.target.value; setForm((p) => ({ ...p, site: id, country: siteCountry[id] ?? p.country })); }}
                    className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">— Select —</option>
                    {sites.map((s) => <option key={s.id} value={s.id}>{s.flag} {s.name}</option>)}
                  </select>
                </Field>
                <Field label="Country">
                  <input value={form.country ?? ""} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
                    className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select value={form.status ?? "on_track"} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as Project["status"] }))}
                    className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur}>
                    <option value="on_track">On Track</option>
                    <option value="at_risk">At Risk</option>
                    <option value="completed">Completed</option>
                  </select>
                </Field>
                <Field label="Phase">
                  <input value={form.phase ?? ""} onChange={(e) => setForm((p) => ({ ...p, phase: e.target.value }))}
                    placeholder="e.g. Construction" className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Deadline">
                  <input type="date" value={form.deadline ?? ""} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
                    className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
                <Field label="Project Manager">
                  <input value={form.pm ?? ""} onChange={(e) => setForm((p) => ({ ...p, pm: e.target.value }))}
                    className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
                </Field>
              </div>
              <Field label="Milestone Progress (0–100%)">
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={100} value={form.milestone_pct ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, milestone_pct: Number(e.target.value) }))}
                    className="flex-1 accent-amber-400" />
                  <span className="text-sm font-semibold w-12 text-right" style={{ color: "#f59e0b" }}>{form.milestone_pct ?? 0}%</span>
                </div>
              </Field>
              <Field label="Approved Budget (USD)">
                <input type="number" min={0} value={form.budget_amount ?? ""} onChange={(e) => setForm((p) => ({ ...p, budget_amount: Number(e.target.value) }))}
                  className={inp} style={inpStyle} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(20,184,166,0.08)", color: "#2dd4bf", border: "1px solid rgba(20,184,166,0.15)" }}>
                ✦ Actual spend is calculated automatically from Cost Entries — no manual input needed.
              </p>
              <Field label="Description">
                <textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className={inp} style={{ ...inpStyle, resize: "none" }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              {formError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: "#1a1f2e", color: "#94a3b8", border: "1px solid #2a3347" }}>Cancel</button>
                <button type="submit" disabled={formSaving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: formSaving ? "#92400e" : "#f59e0b", color: "#0d1117", cursor: formSaving ? "not-allowed" : "pointer" }}>
                  {formSaving ? "Saving…" : formMode === "add" ? "Add Project" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ARCHIVE CONFIRMATION ── */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#161b27", border: "1px solid #2a3347" }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#e2e8f0" }}>Archive Project?</h2>
            <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{archiveTarget.name}</span> will be removed from active projects and budget summaries. Cost entries are preserved. You can restore it at any time.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setArchiveTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "#1a1f2e", color: "#94a3b8", border: "1px solid #2a3347" }}>Cancel</button>
              <button onClick={handleArchive} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#1e2433", color: "#94a3b8", border: "1px solid #4b5563" }}>
                {actionLoading ? "Archiving…" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMANENT DELETE CONFIRMATION ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#161b27", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h2 className="text-lg font-semibold" style={{ color: "#ef4444" }}>Permanent Delete</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
              This will <strong style={{ color: "#ef4444" }}>permanently delete</strong>{" "}
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{deleteTarget.name}</span> and all its cost entries. Cannot be undone. Type the project name to confirm.
            </p>
            <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={deleteTarget.name} className={inp + " mb-4"}
              style={{ ...inpStyle, border: "1px solid rgba(239,68,68,0.3)" }} />
            <div className="flex gap-3">
              <button onClick={() => { setDeleteTarget(null); setDeleteConfirm(""); }} className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "#1a1f2e", color: "#94a3b8", border: "1px solid #2a3347" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteConfirm !== deleteTarget.name || actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: deleteConfirm === deleteTarget.name ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.12)",
                  color: deleteConfirm === deleteTarget.name ? "#fff" : "#ef4444",
                  cursor: deleteConfirm !== deleteTarget.name ? "not-allowed" : "pointer",
                }}>
                {actionLoading ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
