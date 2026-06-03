import type { Metadata } from "next";

import { TallerInscripcionBoceto } from "./taller-inscripcion-boceto";
const path = "/taller-bahia-junio-2026";

export const metadata: Metadata = {
  title: "Taller presencial Bahía Blanca — 27 de junio 2026",
  description:
    "Inscripción al taller presencial de Wanda Perrin en Bahía Blanca, 27 de junio de 2026. Reservá tu lugar con pago online (próximamente).",
  alternates: {
    canonical: path,
  },
  openGraph: {
    title: "Taller presencial en Bahía | Karunkine",
    description: "Inscribite al taller del 27 de junio en Bahía Blanca con Wanda Perrin.",
    url: path,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TallerBahiaJunio2026Page() {
  return <TallerInscripcionBoceto />;
}
