"use client";

import Link from "next/link";
import { useState } from "react";
import { Mic, FileText, Trash2, Clock, ChevronRight, Award } from "lucide-react";

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

const TYPE_COLOR: Record<string, string> = {
  technical: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  behavioral: "text-accent-green bg-accent-green/10 border-accent-green/20",
  mixed: "text-primary-light bg-primary/10 border-primary/20",
};

const LEVEL_COLOR: Record<string, string> = {
  beginner: "text-accent-green",
  intermediate: "text-yellow-400",
  senior: "text-accent-orange",
};

export default function InterviewCard({ interview, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/interview/${interview._id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) onDelete(interview._id);
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const date = new Date(interview.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  const scoreColor =
    !interview.report ? "" :
    interview.report.overallScore >= 80 ? "text-accent-green" :
    interview.report.overallScore >= 60 ? "text-yellow-400" :
    "text-red-400";

  return (
    <div className="glass-card rounded-2xl border border-bg-border p-5 flex flex-col gap-4">
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text truncate mb-1">{interview.title}</h3>
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${TYPE_COLOR[interview.type] ?? ""}`}>
              {interview.type}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded border border-bg-border capitalize ${LEVEL_COLOR[interview.level] ?? "text-text-muted"}`}>
              {interview.level}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-bg-border text-text-muted">
              {interview.questionCount}Q
            </span>
          </div>
        </div>

        {interview.report && (
          <div className="shrink-0 text-center">
            <div className={`text-xl font-black ${scoreColor}`}>{interview.report.grade}</div>
            <div className="text-[10px] text-text-muted">{interview.report.overallScore}%</div>
          </div>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Clock className="w-3 h-3" />
        {date}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {interview.status === "completed" ? (
          <Link
            href={`/interview/${interview._id}/report`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
          >
            <Award className="w-3.5 h-3.5" /> View Report
          </Link>
        ) : (
          <Link
            href={`/interview/${interview._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg btn-primary"
          >
            <Mic className="w-3.5 h-3.5" />
            {interview.status === "in_progress" ? "Continue" : "Start Interview"}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}

        {interview.status === "completed" && (
          <Link
            href={`/interview/${interview._id}`}
            className="flex items-center justify-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-bg-border text-text-muted hover:text-text transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Retake
          </Link>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-2 rounded-lg border border-bg-border text-text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] px-2 py-1 rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 font-medium"
            >
              {deleting ? "…" : "Delete"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[10px] px-2 py-1 rounded bg-bg-border text-text-muted"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
