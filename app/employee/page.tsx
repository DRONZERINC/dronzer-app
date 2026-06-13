"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { currentEmployee, tasks, sites, aiChatCannedResponses } from "@/lib/mockData";

const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "rgba(239,68,68,0.12)", text: "#f87171", label: "High" },
  medium: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", label: "Medium" },
  low: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", label: "Low" },
};

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", label: "Pending" },
  in_progress: { bg: "rgba(20,184,166,0.12)", text: "#2dd4bf", label: "In Progress" },
  done: { bg: "rgba(34,197,94,0.12)", text: "#4ade80", label: "Done" },
};

const todayTasks = tasks.filter((t) => t.due === "Today");

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

export default function EmployeeDashboard() {
  const emp = currentEmployee;
  const site = sites.find((s) => s.id === emp.site);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: aiChatCannedResponses.default },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

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
            {greeting} ·{" "}
            <span style={{ color: "#14b8a6" }}>
              {site?.flag} {site?.name}, {site?.country}
            </span>
          </p>
          <h1 className="text-3xl font-bold" style={{ color: "#e2e8f0" }}>
            Hi {emp.name.split(" ")[0]}, what do you need today?
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {emp.role} · {emp.department}
          </p>
        </div>

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
                style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
              >
                {todayTasks.filter((t) => t.status !== "done").length} open
              </span>
            </div>
            <div className="space-y-2">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2.5 py-1.5"
                  style={{ borderBottom: "1px solid #1f2937" }}
                >
                  <span
                    className="mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center text-xs"
                    style={{
                      background:
                        task.status === "in_progress"
                          ? "rgba(20,184,166,0.2)"
                          : "rgba(100,116,139,0.15)",
                      color: task.status === "in_progress" ? "#2dd4bf" : "#64748b",
                    }}
                  >
                    {task.status === "in_progress" ? "▶" : "○"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs leading-snug" style={{ color: "#e2e8f0" }}>
                      {task.title}
                    </p>
                    <span
                      className="inline-block text-[10px] px-1.5 py-0.5 rounded mt-1"
                      style={{
                        background: priorityColors[task.priority].bg,
                        color: priorityColors[task.priority].text,
                      }}
                    >
                      {priorityColors[task.priority].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                Jul 1
              </p>
              <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
                2026
              </p>
              <div
                className="mt-4 pt-3"
                style={{ borderTop: "1px solid #2a3347" }}
              >
                <p className="text-xs" style={{ color: "#64748b" }}>
                  Gross monthly
                </p>
                <p className="text-lg font-semibold mt-0.5" style={{ color: "#e2e8f0" }}>
                  ${emp.salary.toLocaleString()}
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
            <div className="mt-3 space-y-4">
              {/* Annual */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    Annual Leave
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                    {emp.leaveBalance.annual}
                    <span className="text-xs font-normal" style={{ color: "#64748b" }}>
                      /{emp.leaveBalance.annualTotal} days
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#2a3347" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(emp.leaveBalance.annual / emp.leaveBalance.annualTotal) * 100}%`,
                      background: "#14b8a6",
                    }}
                  />
                </div>
              </div>
              {/* Sick */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    Sick Leave
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>
                    {emp.leaveBalance.sickTotal - emp.leaveBalance.sick}
                    <span className="text-xs font-normal" style={{ color: "#64748b" }}>
                      /{emp.leaveBalance.sickTotal} days
                    </span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "#2a3347" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${((emp.leaveBalance.sickTotal - emp.leaveBalance.sick) / emp.leaveBalance.sickTotal) * 100}%`,
                      background: "#818cf8",
                    }}
                  />
                </div>
              </div>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Leave year resets Jan 1, 2027
              </p>
            </div>
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
