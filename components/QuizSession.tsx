"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, ChevronRight, Loader2, Trophy, RotateCcw } from "lucide-react";
import { scoreTheme } from "@/lib/score";
import { easeOutExpo } from "@/lib/motion";

interface Question {
  id: string; index: number; section: string; question: string;
  options: string[]; correct: number; explanation: string; difficulty: string;
}

interface Props { questions: Question[]; topic: string; topicLabel: string; }

const DIFF_COLOR: Record<string, string> = {
  MOST_FREQ: "text-accent-orange bg-accent-orange/10 border-accent-orange/25",
  MED: "text-accent-violet bg-accent-violet/10 border-accent-violet/25",
  LOW: "text-accent-blue bg-accent-blue/10 border-accent-blue/25",
};
const DIFF_LABEL: Record<string, string> = { MOST_FREQ: "Must know", MED: "Expected", LOW: "Deep dive" };

export default function QuizSession({ questions, topic, topicLabel }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
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
      const finalScore = scoreRef.current;
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

  // ── Submitting ──
  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto glass-card rounded-2xl p-16 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
        <p className="text-base font-medium text-text">Saving your result…</p>
      </div>
    );
  }

  // ── Results ──
  if (done) {
    const pct = finalPct;
    const t = scoreTheme(pct);
    const grade = pct >= 90 ? "A" : pct >= 75 ? "B" : pct >= 60 ? "C" : pct >= 45 ? "D" : "F";
    const msg = pct >= 80 ? "Excellent — you're well prepared." : pct >= 60 ? "Good effort — review the misses below." : "Keep going — revisit the Learn section.";
    const wrong = results.filter((r) => !r.correct).length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="max-w-2xl mx-auto space-y-5"
      >
        <div className="glass-card rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="grid-backdrop absolute inset-0 opacity-60" />
          <div className="relative">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
              className={`text-7xl font-bold mb-1 ${t.text}`}
            >
              {grade}
            </motion.div>
            <div className={`tnum text-3xl font-bold mb-1 ${t.text}`}>{pct}%</div>
            <p className="tnum text-sm text-text-muted mb-1">{scoreRef.current} correct · {wrong} wrong · {total} total</p>
            <p className="text-sm text-text mb-6">{msg}</p>

            <div className="h-2.5 rounded-full bg-bg-surface overflow-hidden mb-8 max-w-sm mx-auto">
              <motion.div className={`h-full rounded-full ${t.bar}`}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: easeOutExpo, delay: 0.2 }} />
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push("/quiz")} className="btn-ghost gap-2">
                <ChevronRight className="w-4 h-4 rotate-180" /> All quizzes
              </button>
              <button onClick={() => router.refresh()} className="btn-primary gap-2">
                <RotateCcw className="w-4 h-4" /> Retake
              </button>
            </div>
          </div>
        </div>

        {wrong > 0 && (
          <div className="space-y-3">
            <h3 className="eyebrow px-1">Review incorrect answers</h3>
            {questions.map((q, i) => {
              const r = results[i];
              if (!r || r.correct) return null;
              return (
                <div key={q.id} className="glass-card rounded-2xl border-accent-pink/20 p-5">
                  <p className="text-sm font-medium text-text mb-3 leading-relaxed">{q.question}</p>
                  <div className="space-y-1.5 mb-3">
                    <div className="flex gap-2 items-start text-sm">
                      <XCircle className="w-4 h-4 text-accent-pink shrink-0 mt-0.5" />
                      <span className="text-accent-pink">Your answer: {q.options[r.selected]}</span>
                    </div>
                    <div className="flex gap-2 items-start text-sm">
                      <CheckCircle className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                      <span className="text-accent-green">Correct: {q.options[r.correct_idx]}</span>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed bg-bg-surface rounded-lg px-3 py-2">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  // ── Active quiz ──
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Progress header */}
      <div className="glass-card rounded-2xl px-5 sm:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="tnum w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{current + 1}</div>
            <div>
              <div className="eyebrow">{topicLabel} quiz</div>
              <div className="text-sm font-semibold text-text">{q.section}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${DIFF_COLOR[q.difficulty] ?? "text-text-muted border-bg-border"}`}>
              {DIFF_LABEL[q.difficulty] ?? q.difficulty}
            </span>
            <span className="tnum text-sm text-text-muted font-medium">{current + 1}<span className="text-text-dim">/{total}</span></span>
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-bg-surface overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: easeOutExpo }} />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.28, ease: easeOutExpo }}
          className="glass-card rounded-2xl p-6 sm:p-8"
        >
          <p className="text-lg sm:text-xl font-semibold text-text leading-relaxed mb-7">{q.question}</p>

          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrect = answered && idx === q.correct;
              const isWrong = answered && isSelected && idx !== q.correct;
              const isOtherWrong = answered && !isSelected && idx !== q.correct;

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                  whileTap={!answered ? { scale: 0.99 } : undefined}
                  className={`w-full text-left flex items-center gap-4 px-4 sm:px-5 py-3.5 rounded-xl border text-sm font-medium leading-relaxed transition-all duration-150 ${
                    isCorrect ? "border-accent-green/60 bg-accent-green/10 text-text" :
                    isWrong ? "border-accent-pink/60 bg-accent-pink/10 text-text" :
                    isSelected ? "border-primary/60 bg-primary/10 text-text" :
                    isOtherWrong ? "border-bg-border text-text-muted opacity-50" :
                    "border-bg-border hover:border-text-dim/40 hover:bg-bg-surface text-text-muted hover:text-text"
                  } disabled:cursor-default`}
                >
                  <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border transition-all ${
                    isCorrect ? "border-accent-green bg-accent-green/20 text-accent-green" :
                    isWrong ? "border-accent-pink bg-accent-pink/20 text-accent-pink" :
                    isSelected ? "border-primary bg-primary/20 text-primary" :
                    "border-bg-border text-text-muted"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 text-sm">{opt}</span>
                  {isCorrect && <CheckCircle className="w-5 h-5 text-accent-green shrink-0" />}
                  {isWrong && <XCircle className="w-5 h-5 text-accent-pink shrink-0" />}
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 20 }}
                exit={{ opacity: 0, height: 0 }}
                className={`overflow-hidden rounded-xl border px-5 py-4 text-sm leading-relaxed ${
                  selected === q.correct
                    ? "border-accent-green/25 bg-accent-green/5 text-text"
                    : "border-accent-pink/25 bg-accent-pink/5 text-text"
                }`}
              >
                <span className="font-semibold">{selected === q.correct ? "Correct. " : "Not quite. "}</span>
                {q.explanation}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Tally + Next */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="tnum flex items-center gap-2 bg-accent-green/10 border border-accent-green/20 rounded-lg px-3.5 py-2">
            <CheckCircle className="w-4 h-4 text-accent-green" />
            <span className="text-base font-bold text-accent-green">{score}</span>
          </div>
          <div className="tnum flex items-center gap-2 bg-accent-pink/10 border border-accent-pink/20 rounded-lg px-3.5 py-2">
            <XCircle className="w-4 h-4 text-accent-pink" />
            <span className="text-base font-bold text-accent-pink">{results.length - score}</span>
          </div>
        </div>

        {answered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            onClick={handleNext} className="btn-primary gap-2"
          >
            {current + 1 < total
              ? <>Next <ChevronRight className="w-4 h-4" /></>
              : <><Trophy className="w-4 h-4" /> Finish</>}
          </motion.button>
        )}
      </div>
    </div>
  );
}
