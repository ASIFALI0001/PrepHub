/**
 * Shared score → visual theme mapping (Precision palette only).
 * Replaces the ad-hoc yellow-400/red-400/emerald-400 classes that were
 * duplicated across the interview cards & report. Four semantic bands:
 *   ≥80 Excellent (green) · ≥60 Good (brand indigo) · ≥40 Fair (orange) · <40 Needs work (pink)
 */
export interface ScoreTheme {
  text: string;   // text-* color
  bar: string;    // solid bg-* for progress fills
  soft: string;   // low-alpha bg-*
  border: string; // border-*
  ring: string;   // stroke-* for SVG rings
  pill: string;   // combined chip classes
  label: string;
}

export function scoreTheme(score: number): ScoreTheme {
  if (score >= 80)
    return {
      text: "text-accent-green", bar: "bg-accent-green", soft: "bg-accent-green/10",
      border: "border-accent-green/30", ring: "stroke-accent-green",
      pill: "bg-accent-green/10 text-accent-green border-accent-green/25", label: "Excellent",
    };
  if (score >= 60)
    return {
      text: "text-primary", bar: "bg-primary", soft: "bg-primary/10",
      border: "border-primary/30", ring: "stroke-primary",
      pill: "bg-primary/10 text-primary border-primary/25", label: "Good",
    };
  if (score >= 40)
    return {
      text: "text-accent-orange", bar: "bg-accent-orange", soft: "bg-accent-orange/10",
      border: "border-accent-orange/30", ring: "stroke-accent-orange",
      pill: "bg-accent-orange/10 text-accent-orange border-accent-orange/25", label: "Fair",
    };
  return {
    text: "text-accent-pink", bar: "bg-accent-pink", soft: "bg-accent-pink/10",
    border: "border-accent-pink/30", ring: "stroke-accent-pink",
    pill: "bg-accent-pink/10 text-accent-pink border-accent-pink/25", label: "Needs work",
  };
}

/** For per-question scores on a 0–10 scale. */
export function qScoreTheme(scoreOutOf10: number): ScoreTheme {
  return scoreTheme(scoreOutOf10 * 10);
}
