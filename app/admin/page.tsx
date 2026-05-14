"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield, Users, FileText, MessageSquare, Star, ChevronDown, ChevronUp,
  Flame, BarChart3, Trophy, LogOut, Loader2, Brain,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface AdminUser {
  _id: string; name: string; email: string; streak: number;
  lastActive: string; createdAt: string;
  profile: { semester?: string; college?: string; branch?: string };
  quizAccuracy: number | null; quizTopics: number;
  interviewCount: number; interviewAvgScore: number | null; interviewGrade: string | null;
}

interface AdminResume {
  _id: string; score: number; roleType: string; skills: string[];
  preview: string; createdAt: string;
}

interface AdminFeedback {
  _id: string; userName: string; userEmail: string;
  ratings: Record<string, number>; text: string; createdAt: string;
}

interface FeedbackAvgs { [feature: string]: number | null }

const FEATURE_LABELS: Record<string, string> = {
  learn: "Learn", quiz: "Quiz", interview: "Interview",
  companyBrain: "Company Brain", ats: "ATS Checker", careerGuide: "Career Guide",
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-bg-border"}`} />
      ))}
    </div>
  );
}

type Tab = "users" | "resumes" | "feedback";

// ─── Component ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [tab,            setTab]       = useState<Tab>("users");
  const [users,          setUsers]     = useState<AdminUser[]>([]);
  const [resumes,        setResumes]   = useState<AdminResume[]>([]);
  const [feedbacks,      setFeedbacks] = useState<AdminFeedback[]>([]);
  const [fbAvgs,         setFbAvgs]    = useState<FeedbackAvgs>({});
  const [loading,        setLoading]   = useState(true);
  const [expandedUser,   setExpandedUser]   = useState<string | null>(null);
  const [expandedResume, setExpandedResume] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { router.replace("/admin/login"); return; }

    const headers = { "x-admin-token": token };

    Promise.all([
      fetch("/api/admin/users",       { headers }).then(r => r.json()),
      fetch("/api/admin/top-resumes", { headers }).then(r => r.json()),
      fetch("/api/admin/feedback",    { headers }).then(r => r.json()),
    ]).then(([u, r, f]) => {
      if (u.error) { router.replace("/admin/login"); return; }
      setUsers(u.users ?? []);
      setResumes(r.resumes ?? []);
      setFeedbacks(f.feedbacks ?? []);
      setFbAvgs(f.averages ?? {});
    }).catch(() => router.replace("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    sessionStorage.removeItem("admin_token");
    router.replace("/admin/login");
  }

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="border-b border-bg-border bg-bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-base font-bold text-text">PrepHub Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {(["users", "resumes", "feedback"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-primary text-white" : "text-text-muted hover:text-text"}`}>
                  {t === "users" ? `Users (${users.length})` : t === "resumes" ? `Top Resumes (${resumes.length})` : `Feedback (${feedbacks.length})`}
                </button>
              ))}
            </div>
            <button onClick={logout} className="flex items-center gap-2 text-sm text-text-muted hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Users", value: users.length, icon: Users, color: "text-primary" },
                { label: "Avg Streak", value: users.length ? Math.round(users.reduce((s, u) => s + u.streak, 0) / users.length) + "d" : "—", icon: Flame, color: "text-accent-orange" },
                { label: "Avg Quiz Accuracy", value: (() => { const r = users.filter(u => u.quizAccuracy !== null); return r.length ? Math.round(r.reduce((s, u) => s + (u.quizAccuracy ?? 0), 0) / r.length) + "%" : "—"; })(), icon: BarChart3, color: "text-accent-green" },
                { label: "Total Interviews", value: users.reduce((s, u) => s + u.interviewCount, 0), icon: Trophy, color: "text-accent-cyan" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass-card rounded-2xl border border-bg-border p-5">
                  <Icon className={`w-5 h-5 ${color} mb-3`} />
                  <div className="text-2xl font-black text-text">{value}</div>
                  <div className="text-xs text-text-muted mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* User list */}
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u._id} className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                  <button onClick={() => setExpandedUser(expandedUser === u._id ? null : u._id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-bg-card/50 transition-colors">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{u.name}</p>
                      <p className="text-xs text-text-muted truncate">{u.email}</p>
                    </div>
                    {/* Quick stats */}
                    <div className="hidden sm:flex items-center gap-6 shrink-0">
                      <div className="text-center">
                        <p className="text-xs text-text-muted">Streak</p>
                        <p className="text-sm font-bold text-accent-orange">{u.streak}d</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-text-muted">Quiz Acc.</p>
                        <p className="text-sm font-bold text-accent-green">{u.quizAccuracy !== null ? `${u.quizAccuracy}%` : "—"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-text-muted">Interview</p>
                        <p className="text-sm font-bold text-accent-cyan">{u.interviewGrade ?? "—"}</p>
                      </div>
                    </div>
                    {expandedUser === u._id ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
                  </button>

                  {expandedUser === u._id && (
                    <div className="border-t border-bg-border px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-bg-card/30">
                      <div>
                        <p className="text-xs text-text-muted mb-1">College</p>
                        <p className="text-sm text-text">{u.profile?.college || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted mb-1">Branch</p>
                        <p className="text-sm text-text">{u.profile?.branch || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted mb-1">Semester</p>
                        <p className="text-sm text-text">{u.profile?.semester ? `Sem ${u.profile.semester}` : "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted mb-1">Quiz Topics</p>
                        <p className="text-sm text-text">{u.quizTopics} attempted</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted mb-1">Interviews</p>
                        <p className="text-sm text-text">{u.interviewCount} completed · avg {u.interviewAvgScore ?? "—"}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted mb-1">Joined</p>
                        <p className="text-sm text-text">{new Date(u.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-muted mb-1">Last Active</p>
                        <p className="text-sm text-text">{new Date(u.lastActive).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── TOP RESUMES TAB ── */}
        {tab === "resumes" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <Brain className="w-5 h-5 text-accent-green" />
              <div>
                <h2 className="text-lg font-bold text-text">ATS Knowledge Base</h2>
                <p className="text-sm text-text-muted">{resumes.length} high-quality resumes (90+ ATS) stored for RAG</p>
              </div>
            </div>
            <div className="space-y-3">
              {resumes.map((r) => (
                <div key={r._id} className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                  <button onClick={() => setExpandedResume(expandedResume === r._id ? null : r._id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-bg-card/50 transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-accent-green/10 border border-accent-green/20 flex flex-col items-center justify-center shrink-0">
                      <span className="text-lg font-black text-accent-green">{r.score}</span>
                      <span className="text-[9px] text-accent-green/60 uppercase">ATS</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text">{r.roleType}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.skills.slice(0, 5).map(s => (
                          <span key={s} className="text-xs bg-bg-border px-2 py-0.5 rounded text-text-muted">{s}</span>
                        ))}
                        {r.skills.length > 5 && <span className="text-xs text-text-muted">+{r.skills.length - 5}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    {expandedResume === r._id ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />}
                  </button>

                  {expandedResume === r._id && (
                    <div className="border-t border-bg-border p-5 bg-bg-card/30">
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Anonymized content preview</p>
                      <pre className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap bg-bg-card rounded-xl p-4 border border-bg-border max-h-48 overflow-y-auto">
                        {r.preview}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── FEEDBACK TAB ── */}
        {tab === "feedback" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {/* Averages */}
            <div className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h2 className="text-base font-bold text-text">Average Ratings by Feature</h2>
                <span className="text-sm text-text-muted ml-auto">{feedbacks.length} responses</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => {
                  const avg = fbAvgs[key];
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-bg-border">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text">{label}</p>
                        <StarDisplay rating={Math.round(avg ?? 0)} />
                      </div>
                      <div className="text-2xl font-black text-amber-400">
                        {avg !== null ? avg.toFixed(1) : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual feedback */}
            <div className="space-y-4">
              {feedbacks.length === 0 && (
                <div className="text-center py-12 text-text-muted text-sm">No feedback submitted yet.</div>
              )}
              {feedbacks.map((fb) => (
                <div key={fb._id} className="glass-card rounded-2xl border border-bg-border p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {fb.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text">{fb.userName}</p>
                        <p className="text-xs text-text-muted">{fb.userEmail}</p>
                      </div>
                    </div>
                    <p className="text-xs text-text-muted shrink-0">{new Date(fb.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-text-muted">{label}</span>
                        <StarDisplay rating={fb.ratings[key] ?? 0} />
                      </div>
                    ))}
                  </div>

                  {fb.text && (
                    <div className="mt-3 pt-3 border-t border-bg-border">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                        <p className="text-sm text-text-muted italic">"{fb.text}"</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
