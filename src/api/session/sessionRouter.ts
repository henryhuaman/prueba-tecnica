import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { sessionController } from "./sessionController";
import { authenticationMiddleware } from "@/common/middleware/sessionMiddleware";


export const sessionRegistry = new OpenAPIRegistry();
export const sessionRouter: Router = express.Router();

sessionRegistry.registerComponent("securitySchemes", "BearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });

sessionRegistry.registerPath({
  method: "post",
  description: "Login",
  path: "/sessions/login",
  tags: ["Session"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            correo: z.string().email(),
            contrasena: z.string(),
          }),
          example: {
            correo: "user1@example.com",
            contrasena: "securepassword",
          },
        },
      },
    },
  },
  responses: createApiResponse(z.object({ token: z.string() }), "Success"),
});

sessionRouter.post("/login", sessionController.login);

sessionRegistry.registerPath({
  method: "post",
  description: "Logout",
  path: "/sessions/logout",
  tags: ["Session"],
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
  responses: createApiResponse(z.object({ token: z.string() }), "JWT token"),
});

sessionRouter.post("/logout", authenticationMiddleware, sessionController.logout);

sessionRegistry.registerPath({
  method: "post",
  description: "Verify token",
  path: "/sessions/verify-token",
  tags: ["Session"],
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
  responses: createApiResponse(z.null(), "Success"),
});

sessionRouter.post("/verify-token", authenticationMiddleware, sessionController.verifyToken);
