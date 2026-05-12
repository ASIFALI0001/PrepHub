"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Map, Printer, ArrowLeft, CheckCircle2, GraduationCap,
  Target, BookOpen, Award, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import type { IRoadmap, ICareerPath } from "@/models/CareerGuide";

interface GuideData {
  roadmap: IRoadmap;
  careerOptions: ICareerPath[];
  githubUsername: string;
}

const phaseColors = [
  { border: "border-accent-blue/30", bg: "bg-accent-blue/5", icon: "text-accent-blue", dot: "bg-accent-blue" },
  { border: "border-accent-cyan/30", bg: "bg-accent-cyan/5", icon: "text-accent-cyan", dot: "bg-accent-cyan" },
  { border: "border-primary/30", bg: "bg-primary/5", icon: "text-primary-light", dot: "bg-primary" },
  { border: "border-accent-green/30", bg: "bg-accent-green/5", icon: "text-accent-green", dot: "bg-accent-green" },
];

export default function CareerGuideRoadmap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);

  useEffect(() => {
    const id = searchParams.get("id");
    fetch("/api/career-guide", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const guides: Array<{ _id: string; roadmap?: IRoadmap; careerOptions: ICareerPath[]; githubUsername: string }> = d.guides ?? [];
        const guide = id
          ? guides.find((g) => g._id === id)
          : guides.find((g) => g.roadmap);
        if (guide?.roadmap) {
          setData({ roadmap: guide.roadmap, careerOptions: guide.careerOptions, githubUsername: guide.githubUsername });
        } else {
          router.push("/career-guide");
        }
      })
      .catch(() => router.push("/career-guide"))
      .finally(() => setLoading(false));
  }, [router, searchParams]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </main>
    );
  }

  if (!data) return null;
  const { roadmap, careerOptions } = data;

  const chosenOption = careerOptions.find((o) => o.path === roadmap.chosenPath);

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #roadmap-print, #roadmap-print * { visibility: visible; }
          #roadmap-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">

          {/* Top bar */}
          <div className="flex items-center justify-between mb-8 no-print">
            <button
              onClick={() => router.push("/career-guide")}
              className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium glass border border-bg-border rounded-xl hover:border-primary/40 transition-all text-text"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
          </div>

          <div id="roadmap-print">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-accent-cyan/10 p-6 sm:p-8">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Map className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-primary uppercase tracking-wider">Career Roadmap</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-text mb-1">{roadmap.chosenPath}</h1>
                  <p className="text-text-muted">Specialization: <span className="font-semibold text-text">{roadmap.specialization}</span></p>

                  {chosenOption && (
                    <div className="mt-4 flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-bg-card border border-bg-border text-sm font-bold text-accent-green">
                        {chosenOption.score}% match
                      </div>
                      <p className="text-sm text-text-muted">{chosenOption.reasoning}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Key Skills */}
            {roadmap.keySkills?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-accent-orange" />
                  <h2 className="text-sm font-bold text-text uppercase tracking-wider">Key Skills to Build</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {roadmap.keySkills.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-lg bg-accent-orange/10 border border-accent-orange/20 text-sm font-medium text-accent-orange">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* College Targets */}
            {roadmap.collegeTargets && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl border border-bg-border p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-accent-cyan" />
                  <h2 className="text-sm font-bold text-text uppercase tracking-wider">College Targets</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Reach", colleges: roadmap.collegeTargets.reach, color: "text-accent-orange", bg: "bg-accent-orange/10", border: "border-accent-orange/20" },
                    { label: "Match", colleges: roadmap.collegeTargets.match, color: "text-accent-green", bg: "bg-accent-green/10", border: "border-accent-green/20" },
                    { label: "Safe", colleges: roadmap.collegeTargets.safe, color: "text-accent-blue", bg: "bg-accent-blue/10", border: "border-accent-blue/20" },
                  ].map(({ label, colleges, color, bg, border }) => (
                    <div key={label} className={`rounded-xl ${bg} border ${border} p-4`}>
                      <p className={`text-xs font-bold uppercase tracking-wider ${color} mb-2`}>{label}</p>
                      <ul className="space-y-1">
                        {colleges.map((c) => <li key={c} className="text-sm text-text">{c}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Phases */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-text uppercase tracking-wider">24-Month Roadmap</h2>
              </div>

              {roadmap.phases.map((phase, i) => {
                const c = phaseColors[i % phaseColors.length];
                const isOpen = expandedPhase === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}
                  >
                    <button
                      onClick={() => setExpandedPhase(isOpen ? null : i)}
                      className="no-print w-full flex items-center justify-between p-5 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                        <div>
                          <span className={`text-xs font-bold uppercase tracking-wider ${c.icon}`}>{phase.label}</span>
                          <p className="text-base font-bold text-text mt-0.5">{phase.title}</p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                    </button>

                    {/* Always visible in print, toggle in UI */}
                    <div className={`px-5 pb-5 ${isOpen ? "block" : "hidden"} print:block`}>
                      {phase.goals?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-text-muted uppercase mb-2">Goals</p>
                          <div className="space-y-1.5">
                            {phase.goals.map((g) => (
                              <div key={g} className="flex items-start gap-2">
                                <CheckCircle2 className={`w-3.5 h-3.5 ${c.icon} mt-0.5 shrink-0`} />
                                <p className="text-sm text-text">{g}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {phase.actions?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-text-muted uppercase mb-2">Action items</p>
                          <ul className="space-y-2">
                            {phase.actions.map((a, ai) => (
                              <li key={ai} className="flex items-start gap-2.5 text-sm text-text">
                                <span className={`text-xs font-bold ${c.icon} shrink-0 mt-0.5`}>{ai + 1}.</span>
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {phase.exams && phase.exams.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase mb-2">Exams</p>
                          <div className="flex flex-wrap gap-2">
                            {phase.exams.map((e) => (
                              <span key={e} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-bg-border text-sm text-text">
                                <Award className={`w-3.5 h-3.5 ${c.icon}`} />
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Print footer */}
            <div className="hidden print:block text-center text-xs text-text-muted pt-4 border-t border-bg-border">
              Generated by PrepHub Career Guide · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </div>

          </div>

          {/* Bottom CTA */}
          <div className="no-print mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/career-guide/new")}
              className="flex-1 py-3 text-sm font-medium glass border border-bg-border rounded-xl hover:border-primary/40 transition-all text-text text-center"
            >
              Change path / redo assessment
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>

        </div>
      </main>
    </>
  );
}
