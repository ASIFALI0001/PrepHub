"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  sourceHint?: string;
}

interface Props {
  questions: Question[];
}

const CATEGORY_COLORS: Record<string, string> = {
  DSA: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  "System Design": "text-violet-400 bg-violet-400/10 border-violet-400/20",
  OOPS: "text-primary-light bg-primary/10 border-primary/20",
  "Core CS": "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  Behavioral: "text-accent-green bg-accent-green/10 border-accent-green/20",
  Domain: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
};

const DIFF_COLOR: Record<string, string> = {
  easy: "text-accent-green",
  medium: "text-yellow-400",
  hard: "text-red-400",
};

const ALL_CATEGORIES = ["All", "DSA", "System Design", "OOPS", "Core CS", "Behavioral", "Domain"];

export default function CompanyBrainQuestionsClient({ questions }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeCategory === "All"
    ? questions
    : questions.filter((q) => q.category === activeCategory);

  // Group filtered questions by category
  const grouped = filtered.reduce((acc, q) => {
    if (!acc[q.category]) acc[q.category] = [];
    acc[q.category].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  return (
    <div className="space-y-5">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map((cat) => {
          const count = cat === "All" ? questions.length : questions.filter((q) => q.category === cat).length;
          if (cat !== "All" && count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                activeCategory === cat
                  ? cat === "All"
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : (CATEGORY_COLORS[cat] ?? "bg-primary/15 border-primary/30 text-primary")
                  : "bg-bg-border/50 border-bg-border text-text-muted hover:text-text"
              }`}
            >
              {cat} {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Questions by group */}
      {Object.entries(grouped).map(([category, qs]) => (
        <div key={category} className="space-y-2">
          <div className="flex items-center gap-2 px-1 mb-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${CATEGORY_COLORS[category] ?? "text-text border-bg-border"}`}>
              {category}
            </span>
            <span className="text-xs text-text-muted">{qs.length} question{qs.length > 1 ? "s" : ""}</span>
          </div>

          {qs.map((q, i) => {
            const isOpen = expandedId === q.id;
            return (
              <div key={q.id} className="glass-card rounded-xl border border-bg-border overflow-hidden">
                <button
                  onClick={() => setExpandedId(isOpen ? null : q.id)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-bg-border/20 transition-colors text-left"
                >
                  <span className="text-xs text-text-muted font-medium w-6 shrink-0 pt-0.5">{i + 1}.</span>
                  <p className="flex-1 text-sm text-text leading-relaxed">{q.text}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] font-semibold capitalize ${DIFF_COLOR[q.difficulty] ?? "text-text-muted"}`}>
                      {q.difficulty}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-bg-border px-4 py-3 bg-bg-surface/50 space-y-2">
                    <p className="text-xs text-text-muted leading-relaxed">
                      💡 <span className="font-medium text-text-dim">Tip:</span> Think about the key concepts behind this question. Consider edge cases, time/space complexity if applicable, and real-world examples from your experience.
                    </p>
                    {q.sourceHint && (
                      <p className="text-[10px] text-text-muted border-t border-bg-border pt-2">
                        <span className="opacity-50">Source: </span>
                        <span className="italic">{q.sourceHint}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
