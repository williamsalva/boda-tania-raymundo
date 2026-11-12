import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// App de la entrada del salón para la wedding planner: mismo sistema visual que el panel.
const geist = Geist({ subsets: ["latin"], variable: "--fuente-panel" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--fuente-panel-mono" });

export const metadata: Metadata = {
  title: "Entrada · Boda Tania & Raymundo",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
};

export default function EntradaLayout({ children }: LayoutProps<"/entrada">) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} panel min-h-[100svh] bg-zinc-50 text-zinc-900 antialiased`}>
      <div className="mx-auto w-full max-w-lg px-4 pb-10 pt-5">{children}</div>
    </div>
  );
}
