"use client";

import { motion } from "framer-motion";
import {
  BookOpen, Zap, Mic, BarChart3, Clock, Trophy, ArrowUpRight,
} from "lucide-react";
import { staggerContainer, fadeUp, revealOnScroll } from "@/lib/motion";

const modes = [
  {
    step: "01",
    icon: BookOpen,
    accent: "text-accent-blue",
    ring: "group-hover:border-accent-blue/40",
    title: "Learn",
    description:
      "Curated Q&A banks across DSA, OOPS, DBMS, OS, CN, SQL, MongoDB, React, Next.js & ML — 1,300+ DSA problems across 13 sub-topics.",
    tags: ["DSA", "OOPS", "DBMS", "OS", "CN", "SQL"],
  },
  {
    step: "02",
    icon: Zap,
    accent: "text-accent-cyan",
    ring: "group-hover:border-accent-cyan/40",
    title: "Quiz",
    description:
      "Timed MCQ sessions with configurable length and persistent high-scores per topic. Compete with your past self, one attempt at a time.",
    tags: ["Timed", "MCQ", "High scores", "Per topic"],
  },
  {
    step: "03",
    icon: Mic,
    accent: "text-primary",
    ring: "group-hover:border-primary/40",
    title: "Live Interview",
    description:
      "Gemini plays the interviewer. Answer out loud — the browser Speech API keeps it free. Get scored answers and a full written report.",
    tags: ["AI voice", "Gemini", "Scored", "Report"],
    badge: "Flagship",
  },
];

const perks = [
  { icon: BarChart3, text: "Accuracy trends & weak-topic analysis" },
  { icon: Clock, text: "Daily streak tracking" },
  { icon: Trophy, text: "Interview history & score reports" },
];

export default function Features() {
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div {...revealOnScroll} variants={fadeUp} className="max-w-2xl mb-16">
          <p className="eyebrow mb-4">Three ways to prep</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-text tracking-tight mb-4">
            Everything you need.
            <br />
            <span className="text-text-muted">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-text-muted text-lg leading-relaxed">
            Each mode builds on the last — read to understand, quiz to retain,
            interview to perform.
          </p>
        </motion.div>

        {/* Mode cards */}
        <motion.div
          variants={staggerContainer(0.1)}
          {...revealOnScroll}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <motion.div
                key={mode.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className={`group relative glass-card rounded-2xl p-6 border-bg-border ${mode.ring} transition-colors duration-300`}
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-11 h-11 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${mode.accent}`} />
                  </div>
                  <span className="tnum text-sm font-mono text-text-dim">{mode.step}</span>
                </div>

                <div className="flex items-center gap-2 mb-2.5">
                  <h3 className="text-xl font-bold text-text">{mode.title}</h3>
                  {mode.badge && (
                    <span className="chip !text-primary !border-primary/30 !bg-primary/10">
                      {mode.badge}
                    </span>
                  )}
                </div>
                <p className="text-text-muted text-sm leading-relaxed mb-5">{mode.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {mode.tags.map((tag) => (
                    <span key={tag} className="chip">{tag}</span>
                  ))}
                </div>

                <ArrowUpRight className="absolute top-6 right-14 w-4 h-4 text-text-dim opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Dashboard strip */}
        <motion.div
          {...revealOnScroll}
          variants={fadeUp}
          className="glass-card rounded-2xl p-8 sm:p-10 relative overflow-hidden"
        >
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <p className="eyebrow mb-3">Your dashboard</p>
              <h3 className="text-2xl font-bold text-text mb-2">Progress, at a glance</h3>
              <p className="text-text-muted mb-6 max-w-md">
                Everything you do flows into one focused view — no dashboards to configure.
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {perks.map((perk) => {
                  const Icon = perk.icon;
                  return (
                    <div key={perk.text} className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-text-muted pt-1">{perk.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
