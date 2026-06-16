"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { sites, departments } from "@/lib/mockData";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  archiveEmployee,
  deleteEmployee,
  type Employee,
  type EmployeeInsert,
} from "@/lib/supabase/employees";

const inp = "w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all";
const inpStyle = { background: "#1a1f2e", border: "1px solid #2a3347", color: "#e2e8f0" };
const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
  (e.target.style.borderColor = "#f59e0b");
const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
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

const siteLabel = (siteId: string | null) => {
  if (!siteId) return "—";
  const s = sites.find((x) => x.id === siteId);
  return s ? `${s.flag} ${s.name}` : siteId;
};

const emptyForm = (): Partial<EmployeeInsert> => ({ status: "active" });

export default function WorkforcePage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
  const [search, setSearch] = useState("");

  // ── Add / Edit modal ──
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState<Partial<EmployeeInsert>>(emptyForm());
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Confirmation modals ──
  const [archiveTarget, setArchiveTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      setEmployees(await getEmployees());
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter((e) => {
    if (filter !== "all" && e.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department ?? "").toLowerCase().includes(q) ||
        (e.site ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = employees.filter((e) => e.status === "active").length;
  const inactiveCount = employees.filter((e) => e.status === "inactive").length;

  function openAdd() {
    setFormMode("add");
    setEditTarget(null);
    setForm(emptyForm());
    setFormError("");
    setFormOpen(true);
  }

  function openEdit(emp: Employee) {
    setFormMode("edit");
    setEditTarget(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      job_title: emp.job_title ?? undefined,
      department: emp.department ?? undefined,
      site: emp.site ?? undefined,
      salary: emp.salary ?? undefined,
      status: emp.status,
      hire_date: emp.hire_date ?? undefined,
    });
    setFormError("");
    setFormOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormSaving(true);
    setFormError("");
    try {
      if (formMode === "add") {
        await createEmployee({
          name: form.name!,
          email: form.email!,
          job_title: form.job_title || null,
          department: form.department || null,
          site: form.site || null,
          salary: form.salary ?? null,
          status: form.status ?? "active",
          hire_date: form.hire_date || null,
          company_id: user?.companyId ?? null,
        });
      } else {
        await updateEmployee(editTarget!.id, {
          name: form.name,
          email: form.email,
          job_title: form.job_title || null,
          department: form.department || null,
          site: form.site || null,
          salary: form.salary ?? null,
          status: form.status,
          hire_date: form.hire_date || null,
        });
      }
      setFormOpen(false);
      await load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setFormSaving(false);
    }
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    setActionLoading(true);
    try {
      await archiveEmployee(archiveTarget.id);
      setArchiveTarget(null);
      await load();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRestore(emp: Employee) {
    try {
      await updateEmployee(emp.id, { status: "active" });
      await load();
    } catch {}
  }

  async function handleDelete() {
    if (!deleteTarget || deleteConfirm !== deleteTarget.name) return;
    setActionLoading(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setDeleteTarget(null);
      setDeleteConfirm("");
      await load();
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "#4b5563" }}>
              Admin
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
              Workforce Management
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {activeCount} active · {inactiveCount} inactive
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: "#f59e0b", color: "#0d1117" }}
          >
            + Add Employee
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, department, site…"
            className={`flex-1 ${inp}`}
            style={inpStyle}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid #2a3347" }}>
            {(["active", "inactive", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-2 text-xs font-medium capitalize transition-all"
                style={{
                  background: filter === f ? "rgba(245,158,11,0.15)" : "#161b27",
                  color: filter === f ? "#f59e0b" : "#64748b",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#161b27", border: "1px solid #2a3347" }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg animate-pulse flex items-center justify-center text-sm font-bold"
                  style={{ background: "#f59e0b", color: "#0d1117" }}
                >
                  D
                </div>
                <p className="text-sm" style={{ color: "#64748b" }}>Loading employees…</p>
              </div>
            </div>
          ) : fetchError ? (
            <div className="p-8 text-center text-sm" style={{ color: "#ef4444" }}>{fetchError}</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm" style={{ color: "#64748b" }}>No employees found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a3347" }}>
                    {["Employee", "Job Title", "Department", "Site", "Salary", "Hired", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                        style={{ color: "#64748b" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr
                      key={emp.id}
                      style={{
                        borderBottom: "1px solid #1e2433",
                        opacity: emp.status === "inactive" ? 0.55 : 1,
                      }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{emp.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{emp.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>{emp.job_title || "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>{emp.department || "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>{siteLabel(emp.site)}</td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: "#e2e8f0" }}>
                        {emp.salary ? `$${emp.salary.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                        {emp.hire_date
                          ? new Date(emp.hire_date).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: emp.status === "active" ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.15)",
                            color: emp.status === "active" ? "#4ade80" : "#94a3b8",
                          }}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openEdit(emp)}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
                          >
                            Edit
                          </button>
                          {emp.status === "active" ? (
                            <button
                              onClick={() => setArchiveTarget(emp)}
                              className="text-xs px-2.5 py-1 rounded-lg"
                              style={{ background: "rgba(100,116,139,0.12)", color: "#94a3b8" }}
                            >
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestore(emp)}
                              className="text-xs px-2.5 py-1 rounded-lg"
                              style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}
                            >
                              Restore
                            </button>
                          )}
                          <button
                            onClick={() => { setDeleteTarget(emp); setDeleteConfirm(""); }}
                            className="text-xs px-2.5 py-1 rounded-lg"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
            style={{ background: "#161b27", border: "1px solid #2a3347" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold" style={{ color: "#e2e8f0" }}>
                {formMode === "add" ? "Add Employee" : "Edit Employee"}
              </h2>
              <button onClick={() => setFormOpen(false)} style={{ color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <Field label="Full Name *">
                <input
                  required
                  value={form.name ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inp}
                  style={inpStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>

              <Field label="Email *">
                <input
                  required
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className={inp}
                  style={inpStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>

              <Field label="Job Title">
                <input
                  value={form.job_title ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, job_title: e.target.value }))}
                  className={inp}
                  style={inpStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>

              <Field label="Department">
                <select
                  value={form.department ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  className={inp}
                  style={inpStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="">— Select —</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>

              <Field label="Site">
                <select
                  value={form.site ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, site: e.target.value }))}
                  className={inp}
                  style={inpStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="">— Select —</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.flag} {s.name}, {s.country}</option>
                  ))}
                </select>
              </Field>

              <Field label="Monthly Salary (USD)">
                <input
                  type="number"
                  min={0}
                  value={form.salary ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, salary: e.target.value ? Number(e.target.value) : undefined }))}
                  className={inp}
                  style={inpStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>

              <Field label="Hire Date">
                <input
                  type="date"
                  value={form.hire_date ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, hire_date: e.target.value }))}
                  className={inp}
                  style={inpStyle}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </Field>

              {formMode === "edit" && (
                <Field label="Status">
                  <select
                    value={form.status ?? "active"}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "active" | "inactive" }))}
                    className={inp}
                    style={inpStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              )}

              {formError && (
                <p
                  className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: "#1a1f2e", color: "#94a3b8", border: "1px solid #2a3347" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: formSaving ? "#92400e" : "#f59e0b",
                    color: "#0d1117",
                    cursor: formSaving ? "not-allowed" : "pointer",
                  }}
                >
                  {formSaving ? "Saving…" : formMode === "add" ? "Add Employee" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ARCHIVE CONFIRMATION ── */}
      {archiveTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#161b27", border: "1px solid #2a3347" }}
          >
            <h2 className="text-lg font-semibold mb-2" style={{ color: "#e2e8f0" }}>Archive Employee?</h2>
            <p className="text-sm mb-5" style={{ color: "#94a3b8" }}>
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{archiveTarget.name}</span> will be marked as
              inactive and removed from active headcount. You can restore them at any time.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setArchiveTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "#1a1f2e", color: "#94a3b8", border: "1px solid #2a3347" }}
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#1e2433", color: "#94a3b8", border: "1px solid #4b5563" }}
              >
                {actionLoading ? "Archiving…" : "Archive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PERMANENT DELETE CONFIRMATION ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#161b27", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚠️</span>
              <h2 className="text-lg font-semibold" style={{ color: "#ef4444" }}>Permanent Delete</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
              This will <strong style={{ color: "#ef4444" }}>permanently delete</strong>{" "}
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{deleteTarget.name}</span> and cannot be undone.
              Type their full name to confirm.
            </p>
            <input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={deleteTarget.name}
              className={inp + " mb-4"}
              style={{ ...inpStyle, border: "1px solid rgba(239,68,68,0.3)" }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirm(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "#1a1f2e", color: "#94a3b8", border: "1px solid #2a3347" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirm !== deleteTarget.name || actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: deleteConfirm === deleteTarget.name ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.12)",
                  color: deleteConfirm === deleteTarget.name ? "#fff" : "#ef4444",
                  cursor: deleteConfirm !== deleteTarget.name ? "not-allowed" : "pointer",
                }}
              >
                {actionLoading ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
