"use client";

import Link from "next/link";
import { ChevronLeft, ChevronDown, Award, TrendingUp, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import type { IInterview } from "@/models/Interview";

interface Props {
  interview: IInterview & { _id: string };
}

function ScoreBadge({ score, max = 100 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const color =
    pct >= 80 ? "text-accent-green" :
    pct >= 60 ? "text-yellow-400" :
    pct >= 40 ? "text-accent-orange" :
    "text-red-400";
  return <span className={`font-bold ${color}`}>{score}{max !== 100 ? `/${max}` : ""}</span>;
}

function GradeCircle({ grade, score }: { grade: string; score: number }) {
  const color =
    score >= 80 ? "text-accent-green border-accent-green/40 bg-accent-green/10" :
    score >= 60 ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10" :
    score >= 40 ? "text-accent-orange border-accent-orange/40 bg-accent-orange/10" :
    "text-red-400 border-red-400/40 bg-red-400/10";

  return (
    <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center ${color}`}>
      <span className="text-2xl font-black">{grade}</span>
      <span className="text-xs font-medium">{score}%</span>
    </div>
  );
}

export default function InterviewReport({ interview }: Props) {
  const report = interview.report!;
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/interview"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Interviews
      </Link>

      {/* Header */}
      <div className="glass-card rounded-2xl border border-bg-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <GradeCircle grade={report.grade} score={report.overallScore} />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text mb-1">{interview.title}</h1>
            <p className="text-sm text-text-muted mb-3">{report.summary}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                { label: "Correctness", val: report.correctness },
                { label: "Structure", val: report.structure },
                { label: "Confidence", val: report.confidence },
              ].map(({ label, val }) => (
                <div key={label} className="text-sm">
                  <span className="text-text-muted">{label}: </span>
                  <ScoreBadge score={val} />
                  <span className="text-text-muted text-xs">%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown bars */}
      <div className="glass-card rounded-2xl border border-bg-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Score Breakdown
        </h2>
        {[
          { label: "Overall Score", val: report.overallScore, color: "from-primary to-primary-light" },
          { label: "Correctness", val: report.correctness, color: "from-accent-green to-accent-green/60" },
          { label: "Structure", val: report.structure, color: "from-accent-blue to-accent-blue/60" },
          { label: "Confidence", val: report.confidence, color: "from-yellow-400 to-yellow-400/60" },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">{label}</span>
              <span className="font-semibold text-text">{val}%</span>
            </div>
            <div className="h-2 rounded-full bg-bg-border overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl border border-bg-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Award className="w-4 h-4 text-accent-green" /> Strengths
          </h2>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-muted">
                <CheckCircle className="w-3.5 h-3.5 text-accent-green shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card rounded-2xl border border-bg-border p-5 space-y-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" /> Areas to Improve
          </h2>
          <ul className="space-y-2">
            {report.improvements.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-text-muted">
                <XCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text px-1">Question-by-Question Breakdown</h2>
        {report.questionReports.map((qr, i) => {
          const isOpen = expandedQ === qr.questionId;
          const scorePct = qr.score * 10;
          const scoreColor =
            scorePct >= 80 ? "text-accent-green" :
            scorePct >= 60 ? "text-yellow-400" :
            "text-red-400";

          return (
            <div key={qr.questionId} className="glass-card rounded-xl border border-bg-border overflow-hidden">
              <button
                onClick={() => setExpandedQ(isOpen ? null : qr.questionId)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-bg-border/20 transition-colors text-left"
              >
                <div className={`text-sm font-bold w-10 shrink-0 ${scoreColor}`}>{qr.score}/10</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-muted mb-0.5">Q{i + 1}</div>
                  <div className="text-sm text-text truncate">{qr.questionText}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
              </button>

              {isOpen && (
                <div className="border-t border-bg-border px-5 py-4 space-y-4">
                  {/* Score bar */}
                  <div className="h-1.5 rounded-full bg-bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${scorePct >= 80 ? "bg-accent-green" : scorePct >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
                      style={{ width: `${scorePct}%` }}
                    />
                  </div>

                  {/* Answer */}
                  <div>
                    <div className="text-xs font-semibold text-text-muted mb-1">Your Answer</div>
                    <p className="text-xs text-text bg-bg-surface rounded-lg px-3 py-2 leading-relaxed">{qr.answerText || "(no answer)"}</p>
                  </div>

                  {/* Feedback */}
                  <div>
                    <div className="text-xs font-semibold text-text-muted mb-1">Feedback</div>
                    <p className="text-xs text-text leading-relaxed">{qr.feedback}</p>
                  </div>

                  {/* Key points */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {qr.keyPointsCovered.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-accent-green mb-1.5">Covered</div>
                        <ul className="space-y-1">
                          {qr.keyPointsCovered.map((p, j) => (
                            <li key={j} className="flex gap-1.5 text-xs text-text-muted">
                              <CheckCircle className="w-3 h-3 text-accent-green shrink-0 mt-0.5" />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {qr.keyPointsMissed.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-red-400 mb-1.5">Missed</div>
                        <ul className="space-y-1">
                          {qr.keyPointsMissed.map((p, j) => (
                            <li key={j} className="flex gap-1.5 text-xs text-text-muted">
                              <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Retake button */}
      <div className="text-center pb-4">
        <Link
          href="/interview"
          className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium"
        >
          Start New Interview
        </Link>
      </div>
    </div>
  );
}
