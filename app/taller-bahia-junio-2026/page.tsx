import type { Metadata } from "next";

import { TallerInscripcionBoceto } from "./taller-inscripcion-boceto";

const path = "/taller-bahia-junio-2026";

export const metadata: Metadata = {
  title: "Taller Liberá tu pelvis — Bahía Blanca, 27 de junio 2026",
  description:
    "Taller teórico-práctico Liberá tu pelvis con Wanda Perrin en Karün, Bahía Blanca. Sábado 27 de junio, 14 a 18 h. Inscripción online con Mercado Pago — $60.000.",
  alternates: {
    canonical: path,
  },
  openGraph: {
    title: "Liberá tu pelvis — Taller en Bahía | Karunkine",
    description:
      "Taller teórico-práctico para liberar bloqueos del suelo pélvico. 27 de junio en Karün, Viamonte 1233.",
    url: path,
    type: "website",
    images: [{ url: "/taller.jpeg", alt: "Flyer — Taller Liberá tu pelvis" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TallerBahiaJunio2026Page() {
  return <TallerInscripcionBoceto />;
}
