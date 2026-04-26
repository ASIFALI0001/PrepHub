"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, ChevronRight, Loader2, Trophy, RotateCcw } from "lucide-react";

interface Question {
  id: string; index: number; section: string; question: string;
  options: string[]; correct: number; explanation: string; difficulty: string;
}

interface Props { questions: Question[]; topic: string; topicLabel: string; }

const DIFF_COLOR: Record<string, string> = {
  MOST_FREQ: "text-orange-400 bg-orange-400/10 border-orange-400/25",
  MED: "text-yellow-400 bg-yellow-400/10 border-yellow-400/25",
  LOW: "text-accent-blue bg-accent-blue/10 border-accent-blue/25",
};
const DIFF_LABEL: Record<string, string> = { MOST_FREQ: "Must Know", MED: "Expected", LOW: "Deep Dive" };

export default function QuizSession({ questions, topic, topicLabel }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); // ← ref avoids stale closure on final submit
  const [results, setResults] = useState<{ correct: boolean; selected: number; correct_idx: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [finalPct, setFinalPct] = useState(0);

  const q = questions[current];
  const total = questions.length;
  const progress = Math.round(((current + (answered ? 1 : 0)) / total) * 100);

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    const isCorrect = idx === q.correct;
    if (isCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    setResults((r) => [...r, { correct: isCorrect, selected: idx, correct_idx: q.correct }]);
  };

  const handleNext = async () => {
    if (current + 1 < total) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setSubmitting(true);
      const finalScore = scoreRef.current; // always correct, no stale closure
      try {
        const res = await fetch(`/api/quiz/${topic}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ score: finalScore, total }),
        });
        if (res.ok) {
          const data = await res.json();
          setFinalPct(data.pct ?? Math.round((finalScore / total) * 100));
        } else {
          setFinalPct(Math.round((finalScore / total) * 100));
        }
      } catch {
        setFinalPct(Math.round((finalScore / total) * 100));
      } finally {
        setSubmitting(false);
        setDone(true);
      }
    }
  };

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto glass-card rounded-2xl border border-bg-border p-16 text-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <p className="text-base font-medium text-text">Saving your result…</p>
      </div>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────────
  if (done) {
    const pct = finalPct;
    const grade = pct >= 90 ? "A" : pct >= 75 ? "B" : pct >= 60 ? "C" : pct >= 45 ? "D" : "F";
    const gradeColor = pct >= 75 ? "text-accent-green" : pct >= 60 ? "text-yellow-400" : "text-red-400";
    const barColor = pct >= 75 ? "from-accent-green to-emerald-400" : pct >= 60 ? "from-yellow-400 to-amber-400" : "from-red-400 to-rose-400";
    const msg = pct >= 80 ? "🎉 Excellent! You're well prepared." : pct >= 60 ? "👍 Good effort — review the missed questions." : "📚 Keep going — revisit the Learn section.";
    const wrong = results.filter((r) => !r.correct).length;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Grade hero */}
        <div className="glass-card rounded-2xl border border-bg-border p-8 text-center">
          <div className={`text-8xl font-black mb-2 ${gradeColor}`}>{grade}</div>
          <div className={`text-3xl font-bold mb-1 ${gradeColor}`}>{pct}%</div>
          <p className="text-sm text-text-muted mb-2">{scoreRef.current} correct · {wrong} wrong · {total} total</p>
          <p className="text-sm text-text mb-6">{msg}</p>

          <div className="h-3 rounded-full bg-bg-border overflow-hidden mb-8 max-w-sm mx-auto">
            <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000`}
              style={{ width: `${pct}%` }} />
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/quiz")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-bg-border text-sm font-medium text-text-muted hover:text-text transition-colors">
              <ChevronRight className="w-4 h-4 rotate-180" /> All Quizzes
            </button>
            <button onClick={() => router.refresh()}
              className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium">
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
          </div>
        </div>

        {/* Per-question review */}
        {wrong > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest px-1">Review Incorrect Answers</h3>
            {questions.map((q, i) => {
              const r = results[i];
              if (!r || r.correct) return null;
              return (
                <div key={q.id} className="glass-card rounded-2xl border border-red-400/20 p-5">
                  <p className="text-sm font-medium text-text mb-3 leading-relaxed">{q.question}</p>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex gap-2 items-start text-sm">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-red-400">Your answer: {q.options[r.selected]}</span>
                    </div>
                    <div className="flex gap-2 items-start text-sm">
                      <CheckCircle className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                      <span className="text-accent-green">Correct: {q.options[r.correct_idx]}</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed bg-bg-surface rounded-xl px-3 py-2">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Active quiz ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Progress header */}
      <div className="glass-card rounded-2xl border border-bg-border px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-black text-primary">{current + 1}</span>
            </div>
            <div>
              <div className="text-xs text-text-muted">{topicLabel} Quiz</div>
              <div className="text-sm font-semibold text-text">{q.section}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${DIFF_COLOR[q.difficulty] ?? "text-text-muted border-bg-border"}`}>
              {DIFF_LABEL[q.difficulty] ?? q.difficulty}
            </span>
            <span className="text-sm text-text-muted font-medium">{current + 1}<span className="text-text-muted/50">/{total}</span></span>
          </div>
        </div>

        <div className="h-2 rounded-full bg-bg-border overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question card */}
      <div className="glass-card rounded-2xl border border-bg-border p-6 sm:p-8">
        {/* Question text — large and readable */}
        <p className="text-lg sm:text-xl font-semibold text-text leading-relaxed mb-7">
          {q.question}
        </p>

        {/* Options */}
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const isCorrect = answered && idx === q.correct;
            const isWrong = answered && isSelected && idx !== q.correct;
            const isOtherWrong = answered && !isSelected && idx !== q.correct;

            return (
              <button key={idx} onClick={() => handleSelect(idx)} disabled={answered}
                className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border text-sm font-medium leading-relaxed transition-all duration-150 ${
                  isCorrect ? "border-accent-green/60 bg-accent-green/10 text-text shadow-[0_0_12px_rgba(16,185,129,0.15)]" :
                  isWrong ? "border-red-400/60 bg-red-400/10 text-text" :
                  isSelected ? "border-primary/60 bg-primary/10 text-text" :
                  isOtherWrong ? "border-bg-border text-text-muted opacity-50" :
                  "border-bg-border hover:border-primary/40 hover:bg-bg-surface text-text-muted hover:text-text"
                } disabled:cursor-default`}
              >
                {/* Letter badge */}
                <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-all ${
                  isCorrect ? "border-accent-green bg-accent-green/20 text-accent-green" :
                  isWrong ? "border-red-400 bg-red-400/20 text-red-400" :
                  isSelected ? "border-primary bg-primary/20 text-primary" :
                  "border-bg-border text-text-muted"
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>

                <span className="flex-1 text-sm">{opt}</span>

                {isCorrect && <CheckCircle className="w-5 h-5 text-accent-green shrink-0" />}
                {isWrong && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && (
          <div className={`mt-5 rounded-xl border px-5 py-4 text-sm leading-relaxed ${
            selected === q.correct
              ? "border-accent-green/25 bg-accent-green/5 text-text"
              : "border-red-400/25 bg-red-400/5 text-text"
          }`}>
            <span className="font-semibold">
              {selected === q.correct ? "✓ Correct! " : "✗ Incorrect. "}
            </span>
            {q.explanation}
          </div>
        )}
      </div>

      {/* Score tally + Next button */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-accent-green/10 border border-accent-green/20 rounded-xl px-4 py-2">
            <CheckCircle className="w-4 h-4 text-accent-green" />
            <span className="text-base font-bold text-accent-green">{score}</span>
          </div>
          <div className="flex items-center gap-2 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-base font-bold text-red-400">{results.length - score}</span>
          </div>
        </div>

        {answered && (
          <button onClick={handleNext}
            className="btn-primary flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm">
            {current + 1 < total
              ? <><ChevronRight className="w-4 h-4" /> Next</>
              : <><Trophy className="w-4 h-4" /> Finish</>}
          </button>
        )}
      </div>
    </div>
  );
}
