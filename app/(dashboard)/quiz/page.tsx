import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import { Zap } from "lucide-react";

export default async function QuizPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-28 pb-16 px-6 min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-cyan" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Quiz</h1>
              <p className="text-text-muted text-sm">Timed MCQ sessions — coming soon</p>
            </div>
          </div>
          <div className="glass-card rounded-2xl border border-bg-border p-12 text-center">
            <p className="text-text-muted">Quiz engine will be added in the next sprint.</p>
          </div>
        </div>
      </main>
    </>
  );
}
