"use client";

import { motion } from "framer-motion";
import { BookOpen, Zap, Mic, BarChart3, Clock, Trophy } from "lucide-react";

const modes = [
  {
    icon: BookOpen,
    color: "text-accent-blue",
    glow: "shadow-glow-blue",
    bg: "bg-accent-blue/10 group-hover:bg-accent-blue/15",
    border: "group-hover:border-accent-blue/40",
    title: "Learn",
    description:
      "Curated Q&A banks across DSA, OOPS, DBMS, OS, CN, SQL, MongoDB, React, Next.js, and ML. 1,300+ DSA problems across 13 sub-topics.",
    tags: ["DSA", "OOPS", "DBMS", "OS", "CN", "SQL", "ML"],
  },
  {
    icon: Zap,
    color: "text-accent-cyan",
    glow: "shadow-glow-cyan",
    bg: "bg-accent-cyan/10 group-hover:bg-accent-cyan/15",
    border: "group-hover:border-accent-cyan/40",
    title: "Quiz",
    description:
      "Timed MCQ sessions with configurable question counts. Persistent high-score tracking per topic — compete with your past self.",
    tags: ["Timed", "MCQ", "High Scores", "Per Topic"],
  },
  {
    icon: Mic,
    color: "text-primary-light",
    glow: "shadow-glow",
    bg: "bg-primary/10 group-hover:bg-primary/15",
    border: "group-hover:border-primary/40",
    title: "Live Interview",
    description:
      "Google Gemini plays the interviewer. You answer via voice — the browser's Speech API keeps it free. Get scored answers and a full report.",
    tags: ["AI Voice", "Gemini", "Scored", "Full Report"],
    badge: "Flagship",
  },
];

const perks = [
  { icon: BarChart3, text: "Accuracy trends & weak-topic analysis" },
  { icon: Clock, text: "Daily streak tracking" },
  { icon: Trophy, text: "Interview history & score reports" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Three ways to prep
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-text mb-4">
            Everything you need, nothing you don't
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Each mode builds on the last — read to understand, quiz to retain, interview to perform.
          </p>
        </motion.div>

        {/* Mode cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        >
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.title}
                variants={item}
                className={`group relative glass-card rounded-2xl p-6 border border-bg-border ${mode.border} transition-all duration-300 hover:-translate-y-1 cursor-default`}
              >
                {mode.badge && (
                  <span className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {mode.badge}
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl ${mode.bg} flex items-center justify-center mb-5 transition-colors`}>
                  <Icon className={`w-6 h-6 ${mode.color}`} />
                </div>
                <h3 className="text-xl font-bold text-text mb-3">{mode.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed mb-5">{mode.description}</p>
                <div className="flex flex-wrap gap-2">
                  {mode.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-md bg-bg-border/60 text-text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Dashboard perks strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl border border-bg-border p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-text mb-2">Personal Dashboard</h3>
            <p className="text-text-muted">Your progress, at a glance.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {perks.map((perk) => {
              const Icon = perk.icon;
              return (
                <div key={perk.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm text-text-muted">{perk.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
