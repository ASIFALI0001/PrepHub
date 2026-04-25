import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import CompanyBrainList from "@/components/CompanyBrainList";
import { Brain } from "lucide-react";

export default async function CompanyBrainPage() {
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
            <div className="w-10 h-10 rounded-xl bg-accent-pink/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-accent-pink" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Company Brain</h1>
              <p className="text-text-muted text-sm">Research any company — get tailored interview questions from Reddit, GitHub, and Gemini AI.</p>
            </div>
          </div>

          <CompanyBrainList />
        </div>
      </main>
    </>
  );
}
