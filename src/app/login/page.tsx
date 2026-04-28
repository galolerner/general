import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin/dashboard");
    redirect("/portal");
  }

  return (
    <div className="fixed inset-0 z-[1000] grid grid-cols-1 md:grid-cols-2 bg-bg overflow-hidden">
      {/* Left visual panel */}
      <div className="relative hidden md:flex flex-col justify-between p-[52px_56px] overflow-hidden bg-surface border-r border-border">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(43,214,197,.07) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 80% 10%, rgba(43,214,197,.04) 0%, transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(43,214,197,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(43,214,197,.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          aria-hidden
          className="absolute top-0 left-0 w-0.5 h-full opacity-40"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, var(--accent) 30%, var(--accent) 70%, transparent 100%)",
          }}
        />
        <div className="relative z-10">
          <Logo height={52} />
        </div>
        <div className="relative z-10 flex flex-col gap-0">
          <h2 className="text-text font-black text-[34px] leading-[1.12] tracking-[-1px] mb-4">
            Convierte cada
            <br />
            contratación en una
            <br />
            <em className="not-italic block text-accent">decisión segura.</em>
          </h2>
          <p className="text-[12px] text-text-dim leading-[1.8] max-w-[300px]">
            Plataforma SHIELD — Evaluación &amp; Screening de postulantes con baterías
            de pruebas configurables por nivel de riesgo del puesto.
          </p>
          <div className="flex gap-7 mt-7 pt-6 border-t border-border">
            <div>
              <div className="text-[24px] font-light text-accent tracking-[-0.5px] leading-none">
                17
              </div>
              <div className="text-[9px] tracking-[2px] uppercase text-text-dim mt-1">
                Pruebas
              </div>
            </div>
            <div>
              <div className="text-[24px] font-light text-accent tracking-[-0.5px] leading-none">
                5
              </div>
              <div className="text-[9px] tracking-[2px] uppercase text-text-dim mt-1">
                Niveles de riesgo
              </div>
            </div>
            <div>
              <div className="text-[24px] font-light text-accent tracking-[-0.5px] leading-none">
                ∞
              </div>
              <div className="text-[9px] tracking-[2px] uppercase text-text-dim mt-1">
                Postulantes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center p-[52px_64px] relative">
        <div
          aria-hidden
          className="absolute bottom-0 right-0 w-[300px] h-[300px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(43,214,197,.03) 0%, transparent 70%)",
          }}
        />
        <LoginForm />
      </div>
    </div>
  );
}
