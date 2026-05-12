import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import CareerGuideLanding from "@/components/CareerGuideLanding";

export default async function CareerGuidePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <>
      <DashboardNav userName={session.user.name} />
      <CareerGuideLanding />
    </>
  );
}
