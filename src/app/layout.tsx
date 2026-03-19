import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "⚽ Cancha — Partidos de fútbol cerca de ti",
  description:
    "Crea tu perfil de jugador y participa en partidos de tu zona. Arma equipos equilibrados con IA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cancha",
  },
  openGraph: {
    title: "⚽ Cancha — Partidos de fútbol cerca de ti",
    description:
      "Crea tu perfil de jugador y participa en partidos de tu zona.",
    siteName: "Cancha",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "⚽ Cancha — Partidos de fútbol cerca de ti",
    description:
      "Crea tu perfil de jugador y participa en partidos de tu zona.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
