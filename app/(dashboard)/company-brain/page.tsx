import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { Brain } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";
import PageHeader from "@/components/ui/PageHeader";
import CompanyBrainList from "@/components/CompanyBrainList";

export default async function CompanyBrainPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Company research"
            icon={<Brain />}
            title="Company Brain"
            description="Research any company — tailored interview questions from Reddit, GitHub, and Gemini."
          />
          <CompanyBrainList />
        </div>
      </main>
    </>
  );
}
