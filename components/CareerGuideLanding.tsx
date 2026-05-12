"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Compass, FileText, Github, Brain, BarChart3, ArrowRight,
  Plus, Map, CheckCircle2, Clock, ShieldCheck, ShieldOff,
} from "lucide-react";
import type { ICareerPath, IRoadmap } from "@/models/CareerGuide";

interface SavedGuide {
  _id: string;
  status: string;
  careerOptions: ICareerPath[];
  roadmap?: IRoadmap;
  createdAt: string;
  githubUsername: string;
  usedPlatformData: boolean;
}

export default function CareerGuideLanding() {
  const router = useRouter();
  const [guides, setGuides] = useState<SavedGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/career-guide", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.guides) setGuides(d.guides); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  const topOption = (guide: SavedGuide) =>
    [...(guide.careerOptions ?? [])].sort((a, b) => b.score - a.score)[0];

  return (
    <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
      <div className="noise-overlay" />
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
              <Compass className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Career Guide</h1>
              <p className="text-text-muted text-sm">AI-powered career path recommendation tailored to your profile</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/career-guide/new")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New assessment
          </button>
        </motion.div>

        {guides.length > 0 ? (
          // ── Past assessments ────────────────────────────────────────────
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
            <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">Your assessments</p>

            {guides.map((guide, i) => {
              const best = topOption(guide);
              const hasRoadmap = !!guide.roadmap;
              const date = new Date(guide.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

              return (
                <motion.div
                  key={guide._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card rounded-2xl border border-bg-border p-5 hover:border-primary/30 transition-all"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${hasRoadmap ? "bg-accent-green/10" : "bg-primary/10"}`}>
                        {hasRoadmap ? <Map className="w-4 h-4 text-accent-green" /> : <Clock className="w-4 h-4 text-primary" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hasRoadmap ? "bg-accent-green/10 text-accent-green" : "bg-primary/10 text-primary"}`}>
                            {hasRoadmap ? "Roadmap ready" : "Options ready"}
                          </span>
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            {guide.usedPlatformData
                              ? <><ShieldCheck className="w-3 h-3 text-accent-green" /> With PrepHub data</>
                              : <><ShieldOff className="w-3 h-3 text-text-muted" /> Resume only</>
                            }
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{date}</p>
                      </div>
                    </div>

                    <div className="shrink-0 flex gap-2">
                      {hasRoadmap && (
                        <button
                          onClick={() => router.push(`/career-guide/roadmap?id=${guide._id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium btn-primary"
                        >
                          View roadmap <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {!hasRoadmap && (
                        <button
                          onClick={() => router.push(`/career-guide/options?id=${guide._id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium glass border border-bg-border rounded-lg hover:border-primary/40 text-text transition-all"
                        >
                          Choose path <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Top recommendation */}
                  {best && (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-bg-card border border-bg-border mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-green shrink-0" />
                          <span className="text-sm font-semibold text-text">{best.path}</span>
                          <span className="text-xs text-text-muted">· {best.specialization}</span>
                        </div>
                        <p className="text-xs text-text-muted line-clamp-1 pl-5">{best.reasoning}</p>
                      </div>
                      <div className={`text-xl font-black shrink-0 ${best.score >= 70 ? "text-accent-green" : best.score >= 50 ? "text-accent-orange" : "text-text-muted"}`}>
                        {best.score}%
                      </div>
                    </div>
                  )}

                  {/* All paths mini row */}
                  <div className="flex flex-wrap gap-2">
                    {guide.careerOptions.slice(0, 4).map((opt) => (
                      <span key={opt.path} className="text-xs px-2.5 py-1 rounded-lg bg-bg-card border border-bg-border text-text-muted">
                        {opt.path} <span className="font-semibold text-text">{opt.score}%</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          // ── No assessments yet ──────────────────────────────────────────
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: FileText, label: "Resume", desc: "Upload your PDF — we extract skills, projects & experience", color: "text-accent-blue", bg: "bg-accent-blue/10" },
                { icon: Github, label: "GitHub", desc: "Paste your GitHub URL — repos, languages & activity via API", color: "text-text", bg: "bg-bg-border/60" },
                { icon: Brain, label: "MCQ Assessment", desc: "8 quick questions about your goals, preferences & situation", color: "text-primary-light", bg: "bg-primary/10" },
                { icon: BarChart3, label: "PrepHub Data", desc: "Quiz scores & interview history — optional, toggle on/off", color: "text-accent-green", bg: "bg-accent-green/10" },
              ].map(({ icon: Icon, label, desc, color, bg }) => (
                <div key={label} className="glass-card rounded-xl border border-bg-border p-5 flex gap-4">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text mb-1">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-2xl border border-bg-border p-6 mb-8">
              <p className="text-sm font-semibold text-text mb-4">What you get</p>
              <div className="space-y-2.5">
                {[
                  "Career path options ranked by match score with honest reasoning",
                  "Specialization recommendation within your chosen path",
                  "A detailed 24-month roadmap with phase-by-phase action items",
                  "Exam targets (GATE / GRE / CAT / GMAT) with score goals",
                  "College targets — reach, match, and safe",
                  "Printable PDF of your roadmap",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-sm text-text-muted">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => router.push("/career-guide/new")}
              className="btn-primary flex items-center gap-2 text-base px-8 py-3"
            >
              <Plus className="w-5 h-5" /> Start career assessment
            </button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
