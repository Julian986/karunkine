import { z } from "zod";

export const MOTIVOS_VALIDOS = new Set([
  "suelo_pelvico",
  "embarazo",
  "posparto",
  "lesion",
  "dolor",
  "postura",
]);

export const HORARIOS_GRUPAL = new Set([
  "grupal_930",
  "grupal_1030",
  "grupal_16",
  "grupal_17",
]);

export const HORARIOS_INDIVIDUAL = new Set(["mie_930", "mie_1030", "mie_16", "mie_17"]);

export const crearReservaTurnoSchema = z
  .object({
    nombre: z.string().trim().min(3).max(80),
    mail: z.string().trim().email(),
    celular: z.string().trim().min(8).max(30),
    motivo: z.string().trim().min(1),
    modalidad: z.enum(["grupal", "consulta_individual"]),
    horario: z.string().trim().min(1),
    turnoDetalle: z.string().trim().min(1),
    turnoCodigo: z.string().trim().min(1),
    precioReferenciaArs: z.number().int().positive(),
  })
  .superRefine((value, ctx) => {
    if (!MOTIVOS_VALIDOS.has(value.motivo)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivo"],
        message: "Motivo inválido.",
      });
    }
    if (value.modalidad === "grupal" && !HORARIOS_GRUPAL.has(value.horario)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Horario grupal inválido.",
      });
    }
    if (value.modalidad === "consulta_individual" && !HORARIOS_INDIVIDUAL.has(value.horario)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horario"],
        message: "Horario individual inválido.",
      });
    }
  });

export type CrearReservaTurnoInput = z.infer<typeof crearReservaTurnoSchema>;
