import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-bg-border py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold gradient-text">PrepHub</span>
        </Link>
        <p className="text-text-muted text-sm">
          © {new Date().getFullYear()} PrepHub. Built to make you interview-ready.
        </p>
        <div className="flex gap-6 text-sm text-text-muted">
          <Link href="/login" className="hover:text-text transition-colors">Login</Link>
          <Link href="/signup" className="hover:text-text transition-colors">Sign Up</Link>
        </div>
      </div>
    </footer>
  );
}
