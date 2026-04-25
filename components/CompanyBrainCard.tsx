"use client";

import Link from "next/link";
import { useState } from "react";
import { Brain, Clock, Trash2, ChevronRight } from "lucide-react";

interface Card {
  _id: string;
  companyName: string;
  role: string;
  description: string;
  sources: string[];
  createdAt: string;
  // questions count — passed separately since we exclude questions from list fetch
  questionCount?: number;
}

interface Props {
  card: Card;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  DSA: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  "System Design": "text-accent-purple bg-accent-purple/10 border-accent-purple/20",
  OOPS: "text-primary-light bg-primary/10 border-primary/20",
  "Core CS": "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  Behavioral: "text-accent-green bg-accent-green/10 border-accent-green/20",
  Domain: "text-accent-orange bg-accent-orange/10 border-accent-orange/20",
};

export default function CompanyBrainCard({ card, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/company-brain/${card._id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) onDelete(card._id);
    } catch { /* ignore */ }
    finally { setDeleting(false); setConfirmDelete(false); }
  };

  const date = new Date(card.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  // Initials for company avatar
  const initials = card.companyName.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="glass-card rounded-2xl border border-bg-border p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center shrink-0 text-sm font-bold text-accent-pink">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text truncate">{card.companyName}</h3>
          <p className="text-xs text-text-muted truncate">{card.role}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
          <Brain className="w-3 h-3 text-accent-pink" />
          <span>{card.questionCount ?? "35"}Q</span>
        </div>
      </div>

      {/* Description snippet */}
      {card.description && (
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{card.description}</p>
      )}

      {/* Sources count */}
      {card.sources.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] px-2 py-0.5 rounded border border-bg-border text-text-muted">
            {card.sources.length} source{card.sources.length > 1 ? "s" : ""} scraped
          </span>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Clock className="w-3 h-3" />
        {date}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/company-brain/${card._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-accent-pink/10 text-accent-pink hover:bg-accent-pink/20 transition-colors border border-accent-pink/20"
        >
          <Brain className="w-3.5 h-3.5" /> View Questions <ChevronRight className="w-3 h-3" />
        </Link>

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

export { CATEGORY_COLORS };
