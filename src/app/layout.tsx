import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Montserrat, Pinyon_Script } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--fuente-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const script = Pinyon_Script({
  variable: "--fuente-script",
  subsets: ["latin"],
  weight: "400",
});

const sans = Montserrat({
  variable: "--fuente-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const sitio =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(sitio),
  title: "Tania & Raymundo · 11.12.2026",
  description: "Con la bendición de Dios y de nuestros padres, te invitamos a celebrar nuestra boda.",
  openGraph: {
    title: "Tania & Raymundo · 11.12.2026",
    description: "Te invitamos a celebrar nuestra boda.",
    images: [{ url: "/fotos/04.jpg", width: 1024, height: 683 }],
    locale: "es_MX",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf3f6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${serif.variable} ${script.variable} ${sans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
