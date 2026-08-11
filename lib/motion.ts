import type { Variants, Transition } from "framer-motion";

/**
 * PrepHub motion system — the shared vocabulary for every animated surface.
 * Philosophy (Precision/Editorial): quick, decisive, no bounce. Motion
 * clarifies hierarchy and continuity; it never performs for its own sake.
 */

// Signature easings
export const easeOutExpo = [0.16, 1, 0.3, 1] as const; // premium settle
export const easeStandard = [0.4, 0, 0.2, 1] as const; // material-ish
export const easeInOutSoft = [0.65, 0, 0.35, 1] as const;

export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.5,
  slower: 0.7,
} as const;

export const spring = {
  // Crisp, low-overshoot spring for layout/hover
  snappy: { type: "spring", stiffness: 420, damping: 34, mass: 0.9 } as Transition,
  gentle: { type: "spring", stiffness: 260, damping: 30 } as Transition,
} as const;

// ── Entrance primitives ──────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: easeOutExpo } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easeOutExpo } },
};

export const fadeUpSm: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easeOutExpo } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: duration.base, ease: easeOutExpo } },
};

// ── Stagger orchestration ────────────────────────────────────────────
export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const staggerItem: Variants = fadeUp;

// ── List enter/exit (for AnimatePresence) ────────────────────────────
export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easeOutExpo } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.fast, ease: easeStandard } },
};

// ── Route / page transition ──────────────────────────────────────────
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easeOutExpo } },
  exit: { opacity: 0, y: -6, transition: { duration: duration.fast, ease: easeStandard } },
};

// ── Overlays: modal + backdrop ───────────────────────────────────────
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base } },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.base, ease: easeOutExpo } },
  exit: { opacity: 0, scale: 0.98, y: 8, transition: { duration: duration.fast, ease: easeStandard } },
};

// ── Dropdown / popover ───────────────────────────────────────────────
export const popover: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -6 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: duration.fast, ease: easeOutExpo } },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.12, ease: easeStandard } },
};

// ── Reusable interaction props (spread onto motion components) ────────
export const hoverLift = {
  whileHover: { y: -3 },
  whileTap: { y: 0, scale: 0.99 },
  transition: spring.snappy,
} as const;

export const pressable = {
  whileTap: { scale: 0.97 },
  transition: spring.snappy,
} as const;

// Scroll-reveal helper: use with whileInView
export const revealOnScroll = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-80px" },
} as const;
