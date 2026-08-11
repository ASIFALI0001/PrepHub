"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Clock, Trash2, ChevronRight } from "lucide-react";

interface Card {
  _id: string;
  companyName: string;
  role: string;
  description: string;
  sources: string[];
  createdAt: string;
  questionCount?: number;
}

interface Props {
  card: Card;
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  DSA: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  "System Design": "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
  OOPS: "text-primary bg-primary/10 border-primary/20",
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

  const initials = card.companyName.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <motion.div
      whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-4 h-full hover:border-text-dim/25 transition-colors"
    >
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
          <span className="tnum">{card.questionCount ?? "35"}Q</span>
        </div>
      </div>

      {card.description && (
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed flex-1">{card.description}</p>
      )}

      {card.sources.length > 0 && (
        <div>
          <span className="text-[10px] px-2 py-0.5 rounded-md border border-bg-border text-text-muted">
            {card.sources.length} source{card.sources.length > 1 ? "s" : ""} scraped
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-text-muted">
        <Clock className="w-3 h-3" /> {date}
      </div>

      <div className="flex gap-2">
        <Link
          href={`/company-brain/${card._id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-accent-pink/10 text-accent-pink hover:bg-accent-pink/15 transition-colors border border-accent-pink/20"
        >
          <Brain className="w-3.5 h-3.5" /> View questions <ChevronRight className="w-3 h-3" />
        </Link>

        <AnimatePresence mode="wait" initial={false}>
          {!confirmDelete ? (
            <motion.button
              key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(true)} aria-label="Delete"
              className="px-3 py-2 rounded-lg border border-bg-border text-text-muted hover:text-accent-pink hover:border-accent-pink/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.div key="c" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="flex gap-1 overflow-hidden">
              <button onClick={handleDelete} disabled={deleting}
                className="text-[10px] px-2 py-1 rounded-md bg-accent-pink/15 text-accent-pink hover:bg-accent-pink/25 font-semibold whitespace-nowrap">
                {deleting ? "…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="text-[10px] px-2 py-1 rounded-md border border-bg-border text-text-muted whitespace-nowrap">
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export { CATEGORY_COLORS };
