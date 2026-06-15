"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("employee");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { login, signup, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.role === "admin" ? "/admin" : "/employee");
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (mode === "signup") {
      const { error: err } = await signup(email, password, role);
      if (err) {
        setError(err);
      } else {
        setMessage("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } else {
      const { error: err } = await login(email, password);
      if (err) {
        setError(err);
      }
      // On success, onAuthStateChange updates user → useEffect above handles redirect
    }

    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #0d1117 0%, #111827 60%, #0d1117 100%)" }}
    >
      {/* Background decorative rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-5"
          style={{ border: "1px solid #f59e0b" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
          style={{ border: "1px solid #14b8a6" }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight" style={{ color: "#f59e0b" }}>
            Dronzer
          </h1>
          <p className="mt-2 text-sm tracking-widest uppercase" style={{ color: "#64748b" }}>
            Workforce Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 shadow-2xl"
          style={{ background: "#161b27", border: "1px solid #2a3347" }}
        >
          <h2 className="text-xl font-semibold mb-1" style={{ color: "#e2e8f0" }}>
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h2>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>
            Gulf Pioneer Petroleum Contractors
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
                style={{ color: "#94a3b8" }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gppc.com"
                required
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "#1a1f2e",
                  border: "1px solid #2a3347",
                  color: "#e2e8f0",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                onBlur={(e) => (e.target.style.borderColor = "#2a3347")}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
                style={{ color: "#94a3b8" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "#1a1f2e",
                  border: "1px solid #2a3347",
                  color: "#e2e8f0",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#f59e0b")}
                onBlur={(e) => (e.target.style.borderColor = "#2a3347")}
              />
            </div>

            {/* Role Selector */}
            <div>
              <label
                className="block text-xs font-medium mb-2 tracking-wide uppercase"
                style={{ color: "#94a3b8" }}
              >
                {mode === "signup" ? "Sign up as" : "Sign in as"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["employee", "admin"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="relative rounded-xl py-4 flex flex-col items-center gap-1.5 transition-all cursor-pointer"
                    style={{
                      background: role === r ? "rgba(245,158,11,0.12)" : "#1a1f2e",
                      border: `2px solid ${role === r ? "#f59e0b" : "#2a3347"}`,
                      color: role === r ? "#f59e0b" : "#94a3b8",
                    }}
                  >
                    <span className="text-2xl">{r === "employee" ? "👤" : "🏢"}</span>
                    <span className="text-sm font-medium capitalize">{r}</span>
                    {role === r && (
                      <span
                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                        style={{ background: "#f59e0b" }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-xs"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {error}
              </div>
            )}

            {/* Success message */}
            {message && (
              <div
                className="rounded-lg px-4 py-3 text-xs"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-sm font-semibold transition-all mt-2"
              style={{
                background: loading ? "#92400e" : "#f59e0b",
                color: "#0d1117",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {mode === "signin" ? "Signing in…" : "Creating account…"}
                </span>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Mode toggle */}
          <p className="mt-5 text-center text-xs" style={{ color: "#64748b" }}>
            {mode === "signin" ? "New to Dronzer?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setMessage(""); }}
              className="font-medium transition-colors"
              style={{ color: "#f59e0b" }}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: "#374151" }}>
          © 2026 Gulf Pioneer Petroleum Contractors · Powered by Dronzer
        </p>
      </div>
    </div>
  );
}
