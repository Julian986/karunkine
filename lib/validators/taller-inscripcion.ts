import { z } from "zod";

export const crearTallerInscripcionSchema = z.object({
  eventoSlug: z.string().trim().min(1).max(80),
  nombre: z.string().trim().min(3, "Ingresá nombre y apellido.").max(80),
  mail: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Ingresá un mail válido o dejalo vacío.",
    }),
  celular: z.string().trim().min(8, "Ingresá un celular válido.").max(30),
  comentario: z.string().trim().max(500).optional().default(""),
});

export type CrearTallerInscripcionInput = z.infer<typeof crearTallerInscripcionSchema>;
