"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthShell, { AuthError, AuthSubmit } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to PrepHub"
      subtitle="Pick up right where you left off."
      footer={
        <>
          No account?{" "}
          <Link href="/signup" className="text-primary hover:text-primary-dark transition-colors font-medium">
            Create one free
          </Link>
        </>
      }
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-muted block mb-1.5">Email</label>
          <div className="input-wrap">
            <span className="input-icon"><Mail className="w-4 h-4" /></span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@email.com"
              className="input-inner"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-text-muted block mb-1.5">Password</label>
          <div className="input-wrap">
            <span className="input-icon"><Lock className="w-4 h-4" /></span>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="input-inner"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-action">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AuthSubmit loading={loading} idle="Sign in" busy="Signing in…" />
      </form>
    </AuthShell>
  );
}
