import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import InterviewListClient from "@/components/InterviewListClient";
import { Mic } from "lucide-react";

export default async function InterviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-6 min-h-screen relative overflow-hidden">
        <div className="noise-overlay" />
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary-light" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text">Live Interview</h1>
                <p className="text-text-muted text-sm">AI voice mock interviews powered by Gemini.</p>
              </div>
            </div>
          </div>

          <InterviewListClient />
        </div>
      </main>
    </>
  );
}
