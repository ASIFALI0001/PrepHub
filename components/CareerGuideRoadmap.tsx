"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, Loader2, CheckCircle2, GraduationCap, Zap, ChevronRight } from "lucide-react";
import type { IRoadmap, ICareerPath } from "@/models/CareerGuide";

interface GuideData { roadmap: IRoadmap; careerOptions: ICareerPath[]; }

const PHASE_COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#10b981"];

function ScoreRing({ score }: { score: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#6b7280";
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
        strokeLinecap="round" transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x="70" y="65" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="26" fontWeight="900">{score}%</text>
      <text x="70" y="84" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="600">MATCH</text>
    </svg>
  );
}

export default function CareerGuideRoadmap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get("id");
    fetch("/api/career-guide", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        const guides: Array<{ _id: string; roadmap?: IRoadmap; careerOptions: ICareerPath[] }> = d.guides ?? [];
        const guide = id ? guides.find(g => g._id === id) : guides.find(g => g.roadmap);
        if (guide?.roadmap) setData({ roadmap: guide.roadmap, careerOptions: guide.careerOptions });
        else router.push("/career-guide");
      })
      .catch(() => router.push("/career-guide"))
      .finally(() => setLoading(false));
  }, [router, searchParams]);

  if (loading) return (
    <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
      <div className="noise-overlay" /><div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
      </div>
    </main>
  );

  if (!data) return null;
  const { roadmap, careerOptions } = data;
  const chosen = careerOptions.find(o => o.path === roadmap.chosenPath);

  return (
    <>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          main { padding-top: 0 !important; background: white !important; }
          .print-section { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <main className="pt-20 pb-24 px-4 sm:px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" /><div className="mesh-gradient fixed inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto">

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-8 no-print">
            <button onClick={() => router.push("/career-guide")}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl border border-bg-border glass hover:border-primary/50 hover:text-primary transition-all text-text-muted">
              <Printer className="w-4 h-4" /> Export PDF
            </button>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 1 — HERO
          ══════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="print-section mb-6">
            <div className="relative overflow-hidden rounded-3xl" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #042f2e 100%)" }}>
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)", transform: "translate(30%, -30%)" }} />
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", transform: "translate(-30%, 30%)" }} />

              <div className="relative p-8 sm:p-10">
                {/* Label */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">PrepHub · AI Career Report</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Main content */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                  {chosen && <ScoreRing score={chosen.score} />}

                  <div className="flex-1">
                    <p className="text-white/50 text-sm font-semibold uppercase tracking-widest mb-2">Recommended Path</p>
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-1 leading-tight">{roadmap.chosenPath}</h1>
                    <p className="text-white/60 text-base mb-5">
                      Specialization: <span className="text-white font-semibold">{roadmap.specialization}</span>
                    </p>

                    {/* Quick stats */}
                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: "Timeline", val: "24 Months" },
                        { label: "Phases", val: `${roadmap.phases.length} Phases` },
                        { label: "Key Skills", val: `${roadmap.keySkills?.length ?? 0} to Build` },
                      ].map(({ label, val }) => (
                        <div key={label} className="px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <span className="text-white/50 text-xs">{label} · </span>
                          <span className="text-white font-bold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                {chosen?.reasoning && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Why this path</p>
                    <p className="text-white/75 text-sm leading-relaxed">{chosen.reasoning}</p>

                    {chosen.pros?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {chosen.pros.map(p => (
                          <span key={p} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
                            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }}>
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

          {/* ══════════════════════════════════════════
              SECTION 2 — SKILLS + COLLEGES
          ══════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="print-section grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

            {/* Key Skills */}
            {roadmap.keySkills?.length > 0 && (
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <h2 className="text-sm font-bold text-text">Skills to Build</h2>
                </div>
                <div className="p-4 space-y-2">
                  {roadmap.keySkills.map((skill, i) => (
                    <div key={skill} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-card transition-colors group">
                      <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                        style={{ background: `${PHASE_COLORS[i % PHASE_COLORS.length]}20`, color: PHASE_COLORS[i % PHASE_COLORS.length] }}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-text flex-1">{skill}</span>
                      <div className="w-16 h-1.5 rounded-full bg-bg-border overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${100 - i * 10}%`, background: PHASE_COLORS[i % PHASE_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* College Targets */}
            {roadmap.collegeTargets && (
              <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                <div className="px-6 py-4 border-b border-bg-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-accent-cyan" />
                  </div>
                  <h2 className="text-sm font-bold text-text">College Targets</h2>
                </div>
                <div className="p-4 space-y-4">
                  {[
                    { tier: "Reach", emoji: "🎯", colleges: roadmap.collegeTargets.reach, color: "#f59e0b" },
                    { tier: "Match", emoji: "✅", colleges: roadmap.collegeTargets.match, color: "#10b981" },
                    { tier: "Safe",  emoji: "🛡️", colleges: roadmap.collegeTargets.safe,  color: "#6366f1" },
                  ].map(({ tier, emoji, colleges, color }) => (
                    <div key={tier}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs">{emoji}</span>
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{tier}</span>
                        <div className="h-px flex-1 bg-bg-border" />
                      </div>
                      <div className="space-y-1 pl-5">
                        {colleges.map(c => (
                          <div key={c} className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 shrink-0" style={{ color }} />
                            <span className="text-sm text-text">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* ══════════════════════════════════════════
              SECTION 3 — TIMELINE ROADMAP
          ══════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="print-section mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-bg-border" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted px-3">24-Month Action Plan</span>
              <div className="h-px flex-1 bg-bg-border" />
            </div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-primary/60 via-accent-cyan/40 to-accent-green/30 hidden sm:block" />

              <div className="space-y-5">
                {roadmap.phases.map((phase, i) => {
                  const color = PHASE_COLORS[i % PHASE_COLORS.length];
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.1 }}
                      className="print-section relative sm:pl-16">

                      {/* Timeline dot */}
                      <div className="absolute left-0 top-6 hidden sm:flex w-12 h-12 rounded-full items-center justify-center text-sm font-black text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, boxShadow: `0 0 20px ${color}40` }}>
                        {i + 1}
                      </div>

                      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}30` }}>
                        {/* Phase header */}
                        <div className="px-6 py-4 flex items-center justify-between gap-4"
                          style={{ background: `linear-gradient(90deg, ${color}12, transparent)`, borderBottom: `1px solid ${color}20` }}>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: `${color}cc` }}>{phase.label}</p>
                            <h3 className="text-base font-bold text-text">{phase.title}</h3>
                          </div>
                          {phase.exams && phase.exams.length > 0 && (
                            <div className="flex flex-wrap gap-2 justify-end">
                              {phase.exams.map(e => (
                                <span key={e} className="text-xs font-semibold px-3 py-1.5 rounded-full glass border border-bg-border text-text">
                                  🎓 {e}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Phase body */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-bg-card/30">
                          {/* Goals */}
                          {phase.goals?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-bg-border inline-block" /> Goals
                              </p>
                              <ul className="space-y-2.5">
                                {phase.goals.map(g => (
                                  <li key={g} className="flex items-start gap-2.5">
                                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                                      style={{ borderColor: color }}>
                                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                    </div>
                                    <p className="text-sm text-text leading-relaxed">{g}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Actions */}
                          {phase.actions?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                                <span className="w-4 h-px bg-bg-border inline-block" /> Action Items
                              </p>
                              <ol className="space-y-2.5">
                                {phase.actions.map((a, ai) => (
                                  <li key={ai} className="flex items-start gap-3">
                                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                                      style={{ background: `${color}18`, color }}>
                                      {ai + 1}
                                    </span>
                                    <p className="text-sm text-text leading-relaxed">{a}</p>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Print footer */}
          <div className="hidden print:block text-center pt-6 border-t border-bg-border">
            <p className="text-xs text-text-muted">Generated by <strong>PrepHub Career Guide</strong> · Powered by Gemini AI · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>

          {/* Action buttons */}
          <div className="no-print flex flex-col sm:flex-row gap-3">
            <button onClick={() => router.push("/career-guide/new")}
              className="flex-1 py-3.5 text-sm font-semibold glass border border-bg-border rounded-2xl hover:border-primary/40 hover:text-primary transition-all text-text-muted">
              Redo assessment
            </button>
            <button onClick={() => window.print()}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold">
              <Printer className="w-4 h-4" /> Export as PDF
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
