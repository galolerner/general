import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Index() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");
  redirect("/portal");
}
