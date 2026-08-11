"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, RotateCcw, Trash2, Clock, ChevronRight, FileText } from "lucide-react";
import { scoreTheme } from "@/lib/score";

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
  technical: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  behavioral: "text-accent-green bg-accent-green/10 border-accent-green/20",
  mixed: "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
};

function GradeRing({ score, grade }: { score: number; grade: string }) {
  const t = scoreTheme(score);
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="4.5" className="text-bg-border" />
        <motion.circle
          cx="30" cy="30" r={r} fill="none" strokeWidth="4.5"
          strokeLinecap="round" className={t.ring}
          strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold leading-none ${t.text}`}>{grade}</span>
        <span className="tnum text-[9px] text-text-muted font-medium mt-0.5">{score}%</span>
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
  const t = interview.report ? scoreTheme(score) : null;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="group glass-card rounded-2xl overflow-hidden h-full flex flex-col hover:border-text-dim/25 transition-colors"
    >
      <div className="p-5 sm:p-6 flex-1">
        <div className="flex items-start gap-4">
          {isCompleted && interview.report ? (
            <GradeRing score={score} grade={grade} />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 text-primary">
              <Mic className="w-6 h-6" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="eyebrow mb-1 truncate">{interview.role}</div>
            <h3 className="text-base font-bold text-text leading-snug mb-3 line-clamp-2">
              {interview.title}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-md border font-medium capitalize ${TYPE_STYLE[interview.type] ?? "text-text-muted border-bg-border"}`}>
                {interview.type}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md border border-bg-border text-text-muted font-medium capitalize">
                {interview.level}
              </span>
              <span className="tnum text-[11px] px-2 py-0.5 rounded-md border border-bg-border text-text-muted font-medium">
                {interview.questionCount} Qs
              </span>
            </div>
          </div>
        </div>

        {isCompleted && interview.report && t && (
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className={`font-semibold ${t.text}`}>{t.label}</span>
              <span className="tnum text-text-muted">{score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg-surface overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${t.bar}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${score}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        )}

        {!isCompleted && (
          <div className="mt-4 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${interview.status === "in_progress" ? "bg-accent-orange animate-pulse" : "bg-text-dim"}`} />
            <span className="text-xs text-text-muted capitalize">
              {interview.status === "in_progress" ? "In progress" : "Not started"}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-bg-border px-5 sm:px-6 py-4 bg-bg-surface/40 space-y-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="w-3.5 h-3.5" /> {date}
        </div>

        <div className="flex gap-2">
          {isCompleted ? (
            <>
              <Link href={`/interview/${interview._id}/report`}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors">
                <FileText className="w-4 h-4" /> View report
              </Link>
              <Link href={`/interview/${interview._id}`}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-bg-border text-sm font-medium text-text-muted hover:text-text hover:bg-bg-card transition-colors">
                <RotateCcw className="w-3.5 h-3.5" /> Retake
              </Link>
            </>
          ) : (
            <Link href={`/interview/${interview._id}`}
              className="flex-1 btn-primary justify-center gap-2 group/btn">
              <Mic className="w-4 h-4" />
              {interview.status === "in_progress" ? "Continue" : "Start interview"}
              <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {!confirmDelete ? (
              <motion.button
                key="trash"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete interview"
                className="px-3 py-2.5 rounded-lg border border-bg-border text-text-muted hover:text-accent-pink hover:border-accent-pink/30 hover:bg-accent-pink/5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                className="flex gap-1.5 overflow-hidden"
              >
                <button onClick={handleDelete} disabled={deleting}
                  className="text-xs px-3 py-2 rounded-lg bg-accent-pink/15 text-accent-pink hover:bg-accent-pink/25 font-semibold border border-accent-pink/20 whitespace-nowrap">
                  {deleting ? "…" : "Delete"}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-xs px-3 py-2 rounded-lg border border-bg-border text-text-muted hover:text-text whitespace-nowrap">
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
