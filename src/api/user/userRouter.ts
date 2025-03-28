import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { CreateUserSchema, GetUserSchema, UserSchema } from "@/api/user/userModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userController } from "./userController";
import { authenticationMiddleware } from "@/common/middleware/sessionMiddleware";

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

userRegistry.register("User", UserSchema);

userRegistry.registerPath({
	method: "get",
	path: "/users",
	tags: ["User"],
	responses: createApiResponse(z.array(UserSchema), "Success"),
});

userRouter.get("/", userController.getUsers);

userRegistry.registerPath({
	method: "get",
	path: "/users/{id}",
	tags: ["User"],
	request: { params: GetUserSchema.shape.params },
	responses: createApiResponse(UserSchema, "Success"),
});

userRouter.get("/:id", validateRequest(GetUserSchema), userController.getUser);

userRegistry.registerPath({
    method: "post",
    path: "/users",
    tags: ["User"],
    request: { body: { // Cambiar 'params' a 'body' porque es un 'POST' que recibe datos en el cuerpo
      content: {
        'application/json': {
          schema: CreateUserSchema, // El esquema de validación para crear un nuevo usuario
        },
      },
    }, },
    responses: createApiResponse(UserSchema, "Success"),
});

userRouter.post("/", userController.createUser);

userRegistry.registerPath({
    method: "patch",
    path: "/users/{id}",
    tags: ["User"],
    request: {
      params: GetUserSchema.shape.params,
      body: { // Cambiar 'params' a 'body' porque es un 'PATCH' que recibe datos en el cuerpo
        content: {
          'application/json': {
            schema: UserSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: createApiResponse(UserSchema, "Success"),
});

userRouter.patch("/:id", userController.updateUser);

userRegistry.registerPath({
  method: "delete",
  security: [{ BearerAuth: [] }],
  path: "/users/{id}/delete",
  tags: ["User"],
  parameters: [
    {
      name: "x-refreshtoken",
      in: "header",
      required: true,
      schema: {
        type: "string",
        description: "Refresh token",
      },
    },
  ],
  request: { params: GetUserSchema.shape.params},
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.delete("/:id/delete", authenticationMiddleware, userController.deleteUser);