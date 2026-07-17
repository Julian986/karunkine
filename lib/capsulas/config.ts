import { utcTodayDateKey } from "../turnos/wanda-schedule";

export type CapsulaMovimientoConfig = {
  id: string;
  dateKey: string;
  nombre: string;
  subtitulo: string;
};

export type CapsulasMovimientoCicloConfig = {
  slug: string;
  titulo: string;
  mesLabel: string;
  horario: string;
  lugar: string;
  precioArs: number;
  cupo: number;
  activo: boolean;
  items: readonly CapsulaMovimientoConfig[];
};

export const CAPSULAS_JULIO_2026: CapsulasMovimientoCicloConfig = {
  slug: "capsulas-movimiento-julio-2026",
  titulo: "Cápsulas de Movimiento",
  mesLabel: "Julio 2026",
  horario: "16:30",
  lugar: "Viamonte 1233",
  precioArs: 15_000,
  cupo: 4,
  activo: true,
  items: [
    {
      id: "2026-07-07-tobillo-pie",
      dateKey: "2026-07-07",
      nombre: "Tobillo y pie",
      subtitulo: "La Base de un Cuerpo Activo.",
    },
    {
      id: "2026-07-09-rodillas",
      dateKey: "2026-07-09",
      nombre: "Rodillas",
      subtitulo: "El Puente al Suelo",
    },
    {
      id: "2026-07-14-caderas",
      dateKey: "2026-07-14",
      nombre: "Caderas",
      subtitulo: "El Motor de la Marcha",
    },
    {
      id: "2026-07-16-pelvis",
      dateKey: "2026-07-16",
      nombre: "Pelvis",
      subtitulo: "Donde Inicia la Postura",
    },
    {
      id: "2026-07-21-cintura-abdomen",
      dateKey: "2026-07-21",
      nombre: "Cintura y abdomen",
      subtitulo: "El Centro del Movimiento",
    },
    {
      id: "2026-07-23-espalda-torax",
      dateKey: "2026-07-23",
      nombre: "Espalda y tórax",
      subtitulo: "Respirar para Habitar en Calma.",
    },
    {
      id: "2026-07-28-cuello-hombros",
      dateKey: "2026-07-28",
      nombre: "Cuello y hombros",
      subtitulo: "Soltar la Carga Invisible.",
    },
    {
      id: "2026-07-30-cara-cuello",
      dateKey: "2026-07-30",
      nombre: "Cara y cuello",
      subtitulo: "Liberá tu Expresión",
    },
  ],
};

export function listActiveCapsulasCiclos(): CapsulasMovimientoCicloConfig[] {
  return [CAPSULAS_JULIO_2026].filter((ciclo) => ciclo.activo);
}

export function getCapsulasCicloBySlug(slug: string): CapsulasMovimientoCicloConfig | null {
  return listActiveCapsulasCiclos().find((ciclo) => ciclo.slug === slug) ?? null;
}

export function getDefaultActiveCapsulasCiclo(): CapsulasMovimientoCicloConfig | null {
  return listActiveCapsulasCiclos()[0] ?? null;
}

export function listCapsulasItemsPublicos(ciclo: CapsulasMovimientoCicloConfig): CapsulaMovimientoConfig[] {
  const today = utcTodayDateKey();
  return ciclo.items.filter((item) => item.dateKey >= today);
}

export function formatCapsulaFecha(dateKey: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(dt).replace(".", "");
  const w = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${w} ${m[3]}/${m[2]}`;
}
