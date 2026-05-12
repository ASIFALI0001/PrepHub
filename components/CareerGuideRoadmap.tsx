"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Printer, ArrowLeft, CheckCircle2, GraduationCap, Target,
  Award, Loader2, Sparkles, TrendingUp, MapPin, Clock,
  ChevronRight, Star, Zap,
} from "lucide-react";
import type { IRoadmap, ICareerPath } from "@/models/CareerGuide";

interface GuideData {
  roadmap: IRoadmap;
  careerOptions: ICareerPath[];
  githubUsername: string;
}

const phaseConfig = [
  { accent: "#6366f1", light: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", label: "Phase 1" },
  { accent: "#06b6d4", light: "rgba(6,182,212,0.08)",  border: "rgba(6,182,212,0.25)",  label: "Phase 2" },
  { accent: "#8b5cf6", light: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)", label: "Phase 3" },
  { accent: "#10b981", light: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", label: "Phase 4" },
];

const scoreColor = (s: number) =>
  s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#6b7280";

export default function CareerGuideRoadmap() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    const id = searchParams.get("id");
    fetch("/api/career-guide", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const guides: Array<{ _id: string; roadmap?: IRoadmap; careerOptions: ICareerPath[]; githubUsername: string }> = d.guides ?? [];
        const guide = id ? guides.find((g) => g._id === id) : guides.find((g) => g.roadmap);
        if (guide?.roadmap) {
          setData({ roadmap: guide.roadmap, careerOptions: guide.careerOptions, githubUsername: guide.githubUsername });
        } else {
          router.push("/career-guide");
        }
      })
      .catch(() => router.push("/career-guide"))
      .finally(() => setLoading(false));
  }, [router, searchParams]);

  if (loading) {
    return (
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" /><div className="mesh-gradient fixed inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-text-muted text-sm">Loading your roadmap…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;
  const { roadmap, careerOptions } = data;
  const chosen = careerOptions.find((o) => o.path === roadmap.chosenPath);

  return (
    <>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-page { padding: 0 !important; margin: 0 !important; }
          .phase-card { break-inside: avoid; }
        }
      `}</style>

      <main className="pt-20 pb-20 px-4 sm:px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Top nav */}
          <div className="flex items-center justify-between mb-8 no-print">
            <button onClick={() => router.push("/career-guide")}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Career Guide
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold glass border border-bg-border rounded-xl hover:border-primary/50 hover:text-primary transition-all text-text-muted">
              <Printer className="w-4 h-4" /> Export PDF
            </button>
          </div>

          {/* ── HERO HEADER ─────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-bg-card to-accent-cyan/10 p-8 sm:p-10">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-accent-cyan/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                    <Sparkles className="w-3 h-3" /> AI Career Report
                  </span>
                  <span className="text-xs text-text-muted">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-text mb-2 leading-tight">{roadmap.chosenPath}</h1>
                <p className="text-lg text-text-muted mb-6">
                  Specialization: <span className="font-bold text-text">{roadmap.specialization}</span>
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Match Score", value: `${chosen?.score ?? "—"}%`, icon: TrendingUp, color: scoreColor(chosen?.score ?? 0) },
                    { label: "Timeline", value: "24 Months", icon: Clock, color: "#6366f1" },
                    { label: "Phases", value: `${roadmap.phases.length} Phases`, icon: MapPin, color: "#06b6d4" },
                    { label: "Key Skills", value: `${roadmap.keySkills?.length ?? 0} Skills`, icon: Zap, color: "#10b981" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="glass rounded-2xl border border-bg-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-4 h-4" style={{ color }} />
                        <span className="text-xs text-text-muted font-medium">{label}</span>
                      </div>
                      <p className="text-xl font-black text-text">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Why this path */}
                {chosen && (
                  <div className="mt-6 p-4 rounded-2xl bg-bg-card/60 border border-bg-border">
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Why this path was recommended</p>
                    <p className="text-sm text-text leading-relaxed">{chosen.reasoning}</p>
                    {chosen.pros?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {chosen.pros.map((p) => (
                          <span key={p} className="flex items-center gap-1 text-xs text-accent-green bg-accent-green/10 border border-accent-green/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />{p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* ── KEY SKILLS ──────────────────────────────────────────── */}
            {roadmap.keySkills?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass-card rounded-2xl border border-bg-border p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-accent-orange/10 flex items-center justify-center">
                    <Target className="w-4 h-4 text-accent-orange" />
                  </div>
                  <h2 className="text-sm font-bold text-text">Key Skills to Build</h2>
                </div>
                <div className="space-y-2.5">
                  {roadmap.keySkills.map((skill, i) => (
                    <div key={skill} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-accent-orange/60 w-4">{i + 1}</span>
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-orange/5 border border-accent-orange/15">
                        <Star className="w-3 h-3 text-accent-orange shrink-0" />
                        <span className="text-sm font-medium text-text">{skill}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── COLLEGE TARGETS ─────────────────────────────────────── */}
            {roadmap.collegeTargets ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="glass-card rounded-2xl border border-bg-border p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <h2 className="text-sm font-bold text-text">College Targets</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Reach", desc: "Dream schools", colleges: roadmap.collegeTargets.reach, accent: "#f59e0b", bg: "bg-amber-500/8", border: "border-amber-500/20", dot: "bg-amber-400" },
                    { label: "Match", desc: "Strong fit",   colleges: roadmap.collegeTargets.match, accent: "#10b981", bg: "bg-emerald-500/8", border: "border-emerald-500/20", dot: "bg-emerald-400" },
                    { label: "Safe",  desc: "High chance",  colleges: roadmap.collegeTargets.safe,  accent: "#6366f1", bg: "bg-indigo-500/8",  border: "border-indigo-500/20",  dot: "bg-indigo-400" },
                  ].map(({ label, desc, colleges, accent, bg, border, dot }) => (
                    <div key={label} className={`rounded-2xl ${bg} border ${border} p-4`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-2 h-2 rounded-full ${dot}`} />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{label}</p>
                          <p className="text-xs text-text-muted">{desc}</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {colleges.map((c) => (
                          <li key={c} className="flex items-start gap-2 text-sm text-text">
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: accent }} />{c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              /* If no college targets, make skills full width */
              <div className="lg:col-span-2" />
            )}
          </div>

          {/* ── TIMELINE ROADMAP ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text">24-Month Roadmap</h2>
                <p className="text-xs text-text-muted">Phase-by-phase action plan tailored to your profile</p>
              </div>
            </div>

            {/* Phase tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 no-print">
              {roadmap.phases.map((phase, i) => {
                const c = phaseConfig[i % phaseConfig.length];
                return (
                  <button key={i} onClick={() => setActivePhase(i)}
                    className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                    style={activePhase === i
                      ? { background: c.light, borderColor: c.border, color: c.accent }
                      : { background: "transparent", borderColor: "var(--border)", color: "var(--text-muted)" }
                    }>
                    {phase.label}
                  </button>
                );
              })}
            </div>

            {/* Active phase detail */}
            {roadmap.phases.map((phase, i) => {
              const c = phaseConfig[i % phaseConfig.length];
              return (
                <div key={i} className={`phase-card ${i === activePhase ? "block" : "hidden"} print:block`}>
                  <div className="rounded-3xl border p-6 sm:p-8 mb-4 print:mb-6"
                    style={{ background: c.light, borderColor: c.border }}>

                    {/* Phase header */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.accent }} />
                          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: c.accent }}>{phase.label}</span>
                        </div>
                        <h3 className="text-xl font-black text-text">{phase.title}</h3>
                      </div>
                      {phase.exams && phase.exams.length > 0 && (
                        <div className="shrink-0 flex flex-wrap gap-2 justify-end">
                          {phase.exams.map((e) => (
                            <span key={e} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full glass border border-bg-border text-text">
                              <Award className="w-3 h-3" style={{ color: c.accent }} />{e}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Goals */}
                      {phase.goals?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Goals</p>
                          <div className="space-y-2.5">
                            {phase.goals.map((g) => (
                              <div key={g} className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ background: `${c.accent}20` }}>
                                  <CheckCircle2 className="w-3 h-3" style={{ color: c.accent }} />
                                </div>
                                <p className="text-sm text-text leading-relaxed">{g}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Items */}
                      {phase.actions?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Action Items</p>
                          <div className="space-y-2.5">
                            {phase.actions.map((a, ai) => (
                              <div key={ai} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                                  style={{ background: `${c.accent}20`, color: c.accent }}>
                                  {ai + 1}
                                </span>
                                <p className="text-sm text-text leading-relaxed">{a}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phase navigation (no-print) */}
                  <div className="flex items-center justify-between no-print">
                    <button onClick={() => setActivePhase(Math.max(0, i - 1))}
                      disabled={i === 0}
                      className="text-sm text-text-muted hover:text-text disabled:opacity-30 transition-colors flex items-center gap-1">
                      ← Previous phase
                    </button>
                    <div className="flex gap-1.5">
                      {roadmap.phases.map((_, pi) => (
                        <button key={pi} onClick={() => setActivePhase(pi)}
                          className="w-2 h-2 rounded-full transition-all"
                          style={{ background: pi === activePhase ? phaseConfig[pi % phaseConfig.length].accent : "var(--border)" }} />
                      ))}
                    </div>
                    <button onClick={() => setActivePhase(Math.min(roadmap.phases.length - 1, i + 1))}
                      disabled={i === roadmap.phases.length - 1}
                      className="text-sm text-text-muted hover:text-text disabled:opacity-30 transition-colors flex items-center gap-1">
                      Next phase →
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* ── PRINT FOOTER ────────────────────────────────────────────── */}
          <div className="hidden print:block text-center text-xs text-text-muted pt-6 border-t border-bg-border mt-8">
            <p className="font-semibold text-text mb-1">PrepHub Career Guide</p>
            <p>Generated on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} · Powered by Gemini AI</p>
          </div>

          {/* ── BOTTOM ACTIONS ────────────────────────────────────────── */}
          <div className="no-print mt-8 flex flex-col sm:flex-row gap-3">
            <button onClick={() => router.push("/career-guide/new")}
              className="flex-1 py-3 text-sm font-semibold glass border border-bg-border rounded-2xl hover:border-primary/40 hover:text-primary transition-all text-text-muted text-center">
              Redo assessment
            </button>
            <button onClick={() => window.print()}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl">
              <Printer className="w-4 h-4" /> Export as PDF
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
