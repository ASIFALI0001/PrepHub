import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import PageHeader from "@/components/ui/PageHeader";
import InterviewSetupWizard from "@/components/InterviewSetupWizard";

export default async function InterviewSetupPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto">
          <PageHeader
            eyebrow="New interview"
            title="Set up your mock"
            description="Answer a few questions and Gemini will generate a personalized interview."
            back={{ href: "/interview", label: "Back to interviews" }}
          />
          <InterviewSetupWizard />
        </div>
      </main>
    </>
  );
}
