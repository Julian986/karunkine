import type { Metadata } from "next";
import { ReprogramarClient } from "../../../mis-turnos/[id]/reprogramar/reprogramar-client";

export const metadata: Metadata = {
  title: "Reprogramar turno · Panel",
  description: "Cambiar fecha u hora de una consulta individual.",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function PanelReprogramarPage({ params }: PageProps) {
  const { id } = await params;
  return <ReprogramarClient turnoId={id} variant="panel" />;
}
