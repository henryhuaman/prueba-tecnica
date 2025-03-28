import { StatusCodes } from "http-status-codes";
import { handleServiceResponse } from "../utils/httpHandlers";
import { ServiceResponse } from "../models/serviceResponse";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/db.server";
import { RequestHandler, Request } from "express";

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}
import { logger } from "@/server";


export const authenticationMiddleware: RequestHandler = async (req, res, next) => {
    const authToken = req.headers.authorization;
    const refreshToken = req.headers["x-refreshtoken"] as string;
    logger.info(`Auth token: ${authToken}`);
    logger.info(`Refresh token: ${refreshToken}`);
    try {
        if(!refreshToken){
            const serviceResponse = ServiceResponse.failure("No refresh token provided", null, StatusCodes.UNAUTHORIZED);
            handleServiceResponse(serviceResponse, res);
            return;
        }
        if (!authToken || !authToken.startsWith("Bearer ")) {
            throw new jwt.JsonWebTokenError("authToken es nulo o no tiene el formato Bearer");
        }
        const token = authToken.split(" ")[1];
        
        const isTokenBlacklisted = await prisma.blackList.findFirst({ where: { token } });
        if (isTokenBlacklisted) {
        const serviceResponse = ServiceResponse.failure(
            "Token de autenticacion invalido",
            null,
            StatusCodes.UNAUTHORIZED,
        );
            handleServiceResponse(serviceResponse, res);
            return;
        }
        
       const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
       const user = await prisma.user.findUnique({ 
        where: { id: (decodedToken as jwt.JwtPayload).userId } 
        });
        logger.info(`User: ${user?.id}`);
        if (!user) {
            const serviceResponse = ServiceResponse.failure("Usuario no encontrado", null, StatusCodes.UNAUTHORIZED);
            handleServiceResponse(serviceResponse, res);
            return;
        }

        res.setHeader("Authorization", `Bearer ${token}`);;
        req.user = user;
        
        next();
    } catch (authError) {
        if(authError instanceof jwt.TokenExpiredError || authError instanceof jwt.JsonWebTokenError){
            try {
                const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_SECRET!);
                const user = await prisma.session.findUnique({
                    where: { userId: (decodedRefreshToken as jwt.JwtPayload).userId },
                });
                if (!user) {
                    const serviceResponse = ServiceResponse.failure("Usuario no encontrado", null, StatusCodes.NOT_FOUND);
                    handleServiceResponse(serviceResponse, res);
                    return;
                    
                }

                const newToken = jwt.sign({ userId: user!.id },
                    process.env.JWT_SECRET!,
                    { expiresIn: "15m" });
                    res.setHeader("Authorization", `Bearer ${newToken}`);
                    req.headers.authorization = `Bearer ${newToken}`;

                    req.user = user;
                    next();

                
            } catch (refreshError) {

                logger.info("Token de refresh expirado o invalido, se verifica si la sesion existe");
                if (res.headersSent) return next();
                try{
                    const decodedRefreshToken = jwt.decode(refreshToken) as jwt.JwtPayload;
                    const sessionExists = await prisma.session.findFirst({
                        where: { userId: decodedRefreshToken.userId },
                        select: { id: true, token: true, user: true },
                    });

                    if (!sessionExists) {
                        const serviceResponse = ServiceResponse.failure("Sesion finalizada", null, StatusCodes.UNAUTHORIZED);
                        handleServiceResponse(serviceResponse, res);
                        return;
                    }

                    const newToken = jwt.sign(
                        { userId: decodedRefreshToken.userId, role: decodedRefreshToken.role },
                        process.env.JWT_SECRET!,
                        {
                          expiresIn: "15m",
                        },
                      );

                    const newRefreshToken = jwt.sign(
                        { userId: decodedRefreshToken.userId, role: decodedRefreshToken.role },
                        process.env.JWT_SECRET!,
                        { expiresIn: "7d" },
                    );
    
                    await prisma.session.update({
                        where: { id: sessionExists!.id },
                        data: { token: newRefreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
                    });
    
                    res.setHeader("Authorization", `Bearer ${newToken}`);
                    res.setHeader("x-refreshtoken", newRefreshToken);
                    req.headers.authorization = `Bearer ${newToken}`;
                    req.headers["x-refreshtoken"] = newRefreshToken;
    
                    req.user = sessionExists!.user;
                    next();

                }catch(error){ 
                    logger.error(`Ocurrio un error durante la verificacion del refresh token: ${error}`);
                    if (res.headersSent) return next(error);

                    const serviceResponse = ServiceResponse.failure(
                        "Error durante la verificacion del refresh token",
                        null,
                        StatusCodes.INTERNAL_SERVER_ERROR,
                    );
                    handleServiceResponse(serviceResponse, res);
                    return;
                
                }
            }
        }
        const serviceResponse = ServiceResponse.failure(
            "Error durante la autorizacion de autenticacion",
            null,
            StatusCodes.INTERNAL_SERVER_ERROR,
        );
        handleServiceResponse(serviceResponse, res);
        return;
          
    }
};

export const authorizationMiddleware: RequestHandler = async (req, res, next) => {
    try {
        const user = req.user;
        const idTarea = req.params.id;

        if(!user){
            const serviceResponse = ServiceResponse.failure("Usuario no encontrado", null, StatusCodes.UNAUTHORIZED);
            handleServiceResponse(serviceResponse, res);
            return;
            
        }

        if(!idTarea){
            const serviceResponse = ServiceResponse.failure("Id de tarea invalido", null, StatusCodes.BAD_REQUEST);
            handleServiceResponse(serviceResponse, res);
            return;
        }

        const tarea = await prisma.tarea.findFirst({
            where: { id: Number.parseInt(idTarea, 10) },
        });

        if(!tarea){
            const serviceResponse = ServiceResponse.failure("Tarea no encontrada", null, StatusCodes.NOT_FOUND);
            handleServiceResponse(serviceResponse, res);
            return;
        }

        if(tarea!.userId !== user.id){
            const serviceResponse = ServiceResponse.failure("No autorizado", null, StatusCodes.UNAUTHORIZED);
            handleServiceResponse(serviceResponse, res);
            return;
        }


    } catch (error) {
        logger.error(`Error during authorization: ${error}`);
        const serviceResponse = ServiceResponse.failure("Error durante la autorizacion", null, StatusCodes.INTERNAL_SERVER_ERROR);
        handleServiceResponse(serviceResponse, res);
        return next();
    }
};