/** Etiquetas legibles para el panel de Wanda (motivo, formato, franjas). */

export const PANEL_MOTIVO_OPCIONES = [
  { value: "suelo_pelvico", label: "Disfunción de suelo pélvico" },
  { value: "embarazo", label: "Embarazo" },
  { value: "posparto", label: "Posparto" },
  { value: "lesion", label: "Lesión" },
  { value: "dolor", label: "Dolor" },
  { value: "postura", label: "Postura" },
] as const;

const MOTIVO_MAP = new Map<string, string>(PANEL_MOTIVO_OPCIONES.map((o) => [o.value, o.label]));

const HORARIO_EXTRA_MAP: Record<string, string> = {
  panel_libre: "Horario libre (panel)",
};

const HORARIO_GRUPAL_MAP: Record<string, string> = {
  grupal_15: "Martes y Jueves - 15:00H",
  grupal_1730: "Lunes y Miércoles - 17:30H",
  grupal_930: "Martes y Jueves - 9:30H",
  grupal_1030: "Martes y Jueves - 10:30H",
  grupal_16: "Martes y Jueves - 16H",
  grupal_17: "Martes y Jueves - 17H",
};

const HORARIO_INDIVIDUAL_MAP: Record<string, string> = {
  lun_1400: "Lunes 14:00H",
  lun_1600: "Lunes 16:00H",
  mar_1400: "Martes 14:00H",
  mar_1730: "Martes 17:30H",
  lun_1500: "Lunes 15:00H",
  mar_930: "Martes 9:30H",
  mie_1400: "Miércoles 14:00H",
  mie_1500: "Miércoles 15:00H",
  mie_1600: "Miércoles 16:00H",
  jue_1400: "Jueves 14:00H",
  jue_1730: "Jueves 17:30H",
  jue_930: "Jueves 9:30H",
  vie_1500: "Viernes 15:00H",
  vie_1600: "Viernes 16:00H",
  vie_1700: "Viernes 17:00H",
};

export function panelMotivoLabel(code: string): string {
  const k = code.trim();
  if (!k) return "";
  return MOTIVO_MAP.get(k) ?? k;
}

export function panelFormatoLabel(formato: string): string {
  if (formato === "presencial") return "Presencial";
  if (formato === "virtual") return "Virtual";
  return "";
}

export function panelHorarioTemplateLabel(id: string): string {
  const k = id.trim();
  if (!k) return "";
  return HORARIO_EXTRA_MAP[k] ?? HORARIO_GRUPAL_MAP[k] ?? HORARIO_INDIVIDUAL_MAP[k] ?? k;
}

export function panelModalidadLabel(modalidad: "grupal" | "consulta_individual"): string {
  return modalidad === "consulta_individual" ? "Consulta individual" : "Clases grupales";
}
