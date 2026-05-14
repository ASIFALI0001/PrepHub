import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/DashboardNav";
import ProfilePage from "@/components/ProfilePage";

export default async function Profile() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <>
      <DashboardNav userName={session.user.name} />
      <ProfilePage />
    </>
  );
}
