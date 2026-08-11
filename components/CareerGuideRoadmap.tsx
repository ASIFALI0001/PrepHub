"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Printer, ArrowLeft, Loader2, CheckCircle2, GraduationCap, Zap, ChevronRight } from "lucide-react";
import type { IRoadmap, ICareerPath } from "@/models/CareerGuide";
import { scoreTheme } from "@/lib/score";
import { easeOutExpo } from "@/lib/motion";

interface GuideData { roadmap: IRoadmap; careerOptions: ICareerPath[]; }

// Timeline phase accents (mid-tones legible on both themes)
const PHASE_COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#10b981"];

const SKILL_PRIORITY = ["Must Have", "Must Have", "Must Have", "Important", "Important", "Good to Have", "Good to Have", "Good to Have"];
const SKILL_PRIORITY_STYLE: Record<string, string> = {
  "Must Have":    "bg-accent-pink/10 text-accent-pink border-accent-pink/20",
  "Important":    "bg-accent-orange/10 text-accent-orange border-accent-orange/20",
  "Good to Have": "bg-accent-green/10 text-accent-green border-accent-green/20",
};

function ScoreRing({ score }: { score: number }) {
  const t = scoreTheme(score);
  const r = 52, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  return (
    <div className="relative w-[140px] h-[140px] shrink-0">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-bg-border" />
        <motion.circle cx="70" cy="70" r={r} fill="none" strokeWidth="9" strokeLinecap="round" className={t.ring}
          initial={{ strokeDasharray: `0 ${circ}` }} animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.2 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`tnum text-2xl font-bold ${t.text}`}>{score}%</span>
        <span className="text-[11px] text-text-muted font-semibold tracking-wider">MATCH</span>
      </div>
    </div>
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
    <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
      </div>
    </main>
  );

  if (!data) return null;
  const { roadmap, careerOptions } = data;
  const chosen = careerOptions.find(o => o.path === roadmap.chosenPath);
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      {/* ── PRINT STYLES — clean white document ── */}
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { background: #fff !important; color: #111 !important; font-family: Georgia, serif; }
          main { padding: 0 !important; background: white !important; }
          .noise-overlay, .mesh-gradient { display: none !important; }

          /* Print wrapper overrides */
          #print-doc { display: block !important; }
          #screen-doc { display: none !important; }

          .print-page { padding: 36px 48px; max-width: 100%; }

          /* Cover */
          .print-cover { border-bottom: 3px solid #111; padding-bottom: 24px; margin-bottom: 32px; }
          .print-cover h1 { font-size: 32px; font-weight: 900; color: #111; margin: 8px 0 4px; }
          .print-cover .sub { font-size: 15px; color: #555; margin-bottom: 16px; }
          .print-cover .score-badge { display: inline-block; padding: 6px 18px; border-radius: 999px; background: #111; color: white; font-size: 14px; font-weight: 700; }
          .print-cover .meta { font-size: 12px; color: #888; margin-top: 12px; }

          /* Reasoning box */
          .print-reasoning { background: #f8f8f8; border-left: 4px solid #111; padding: 14px 18px; margin-bottom: 28px; border-radius: 0 6px 6px 0; }
          .print-reasoning p { font-size: 13px; color: #333; line-height: 1.7; margin: 0; }

          /* Section title */
          .print-section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #888; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin: 28px 0 16px; }

          /* Skills table */
          .print-skills-table { width: 100%; border-collapse: collapse; }
          .print-skills-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #222; }
          .print-skills-table td:first-child { font-weight: 700; width: 32px; color: #888; }
          .print-skills-table td:last-child { text-align: right; font-size: 11px; font-weight: 600; color: #555; }

          /* College grid */
          .print-college-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
          .print-college-col h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 8px; }
          .print-college-col ul { list-style: none; margin: 0; padding: 0; }
          .print-college-col ul li { font-size: 13px; color: #333; padding: 3px 0; border-bottom: 1px solid #f5f5f5; }

          /* Timeline */
          .print-phase { margin-bottom: 28px; break-inside: avoid; }
          .print-phase-header { background: #f5f5f5; padding: 12px 16px; border-radius: 6px 6px 0 0; border-left: 5px solid #111; margin-bottom: 0; }
          .print-phase-header .phase-label { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #888; }
          .print-phase-header .phase-title { font-size: 16px; font-weight: 800; color: #111; margin: 2px 0 0; }
          .print-phase-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 16px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 6px 6px; }
          .print-phase-body h5 { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin: 0 0 10px; }
          .print-phase-body ul { list-style: none; margin: 0; padding: 0; }
          .print-phase-body ul li { font-size: 12px; color: #333; padding: 4px 0; display: flex; gap: 8px; line-height: 1.5; border-bottom: 1px solid #f5f5f5; }
          .print-phase-body ul li:last-child { border: none; }
          .print-phase-body ul li .num { font-weight: 700; color: #aaa; min-width: 16px; }
          .print-exams { margin-top: 12px; }
          .print-exams span { display: inline-block; background: #111; color: white; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 4px; margin-right: 6px; margin-top: 4px; }

          .print-footer { border-top: 1px solid #e5e5e5; padding-top: 16px; text-align: center; font-size: 11px; color: #aaa; margin-top: 32px; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════
          SCREEN VERSION
      ═══════════════════════════════════════════════════ */}
      <div id="screen-doc">
        <main className="pt-24 pb-24 px-4 sm:px-6 min-h-screen relative">
          <div className="mesh-gradient fixed inset-0 pointer-events-none" />
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

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeOutExpo }} className="mb-6">
              <div className="relative overflow-hidden rounded-2xl glass-card">
                <div className="grid-backdrop absolute inset-0 opacity-70" />
                <div className="relative p-7 sm:p-9">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-px flex-1 bg-bg-border" />
                    <span className="eyebrow">PrepHub · AI Career Report · {date}</span>
                    <div className="h-px flex-1 bg-bg-border" />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                    {chosen && <ScoreRing score={chosen.score} />}
                    <div className="flex-1">
                      <p className="eyebrow mb-2">Recommended path</p>
                      <h1 className="text-3xl sm:text-4xl font-bold text-text tracking-tight mb-1">{roadmap.chosenPath}</h1>
                      <p className="text-text-muted text-base mb-5">Specialization: <span className="text-text font-semibold">{roadmap.specialization}</span></p>
                      <div className="flex flex-wrap gap-2.5">
                        {[{ l: "Timeline", v: "24 months" }, { l: "Phases", v: `${roadmap.phases.length} phases` }, { l: "Skills", v: `${roadmap.keySkills?.length ?? 0} to build` }].map(({ l, v }) => (
                          <div key={l} className="px-3.5 py-2 rounded-xl text-sm bg-bg-surface border border-bg-border">
                            <span className="text-text-muted text-xs">{l} · </span><span className="text-text font-bold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {chosen?.reasoning && (
                    <div className="mt-8 pt-6 border-t border-bg-border">
                      <p className="eyebrow mb-3">Why this path was recommended</p>
                      <p className="text-text-muted text-sm leading-relaxed">{chosen.reasoning}</p>
                      {chosen.pros?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {chosen.pros.map(p => (
                            <span key={p} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/25 text-accent-green">
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

            {/* Skills + Colleges */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">

              {roadmap.keySkills?.length > 0 && (
                <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-bg-border flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center text-accent-orange">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-text">Skills to build</h2>
                      <p className="text-xs text-text-muted">Prioritized for your chosen path</p>
                    </div>
                  </div>
                  <div className="divide-y divide-bg-border">
                    {roadmap.keySkills.map((skill, i) => {
                      const priority = SKILL_PRIORITY[i] ?? "Good to Have";
                      return (
                        <div key={skill} className="flex items-center gap-3 px-5 py-3">
                          <span className="text-xs font-black text-text-muted/50 w-5 shrink-0">{i + 1}</span>
                          <span className="text-sm font-medium text-text flex-1">{skill}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${SKILL_PRIORITY_STYLE[priority]}`}>
                            {priority}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {roadmap.collegeTargets && (
                <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
                  <div className="px-5 py-4 border-b border-bg-border flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-accent-cyan" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-text">College Targets</h2>
                      <p className="text-xs text-text-muted">Based on your current profile</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-5">
                    {[
                      { tier: "Reach", desc: "Ambitious — strong profile needed", emoji: "🎯", colleges: roadmap.collegeTargets.reach, color: "#f59e0b" },
                      { tier: "Match", desc: "Realistic with your profile", emoji: "✅", colleges: roadmap.collegeTargets.match, color: "#10b981" },
                      { tier: "Safe",  desc: "High acceptance likelihood", emoji: "🛡️", colleges: roadmap.collegeTargets.safe,  color: "#6366f1" },
                    ].map(({ tier, desc, emoji, colleges, color }) => (
                      <div key={tier}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{emoji}</span>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{tier}</span>
                          <span className="text-xs text-text-muted">· {desc}</span>
                        </div>
                        <div className="pl-6 space-y-1">
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

            {/* Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-bg-border" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted px-3">24-Month Action Plan</span>
                <div className="h-px flex-1 bg-bg-border" />
              </div>
              <div className="relative">
                <div className="absolute left-6 top-6 bottom-6 w-px bg-gradient-to-b from-primary/60 via-accent-cyan/40 to-accent-green/30 hidden sm:block" />
                <div className="space-y-5">
                  {roadmap.phases.map((phase, i) => {
                    const color = PHASE_COLORS[i % PHASE_COLORS.length];
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.1 }}
                        className="relative sm:pl-16">
                        <div className="absolute left-0 top-6 hidden sm:flex w-12 h-12 rounded-full items-center justify-center text-sm font-black text-white shadow-lg"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)`, boxShadow: `0 0 20px ${color}40` }}>
                          {i + 1}
                        </div>
                        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}30` }}>
                          <div className="px-6 py-4 flex items-center justify-between gap-4"
                            style={{ background: `linear-gradient(90deg, ${color}12, transparent)`, borderBottom: `1px solid ${color}20` }}>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: `${color}cc` }}>{phase.label}</p>
                              <h3 className="text-base font-bold text-text">{phase.title}</h3>
                            </div>
                            {(phase.exams?.length ?? 0) > 0 && (
                              <div className="flex flex-wrap gap-2 justify-end">
                                {phase.exams!.map(e => (
                                  <span key={e} className="text-xs font-semibold px-3 py-1.5 rounded-full glass border border-bg-border text-text">🎓 {e}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-bg-card/30">
                            {phase.goals?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Goals</p>
                                <ul className="space-y-2.5">
                                  {phase.goals.map(g => (
                                    <li key={g} className="flex items-start gap-2.5">
                                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: color }}>
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                                      </div>
                                      <p className="text-sm text-text leading-relaxed">{g}</p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {phase.actions?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Action Items</p>
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
      </div>

      {/* ═══════════════════════════════════════════════════
          PRINT-ONLY VERSION — clean white document
      ═══════════════════════════════════════════════════ */}
      <div id="print-doc" style={{ display: "none" }}>
        <div className="print-page">

          {/* Cover */}
          <div className="print-cover">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 8px" }}>
              PrepHub · AI Career Report · {date}
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>{roadmap.chosenPath}</h1>
            <p style={{ fontSize: 15, color: "#555", margin: "0 0 16px" }}>Specialization: <strong>{roadmap.specialization}</strong></p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {chosen && <span className="print-score-badge" style={{ background: "#111", color: "#fff", padding: "6px 18px", borderRadius: 999, fontSize: 14, fontWeight: 700 }}>{chosen.score}% Match</span>}
              <span style={{ fontSize: 12, color: "#888" }}>24-Month Roadmap · {roadmap.phases.length} Phases · {roadmap.keySkills?.length ?? 0} Key Skills</span>
            </div>
          </div>

          {/* Why recommended */}
          {chosen?.reasoning && (
            <>
              <p className="print-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", borderBottom: "1px solid #e5e5e5", paddingBottom: 6, margin: "24px 0 12px" }}>Why This Path Was Recommended</p>
              <div className="print-reasoning" style={{ background: "#f8f8f8", borderLeft: "4px solid #111", padding: "14px 18px", borderRadius: "0 6px 6px 0", marginBottom: 8 }}>
                <p style={{ fontSize: 13, color: "#333", lineHeight: 1.7, margin: 0 }}>{chosen.reasoning}</p>
              </div>
              {chosen.pros?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                  {chosen.pros.map(p => <span key={p} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", border: "1px solid #ccc", borderRadius: 4, color: "#444" }}>✓ {p}</span>)}
                </div>
              )}
            </>
          )}

          {/* Skills */}
          {roadmap.keySkills?.length > 0 && (
            <>
              <p className="print-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", borderBottom: "1px solid #e5e5e5", paddingBottom: 6, margin: "28px 0 12px" }}>Skills to Build</p>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {roadmap.keySkills.map((skill, i) => (
                    <tr key={skill} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#aaa", width: 32 }}>{i + 1}</td>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#222" }}>{skill}</td>
                      <td style={{ padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "#777", textAlign: "right" }}>
                        {SKILL_PRIORITY[i] ?? "Good to Have"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* College Targets */}
          {roadmap.collegeTargets && (
            <>
              <p className="print-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", borderBottom: "1px solid #e5e5e5", paddingBottom: 6, margin: "28px 0 12px" }}>College Targets</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                {[
                  { tier: "Reach 🎯", colleges: roadmap.collegeTargets.reach },
                  { tier: "Match ✅", colleges: roadmap.collegeTargets.match },
                  { tier: "Safe 🛡️",  colleges: roadmap.collegeTargets.safe },
                ].map(({ tier, colleges }) => (
                  <div key={tier}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px", color: "#333" }}>{tier}</p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {colleges.map(c => <li key={c} style={{ fontSize: 13, color: "#444", padding: "3px 0", borderBottom: "1px solid #f5f5f5" }}>{c}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Phases */}
          <p className="print-section-title" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", borderBottom: "1px solid #e5e5e5", paddingBottom: 6, margin: "28px 0 16px" }}>24-Month Action Plan</p>
          {roadmap.phases.map((phase, i) => (
            <div key={i} style={{ marginBottom: 24, breakInside: "avoid" }}>
              <div style={{ background: "#f5f5f5", padding: "12px 16px", borderRadius: "6px 6px 0 0", borderLeft: "5px solid #111" }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", margin: "0 0 3px" }}>{phase.label}</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>{phase.title}</p>
                {(phase.exams?.length ?? 0) > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {phase.exams!.map(e => <span key={e} style={{ display: "inline-block", background: "#111", color: "#fff", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, marginRight: 6 }}>🎓 {e}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 16, border: "1px solid #e5e5e5", borderTop: "none", borderRadius: "0 0 6px 6px" }}>
                {phase.goals?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", margin: "0 0 10px" }}>Goals</p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {phase.goals.map(g => <li key={g} style={{ fontSize: 12, color: "#333", padding: "4px 0", borderBottom: "1px solid #f5f5f5", lineHeight: 1.5 }}>· {g}</li>)}
                    </ul>
                  </div>
                )}
                {phase.actions?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", margin: "0 0 10px" }}>Action Items</p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                      {phase.actions.map((a, ai) => (
                        <li key={ai} style={{ fontSize: 12, color: "#333", padding: "4px 0", borderBottom: "1px solid #f5f5f5", lineHeight: 1.5, display: "flex", gap: 8 }}>
                          <span style={{ fontWeight: 700, color: "#aaa", minWidth: 16 }}>{ai + 1}.</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: 16, textAlign: "center", fontSize: 11, color: "#aaa", marginTop: 32 }}>
            Generated by <strong>PrepHub Career Guide</strong> · Powered by Gemini AI · {date}
          </div>
        </div>
      </div>
    </>
  );
}
