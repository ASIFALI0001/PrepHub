"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Mic, Zap, GraduationCap, Flame, Check } from "lucide-react";
import { staggerContainer, fadeUp, duration, easeOutExpo } from "@/lib/motion";

const stats = [
  { value: "1,300+", label: "DSA problems" },
  { value: "10", label: "topic tracks" },
  { value: "AI voice", label: "mock interviews" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
      <div className="grid-backdrop absolute inset-0 pointer-events-none" />

      <motion.div
        variants={staggerContainer(0.09, 0.05)}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-4xl mx-auto text-center"
      >
        {/* Announcement */}
        <motion.div variants={fadeUp} className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full glass text-sm">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-70 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              New
            </span>
            <span className="text-text-muted">AI voice mock interviews are live</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-[2.75rem] sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tightest text-text mb-6"
        >
          The calm way to
          <br />
          ace every{" "}
          <span className="relative whitespace-nowrap text-primary">
            interview
            <svg
              className="absolute -bottom-2 left-0 w-full"
              viewBox="0 0 300 12"
              fill="none"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M2 9C60 3 120 3 180 5C230 6.5 270 7 298 4"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.6, ease: easeOutExpo }}
              />
            </svg>
          </span>
          .
        </motion.h1>

        {/* Subhead */}
        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-text-muted max-w-2xl mx-auto mb-9 leading-relaxed"
        >
          Learn curated concepts, drill timed quizzes, and rehearse live AI voice
          interviews — every session tracked on one focused dashboard.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
        >
          <Link href="/signup" className="btn-primary group text-base px-6 py-3 gap-2 w-full sm:w-auto">
            Start preparing — it&apos;s free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/login" className="btn-ghost text-base px-6 py-3 w-full sm:w-auto">
            I have an account
          </Link>
        </motion.div>

        <motion.p variants={fadeUp} className="flex items-center justify-center gap-4 text-xs text-text-dim mb-14">
          {["No credit card", "Free forever tier", "Setup in 30s"].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent-green" /> {t}
            </span>
          ))}
        </motion.p>

        {/* Stats */}
        <motion.div
          variants={fadeUp}
          className="flex items-stretch justify-center divide-x divide-bg-border"
        >
          {stats.map((s) => (
            <div key={s.label} className="px-4 sm:px-10 text-center">
              <div className="tnum text-2xl sm:text-3xl font-bold text-text">{s.value}</div>
              <div className="text-xs sm:text-sm text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Product preview */}
      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  const rows = [
    { icon: Flame, label: "Day streak", value: "7 days", accent: "text-accent-orange", w: "72%" },
    { icon: Zap, label: "Quiz accuracy", value: "84%", accent: "text-accent-green", w: "84%" },
    { icon: GraduationCap, label: "Concepts learned", value: "142", accent: "text-accent-blue", w: "58%" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: duration.slower, delay: 0.5, ease: easeOutExpo }}
      style={{ perspective: 1200 }}
      className="relative z-10 w-full max-w-4xl mx-auto mt-16"
    >
      <div className="glass-card rounded-2xl shadow-glow-lg overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-bg-border bg-bg-surface/60">
          <span className="w-3 h-3 rounded-full bg-accent-orange/60" />
          <span className="w-3 h-3 rounded-full bg-accent-green/50" />
          <span className="w-3 h-3 rounded-full bg-bg-border" />
          <div className="ml-3 h-6 flex-1 max-w-xs rounded-md bg-bg-card border border-bg-border flex items-center px-2.5 text-[11px] text-text-dim">
            prephub.app/dashboard
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_0.9fr] gap-0">
          {/* left: stats */}
          <div className="p-6 space-y-4">
            <div>
              <div className="eyebrow mb-1">Overview</div>
              <div className="text-lg font-semibold text-text">Welcome back, Asif</div>
            </div>
            <div className="space-y-3">
              {rows.map(({ icon: Icon, label, value, accent, w }, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-bg-surface border border-bg-border flex items-center justify-center ${accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-text-muted">{label}</span>
                      <span className="tnum font-semibold text-text">{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-bg-surface overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary/80"
                        initial={{ width: 0 }}
                        animate={{ width: w }}
                        transition={{ duration: 0.9, delay: 1 + i * 0.12, ease: easeOutExpo }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right: live interview mock */}
          <div className="p-6 border-t md:border-t-0 md:border-l border-bg-border bg-bg-surface/40">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-text">Live AI Interview</div>
                <div className="text-[11px] text-accent-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" /> recording
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="text-xs text-text-muted bg-bg-card border border-bg-border rounded-lg rounded-tl-sm p-2.5">
                Explain how a hash map handles collisions.
              </div>
              <div className="text-xs text-text bg-primary/10 border border-primary/20 rounded-lg rounded-tr-sm p-2.5 ml-6">
                Chaining stores collisions in a linked list per bucket, while open addressing probes for the next free slot…
              </div>
              <div className="flex items-center gap-1 pt-1">
                {[10, 16, 8, 20, 12, 22, 9, 15, 7].map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-1 rounded-full bg-primary/50"
                    animate={{ height: [h, h * 1.7, h] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                    style={{ height: h }}
                  />
                ))}
                <span className="ml-auto tnum text-[11px] text-text-dim">02:14</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* soft grounding shadow */}
      <div className="absolute -bottom-6 inset-x-10 h-12 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
    </motion.div>
  );
}
