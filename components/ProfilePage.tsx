"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, GraduationCap, BookOpen, Loader2, CheckCircle, Save } from "lucide-react";

const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const BRANCHES = [
  "Computer Science and Engineering",
  "Information Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Aerospace Engineering",
  "Other",
];

interface ProfileData {
  name: string;
  email: string;
  profile: { semester: string; college: string; branch: string };
  createdAt: string;
}

export default function ProfilePage() {
  const [data,     setData]     = useState<ProfileData | null>(null);
  const [semester, setSemester] = useState("");
  const [college,  setCollege]  = useState("");
  const [branch,   setBranch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setData(d.profile);
          setSemester(d.profile.profile?.semester ?? "");
          setCollege(d.profile.profile?.college ?? "");
          setBranch(d.profile.profile?.branch ?? "");
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ semester, college, branch }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setError("Failed to save");
    } catch { setError("Failed to save"); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
      <div className="noise-overlay" /><div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    </main>
  );

  return (
    <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
      <div className="noise-overlay" /><div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Update Profile</h1>
              <p className="text-sm text-text-muted">Keep your academic information up to date</p>
            </div>
          </div>
        </motion.div>

        {/* Account info (read-only) */}
        {data && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl border border-bg-border p-6 mb-5">
            <h2 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-text-muted" /> Account
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Full Name</p>
                <p className="text-sm font-semibold text-text">{data.name}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Email</p>
                <p className="text-sm font-semibold text-text">{data.email}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Member since</p>
                <p className="text-sm text-text">{new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Editable profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <form onSubmit={handleSave} className="glass-card rounded-2xl border border-bg-border p-6 space-y-5">
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-accent-cyan" /> Academic Information
            </h2>

            {/* College */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> College / University
              </label>
              <input
                type="text"
                value={college}
                onChange={e => setCollege(e.target.value)}
                placeholder="e.g. R.V. College of Engineering, Bengaluru"
                className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Branch / Department</label>
              <select value={branch} onChange={e => setBranch(e.target.value)}
                className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors">
                <option value="">Select branch…</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-medium text-text-muted mb-2">Current Semester</label>
              <div className="grid grid-cols-8 gap-2">
                {SEMESTERS.map(s => (
                  <button key={s} type="button" onClick={() => setSemester(s)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${semester === s ? "bg-primary text-white shadow-glow" : "glass border border-bg-border text-text-muted hover:border-primary/40 hover:text-text"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button type="submit" disabled={saving}
              className="w-full btn-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : saved ? (
                <><CheckCircle className="w-4 h-4 text-accent-green" /> Saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Profile</>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
