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
  "grupal_15",
  "grupal_16",
  "grupal_17",
]);

export const HORARIOS_INDIVIDUAL = new Set([
  "lun_1400",
  "lun_1500",
  "mar_930",
  "mie_1400",
  "mie_1500",
  "mie_1600",
  "jue_930",
]);

const slotObj = z.object({
  dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeLocal: z.string().regex(/^\d{2}:\d{2}$/),
});

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
    formatoConsulta: z.enum(["presencial", "virtual"]).optional(),
    horarioEvaluacion: z.string().trim().optional(),
    formatoEvaluacion: z.enum(["presencial", "virtual"]).optional(),
    principalSlot: slotObj.optional(),
    evalSlot: slotObj.optional(),
    grupalClaseAnclaDateKey: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
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
    if (value.modalidad === "consulta_individual" && !value.formatoConsulta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["formatoConsulta"],
        message: "Elegí si la consulta es presencial o virtual.",
      });
    }
    if (value.modalidad === "grupal" && value.formatoConsulta) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["formatoConsulta"],
        message: "Formato de consulta solo aplica a consulta individual.",
      });
    }

    if (value.modalidad === "consulta_individual") {
      if (value.evalSlot || value.grupalClaseAnclaDateKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["evalSlot"],
          message: "Campos de grupal no aplican.",
        });
      }
      if (value.horarioEvaluacion?.trim() || value.formatoEvaluacion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["horarioEvaluacion"],
          message: "Evaluación solo aplica a clases grupales.",
        });
      }
    }

    if (value.modalidad === "grupal") {
      const he = value.horarioEvaluacion?.trim() ?? "";
      if (!he || !HORARIOS_INDIVIDUAL.has(he)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["horarioEvaluacion"],
          message: "Elegí horario para la evaluación inicial (código).",
        });
      }
      if (!value.formatoEvaluacion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["formatoEvaluacion"],
          message: "Elegí si la evaluación es presencial o virtual.",
        });
      }
      if (value.principalSlot) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["principalSlot"],
          message: "principalSlot no aplica a grupal.",
        });
      }
    }
  });

export type CrearReservaTurnoInput = z.infer<typeof crearReservaTurnoSchema>;
