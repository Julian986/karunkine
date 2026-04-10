import type { Metadata, Viewport } from "next";

const PANEL_PWA_VERSION = "panel-v2";

export const metadata: Metadata = {
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
  themeColor: "#a56a42",
};

export default function PanelTurnosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
