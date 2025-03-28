import { ServiceResponse } from "@/common/models/serviceResponse";
import { StatusCodes } from "http-status-codes";
import { Tarea, TareaSchema } from "./tareaModel";
import { prisma } from "@/common/utils/db.server";
import { logger } from "@/server";
import { a } from "vitest/dist/chunks/suite.d.FvehnV49";


class TareaService {
    async findAll(): Promise<ServiceResponse<Tarea[] | null>> {
        try {
            const tareas = await prisma.tarea.findMany();
            if(tareas.length === 0 || !tareas)  {
                return ServiceResponse.failure("Tareas not found", null, StatusCodes.NOT_FOUND);
            }
            return ServiceResponse.success<Tarea[]>("Tareas encontradas", tareas);
        } catch (error) {
            return ServiceResponse.failure("Error al obtener tareas", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async findById(id: number): Promise<ServiceResponse<Tarea[] | null>> {
        try {
            const tarea = await prisma.tarea.findMany({
                where: { userId: id }
            });
            if(!tarea || tarea.length === 0) {
                return ServiceResponse.failure(`No hay tareas:`, null, StatusCodes.NOT_FOUND);
            }
            return ServiceResponse.success<Tarea[]>("Tareas encontradas", tarea);
        } catch (error) {
            const errorMessage = `Error finding user with id ${id}:, ${(error as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async create(userId: number, tarea: Tarea): Promise<ServiceResponse<Tarea | null>> {
        try {
            tarea.userId = userId;
            const userValidated = TareaSchema.safeParse(tarea);
            if(!userValidated.success){
                return ServiceResponse.failure("Invalid user data", null, StatusCodes.BAD_REQUEST);
            }
            const newTarea = await prisma.tarea.create({
                data: {
                    userId: userValidated.data.userId,
                    titulo: userValidated.data.titulo,
                    descripcion: userValidated.data.descripcion,
                    completada: userValidated.data.completada
                }
            });
            return ServiceResponse.success<Tarea>("Tarea creada", newTarea, StatusCodes.CREATED);

        } catch (error) {
            const errorMessage = `Hubo un error creando una tarea: ${(error as Error).message}`;
            logger.error(errorMessage);
            return ServiceResponse.failure("Hubo un error creando una tarea", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async update(id: number, tarea: Tarea): Promise<ServiceResponse<Tarea | null>> {
        try {
            const userValidated = TareaSchema.safeParse(tarea);
            if(!userValidated.success){
                return ServiceResponse.failure("Invalid user data", null, StatusCodes.BAD_REQUEST);
            }
            const updatedTarea = await prisma.tarea.update({
                where: { id: id },
                data: {
                    userId: userValidated.data.userId,
                    titulo: userValidated.data.titulo,
                    descripcion: userValidated.data.descripcion,
                    completada: userValidated.data.completada
                }
            });
            return ServiceResponse.success<Tarea>("Tarea actualizada", updatedTarea, StatusCodes.OK);
        } catch (error) {
            const errorMessage = `Hubo un error actualizando una tarea: ${(error as Error).message}`;
            logger.error(errorMessage);
            return ServiceResponse.failure("Hubo un error actualizando una tarea", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async delete(id: number): Promise<ServiceResponse<Tarea | null>> {
        try {
            const deletedTarea = await prisma.tarea.delete({
                where: { id: id }
            });
            return ServiceResponse.success<Tarea>("Tarea eliminada", deletedTarea, StatusCodes.OK);
        } catch (error) {
            const errorMessage = `Hubo un error eliminando una tarea: ${(error as Error).message}`;
            logger.error(errorMessage);
            return ServiceResponse.failure("Hubo un error eliminando una tarea", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}

export const tareaService = new TareaService(); 