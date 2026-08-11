"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { duration, easeOutExpo } from "@/lib/motion";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /**
   * Rendered icon element (e.g. `<Mic className="w-5 h-5" />`), NOT a component
   * reference. Server-component callers cannot pass a bare component/function
   * across the client boundary, but a rendered element serializes fine.
   */
  icon?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}

/**
 * Consistent editorial page header shared across every internal flow.
 * Optional back link, eyebrow, icon, and right-aligned actions.
 */
export default function PageHeader({
  eyebrow, title, description, icon, back, actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {back && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: duration.base, ease: easeOutExpo }}
        >
          <Link
            href={back.href}
            className="group inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-5"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            {back.label}
          </Link>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.slow, ease: easeOutExpo }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          {icon && (
            <div className="w-11 h-11 rounded-xl bg-bg-surface border border-bg-border flex items-center justify-center shrink-0 text-primary [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            <h1 className="text-2xl sm:text-[28px] font-bold text-text tracking-tight leading-tight">
              {title}
            </h1>
            {description && <p className="text-text-muted text-sm mt-1.5 max-w-xl">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </motion.div>
    </div>
  );
}
