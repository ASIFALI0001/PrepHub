"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthShell, { AuthError, AuthSubmit } from "@/components/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your account"
      subtitle="Free forever tier — no credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary-dark transition-colors font-medium">
            Sign in
          </Link>
        </>
      }
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-muted block mb-1.5">Full name</label>
          <div className="input-wrap">
            <span className="input-icon"><User className="w-4 h-4" /></span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Alex Kumar"
              className="input-inner"
            />
          </div>
        </div>

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
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters"
              className="input-inner"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="input-action">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AuthSubmit loading={loading} idle="Create account" busy="Creating account…" />
      </form>
    </AuthShell>
  );
}
