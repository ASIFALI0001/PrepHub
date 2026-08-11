"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, ChevronDown, Award, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, RotateCcw, MessageSquare,
} from "lucide-react";
import type { IInterview } from "@/models/Interview";
import { scoreTheme, qScoreTheme } from "@/lib/score";
import { staggerContainer, fadeUp, easeOutExpo } from "@/lib/motion";

interface Props {
  interview: IInterview & { _id: string };
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const t = scoreTheme(score);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-bg-border" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="7" strokeLinecap="round" className={t.ring}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${t.text}`}>{grade}</span>
        <span className="tnum text-xs text-text-muted font-medium mt-0.5">{score}%</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, val, barClass }: { label: string; val: number; barClass: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="tnum text-xs font-bold text-text">{val}%</span>
      </div>
      <div className="h-2 rounded-full bg-bg-surface overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${val}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: easeOutExpo }}
        />
      </div>
    </div>
  );
}

export default function InterviewReport({ interview }: Props) {
  const report = interview.report!;
  const [expandedQ, setExpandedQ] = useState<string | null>(report.questionReports[0]?.questionId ?? null);
  const t = scoreTheme(report.overallScore);

  return (
    <motion.div
      variants={staggerContainer(0.08)}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto space-y-4"
    >
      <motion.div variants={fadeUp}>
        <Link href="/interview" className="group inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
          <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" /> Back to interviews
        </Link>
      </motion.div>

      {/* Hero */}
      <motion.div variants={fadeUp} className={`glass-card rounded-2xl p-6 ${t.border}`}>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <ScoreRing score={report.overallScore} grade={report.grade} />
          <div className="flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border mb-3 ${t.pill}`}>
              <Award className="w-3 h-3" /> {t.label}
            </span>
            <h1 className="text-lg font-bold text-text mb-1.5 leading-snug">{interview.title}</h1>
            <p className="text-sm text-text-muted leading-relaxed mb-4">{report.summary}</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Correctness", val: report.correctness },
                { label: "Structure", val: report.structure },
                { label: "Confidence", val: report.confidence },
              ].map(({ label, val }) => {
                const st = scoreTheme(val);
                return (
                  <div key={label} className="bg-bg-surface rounded-xl border border-bg-border px-3 py-2.5 text-center">
                    <div className={`tnum text-xl font-bold ${st.text}`}>{val}%</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Breakdown */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-5 space-y-3.5">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Score breakdown
        </h2>
        <ScoreBar label="Overall" val={report.overallScore} barClass={scoreTheme(report.overallScore).bar} />
        <ScoreBar label="Correctness" val={report.correctness} barClass="bg-accent-green" />
        <ScoreBar label="Structure" val={report.structure} barClass="bg-accent-blue" />
        <ScoreBar label="Confidence" val={report.confidence} barClass="bg-accent-cyan" />
      </motion.div>

      {/* Strengths & improvements */}
      <motion.div variants={fadeUp} className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent-green" /> Strengths
          </h2>
          <ul className="space-y-2.5">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-text-muted leading-relaxed">
                <span className="tnum w-4 h-4 rounded-md bg-accent-green/15 text-accent-green flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-orange" /> Areas to improve
          </h2>
          <ul className="space-y-2.5">
            {report.improvements.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-text-muted leading-relaxed">
                <span className="tnum w-4 h-4 rounded-md bg-accent-orange/15 text-accent-orange flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Per-question accordion */}
      <motion.div variants={fadeUp} className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Question breakdown
          </h2>
          <span className="tnum text-xs text-text-muted">{report.questionReports.length} questions</span>
        </div>

        {report.questionReports.map((qr, i) => {
          const isOpen = expandedQ === qr.questionId;
          const st = qScoreTheme(qr.score);
          const scorePct = qr.score * 10;

          return (
            <div key={qr.questionId} className={`glass-card rounded-2xl overflow-hidden transition-colors ${isOpen ? "border-primary/30" : ""}`}>
              <button
                onClick={() => setExpandedQ(isOpen ? null : qr.questionId)}
                className="w-full text-left px-5 py-4 hover:bg-bg-surface/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold tnum ${st.pill}`}>
                    {qr.score}/10
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="eyebrow mb-1">Question {i + 1}</div>
                    <p className="text-sm text-text leading-relaxed">{qr.questionText}</p>
                    <div className="mt-2.5 h-1 rounded-full bg-bg-surface overflow-hidden">
                      <motion.div className={`h-full rounded-full ${st.bar}`}
                        initial={{ width: 0 }} animate={{ width: `${scorePct}%` }}
                        transition={{ duration: 0.7, ease: easeOutExpo }} />
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 mt-1 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: easeOutExpo }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-bg-border">
                      <div className="px-5 pt-4 pb-3">
                        <div className="eyebrow mb-2">Your answer</div>
                        <div className="bg-bg-surface rounded-xl border border-bg-border px-4 py-3 text-sm text-text leading-relaxed">
                          {qr.answerText || <span className="text-text-muted italic">(no answer recorded)</span>}
                        </div>
                      </div>
                      <div className="px-5 pb-3">
                        <div className="eyebrow mb-2">Feedback</div>
                        <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-sm text-text leading-relaxed">
                          {qr.feedback}
                        </div>
                      </div>
                      {(qr.keyPointsCovered.length > 0 || qr.keyPointsMissed.length > 0) && (
                        <div className="px-5 pb-4 grid sm:grid-cols-2 gap-4">
                          {qr.keyPointsCovered.length > 0 && (
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-green mb-2">Covered</div>
                              <ul className="space-y-1.5">
                                {qr.keyPointsCovered.map((p, j) => (
                                  <li key={j} className="flex gap-2 text-xs text-text-muted leading-relaxed">
                                    <CheckCircle className="w-3.5 h-3.5 text-accent-green shrink-0 mt-0.5" /> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {qr.keyPointsMissed.length > 0 && (
                            <div>
                              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent-pink mb-2">Missed</div>
                              <ul className="space-y-1.5">
                                {qr.keyPointsMissed.map((p, j) => (
                                  <li key={j} className="flex gap-2 text-xs text-text-muted leading-relaxed">
                                    <XCircle className="w-3.5 h-3.5 text-accent-pink shrink-0 mt-0.5" /> {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

      {/* Footer actions */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-6">
        <Link href={`/interview/${interview._id}`} className="btn-ghost justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> Retake interview
        </Link>
        <Link href="/interview" className="btn-primary justify-center gap-2">
          New interview
        </Link>
      </motion.div>
    </motion.div>
  );
}
