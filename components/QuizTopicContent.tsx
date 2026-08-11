"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, Zap, Loader2, BookOpen, TrendingUp, RotateCcw, Clock,
} from "lucide-react";
import QuizSession from "./QuizSession";
import { scoreTheme } from "@/lib/score";
import { easeOutExpo } from "@/lib/motion";

const TOPIC_LABELS: Record<string, string> = {
  java: "Java", oops: "OOPS", cn: "Computer Networks",
  os: "Operating Systems", dbms: "DBMS",
};

interface QuizStats {
  attempts: number; avgScore: number; lastScore: number; lastTaken: string;
}

interface Question {
  id: string; index: number; section: string; question: string;
  options: string[]; correct: number; explanation: string; difficulty: string;
}

function readiness(avg: number) {
  if (avg >= 80) return { text: "Well prepared", color: "text-accent-green" };
  if (avg >= 60) return { text: "On track", color: "text-primary" };
  if (avg >= 40) return { text: "Needs practice", color: "text-accent-orange" };
  return { text: "Just starting", color: "text-text-muted" };
}

export default function QuizTopicContent({ topic }: { topic: string }) {
  const label = TOPIC_LABELS[topic] ?? topic;

  const [phase, setPhase] = useState<"setup" | "loading" | "quiz" | "unavailable">("setup");
  const [count, setCount] = useState(15);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    fetch(`/api/quiz/${topic}?count=1`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setAvailable(false); setPhase("unavailable"); }
        else setStats(d.stats);
      })
      .catch(() => { setAvailable(false); setPhase("unavailable"); })
      .finally(() => setStatsLoading(false));
  }, [topic]);

  const startQuiz = async () => {
    setPhase("loading");
    const res = await fetch(`/api/quiz/${topic}?count=${count}`, { credentials: "include" });
    const data = await res.json();
    if (data.error || !data.questions) { setPhase("unavailable"); return; }
    setQuestions(data.questions);
    setPhase("quiz");
  };

  if (phase === "quiz") {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto mb-5">
          <Link href="/quiz" className="group inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to quiz
          </Link>
        </div>
        <QuizSession questions={questions} topic={topic} topicLabel={label} />
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="max-w-2xl mx-auto glass-card rounded-2xl p-16 text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping" />
          <div className="relative w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        </div>
        <p className="tnum text-base font-medium text-text">Loading {count} questions…</p>
      </div>
    );
  }

  const prepared = stats ? Math.min(100, stats.avgScore) : 0;
  const r = readiness(prepared);
  const bar = scoreTheme(prepared);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOutExpo }}
      className="max-w-xl mx-auto"
    >
      <Link href="/quiz" className="group inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to quiz
      </Link>

      {/* Stats card */}
      <div className="glass-card rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center text-primary">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">{label} Quiz</h1>
            <p className="text-sm text-text-muted">Multiple choice — track your prep</p>
          </div>
        </div>

        {statsLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-2.5 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
          </div>
        ) : !available ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <BookOpen className="w-4 h-4" /> Quiz not available yet.
          </div>
        ) : stats ? (
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={`font-semibold ${r.color}`}>{r.text}</span>
                <span className="tnum text-text font-bold">{prepared}% ready</span>
              </div>
              <div className="h-2.5 rounded-full bg-bg-surface overflow-hidden">
                <motion.div className={`h-full rounded-full ${bar.bar}`}
                  initial={{ width: 0 }} animate={{ width: `${prepared}%` }}
                  transition={{ duration: 0.8, ease: easeOutExpo }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: RotateCcw, value: String(stats.attempts), label: "Times taken", color: "text-text" },
                { icon: TrendingUp, value: `${stats.avgScore}%`, label: "Avg score", color: scoreTheme(stats.avgScore).text },
                { icon: Clock, value: `${stats.lastScore}%`, label: "Last score", color: scoreTheme(stats.lastScore).text },
              ].map(({ icon: Icon, value, label: lbl, color }) => (
                <div key={lbl} className="bg-bg-surface rounded-xl border border-bg-border px-4 py-4 text-center">
                  <Icon className="w-4 h-4 text-text-dim mx-auto mb-2" />
                  <div className={`tnum text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-text-muted mt-1">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-text-muted py-1">
            <Zap className="w-4 h-4 text-primary/60" /> No attempts yet — start your first quiz!
          </div>
        )}
      </div>

      {/* Count picker */}
      {available && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-text mb-1">How many questions?</h2>
            <p className="text-sm text-text-muted">Questions are randomly picked from the full bank.</p>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {[5, 10, 15, 20, 25, 30, 50, 100].map((n) => (
              <motion.button key={n} whileTap={{ scale: 0.96 }} onClick={() => setCount(n)}
                className={`tnum py-3 rounded-xl border text-base font-bold transition-all ${
                  count === n
                    ? "border-primary/50 bg-primary/10 text-primary ring-4 ring-primary/10"
                    : "border-bg-border text-text-muted hover:border-text-dim/40 hover:text-text"
                }`}>
                {n}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <input type="range" min={5} max={100} step={5} value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="flex-1 accent-[rgb(var(--accent))] h-2" />
            <span className="tnum text-lg font-bold text-primary w-16 text-right">{count} Qs</span>
          </div>

          <button onClick={startQuiz} className="w-full btn-primary py-3.5 text-base gap-2">
            <Zap className="w-5 h-5" /> Start quiz
          </button>
        </div>
      )}

      {phase === "unavailable" && !statsLoading && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-bg-surface border border-bg-border flex items-center justify-center mx-auto mb-4 text-text-muted">
            <BookOpen className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-text mb-1">Quiz coming soon</p>
          <p className="text-sm text-text-muted">The MCQ bank for {label} is being prepared.</p>
        </div>
      )}
    </motion.div>
  );
}
