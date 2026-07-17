import { z } from "zod";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const crearCapsulasInscripcionSchema = z.object({
  nombre: z.string().trim().min(3, "Ingresá nombre y apellido.").max(80),
  mail: z
    .string()
    .trim()
    .min(1, "Ingresá un mail.")
    .regex(emailRegex, "Ingresá un mail válido."),
  celular: z
    .string()
    .trim()
    .min(1, "Ingresá un celular.")
    .refine((value) => /^[+\d\s()-]+$/.test(value), "Usá solo números y símbolos telefónicos.")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "Ingresá un celular válido."),
  cicloSlug: z.string().trim().min(1, "Falta el ciclo."),
  capsulaIds: z
    .array(z.string().trim().min(1))
    .min(1, "Elegí al menos una cápsula.")
    .max(31, "Seleccionaste demasiadas cápsulas.")
    .refine((items) => new Set(items).size === items.length, "No repitas cápsulas."),
});

export type CrearCapsulasInscripcionInput = z.infer<typeof crearCapsulasInscripcionSchema>;
