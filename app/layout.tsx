import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/Header";
import { getSiteUrl } from "../lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** JPG 1200×630 en Cloudinary (WhatsApp / Facebook no suelen aceptar og:image en webp). */
const OG_IMAGE_JPG =
  "https://res.cloudinary.com/dzoupwn0e/image/upload/f_jpg,q_85,c_fill,w_1200,h_630,g_auto/v1774125901/beautiful-fit-red-girl-working-out_mz9uww_1_nd4bjf.jpg";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Karunkine · Reserva online",
    template: "%s · Karunkine",
  },
  description:
    "Reservá evaluación y turnos con Wanda Perrin en Bahía Blanca: consulta individual (presencial u online) y clases grupales.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Karunkine",
    title: "Karunkine · Reserva online",
    description:
      "Reservá evaluación y turnos con Wanda Perrin en Bahía Blanca: consulta individual y clases grupales.",
    images: [
      {
        url: OG_IMAGE_JPG,
        width: 1200,
        height: 630,
        alt: "Karunkine — conciencia corporal y movimiento",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Karunkine · Reserva online",
    description:
      "Reservá evaluación y turnos con Wanda Perrin en Bahía Blanca: consulta individual y clases grupales.",
    images: [OG_IMAGE_JPG],
  },
};

export const viewport: Viewport = {
  themeColor: "#a56a42",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
