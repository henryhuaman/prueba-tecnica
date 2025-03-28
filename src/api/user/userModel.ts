import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type User = z.infer<typeof UserSchema>;
export const UserSchema = z.object({
	id: z.number().optional(),
	nombre: z.string().nonempty(),
	correo: z.string().email().nonempty(),
	contrasena: z.string().nonempty(),
});

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;
export const CreateUserSchema = z.object({
	nombre: z.string().nonempty(),
	correo: z.string().email().nonempty(),
	contrasena: z.string().nonempty(),
});
