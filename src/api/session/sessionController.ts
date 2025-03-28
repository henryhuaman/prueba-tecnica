import type { Request, RequestHandler, Response } from "express";
import { sessionService } from "./sessionService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";


class SessionController {
    public login : RequestHandler = async (req: Request, res: Response) => {
        try {
            const { correo, contrasena } = req.body;
            const serviceResponse = await sessionService.login(correo, contrasena);
            if (serviceResponse.success && serviceResponse.responseObject) {
                console.log("Tokens generados:", serviceResponse.responseObject);
                res.setHeader("x-refreshToken", serviceResponse.responseObject.refreshToken);
                res.setHeader("Authorization", `Bearer ${serviceResponse.responseObject.token}`);
            }
            handleServiceResponse(serviceResponse, res);
        } catch (error) {
            console.error(`Error during login: ${error}`);
            const serviceResponse = ServiceResponse.failure("Error during login", null, StatusCodes.INTERNAL_SERVER_ERROR);
            handleServiceResponse(serviceResponse, res);
        }
    }

    public logout : RequestHandler = async (req: Request, res: Response) => {
        try {
            if (!req.headers.authorization || !req.headers["x-refreshtoken"]) {
                handleServiceResponse(ServiceResponse.failure("Faltan tokens en la solicitud", null, 400), res);
            }

            const serviceResponse = await sessionService.logout(req.headers.authorization!.split(" ")[1]);
            handleServiceResponse(serviceResponse, res);
        } catch (error) {
            console.error(`Error during logout: ${error}`);
            const serviceResponse = ServiceResponse.failure("Error durante el logout", null, StatusCodes.INTERNAL_SERVER_ERROR);
            handleServiceResponse(serviceResponse, res);
        }
    }

    public verifyToken : RequestHandler = async (req: Request, res: Response) => {
        const token = req.headers.authorization!.split(" ")[1];
        const refreshToken = req.headers["x-refreshtoken"] as string;
        const serviceResponse = await sessionService.verifyToken(token, refreshToken);
        handleServiceResponse(serviceResponse, res);
    }    
}

export const sessionController = new SessionController();