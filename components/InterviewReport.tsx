"use client";

import Link from "next/link";
import {
  ChevronLeft, ChevronDown, Award, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, RotateCcw, MessageSquare,
} from "lucide-react";
import { useState } from "react";
import type { IInterview } from "@/models/Interview";

interface Props {
  interview: IInterview & { _id: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function gradeColor(score: number) {
  if (score >= 80) return { text: "text-accent-green", border: "border-accent-green/40", bg: "bg-accent-green/10", bar: "from-accent-green to-emerald-400", ring: "stroke-accent-green" };
  if (score >= 60) return { text: "text-yellow-400", border: "border-yellow-400/40", bg: "bg-yellow-400/10", bar: "from-yellow-400 to-amber-400", ring: "stroke-yellow-400" };
  if (score >= 40) return { text: "text-accent-orange", border: "border-accent-orange/40", bg: "bg-accent-orange/10", bar: "from-accent-orange to-orange-400", ring: "stroke-accent-orange" };
  return { text: "text-red-400", border: "border-red-400/40", bg: "bg-red-400/10", bar: "from-red-400 to-rose-400", ring: "stroke-red-400" };
}

function questionScoreColor(score: number) {
  if (score >= 8) return { pill: "bg-accent-green/15 text-accent-green border-accent-green/30", bar: "bg-accent-green" };
  if (score >= 6) return { pill: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30", bar: "bg-yellow-400" };
  if (score >= 4) return { pill: "bg-accent-orange/15 text-accent-orange border-accent-orange/30", bar: "bg-accent-orange" };
  return { pill: "bg-red-400/15 text-red-400 border-red-400/30", bar: "bg-red-400" };
}

// Circular SVG score ring
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const c = gradeColor(score);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-bg-border" />
        <circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          className={`${c.ring} transition-all duration-1000`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-black ${c.text}`}>{grade}</span>
        <span className="text-xs text-text-muted font-medium">{score}%</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-xs font-bold text-text">{val}%</span>
      </div>
      <div className="h-2 rounded-full bg-bg-border overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${val}%` }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InterviewReport({ interview }: Props) {
  const report = interview.report!;
  const [expandedQ, setExpandedQ] = useState<string | null>(report.questionReports[0]?.questionId ?? null);
  const c = gradeColor(report.overallScore);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Back */}
      <Link href="/interview"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Interviews
      </Link>

      {/* ── Hero header ─────────────────────────────────────────────── */}
      <div className={`glass-card rounded-2xl border ${c.border} p-6`}>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <ScoreRing score={report.overallScore} grade={report.grade} />

          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border mb-3 ${c.bg} ${c.border} ${c.text}`}>
              <Award className="w-3 h-3" />
              {report.overallScore >= 80 ? "Excellent" : report.overallScore >= 60 ? "Good" : report.overallScore >= 40 ? "Needs Work" : "Poor"}
            </div>
            <h1 className="text-lg font-bold text-text mb-1 leading-snug">{interview.title}</h1>
            <p className="text-sm text-text-muted leading-relaxed mb-4">{report.summary}</p>

            {/* Mini scores row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Correctness", val: report.correctness },
                { label: "Structure", val: report.structure },
                { label: "Confidence", val: report.confidence },
              ].map(({ label, val }) => {
                const sc = gradeColor(val);
                return (
                  <div key={label} className="bg-bg-surface rounded-xl border border-bg-border px-3 py-2 text-center">
                    <div className={`text-xl font-black ${sc.text}`}>{val}%</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Score breakdown bars ────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-bg-border p-5 space-y-3.5">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Score Breakdown
        </h2>
        <ScoreBar label="Overall Score" val={report.overallScore} color="from-primary to-primary-light" />
        <ScoreBar label="Correctness" val={report.correctness} color="from-accent-green to-emerald-400/60" />
        <ScoreBar label="Structure" val={report.structure} color="from-accent-blue to-accent-blue/60" />
        <ScoreBar label="Confidence" val={report.confidence} color="from-yellow-400 to-yellow-400/60" />
      </div>

      {/* ── Strengths & Improvements ────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl border border-accent-green/20 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-accent-green" /> Strengths
          </h2>
          <ul className="space-y-2.5">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-text-muted leading-relaxed">
                <span className="w-4 h-4 rounded-full bg-accent-green/15 text-accent-green flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card rounded-2xl border border-yellow-400/20 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> Areas to Improve
          </h2>
          <ul className="space-y-2.5">
            {report.improvements.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-text-muted leading-relaxed">
                <span className="w-4 h-4 rounded-full bg-yellow-400/15 text-yellow-400 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Per-question breakdown ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Question Breakdown
          </h2>
          <span className="text-xs text-text-muted">{report.questionReports.length} questions</span>
        </div>

        {report.questionReports.map((qr, i) => {
          const isOpen = expandedQ === qr.questionId;
          const sc = questionScoreColor(qr.score);
          const scorePct = qr.score * 10;

          return (
            <div key={qr.questionId}
              className={`glass-card rounded-2xl border overflow-hidden transition-all ${isOpen ? "border-primary/30" : "border-bg-border"}`}>

              {/* Question header — always visible, full text, never truncated */}
              <button
                onClick={() => setExpandedQ(isOpen ? null : qr.questionId)}
                className="w-full text-left px-5 py-4 hover:bg-bg-border/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Score pill */}
                  <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold tabular-nums ${sc.pill}`}>
                    {qr.score}/10
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Q number */}
                    <div className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1">
                      Question {i + 1}
                    </div>
                    {/* Full question — wraps, never truncates */}
                    <p className="text-sm text-text leading-relaxed">
                      {qr.questionText}
                    </p>

