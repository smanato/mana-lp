import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect("/member");
  }
  return <LoginForm />;
}
