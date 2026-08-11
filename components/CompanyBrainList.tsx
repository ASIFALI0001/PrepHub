"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Brain } from "lucide-react";
import CompanyBrainCard from "./CompanyBrainCard";
import { staggerContainer, fadeUp, duration, easeOutExpo } from "@/lib/motion";

interface Card {
  _id: string;
  companyName: string;
  role: string;
  description: string;
  sources: string[];
  createdAt: string;
}

export default function CompanyBrainList() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/company-brain", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) => setCards((prev) => prev.filter((c) => c._id !== id));

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => router.push("/company-brain/new")} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Research a company
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3.5 w-24" /><div className="skeleton h-3 w-16" /></div>
              </div>
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-9 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.slow, ease: easeOutExpo }}
          className="glass-card rounded-2xl p-12 sm:p-16 text-center relative overflow-hidden"
        >
          <div className="grid-backdrop absolute inset-0 opacity-70" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-accent-pink/10 border border-accent-pink/20 flex items-center justify-center mx-auto mb-5 text-accent-pink">
              <Brain className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">No research yet</h3>
            <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto leading-relaxed">
              Enter a company name and role — PrepHub scrapes Reddit &amp; GitHub, then Gemini generates tailored interview questions.
            </p>
            <button onClick={() => router.push("/company-brain/new")} className="btn-primary inline-flex gap-2">
              <Plus className="w-4 h-4" /> Research a company
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {cards.map((card) => (
              <motion.div key={card._id} layout variants={fadeUp} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}>
                <CompanyBrainCard card={card} onDelete={handleDelete} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