                    {/* Mini score bar always visible */}
                    <div className="mt-2.5 h-1 rounded-full bg-bg-border overflow-hidden">
                      <div className={`h-full rounded-full ${sc.bar} transition-all duration-700`}
                        style={{ width: `${scorePct}%` }} />
                    </div>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 mt-1 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-bg-border">

                  {/* Answer */}
                  <div className="px-5 pt-4 pb-3">
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Your Answer</div>
                    <div className="bg-bg-surface rounded-xl border border-bg-border px-4 py-3 text-sm text-text leading-relaxed">
                      {qr.answerText || <span className="text-text-muted italic">(no answer recorded)</span>}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div className="px-5 pb-3">
                    <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">Feedback</div>
                    <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-sm text-text leading-relaxed">
                      {qr.feedback}
                    </div>
                  </div>

                  {/* Key points */}
                  {(qr.keyPointsCovered.length > 0 || qr.keyPointsMissed.length > 0) && (
                    <div className="px-5 pb-4 grid sm:grid-cols-2 gap-4">
                      {qr.keyPointsCovered.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-accent-green uppercase tracking-widest mb-2">
                            ✓ Covered
                          </div>
                          <ul className="space-y-1.5">
                            {qr.keyPointsCovered.map((p, j) => (
                              <li key={j} className="flex gap-2 text-xs text-text-muted leading-relaxed">
                                <CheckCircle className="w-3.5 h-3.5 text-accent-green shrink-0 mt-0.5" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {qr.keyPointsMissed.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2">
                            ✗ Missed
                          </div>
                          <ul className="space-y-1.5">
                            {qr.keyPointsMissed.map((p, j) => (
                              <li key={j} className="flex gap-2 text-xs text-text-muted leading-relaxed">
                                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer actions ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pb-6">
        <Link
          href={`/interview/${interview._id}`}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-bg-border text-sm text-text-muted hover:text-text transition-colors font-medium"
        >
          <RotateCcw className="w-4 h-4" /> Retake Interview
        </Link>
        <Link
          href="/interview"
          className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm"
        >
          New Interview
        </Link>
      </div>
    </div>
  );
}
