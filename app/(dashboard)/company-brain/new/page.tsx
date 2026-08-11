import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import PageHeader from "@/components/ui/PageHeader";
import CompanyBrainForm from "@/components/CompanyBrainForm";

export default async function NewCompanyBrainPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <main className="pt-24 pb-20 px-4 sm:px-6 min-h-screen relative">
        <div className="mesh-gradient fixed inset-0 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <PageHeader
            eyebrow="New research"
            title="Research a company"
            description="Enter the company and role — PrepHub scrapes Reddit & GitHub, then Gemini generates targeted interview questions."
            back={{ href: "/company-brain", label: "Back to Company Brain" }}
          />
          <CompanyBrainForm />
        </div>
      </main>
    </>
  );
}
