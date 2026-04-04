import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import MemberDashboard from "./MemberDashboard";

export default async function MemberPage() {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }
  return <MemberDashboard initialUser={session} />;
}
