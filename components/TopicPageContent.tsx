"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, RotateCcw, BookOpen, ExternalLink,
  ChevronDown, Star, Info, CheckCircle2,
} from "lucide-react";
import { TOPIC_ICONS } from "@/lib/topicIcons";
import type { Topic } from "@/lib/topics";
import QuestionCard, { type Question } from "./QuestionCard";
import QuestionsSkeleton from "./QuestionsSkeleton";

interface QuestionsData {
  metadata: {
    title: string;
    description: string;
    total_questions: number;
    last_updated: string;
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
  { key: "MOST_FREQ", label: "Must Know",  dot: "bg-orange-400", text: "text-orange-400" },
  { key: "MED",       label: "Expected",   dot: "bg-yellow-400", text: "text-yellow-400" },
  { key: "LOW",       label: "Deep Dive",  dot: "bg-accent-blue", text: "text-accent-blue" },
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

  return (
    <div>
      {/* Back */}
      <Link href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-8">
        <ChevronLeft className="w-4 h-4" /> Back to Learn
      </Link>

      {/* ── Header card ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-bg-border p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-7">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${topic.iconBg}`}>
            {Icon && <Icon className={`w-8 h-8 ${topic.color}`} />}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-text mb-2">{topic.label}</h1>
            <p className="text-text-muted leading-relaxed">{topic.desc}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-sm text-text-muted font-medium">
              {learnedSet.size} of {data?.metadata.total_questions ?? topic.total} learned
            </span>
            <span className={`text-base font-black ${pct > 0 ? topic.color : "text-text-muted"}`}>
              {pct}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Reset */}
        <div className="flex justify-end">
          {showResetConfirm ? (
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-text-muted">Reset all progress?</span>
              <button onClick={handleReset} disabled={resetting}
                className="text-sm px-4 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 font-semibold border border-red-500/20">
                {resetting ? "Resetting…" : "Yes, reset"}
              </button>
              <button onClick={() => setShowResetConfirm(false)}
                className="text-sm px-4 py-2 rounded-xl bg-bg-border text-text-muted hover:text-text">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-red-400 transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset progress
            </button>
          )}
        </div>
      </div>

      {/* ── Questions area ───────────────────────────────────────────── */}
      {loading ? (
        <QuestionsSkeleton />
      ) : !hasContent ? (
        <div className="glass-card rounded-2xl border border-bg-border p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-text mb-2">Questions coming soon</h3>
          <p className="text-text-muted max-w-sm mx-auto">
            The {topic.label} question bank is being prepared.
          </p>
        </div>
      ) : data && (
        <div className="space-y-6">

          {/* ── Stats tiles ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Total */}
            <div className="glass-card rounded-2xl border border-bg-border px-4 py-4 text-center col-span-1">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="text-2xl font-black text-text">{data.metadata.total_questions}</div>
              <div className="text-xs text-text-muted mt-0.5">Questions</div>
            </div>

            {/* Frequency tiles */}
            {FREQ_STAT.map(({ key, label, dot, text }) => (
              <div key={key} className="glass-card rounded-2xl border border-bg-border px-4 py-4 text-center">
                <div className={`w-3 h-3 rounded-full ${dot} mx-auto mb-2`} />
                <div className={`text-2xl font-black ${text}`}>{data.summary.by_frequency[key] ?? 0}</div>
                <div className="text-xs text-text-muted mt-0.5">{label}</div>
              </div>
            ))}

            {/* Learned */}
            <div className="glass-card rounded-2xl border border-accent-green/25 bg-accent-green/5 px-4 py-4 text-center">
              <div className="w-9 h-9 rounded-xl bg-accent-green/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-accent-green" />
              </div>
              <div className="text-2xl font-black text-accent-green">{learnedSet.size}</div>
              <div className="text-xs text-text-muted mt-0.5">Learned</div>
            </div>
          </div>

          {/* Sources line */}
          <p className="text-xs text-text-muted px-1">
            Compiled from {Object.keys(data.metadata.sources).join(", ")} · Last updated {data.metadata.last_updated}
          </p>

          {/* ── Study Plan accordion ─────────────────────────────────── */}
          <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
            <button
              onClick={() => setShowStudyPlan((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-bg-border/15 transition-colors"
            >
              <div className="flex items-center gap-3 text-base font-semibold text-text">
                <Star className="w-5 h-5 text-yellow-400" />
                Study Plan — where to start based on experience
              </div>
              <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${showStudyPlan ? "rotate-180" : ""}`} />
            </button>
            {showStudyPlan && (
              <div className="border-t border-bg-border px-6 py-5 space-y-4">
                {Object.entries(data.summary.study_plan).map(([key, val]) => {
                  const labels: Record<string, string> = {
                    freshers_0_to_2_yrs:  "Freshers (0–2 yrs)",
                    mid_level_2_to_5_yrs: "Mid-level (2–5 yrs)",
                    senior_5_plus_yrs:    "Senior (5+ yrs)",
                  };
                  return (
                    <div key={key}>
                      <div className="text-sm font-bold text-primary mb-1">{labels[key] ?? key}</div>
                      <div className="text-sm text-text-muted leading-relaxed">{val}</div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-bg-border">
                  <div className="text-sm font-bold text-text mb-2">Highest probability topics</div>
                  <div className="flex flex-wrap gap-2">
                    {data.summary.highest_probability_topics.map((t) => (
                      <span key={t} className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Sources accordion ────────────────────────────────────── */}
          <div className="glass-card rounded-2xl border border-bg-border overflow-hidden">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-bg-border/15 transition-colors"
            >
              <div className="flex items-center gap-3 text-base font-semibold text-text">
                <Info className="w-5 h-5 text-accent-blue" />
                Sources — where these questions come from
              </div>
              <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${showSources ? "rotate-180" : ""}`} />
            </button>
            {showSources && (
              <div className="border-t border-bg-border px-6 py-5 grid sm:grid-cols-2 gap-5">
                {Object.entries(data.metadata.sources).map(([key, src]) => (
                  <div key={key} className="flex gap-3">
                    <div className="w-1.5 rounded-full bg-primary/40 shrink-0 mt-1" />
                    <div>
                      <a href={src.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-text hover:text-primary transition-colors flex items-center gap-1.5">
                        {src.full_name}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <p className="text-sm text-text-muted mt-1 leading-relaxed">{src.strength}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Questions by section ─────────────────────────────────── */}
          {sections.map(([sectionName, questions]) => {
            const learnedInSection = questions.filter((q) => learnedSet.has(q.id)).length;
            const sectionPct = Math.round((learnedInSection / questions.length) * 100);

            return (
              <div key={sectionName} className="space-y-3">
                {/* Section header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-text">{sectionName}</h2>
                    <span className="text-xs px-2.5 py-1 rounded-lg border border-bg-border text-text-muted font-medium">
                      {questions.length} questions
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-20 h-1.5 rounded-full bg-bg-border overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full bg-accent-green transition-all duration-500"
                        style={{ width: `${sectionPct}%` }} />
                    </div>
                    <span className={`text-sm font-semibold ${learnedInSection > 0 ? "text-accent-green" : "text-text-muted"}`}>
                      {learnedInSection}/{questions.length}
                    </span>
                  </div>
                </div>

                {/* Question cards */}
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i + 1}
                    isLearned={learnedSet.has(q.id)}
                    onToggle={handleToggle}
                    toggling={toggling === q.id}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
