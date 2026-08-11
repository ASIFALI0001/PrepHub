"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, RotateCcw, BookOpen, ExternalLink,
  ChevronDown, Star, Info, CheckCircle2,
} from "lucide-react";
import { TOPIC_ICONS } from "@/lib/topicIcons";
import type { Topic } from "@/lib/topics";
import QuestionCard, { type Question } from "./QuestionCard";
import QuestionsSkeleton from "./QuestionsSkeleton";
import { staggerContainer, fadeUpSm, easeOutExpo } from "@/lib/motion";

interface QuestionsData {
  metadata: {
    title: string; description: string; total_questions: number; last_updated: string;
    sources: Record<string, { full_name: string; url: string; strength: string }>;
    frequency_legend: Record<string, string>;
  };
  questions: Question[];
  summary: {
    by_section: Record<string, number>;
    by_frequency: Record<string, number>;
    study_plan: Record<string, string>;
    highest_probability_topics: string[];
  };
}

interface Props {
  topic: Topic;
  initialLearnedIds: string[];
}

const FREQ_STAT = [
  { key: "MOST_FREQ", label: "Must know", text: "text-accent-orange", dot: "bg-accent-orange" },
  { key: "MED", label: "Expected", text: "text-accent-violet", dot: "bg-accent-violet" },
  { key: "LOW", label: "Deep dive", text: "text-accent-blue", dot: "bg-accent-blue" },
];

