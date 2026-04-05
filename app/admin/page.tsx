import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/");
  }
  return <AdminDashboard initialUser={session} />;
}
