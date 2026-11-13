import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// App de la entrada del salón para la wedding planner. Oscura: se usa de noche, con poca luz.
const geist = Geist({ subsets: ["latin"], variable: "--fuente-panel" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--fuente-panel-mono" });

export const metadata: Metadata = {
  title: "Entrada · Boda Tania & Raymundo",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "Entrada boda", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function EntradaLayout({ children }: LayoutProps<"/entrada">) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} panel min-h-[100svh] bg-zinc-950 text-zinc-100 antialiased [color-scheme:dark]`}>
      <div className="mx-auto w-full max-w-lg px-4">{children}</div>
    </div>
  );
}
