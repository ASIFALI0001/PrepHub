import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mic, Plus } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import PageHeader from "@/components/ui/PageHeader";
import InterviewListClient from "@/components/InterviewListClient";

export default async function InterviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Powered by Gemini"
            icon={<Mic />}
            title="Live Interview"
            description="AI voice mock interviews — scored answer-by-answer with a full report."
            actions={
              <Link href="/interview/setup" className="btn-primary gap-2">
                <Plus className="w-4 h-4" /> New interview
              </Link>
            }
          />

          <InterviewListClient />
        </div>
      </main>
    </>
  );
}
