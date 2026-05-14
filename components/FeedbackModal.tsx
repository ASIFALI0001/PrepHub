"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Loader2, CheckCircle, MessageSquare } from "lucide-react";

const FEATURES: { key: string; label: string; emoji: string }[] = [
  { key: "learn",        label: "Learn",         emoji: "📚" },
  { key: "quiz",         label: "Quiz",          emoji: "⚡" },
  { key: "interview",    label: "AI Interview",  emoji: "🎙️" },
  { key: "companyBrain", label: "Company Brain", emoji: "🧠" },
  { key: "ats",          label: "ATS Checker",   emoji: "📄" },
  { key: "careerGuide",  label: "Career Guide",  emoji: "🧭" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110">
          <Star className={`w-6 h-6 transition-colors ${i <= (hover || value) ? "text-amber-400 fill-amber-400" : "text-bg-border"}`} />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackModal({ open, onClose }: Props) {
  const [ratings, setRatings] = useState<Record<string, number>>({
    learn: 0, quiz: 0, interview: 0, companyBrain: 0, ats: 0, careerGuide: 0,
  });
  const [text,    setText]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  // Load existing feedback on open
  useEffect(() => {
    if (!open) return;
    fetch("/api/feedback", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.feedback) {
          setRatings(d.feedback.ratings ?? ratings);
          setText(d.feedback.text ?? "");
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ratings, text }),
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => { setDone(false); onClose(); }, 1800);
      } else {
        setError("Failed to submit feedback");
      }
    } catch { setError("Failed to submit feedback"); }
    finally { setSaving(false); }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose} />

          {/* Modal */}
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="relative z-10 w-full max-w-lg glass-card rounded-3xl border border-bg-border p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-text">Share your feedback</h2>
                <p className="text-xs text-text-muted mt-0.5">Rate each feature and leave a suggestion</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg glass border border-bg-border flex items-center justify-center hover:border-primary/40 transition-colors">
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <CheckCircle className="w-12 h-12 text-accent-green" />
                <p className="text-base font-bold text-text">Thanks for your feedback!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Feature ratings */}
                <div className="space-y-4">
                  {FEATURES.map(({ key, label, emoji }) => (
                    <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-bg-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{emoji}</span>
                        <span className="text-sm font-medium text-text">{label}</span>
                      </div>
                      <StarRating
                        value={ratings[key] ?? 0}
                        onChange={(v) => setRatings(prev => ({ ...prev, [key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                {/* Text feedback */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Anything else to share? <span className="font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Suggestions, bugs, features you'd love to see…"
                    rows={3}
                    className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button type="submit" disabled={saving}
                  className="w-full btn-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit feedback"}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
