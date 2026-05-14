"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { token?: string; error?: string };
      if (data.token) {
        sessionStorage.setItem("admin_token", data.token);
        router.push("/admin");
      } else {
        setError(data.error ?? "Invalid credentials");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
          <p className="text-sm text-text-muted mt-1">PrepHub administration</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/50"
              placeholder="admin@prephub.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/50"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full btn-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
