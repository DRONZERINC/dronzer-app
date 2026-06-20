"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { sites, aiChatCannedResponses } from "@/lib/mockData";
import { getEmployeeByEmail, type Employee } from "@/lib/supabase/employees";

function getCannedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("leave") || lower.includes("vacation") || lower.includes("holiday"))
    return aiChatCannedResponses.leave;
  if (lower.includes("salary") || lower.includes("pay") || lower.includes("payslip"))
    return aiChatCannedResponses.salary;
  if (lower.includes("task") || lower.includes("work") || lower.includes("today"))
    return aiChatCannedResponses.tasks;
  if (lower.includes("site") || lower.includes("location") || lower.includes("where"))
    return aiChatCannedResponses.site;
  return aiChatCannedResponses.default;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function nextPayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: aiChatCannedResponses.default },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setRecordLoading(false);
      return;
    }
    getEmployeeByEmail(user.email)
      .then(setEmployee)
      .catch(() => setEmployee(null))
      .finally(() => setRecordLoading(false));
  }, [user?.email]);

  const site = sites.find((s) => s.id === employee?.site);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const firstName = (employee?.name || user?.name || "there").split(" ")[0];

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setMessages((prev) => [...prev, { role: "assistant", text: getCannedResponse(userMsg) }]);
    setChatLoading(false);
  };

  return (
    <AppShell requiredRole="employee">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm mb-1" style={{ color: "#64748b" }}>
            {greeting}
            {site && (
              <>
                {" "}
                ·{" "}
                <span style={{ color: "#14b8a6" }}>
                  {site.flag} {site.name}, {site.country}
                </span>
              </>
            )}
          </p>
          <h1 className="text-3xl font-bold" style={{ color: "#e2e8f0" }}>
            Hi {firstName}, what do you need today?
          </h1>
          {employee && (
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              {employee.job_title} · {employee.department}
            </p>
          )}
        </div>

        {!recordLoading && !employee ? (
          <div
            className="rounded-xl p-8 text-center mb-6"
            style={{ background: "#161b27", border: "1px solid #2a3347" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 mx-auto"
              style={{ background: "#1e2433", border: "1px solid #2a3347" }}
            >
              👤
            </div>
            <h2 className="text-base font-semibold mb-1.5" style={{ color: "#e2e8f0" }}>
              No employee profile linked yet
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "#64748b" }}>
              We couldn&apos;t find an employee record matching {user?.email}. Ask your admin to add
              you to Workforce and your dashboard will populate automatically.
            </p>
          </div>
        ) : (
          <>
            {/* Top cards row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Tasks card */}
              <div
                className="rounded-xl p-4 col-span-1"
                style={{ background: "#161b27", border: "1px solid #2a3347" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
                    Today&apos;s Tasks
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(100,116,139,0.15)", color: "#94a3b8" }}
                  >
                    0 open
                  </span>
                </div>
                <p className="text-sm text-center py-6" style={{ color: "#4b5563" }}>
                  No tasks assigned yet
                </p>
              </div>

              {/* Salary card */}
              <div
                className="rounded-xl p-4"
                style={{ background: "#161b27", border: "1px solid #2a3347" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
                  Next Salary
                </span>
                <div className="mt-3">
                  <p className="text-3xl font-bold" style={{ color: "#f59e0b" }}>
                    {nextPayDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
                    {nextPayDate().getFullYear()}
                  </p>
                  <div className="mt-4 pt-3" style={{ borderTop: "1px solid #2a3347" }}>
                    <p className="text-xs" style={{ color: "#64748b" }}>
                      Gross monthly
                    </p>
                    <p className="text-lg font-semibold mt-0.5" style={{ color: "#e2e8f0" }}>
                      {employee?.salary != null ? `$${employee.salary.toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave balance card */}
              <div
                className="rounded-xl p-4"
                style={{ background: "#161b27", border: "1px solid #2a3347" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
                  Leave Balance
                </span>
                <p className="text-sm text-center py-8" style={{ color: "#4b5563" }}>
                  Leave tracking isn&apos;t set up yet
                </p>
              </div>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              {["Apply for leave", "View payslip", "Update task status", "Check site contacts"].map((s) => (
                <button
                  key={s}
                  onClick={() => setChatInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-all"
                  style={{
                    background: "#1e2433",
                    border: "1px solid #2a3347",
                    color: "#94a3b8",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#f59e0b";
                    (e.currentTarget as HTMLElement).style.color = "#f59e0b";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#2a3347";
                    (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* AI Chat */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#161b27", border: "1px solid #2a3347" }}
        >
          <div className="px-5 py-3 flex items-center gap-2.5" style={{ borderBottom: "1px solid #2a3347" }}>
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
              style={{ background: "rgba(20,184,166,0.2)", color: "#14b8a6" }}
            >
              ✦
            </div>
            <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
              Dronzer AI Assistant
            </span>
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(20,184,166,0.12)", color: "#2dd4bf" }}
            >
              Online
            </span>
            <span className="text-xs" style={{ color: "#4b5563" }}>
              AI API integration coming in Phase 2
            </span>
          </div>

          {/* Messages */}
          <div className="h-48 overflow-y-auto px-5 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm"
                  style={
                    msg.role === "user"
                      ? { background: "rgba(245,158,11,0.15)", color: "#fde68a" }
                      : { background: "#1e2433", color: "#e2e8f0", border: "1px solid #2a3347" }
                  }
                >
                  {msg.text.split("**").map((part, j) =>
                    j % 2 === 1 ? (
                      <strong key={j} style={{ color: "#f59e0b" }}>
                        {part}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-xl px-4 py-2.5 text-sm flex gap-1"
                  style={{ background: "#1e2433", border: "1px solid #2a3347" }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        background: "#14b8a6",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleChat}
            className="flex gap-2 px-5 py-3"
            style={{ borderTop: "1px solid #2a3347" }}
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about leave, payroll, tasks, or your site…"
              className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                background: "#1a1f2e",
                border: "1px solid #2a3347",
                color: "#e2e8f0",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#14b8a6")}
              onBlur={(e) => (e.target.style.borderColor = "#2a3347")}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: "#14b8a6", color: "#0d1117" }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
