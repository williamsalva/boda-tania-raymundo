import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// El panel tiene su propio sistema visual (herramienta de trabajo), separado de la invitación.
const geist = Geist({ subsets: ["latin"], variable: "--fuente-panel" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--fuente-panel-mono" });

export const metadata: Metadata = {
  title: "Panel · Boda Tania & Raymundo",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div
      className={`${geist.variable} ${geistMono.variable} panel min-h-[100svh] bg-zinc-50 text-zinc-900 antialiased`}
    >
      {children}
    </div>
  );
}
