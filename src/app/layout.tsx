import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHIELD Platform — ISEG",
  description:
    "Plataforma de evaluación y screening de postulantes. Convierte cada contratación en una decisión segura.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-sans bg-bg text-text min-h-screen antialiased">{children}</body>
    </html>
  );
}
