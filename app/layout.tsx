import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Karunkine - Reserva online",
  description: "Reserva online",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png?app=site-v2", type: "image/png" }],
    apple: [{ url: "/icon.png?app=site-v2", type: "image/png" }],
    shortcut: ["/icon.png?app=site-v2"],
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
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
