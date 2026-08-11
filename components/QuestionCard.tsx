"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { easeOutExpo } from "@/lib/motion";

export interface Question {
  id: string;
  section: string;
  question: string;
  answer: string;
  frequency: "MOST_FREQ" | "MED" | "LOW";
  sources: string[];
}

interface Props {
  question: Question;
  index: number;
  isLearned: boolean;
  onToggle: (id: string) => void;
  toggling: boolean;
}

const FREQ_CONFIG = {
  MOST_FREQ: { label: "Must know", className: "bg-accent-orange/10 text-accent-orange border-accent-orange/25" },
  MED: { label: "Expected", className: "bg-accent-violet/10 text-accent-violet border-accent-violet/25" },
  LOW: { label: "Deep dive", className: "bg-accent-blue/10 text-accent-blue border-accent-blue/25" },
};

export default function QuestionCard({ question, index, isLearned, onToggle, toggling }: Props) {
  const [open, setOpen] = useState(false);
  const freq = FREQ_CONFIG[question.frequency];

  return (
    <div className={`glass-card rounded-2xl overflow-hidden transition-colors ${
      isLearned ? "border-accent-green/35 bg-accent-green/[0.03]" : "hover:border-text-dim/25"
    }`}>
      <div className="flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-bg-surface/40 transition-colors select-none" onClick={() => setOpen((o) => !o)}>
        <span className="tnum text-sm text-text-dim w-6 shrink-0 text-right font-mono pt-1">{index}</span>

        <div className="flex-1 min-w-0">
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border mb-2 ${freq.className}`}>
            {freq.label}
          </span>
          <p className="text-[15px] font-semibold text-text leading-relaxed">{question.question}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(question.id); }}
            disabled={toggling}
            title={isLearned ? "Mark as not learned" : "Mark as learned"}
            className="transition-transform active:scale-90 disabled:opacity-40"
          >
            {isLearned
              ? <CheckCircle2 className="w-6 h-6 text-accent-green" />
              : <Circle className="w-6 h-6 text-text-dim hover:text-accent-green transition-colors" />}
          </button>
          <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOutExpo }} className="overflow-hidden"
          >
            <div className="border-t border-bg-border bg-bg-surface/40">
              <div className="px-5 py-5 space-y-4">
                <p className="text-sm text-text leading-relaxed">{question.answer}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-text-muted font-medium">Sources:</span>
                  {question.sources.map((src) => (
                    <span key={src} className="chip">{src}</span>
                  ))}
                </div>
              </div>
              <div className="border-t border-bg-border px-5 py-3.5">
                <button
                  onClick={() => onToggle(question.id)}
                  disabled={toggling}
                  className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50 ${
                    isLearned
                      ? "bg-accent-green/10 text-accent-green border border-accent-green/25 hover:bg-accent-green/20"
                      : "border border-bg-border text-text-muted hover:bg-primary/10 hover:text-primary hover:border-primary/25"
                  }`}
                >
                  {isLearned
                    ? <><CheckCircle2 className="w-4 h-4" /> Marked as learned</>
                    : <><Circle className="w-4 h-4" /> Mark as learned</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
