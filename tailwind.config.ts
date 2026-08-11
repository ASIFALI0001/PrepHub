import type { Config } from "tailwindcss";

/**
 * PrepHub — "Precision / Editorial" design language.
 * Linear + Vercel DNA: near-monochrome canvas, one confident accent,
 * hairline borders, depth from contrast (not glow), tabular data.
 *
 * All colors are declared as RGB channel triplets in globals.css
 * (e.g. `--bg: 255 255 255`). Exposing them through the
 * `rgb(var(--x) / <alpha-value>)` form makes every Tailwind opacity
 * modifier (bg-primary/10, border-bg-border/60, …) theme-aware and
 * mathematically correct in both light and dark.
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: withAlpha("--bg"),
          surface: withAlpha("--bg-surface"),
          card: withAlpha("--bg-card"),
          elevated: withAlpha("--bg-elevated"),
          border: withAlpha("--bg-border"),
        },
        // Primary accent — the single confident brand hue.
        primary: {
          DEFAULT: withAlpha("--accent"),
          light: withAlpha("--accent-light"),
          dark: withAlpha("--accent-dark"),
        },
        // Semantic / category hues — refined, muted, used sparingly.
        accent: {
          blue: withAlpha("--c-blue"),
          cyan: withAlpha("--c-cyan"),
          pink: withAlpha("--c-pink"),
          green: withAlpha("--c-green"),
          orange: withAlpha("--c-orange"),
          violet: withAlpha("--c-violet"),
        },
        text: {
          DEFAULT: withAlpha("--text"),
          muted: withAlpha("--text-muted"),
          dim: withAlpha("--text-dim"),
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'SF Mono'", "ui-monospace", "monospace"],
      },
      // Tighter, more editorial radius scale.
      borderRadius: {
        lg: "0.625rem", // 10px
        xl: "0.75rem", // 12px
        "2xl": "1rem", // 16px
        "3xl": "1.375rem", // 22px
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      fontSize: {
        // Editorial display sizes with baked-in tight tracking.
        "display-sm": ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        display: ["3.5rem", { lineHeight: "1.02", letterSpacing: "-0.035em" }],
        "display-lg": ["4.75rem", { lineHeight: "0.98", letterSpacing: "-0.04em" }],
      },
      // Realistic, layered elevation. `glow*` names retained so the ~100
      // existing usages inherit the new (non-neon) treatment for free.
      boxShadow: {
        xs: "0 1px 2px rgb(var(--shadow) / 0.05)",
        sm: "0 1px 2px rgb(var(--shadow) / 0.06), 0 1px 3px rgb(var(--shadow) / 0.05)",
        md: "0 2px 4px rgb(var(--shadow) / 0.05), 0 6px 16px rgb(var(--shadow) / 0.08)",
        lg: "0 4px 8px rgb(var(--shadow) / 0.06), 0 16px 40px rgb(var(--shadow) / 0.12)",
        glow: "0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 24px rgb(var(--shadow) / 0.10)",
        "glow-lg": "0 8px 20px rgb(var(--shadow) / 0.10), 0 24px 60px rgb(var(--shadow) / 0.18)",
        "glow-cyan": "0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 24px rgb(var(--shadow) / 0.10)",
        "glow-blue": "0 1px 2px rgb(var(--shadow) / 0.05), 0 8px 24px rgb(var(--shadow) / 0.10)",
        // Accent-tinted focus/press ring for primary controls.
        accent: "0 1px 2px rgb(var(--shadow) / 0.06), 0 6px 20px rgb(var(--accent) / 0.28)",
      },
      animation: {
        "gradient-x": "gradient-x 8s ease infinite",
        float: "float 7s ease-in-out infinite",
        "float-delayed": "float 7s ease-in-out 2.5s infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
        shimmer: "shimmer 1.6s linear infinite",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        "gradient-x": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.6" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      backgroundSize: { "300%": "300%" },
      transitionTimingFunction: {
        // Signature "expo-out" easing used throughout the redesign.
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
