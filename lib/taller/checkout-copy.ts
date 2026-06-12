import type { TallerEventoConfig } from "./evento-config";

export function buildTallerCheckoutItemCopy(evento: TallerEventoConfig): {
  tituloItem: string;
  descripcionItem: string;
} {
  const tituloItem = `Taller ${evento.titulo} — ${evento.fecha}`;
  const descripcionItem = `${evento.subtitulo}. ${evento.lugar}. ${evento.horario}.`;
  return { tituloItem, descripcionItem };
}
