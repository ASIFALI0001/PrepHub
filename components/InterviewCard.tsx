"use client";

import Link from "next/link";
import { useState } from "react";
import { Mic, RotateCcw, Trash2, Clock, ChevronRight, Award } from "lucide-react";

interface Interview {
  _id: string;
  title: string;
  role: string;
  type: string;
  level: string;
  questionCount: number;
  status: "pending" | "in_progress" | "completed";
  report?: { overallScore: number; grade: string } | null;
  createdAt: string;
}

interface Props {
  interview: Interview;
  onDelete: (id: string) => void;
}

const TYPE_STYLE: Record<string, string> = {
  technical: "text-accent-blue bg-accent-blue/10 border-accent-blue/25",
  behavioral: "text-accent-green bg-accent-green/10 border-accent-green/25",
  mixed: "text-primary-light bg-primary/10 border-primary/25",
};

const LEVEL_STYLE: Record<string, string> = {
  beginner: "text-accent-green bg-accent-green/10 border-accent-green/20",
  intermediate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  senior: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
};

function gradeColors(score: number) {
  if (score >= 80) return { text: "text-accent-green", ring: "stroke-accent-green", bg: "bg-accent-green/10 border-accent-green/30" };
  if (score >= 60) return { text: "text-yellow-400", ring: "stroke-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" };
  if (score >= 40) return { text: "text-accent-orange", ring: "stroke-accent-orange", bg: "bg-accent-orange/10 border-accent-orange/30" };
  return { text: "text-red-400", ring: "stroke-red-400", bg: "bg-red-400/10 border-red-400/30" };
}

function GradeRing({ score, grade }: { score: number; grade: string }) {
  const { text, ring } = gradeColors(score);
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-bg-border" />
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          className={`${ring} transition-all duration-700`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-black leading-none ${text}`}>{grade}</span>
        <span className="text-[9px] text-text-muted font-medium">{score}%</span>
      </div>
    </div>
  );
}

export default function InterviewCard({ interview, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/interview/${interview._id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) onDelete(interview._id);
    } catch { /* ignore */ }
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  const date = new Date(interview.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const isCompleted = interview.status === "completed";
  const score = interview.report?.overallScore ?? 0;
  const grade = interview.report?.grade ?? "";
  const { text: scoreText } = interview.report ? gradeColors(score) : { text: "" };

  return (
    <div className={`glass-card rounded-2xl border flex flex-col gap-0 overflow-hidden transition-all duration-200 ${
      isCompleted ? "border-bg-border hover:border-primary/30" : "border-bg-border hover:border-primary/20"
    }`}>

      {/* ── Top section ───────────────────────────────────────────── */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Grade ring or mic icon */}
          {isCompleted && interview.report ? (
            <GradeRing score={score} grade={grade} />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Mic className="w-7 h-7 text-primary-light" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Role label */}
            <div className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">
              {interview.role}
            </div>
            {/* Title */}
            <h3 className="text-base font-bold text-text leading-snug mb-3">
              {interview.title}
            </h3>
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize ${TYPE_STYLE[interview.type] ?? "text-text-muted border-bg-border"}`}>
                {interview.type}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize ${LEVEL_STYLE[interview.level] ?? "text-text-muted border-bg-border"}`}>
                {interview.level}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg border border-bg-border text-text-muted font-medium">
                {interview.questionCount} questions
              </span>
            </div>
          </div>
        </div>

        {/* Score bar for completed */}
        {isCompleted && interview.report && (
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className={`font-semibold ${scoreText}`}>
                {score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work"}
              </span>
              <span className="text-text-muted">{score}%</span>
            </div>
            <div className="h-2 rounded-full bg-bg-border overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                score >= 80 ? "bg-accent-green" : score >= 60 ? "bg-yellow-400" : score >= 40 ? "bg-accent-orange" : "bg-red-400"
              }`} style={{ width: `${score}%` }} />
            </div>
          </div>
        )}

        {/* Status for pending */}
        {!isCompleted && (
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${interview.status === "in_progress" ? "bg-yellow-400 animate-pulse" : "bg-bg-border"}`} />
            <span className="text-xs text-text-muted capitalize">
              {interview.status === "in_progress" ? "In progress" : "Not started"}
            </span>
          </div>
        )}
      </div>

      {/* ── Divider + footer ─────────────────────────────────────── */}
      <div className="border-t border-bg-border px-6 py-4 bg-bg-surface/30 space-y-3">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          {date}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5">
          {isCompleted ? (
            <>
              <Link href={`/interview/${interview._id}/report`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary/10 border border-primary/25 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
                <Award className="w-4 h-4" /> View Report
              </Link>
              <Link href={`/interview/${interview._id}`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-bg-border text-sm font-medium text-text-muted hover:text-text hover:border-primary/30 transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </Link>
            </>
          ) : (
            <Link href={`/interview/${interview._id}`}
              className="flex-1 btn-primary flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm">
              <Mic className="w-4 h-4" />
              {interview.status === "in_progress" ? "Continue Interview" : "Start Interview"}
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          {/* Delete */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="px-3 py-2.5 rounded-xl border border-bg-border text-text-muted hover:text-red-400 hover:border-red-400/30 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs px-3 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 font-semibold border border-red-500/20">
                {deleting ? "…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-2 rounded-xl bg-bg-border text-text-muted hover:text-text">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
