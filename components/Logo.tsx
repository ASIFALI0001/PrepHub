import Link from "next/link";

/**
 * PrepHub brand mark — a crafted geometric monogram: three ascending
 * bars (learn → quiz → interview) enclosed in a precise rounded frame.
 * Replaces the old gradient-blob + generic book icon.
 */
export function LogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-[9px] bg-primary text-white shadow-accent ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-[58%] h-[58%]">
        <rect x="4" y="13" width="3.4" height="7" rx="1.2" fill="currentColor" opacity="0.55" />
        <rect x="10.3" y="9" width="3.4" height="11" rx="1.2" fill="currentColor" opacity="0.8" />
        <rect x="16.6" y="4" width="3.4" height="16" rx="1.2" fill="currentColor" />
      </svg>
    </span>
  );
}

interface LogoProps {
  href?: string;
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}

export default function Logo({
  href = "/",
  className = "",
  markClassName = "w-8 h-8",
  showWordmark = true,
}: LogoProps) {
  const inner = (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      {showWordmark && (
        <span className="text-[17px] font-bold tracking-tight text-text">
          Prep<span className="text-text-muted font-semibold">Hub</span>
        </span>
      )}
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="group inline-flex items-center transition-opacity hover:opacity-80">
      {inner}
    </Link>
  );
}
