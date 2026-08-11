"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Compass, FileText, Github, Brain, BarChart3, ArrowRight,
  Plus, Map, CheckCircle2, Clock, ShieldCheck, ShieldOff,
} from "lucide-react";
import type { ICareerPath, IRoadmap } from "@/models/CareerGuide";
import PageHeader from "@/components/ui/PageHeader";
import { scoreTheme } from "@/lib/score";
import { staggerContainer, fadeUp, fadeUpSm } from "@/lib/motion";

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

  const topOption = (guide: SavedGuide) =>
    [...(guide.careerOptions ?? [])].sort((a, b) => b.score - a.score)[0];

  return (
    <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <PageHeader
          eyebrow="AI-powered"
          icon={<Compass />}
          title="Career Guide"
          description="Personalized career-path recommendations tailored to your profile."
          actions={
            <button onClick={() => router.push("/career-guide/new")} className="btn-primary gap-2">
              <Plus className="w-4 h-4" /> New assessment
            </button>
          }
        />

        {loading ? (
          <div className="space-y-4">
            {[0, 1].map((i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : guides.length > 0 ? (
          <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="space-y-4">
            <motion.p variants={fadeUpSm} className="eyebrow mb-2">Your assessments</motion.p>

            {guides.map((guide) => {
              const best = topOption(guide);
              const hasRoadmap = !!guide.roadmap;
              const date = new Date(guide.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

              return (
                <motion.div key={guide._id} variants={fadeUp} className="glass-card rounded-2xl p-5 hover:border-text-dim/25 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${hasRoadmap ? "bg-accent-green/10 text-accent-green" : "bg-primary/10 text-primary"}`}>
                        {hasRoadmap ? <Map className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${hasRoadmap ? "bg-accent-green/10 text-accent-green" : "bg-primary/10 text-primary"}`}>
                            {hasRoadmap ? "Roadmap ready" : "Options ready"}
                          </span>
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            {guide.usedPlatformData
                              ? <><ShieldCheck className="w-3 h-3 text-accent-green" /> With PrepHub data</>
                              : <><ShieldOff className="w-3 h-3 text-text-dim" /> Resume only</>}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">{date}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {hasRoadmap ? (
                        <button onClick={() => router.push(`/career-guide/roadmap?id=${guide._id}`)} className="btn-primary !px-3 !py-1.5 text-xs gap-1.5">
                          View roadmap <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button onClick={() => router.push(`/career-guide/options?id=${guide._id}`)} className="btn-ghost !px-3 !py-1.5 text-xs gap-1.5">
                          Choose path <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {best && (
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-bg-surface border border-bg-border mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent-green shrink-0" />
                          <span className="text-sm font-semibold text-text">{best.path}</span>
                          <span className="text-xs text-text-muted">· {best.specialization}</span>
                        </div>
                        <p className="text-xs text-text-muted line-clamp-1 pl-5">{best.reasoning}</p>
                      </div>
                      <div className={`tnum text-xl font-bold shrink-0 ${scoreTheme(best.score).text}`}>{best.score}%</div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {guide.careerOptions.slice(0, 4).map((opt) => (
                      <span key={opt.path} className="text-xs px-2.5 py-1 rounded-md bg-bg-surface border border-bg-border text-text-muted">
                        {opt.path} <span className="tnum font-semibold text-text">{opt.score}%</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: FileText, label: "Resume", desc: "Upload your PDF — we extract skills, projects & experience", accent: "text-accent-blue" },
                { icon: Github, label: "GitHub", desc: "Paste your GitHub URL — repos, languages & activity via API", accent: "text-text" },
                { icon: Brain, label: "MCQ assessment", desc: "8 quick questions about your goals, preferences & situation", accent: "text-accent-violet" },
                { icon: BarChart3, label: "PrepHub data", desc: "Quiz scores & interview history — optional, toggle on/off", accent: "text-accent-green" },
              ].map(({ icon: Icon, label, desc, accent }) => (
                <motion.div key={label} variants={fadeUpSm} className="glass-card rounded-xl p-5 flex gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center shrink-0 ${accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text mb-1">{label}</p>
                    <p className="text-xs text-text-muted">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={fadeUp} className="glass-card rounded-2xl p-6 mb-6">
              <p className="text-sm font-semibold text-text mb-4">What you get</p>
              <div className="grid sm:grid-cols-2 gap-2.5">
                {[
                  "Career path options ranked by match score with honest reasoning",
                  "Specialization recommendation within your chosen path",
                  "A detailed 24-month roadmap with phase-by-phase action items",
                  "Exam targets (GATE / GRE / CAT / GMAT) with score goals",
                  "College targets — reach, match, and safe",
                  "Printable PDF of your roadmap",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-text-muted">{item}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.button variants={fadeUp} onClick={() => router.push("/career-guide/new")} className="btn-primary text-base px-8 py-3 gap-2">
              <Plus className="w-5 h-5" /> Start career assessment
            </motion.button>
          </motion.div>
        )}
      </div>
    </main>
  );
}
