"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, MessageSquare, Loader2, CheckCircle, Send } from "lucide-react";

const FEATURES: { key: string; label: string; emoji: string; desc: string }[] = [
  { key: "learn",        label: "Learn",         emoji: "📚", desc: "Topic Q&A library — DSA, OOPS, DBMS, OS, CN, SQL" },
  { key: "quiz",         label: "Quiz",          emoji: "⚡", desc: "Timed MCQ sessions per topic" },
  { key: "interview",    label: "AI Interview",  emoji: "🎙️", desc: "Voice-based mock interviews with AI" },
  { key: "companyBrain", label: "Company Brain", emoji: "🧠", desc: "Company-specific interview question generator" },
  { key: "ats",          label: "ATS Checker",   emoji: "📄", desc: "Resume ATS scoring and LaTeX resume builder" },
  { key: "careerGuide",  label: "Career Guide",  emoji: "🧭", desc: "AI career path recommendation and roadmap" },
];

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-3" onMouseLeave={() => setHover(0)}>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button"
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
            className="focus:outline-none">
            <Star className={`w-8 h-8 transition-colors duration-100 ${i <= active ? "text-amber-400 fill-amber-400" : "text-bg-border"}`} />
          </button>
        ))}
      </div>
      <span className="w-20 text-sm font-semibold text-amber-400">
        {active > 0 ? LABELS[active] : ""}
      </span>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>({
    learn: 0, quiz: 0, interview: 0, companyBrain: 0, ats: 0, careerGuide: 0,
  });
  const [text,    setText]    = useState("");
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/feedback", { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.feedback) {
          setRatings(d.feedback.ratings ?? ratings);
          setText(d.feedback.text ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setError("Failed to submit. Please try again.");
      }
    } catch { setError("Failed to submit. Please try again."); }
    finally { setSaving(false); }
  }

  const totalRated = Object.values(ratings).filter(v => v > 0).length;

  if (loading) return (
    <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    </main>
  );

  return (
    <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
      <div className="mesh-gradient fixed inset-0 pointer-events-none" />
      <div className="relative z-10 max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4">
            <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-1">Share your feedback</h1>
          <p className="text-sm text-text-muted">Rate each feature and help us improve PrepHub</p>
        </motion.div>

        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl border border-accent-green/30 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-accent-green mx-auto mb-4" />
            <h2 className="text-xl font-bold text-text mb-2">Thank you!</h2>
            <p className="text-text-muted text-sm">Your feedback has been submitted. Redirecting to dashboard…</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}>

            {/* Feature ratings */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl border border-bg-border overflow-hidden mb-5">
              <div className="px-6 py-4 border-b border-bg-border">
                <h2 className="text-sm font-bold text-text">Rate each feature</h2>
                <p className="text-xs text-text-muted mt-0.5">{totalRated} of {FEATURES.length} rated</p>
              </div>

              <div className="divide-y divide-bg-border">
                {FEATURES.map(({ key, label, emoji, desc }, i) => (
                  <motion.div key={key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-lg">{emoji}</span>
                        <span className="text-sm font-semibold text-text">{label}</span>
                        {ratings[key] > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">
                            {ratings[key]}/5
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted pl-7">{desc}</p>
                    </div>
                    <StarRating
                      value={ratings[key] ?? 0}
                      onChange={(v) => setRatings(prev => ({ ...prev, [key]: v }))}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Text feedback */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl border border-bg-border p-6 mb-5">
              <label className="flex items-center gap-2 text-sm font-bold text-text mb-3">
                <MessageSquare className="w-4 h-4 text-primary" />
                Anything else to share?
                <span className="text-xs font-normal text-text-muted">(optional)</span>
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={5}
                placeholder="Tell us about bugs you found, features you'd love to see, what worked great, or anything on your mind…"
                className="w-full bg-bg-surface border border-bg-border rounded-xl px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
            </motion.div>

            {error && (
              <p className="text-xs text-accent-pink mb-4">{error}</p>
            )}

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={() => router.back()} className="btn-ghost flex-1 justify-center py-3.5">
                Cancel
              </button>
              <button type="submit" disabled={saving || totalRated === 0}
                className="flex-1 btn-primary py-3.5 justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <><Send className="w-4 h-4" /> Submit Feedback</>
                }
              </button>
            </motion.div>

            {totalRated === 0 && (
              <p className="text-xs text-text-muted text-center mt-3">Rate at least one feature to submit</p>
            )}

          </form>
        )}
      </div>
    </main>
  );
}
