import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import InterviewSetupWizard from "@/components/InterviewSetupWizard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function InterviewSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <Link
            href="/interview"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Interviews
          </Link>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-text">Set Up Interview</h1>
            <p className="text-text-muted text-sm mt-1">Answer a few questions and Gemini will generate your personalized mock interview.</p>
          </div>

          <InterviewSetupWizard />
        </div>
      </main>
    </>
  );
}
