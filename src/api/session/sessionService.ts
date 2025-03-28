import { ServiceResponse } from "@/common/models/serviceResponse";
import { prisma } from "@/common/utils/db.server";
import { hashPassword, verifyPassword } from "@/common/utils/encript";
import { logger } from "@/server";
import { hash } from "argon2";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

class SessionService {
  async login(correo: string, contrasena: string) : Promise<ServiceResponse<{ token: string, refreshToken: string } | null>> {
    try{
        const user = await prisma.user.findFirst({
            where: {
                correo: correo
            }});
        if(!user){
          return ServiceResponse.failure("User not found", null, StatusCodes.UNAUTHORIZED);
        }

        const isPasswordValid = await verifyPassword(contrasena, user.contrasena);
        if(!isPasswordValid){
          return ServiceResponse.failure("Incorrect password", null, StatusCodes.UNAUTHORIZED);
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

        await prisma.session.upsert({
          where: {userId: user.id},
          update: {token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)},
          create: {token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), userId: user.id}
        });

        return ServiceResponse.success("Login Exitoso", { token, refreshToken });
    }catch(error){
        logger.error(`Error during login: ${error}`);
        return ServiceResponse.failure("Error during login", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async logout(token: string) : Promise<ServiceResponse<null>> {
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

        await prisma.$transaction([
          prisma.blackList.create({ data: { token } }),
          prisma.session.deleteMany({ where: { userId: decoded.userId } })
        ]);
        return ServiceResponse.success("Logout Exitoso", null);
    }catch(error){
      // caso de token expirado
        if(error instanceof jwt.TokenExpiredError){
          const decoded = jwt.decode(token) as jwt.JwtPayload;
          await prisma.session.deleteMany({where: {userId: decoded.uerId}});
          return ServiceResponse.success("Token expired", null);
        }

        logger.error(`Error during logout: ${error}`);
        return ServiceResponse.failure("Error during logout", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyToken(reqToken: string, resToken: string): Promise<ServiceResponse<null>> {
    try {
      jwt.verify(reqToken, process.env.JWT_SECRET!);
      return ServiceResponse.success("Token verificado", null);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        try {
          jwt.verify(resToken, process.env.JWT_SECRET!);
          return ServiceResponse.success("Token verificado", null);
        } catch (error) {
          logger.error(`Error en verifyToken: ${error}`);
          return ServiceResponse.failure("Token inválido", null, StatusCodes.UNAUTHORIZED);
        }
      }
      logger.error(`Error en verifyToken: ${error}`);
      return ServiceResponse.failure("Error al verificar el token", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const sessionService = new SessionService();



