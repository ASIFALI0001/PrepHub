"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Zap, Loader2, BookOpen,
  TrendingUp, RotateCcw, Clock,
} from "lucide-react";
import QuizSession from "./QuizSession";

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

function gradeLabel(avg: number) {
  if (avg >= 80) return { text: "Well Prepared 🎉", color: "text-accent-green" };
  if (avg >= 60) return { text: "On Track 👍", color: "text-yellow-400" };
  if (avg >= 40) return { text: "Needs Practice 📚", color: "text-accent-orange" };
  return { text: "Just Starting 🌱", color: "text-text-muted" };
}

export default function QuizTopicContent({ topic }: { topic: string }) {
  const router = useRouter();
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

  // ── Active quiz ──────────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div>
        <div className="max-w-2xl mx-auto mb-5">
          <Link href="/quiz" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Quiz
          </Link>
        </div>
        <QuizSession questions={questions} topic={topic} topicLabel={label} />
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="max-w-2xl mx-auto glass-card rounded-2xl border border-bg-border p-16 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-base font-medium text-text">Loading {count} questions…</p>
      </div>
    );
  }

  // ── Setup ────────────────────────────────────────────────────────────────
  const prepared = stats ? Math.min(100, stats.avgScore) : 0;
  const { text: readiness, color: readinessColor } = gradeLabel(prepared);

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/quiz" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Quiz
      </Link>

      {/* ── Stats card ──────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-bg-border p-6 mb-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-light" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">{label} Quiz</h1>
            <p className="text-sm text-text-muted">Multiple choice — track your prep</p>
          </div>
        </div>

        {statsLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your stats…
          </div>
        ) : !available ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <BookOpen className="w-4 h-4" /> Quiz not available yet.
          </div>
        ) : stats ? (
          <div className="space-y-5">
            {/* Prepared bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className={`font-semibold ${readinessColor}`}>{readiness}</span>
                <span className="text-text font-bold">{prepared}% prepared</span>
              </div>
              <div className="h-3 rounded-full bg-bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${prepared >= 75 ? "bg-accent-green" : prepared >= 60 ? "bg-yellow-400" : "bg-primary"}`}
                  style={{ width: `${prepared}%` }}
                />
              </div>
            </div>

            {/* Stats tiles */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: RotateCcw, value: String(stats.attempts), label: "Times taken", color: "text-text" },
                { icon: TrendingUp, value: `${stats.avgScore}%`, label: "Avg score", color: stats.avgScore >= 75 ? "text-accent-green" : stats.avgScore >= 60 ? "text-yellow-400" : "text-text" },
                { icon: Clock, value: `${stats.lastScore}%`, label: "Last score", color: stats.lastScore >= 75 ? "text-accent-green" : stats.lastScore >= 60 ? "text-yellow-400" : "text-text" },
              ].map(({ icon: Icon, value, label: lbl, color }) => (
                <div key={lbl} className="bg-bg-surface rounded-2xl border border-bg-border px-4 py-4 text-center">
                  <Icon className="w-4 h-4 text-text-muted mx-auto mb-2" />
                  <div className={`text-2xl font-black ${color}`}>{value}</div>
                  <div className="text-xs text-text-muted mt-1">{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-text-muted py-1">
            <Zap className="w-4 h-4 text-primary/50" />
            No attempts yet — start your first quiz!
          </div>
        )}
      </div>

      {/* ── Question count picker ────────────────────────────────────── */}
      {available && (
        <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold text-text mb-1">How many questions?</h2>
            <p className="text-sm text-text-muted">Questions are randomly picked from the full bank.</p>
          </div>

          {/* Quick-pick buttons */}
          <div className="grid grid-cols-4 gap-2.5">
            {[5, 10, 15, 20, 25, 30, 50, 100].map((n) => (
              <button key={n} onClick={() => setCount(n)}
                className={`py-3 rounded-xl border text-base font-bold transition-all ${
                  count === n
                    ? "border-primary/50 bg-primary/15 text-primary shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                    : "border-bg-border text-text-muted hover:border-primary/30 hover:text-text"
                }`}>
                {n}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="flex items-center gap-4">
            <input type="range" min={5} max={100} step={5} value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="flex-1 accent-primary h-2" />
            <span className="text-lg font-black text-primary w-16 text-right">{count} Qs</span>
          </div>

          {/* Start */}
          <button onClick={startQuiz}
            className="w-full btn-primary py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" /> Start Quiz
          </button>
        </div>
      )}

      {phase === "unavailable" && !statsLoading && (
        <div className="glass-card rounded-2xl border border-bg-border p-10 text-center">
          <BookOpen className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-base font-semibold text-text mb-1">Quiz coming soon</p>
          <p className="text-sm text-text-muted">MCQ bank for {label} is being prepared.</p>
        </div>
      )}
    </div>
  );
}
