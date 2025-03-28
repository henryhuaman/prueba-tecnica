import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { GetTareaSchema, TareaSchema } from "./tareaModel";
import { tareaController } from "./tareaController";
import { Param } from "@prisma/client/runtime/library";
import { authenticationMiddleware, authorizationMiddleware } from "@/common/middleware/sessionMiddleware";

export const tareaRegistry = new OpenAPIRegistry();
export const tareaRouter: Router = express.Router();

tareaRegistry.registerComponent("securitySchemes", "BearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });

  tareaRegistry.registerPath({
    method: "get",
    description: "Get all tareas",
    path: "/tareas",
    tags: ["Tareas"],
    responses: createApiResponse(z.array(TareaSchema), "Success"),
  });
  tareaRouter.get("/users", tareaController.getTareas);

  tareaRegistry.registerPath({
    method: "get",
    description: "Get a user tareas",
    path: "/tareas/user",
    tags: ["Tareas"],
    security: [{ BearerAuth: [] }],
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
    responses: createApiResponse(TareaSchema, "Success"),
  });
  tareaRouter.get("/user", authenticationMiddleware, tareaController.getMyTarea);

  tareaRegistry.registerPath({
    method: "post",
    description: "Create a new tarea",
    path: "/tareas",
    tags: ["Tareas"],
    security: [{ BearerAuth: [] }],
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
    request: {
      body: {
        content: {
          "application/json": {
            schema: TareaSchema.omit({id: true, userId: true}),
          },
        },
      },
    },
    responses: createApiResponse(TareaSchema, "Success"),
  });
  tareaRouter.post("/", authenticationMiddleware, tareaController.createTarea);

  tareaRegistry.registerPath({
    method: "patch",
    description: "Update a tarea",
    path: "/tareas/{id}",
    tags: ["Tareas"],
    security: [{ BearerAuth: [] }],
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
    request: {
      params: GetTareaSchema.shape.params,
      body: {
        content: {
          "application/json": {
            schema: TareaSchema.omit({id: true}),
          },
        },
      },
    },
    responses: createApiResponse(TareaSchema, "Success"),
  });
  tareaRouter.patch("/:id", [authenticationMiddleware, authorizationMiddleware], tareaController.updateTarea);

  tareaRegistry.registerPath({
    method: "delete",
    description: "Delete a tarea",
    path: "/tareas/{id}",
    tags: ["Tareas"],
    security: [{ BearerAuth: [] }],
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
    request: {params: GetTareaSchema.shape.params},
    responses: createApiResponse(TareaSchema, "Success"),
  });
  tareaRouter.delete("/:id", [authenticationMiddleware, authorizationMiddleware], tareaController.deleteTarea);

  