import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";

const PANEL_PWA_VERSION = "panel-v3";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  manifest: "/manifest-admin-panel-turnos.webmanifest",
  icons: {
    icon: [
      {
        url: `/panel-turnos/app-icon/192?app=${PANEL_PWA_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `/panel-turnos/app-icon/512?app=${PANEL_PWA_VERSION}`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `/panel-turnos/app-icon/192?app=${PANEL_PWA_VERSION}`,
        sizes: "192x192",
        type: "image/png",
      },
    ],
    shortcut: [
      {
        url: `/panel-turnos/app-icon/192?app=${PANEL_PWA_VERSION}`,
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#B88E2F",
};

export default function PanelTurnosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`panel-v2-theme ${montserrat.variable} ${playfair.variable} min-h-screen bg-white text-gray-900 antialiased`}
    >
      {children}
    </div>
  );
}
