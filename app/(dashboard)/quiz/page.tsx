import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import QuizTopicsClient from "@/components/QuizTopicsClient";
import { Zap } from "lucide-react";

export default async function QuizPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-light" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Quiz</h1>
              <p className="text-text-muted text-sm">MCQ sessions to test your interview readiness.</p>
            </div>
          </div>

          <QuizTopicsClient />
        </div>
      </main>
    </>
  );
}
