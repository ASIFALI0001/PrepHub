import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="relative border-t border-bg-border">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo href="/" markClassName="w-8 h-8" />
            <p className="text-text-muted text-sm mt-4 max-w-xs leading-relaxed">
              The calm, all-in-one workspace to learn concepts, drill quizzes,
              and rehearse live AI interviews.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-3">Product</p>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: "/learn", label: "Learn" },
                { href: "/quiz", label: "Quiz" },
                { href: "/interview", label: "Live Interview" },
                { href: "/career-guide", label: "Career Guide" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-text-muted hover:text-text transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-3">Account</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/login" className="text-text-muted hover:text-text transition-colors">Log in</Link></li>
              <li><Link href="/signup" className="text-text-muted hover:text-text transition-colors">Sign up</Link></li>
              <li><Link href="/admin/login" className="text-text-muted hover:text-text transition-colors">Admin</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-bg-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-dim text-sm">
            © {new Date().getFullYear()} PrepHub. Built to make you interview-ready.
          </p>
          <p className="text-text-dim text-xs">Crafted with precision.</p>
        </div>
      </div>
    </footer>
  );
}
