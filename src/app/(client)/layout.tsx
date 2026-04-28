import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/Header";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/admin/dashboard");
  if (!session.user.clientId) redirect("/login");

  const client = await db.client.findUnique({ where: { id: session.user.clientId } });
  if (!client) redirect("/login");

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header
        role="CLIENT"
        userLabel={`${client.icon} ${client.name}`}
        userBadge="Cliente"
      />
      <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
    </div>
  );
}