export default function TopicPageContent({ topic, initialLearnedIds }: Props) {
  const Icon = TOPIC_ICONS[topic.id];

  const [learnedSet, setLearnedSet] = useState<Set<string>>(new Set(initialLearnedIds));
  const [toggling, setToggling] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [data, setData] = useState<QuestionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasContent, setHasContent] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [showStudyPlan, setShowStudyPlan] = useState(false);

  useEffect(() => {
    fetch(`/api/content/learn/${topic.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setHasContent(false); else setData(d); })
      .catch(() => setHasContent(false))
      .finally(() => setLoading(false));
  }, [topic.id]);

  const sections = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, Question[]>();
    for (const q of data.questions) {
      const arr = map.get(q.section) ?? [];
      arr.push(q);
      map.set(q.section, arr);
    }
    return Array.from(map.entries());
  }, [data]);

  const pct = data
    ? Math.round((learnedSet.size / data.metadata.total_questions) * 100)
    : Math.round((learnedSet.size / topic.total) * 100);

  const handleToggle = useCallback(async (questionId: string) => {
    const action = learnedSet.has(questionId) ? "remove" : "add";
    setLearnedSet((prev) => {
      const next = new Set(prev);
      action === "add" ? next.add(questionId) : next.delete(questionId);
      return next;
    });
    setToggling(questionId);
    try {
      const res = await fetch(`/api/progress/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId, action }),
      });
      if (!res.ok) {
        setLearnedSet((prev) => {
          const next = new Set(prev);
          action === "add" ? next.delete(questionId) : next.add(questionId);
          return next;
        });
      }
    } catch {
      setLearnedSet((prev) => {
        const next = new Set(prev);
        action === "add" ? next.delete(questionId) : next.add(questionId);
        return next;
      });
    } finally {
      setToggling(null);
    }
  }, [learnedSet, topic.id]);

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/progress/${topic.id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setLearnedSet(new Set());
    } catch { /* ignore */ }
    finally { setResetting(false); setShowResetConfirm(false); }
  };

  const total = data?.metadata.total_questions ?? topic.total;

  return (
    <div>
      <Link href="/learn" className="group inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to Learn
      </Link>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="glass-card rounded-2xl p-6 sm:p-8 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-7">
          <div className={`w-16 h-16 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center shrink-0 ${topic.accent}`}>
            {Icon && <Icon className="w-8 h-8" />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight mb-2">{topic.label}</h1>
            <p className="text-text-muted leading-relaxed">{topic.desc}</p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-center mb-2.5">
            <span className="tnum text-sm text-text-muted font-medium">{learnedSet.size} of {total} learned</span>
            <span className={`tnum text-base font-bold ${pct > 0 ? topic.accent : "text-text-dim"}`}>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-bg-surface overflow-hidden">
            <motion.div className="h-full rounded-full bg-primary"
              animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: easeOutExpo }} />
          </div>
        </div>

        <div className="flex justify-end">
          <AnimatePresence mode="wait" initial={false}>
            {showResetConfirm ? (
              <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5">
                <span className="text-sm text-text-muted">Reset all progress?</span>
                <button onClick={handleReset} disabled={resetting}
                  className="text-sm px-4 py-2 rounded-lg bg-accent-pink/15 text-accent-pink hover:bg-accent-pink/25 font-semibold border border-accent-pink/20">
                  {resetting ? "Resetting…" : "Yes, reset"}
                </button>
                <button onClick={() => setShowResetConfirm(false)} className="text-sm px-4 py-2 rounded-lg border border-bg-border text-text-muted hover:text-text">Cancel</button>
              </motion.div>
            ) : (
              <motion.button key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-pink transition-colors">
                <RotateCcw className="w-4 h-4" /> Reset progress
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Questions area */}
      {loading ? (
        <QuestionsSkeleton />
      ) : !hasContent ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center mx-auto mb-4 text-primary">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">Questions coming soon</h3>
          <p className="text-text-muted max-w-sm mx-auto">The {topic.label} question bank is being prepared.</p>
        </div>
      ) : data && (
        <div className="space-y-6">
          {/* Stats tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass-card rounded-2xl px-4 py-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center mx-auto mb-2 text-primary">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="tnum text-2xl font-bold text-text">{data.metadata.total_questions}</div>
              <div className="text-xs text-text-muted mt-0.5">Questions</div>
            </div>
            {FREQ_STAT.map(({ key, label, text, dot }) => (
              <div key={key} className="glass-card rounded-2xl px-4 py-4 text-center">
                <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-2.5 ${dot}`} />
                <div className={`tnum text-2xl font-bold ${text}`}>{data.summary.by_frequency[key] ?? 0}</div>
                <div className="text-xs text-text-muted mt-0.5">{label}</div>
              </div>
            ))}
            <div className="glass-card rounded-2xl border-accent-green/25 bg-accent-green/5 px-4 py-4 text-center">
              <div className="w-9 h-9 rounded-lg bg-accent-green/10 flex items-center justify-center mx-auto mb-2 text-accent-green">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="tnum text-2xl font-bold text-accent-green">{learnedSet.size}</div>
              <div className="text-xs text-text-muted mt-0.5">Learned</div>
            </div>
          </div>

          <p className="text-xs text-text-muted px-1">
            Compiled from {Object.keys(data.metadata.sources).join(", ")} · Last updated {data.metadata.last_updated}
          </p>

          {/* Accordions */}
          <Accordion open={showStudyPlan} onToggle={() => setShowStudyPlan((v) => !v)} icon={<Star className="w-5 h-5 text-accent-orange" />} title="Study plan — where to start based on experience">
            <div className="space-y-4">
              {Object.entries(data.summary.study_plan).map(([key, val]) => {
                const labels: Record<string, string> = {
                  freshers_0_to_2_yrs: "Freshers (0–2 yrs)",
                  mid_level_2_to_5_yrs: "Mid-level (2–5 yrs)",
                  senior_5_plus_yrs: "Senior (5+ yrs)",
                };
                return (
                  <div key={key}>
                    <div className="text-sm font-bold text-primary mb-1">{labels[key] ?? key}</div>
                    <div className="text-sm text-text-muted leading-relaxed">{val}</div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-bg-border">
                <div className="text-sm font-bold text-text mb-2">Highest probability topics</div>
                <div className="flex flex-wrap gap-2">
                  {data.summary.highest_probability_topics.map((t) => (
                    <span key={t} className="chip !text-primary !border-primary/25 !bg-primary/10">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </Accordion>

          <Accordion open={showSources} onToggle={() => setShowSources((v) => !v)} icon={<Info className="w-5 h-5 text-accent-blue" />} title="Sources — where these questions come from">
            <div className="grid sm:grid-cols-2 gap-5">
              {Object.entries(data.metadata.sources).map(([key, src]) => (
                <div key={key} className="flex gap-3">
                  <div className="w-1 rounded-full bg-primary/40 shrink-0" />
                  <div>
                    <a href={src.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-text hover:text-primary transition-colors flex items-center gap-1.5">
                      {src.full_name} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <p className="text-sm text-text-muted mt-1 leading-relaxed">{src.strength}</p>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          {/* Questions by section */}
          {sections.map(([sectionName, questions]) => {
            const learnedInSection = questions.filter((q) => learnedSet.has(q.id)).length;
            const sectionPct = Math.round((learnedInSection / questions.length) * 100);
            return (
              <div key={sectionName} className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-text">{sectionName}</h2>
                    <span className="chip">{questions.length} questions</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1.5 rounded-full bg-bg-surface overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full bg-accent-green transition-all duration-500" style={{ width: `${sectionPct}%` }} />
                    </div>
                    <span className={`tnum text-sm font-semibold ${learnedInSection > 0 ? "text-accent-green" : "text-text-dim"}`}>
                      {learnedInSection}/{questions.length}
                    </span>
                  </div>
                </div>
                <motion.div variants={staggerContainer(0.03)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }} className="space-y-2.5">
                  {questions.map((q, i) => (
                    <motion.div key={q.id} variants={fadeUpSm}>
                      <QuestionCard question={q} index={i + 1} isLearned={learnedSet.has(q.id)} onToggle={handleToggle} toggling={toggling === q.id} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Accordion({ open, onToggle, icon, title, children }: {
  open: boolean; onToggle: () => void; icon: React.ReactNode; title: string; children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 hover:bg-bg-surface/50 transition-colors">
        <div className="flex items-center gap-3 text-base font-semibold text-text text-left">{icon}{title}</div>
        <ChevronDown className={`w-5 h-5 text-text-muted transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOutExpo }} className="overflow-hidden">
            <div className="border-t border-bg-border px-6 py-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
