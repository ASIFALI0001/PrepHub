"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Brain } from "lucide-react";

const floatingBadges = [
  { icon: "🧠", label: "AI Interviewer", delay: 0, x: "-left-4", y: "top-1/4" },
  { icon: "⚡", label: "Live Feedback", delay: 0.5, x: "-right-4", y: "top-1/3" },
  { icon: "📈", label: "Track Progress", delay: 1, x: "left-8", y: "bottom-1/4" },
];

const stats = [
  { value: "1300+", label: "DSA Questions" },
  { value: "10+", label: "Topic Tracks" },
  { value: "AI-Powered", label: "Mock Interviews" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 pb-24 px-6">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-glow-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/8 rounded-full blur-3xl pointer-events-none animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/30 text-sm text-primary mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Your AI interview coach is ready</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl sm:text-7xl lg:text-8xl font-black leading-none tracking-tight mb-6"
        >
          <span className="gradient-text">PrepHub</span>
          <br />
          <span className="text-text text-4xl sm:text-5xl lg:text-6xl font-bold mt-2 block">
            Ace every interview.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          One platform to{" "}
          <span className="text-text font-medium">learn</span> curated concepts,{" "}
          <span className="text-text font-medium">quiz</span> yourself with timed MCQs, and practice{" "}
          <span className="text-text font-medium">live AI voice interviews</span> — all tracked on your personal dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/signup"
            className="btn-primary flex items-center gap-2 text-base px-8 py-4 group"
          >
            Start preparing free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="btn-ghost text-base px-8 py-4">
            I have an account
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 sm:gap-16"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold gradient-text">{s.value}</div>
              <div className="text-sm text-text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Floating pills */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute left-8 top-1/3 hidden xl:flex items-center gap-2 glass px-4 py-2.5 rounded-full border border-bg-border animate-float"
      >
        <Brain className="w-4 h-4 text-primary" />
        <span className="text-sm text-text-muted">AI Interviewer</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute right-8 top-2/5 hidden xl:flex items-center gap-2 glass px-4 py-2.5 rounded-full border border-bg-border animate-float-delayed"
      >
        <Zap className="w-4 h-4 text-accent-cyan" />
        <span className="text-sm text-text-muted">Instant feedback</span>
      </motion.div>
    </section>
  );
}
