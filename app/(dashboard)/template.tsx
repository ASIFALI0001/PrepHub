"use client";

import { motion } from "framer-motion";

/**
 * Route transition for the authenticated app. Opacity-only on purpose:
 * dashboard pages render a `position: fixed` nav, and any `transform` on an
 * ancestor would re-anchor that fixed element and cause it to jump. A fade
 * keeps navigations smooth without disturbing layout.
 */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
