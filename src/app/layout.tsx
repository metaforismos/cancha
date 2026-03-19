import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  || (process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`)
  || "https://getcancha.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
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
    url: baseUrl,
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Cancha — Partidos de futbol cerca de ti",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "⚽ Cancha — Partidos de fútbol cerca de ti",
    description:
      "Crea tu perfil de jugador y participa en partidos de tu zona.",
    images: [`${baseUrl}/opengraph-image`],
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
