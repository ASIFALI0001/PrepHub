"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Mic } from "lucide-react";
import InterviewCard from "./InterviewCard";
import { staggerContainer, fadeUp, duration, easeOutExpo } from "@/lib/motion";

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

export default function InterviewListClient() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/interview", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInterviews(d.interviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (id: string) => {
    setInterviews((prev) => prev.filter((i) => i._id !== id));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="skeleton w-16 h-16 rounded-2xl" />
              <div className="flex-1 space-y-2.5">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-4 w-3/4" />
                <div className="flex gap-2 pt-1">
                  <div className="skeleton h-6 w-16 rounded-lg" />
                  <div className="skeleton h-6 w-20 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="skeleton h-10 w-full rounded-xl mt-6" />
          </div>
        ))}
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.slow, ease: easeOutExpo }}
        className="glass-card rounded-2xl p-12 sm:p-16 text-center relative overflow-hidden"
      >
        <div className="grid-backdrop absolute inset-0 opacity-70 pointer-events-none" />
        <div className="relative">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5 text-primary"
          >
            <Mic className="w-7 h-7" />
          </motion.div>
          <h3 className="text-lg font-semibold text-text mb-2">Your first mock awaits</h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto leading-relaxed">
            Pick a role, type, and level — Gemini crafts a tailored interview, then scores
            you answer-by-answer with a full report.
          </p>
          <button
            onClick={() => router.push("/interview/setup")}
            className="btn-primary inline-flex gap-2"
          >
            <Plus className="w-4 h-4" /> Generate interview
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer(0.07)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <AnimatePresence mode="popLayout">
        {interviews.map((interview) => (
          <motion.div
            key={interview._id}
            layout
            variants={fadeUp}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          >
            <InterviewCard interview={interview} onDelete={handleDelete} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
