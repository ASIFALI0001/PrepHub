import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import CareerGuideWizard from "@/components/CareerGuideWizard";

export default async function CareerGuideNewPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <CareerGuideWizard />
    </>
  );
}
