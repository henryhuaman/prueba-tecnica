import type { Request, RequestHandler, Response } from "express";
import { tareaService } from "./tareaService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";
import { logger } from "@/server";



class TareaController {
    public getTareas: RequestHandler = async (req: Request, res: Response) => {
        const serviceResponse = await tareaService.findAll();
        handleServiceResponse(serviceResponse, res);
    }

    public getMyTarea: RequestHandler = async (req: Request, res: Response) => {
        const userId = req.user.id;
        const serviceResponse = await tareaService.findById(Number.parseInt(userId,10));
        handleServiceResponse(serviceResponse, res);
    }

    public createTarea: RequestHandler = async (req: Request, res: Response) => {
        const userId = req.user.id;
        logger.info(`Creating tarea for user ${userId}`);
        const serviceResponse = await tareaService.create(Number.parseInt(userId,10), req.body);
        handleServiceResponse(serviceResponse, res);
    }

    public updateTarea: RequestHandler = async (req: Request, res: Response) => {
        const id = Number.parseInt(req.params.id as string, 10);
        const serviceResponse = await tareaService.update(id, req.body);
        handleServiceResponse(serviceResponse, res);
    }

    public deleteTarea: RequestHandler = async (req: Request, res: Response) => {
        const id = Number.parseInt(req.params.id as string, 10);
        const serviceResponse = await tareaService.delete(id);
        handleServiceResponse(serviceResponse, res);
    }

}

export const tareaController = new TareaController();