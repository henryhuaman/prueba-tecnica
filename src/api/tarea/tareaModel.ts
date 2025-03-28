import { commonValidations } from "@/common/utils/commonValidation";
import { z } from "zod";


export type Tarea = z.infer<typeof TareaSchema>;
export const TareaSchema = z.object({
    id: z.number().optional(),
    userId: z.number(),
    titulo: z.string(),
    descripcion: z.string().nullable(),
    completada: z.boolean().default(false),
});

export type CreateTarea = z.infer<typeof CreateTareaSchema>;
export const CreateTareaSchema = z.object({
    userId: z.number(),
    titulo: z.string(),
    descripcion: z.string().min(1).optional(),
    completada: z.boolean(),
});

export const GetTareaSchema = z.object({
    params: z.object({ id: commonValidations.id }),
});
