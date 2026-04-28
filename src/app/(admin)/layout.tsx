import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/Header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/portal");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header role="ADMIN" userLabel={session.user.name ?? "Admin"} userBadge="Admin ISEG" />
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
    </div>
  );
}
