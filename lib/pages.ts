/**
 * The feature pages an admin can pause. Kept mongoose-free (separate from
 * models/Settings.ts) so it's safe to import into client components.
 * `key` matches the leading path segment of the page's route.
 */
export const TOGGLEABLE_PAGES = [
  { key: "learn", label: "Learn", href: "/learn" },
  { key: "quiz", label: "Quiz", href: "/quiz" },
  { key: "interview", label: "Interview", href: "/interview" },
  { key: "company-brain", label: "Company Brain", href: "/company-brain" },
  { key: "career-guide", label: "Career Guide", href: "/career-guide" },
  { key: "ats", label: "ATS Checker", href: "/ats" },
] as const;

export const VALID_PAGE_KEYS: string[] = TOGGLEABLE_PAGES.map((p) => p.key);
