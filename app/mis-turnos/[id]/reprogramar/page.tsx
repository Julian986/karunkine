import type { Metadata } from "next";
import { ReprogramarClient } from "./reprogramar-client";

export const metadata: Metadata = {
  title: "Cambiar horario",
  description: "Reprogramá tu consulta individual con Karunkine.",
  robots: {
    index: false,
    follow: false,
  },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReprogramarTurnoPage({ params }: PageProps) {
  const { id } = await params;
  return <ReprogramarClient turnoId={id} />;
}
