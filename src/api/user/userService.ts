import { StatusCodes } from "http-status-codes";

import { CreateUser, CreateUserSchema, UserSchema, type User } from "@/api/user/userModel";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { prisma } from "@/common/utils/db.server";
import { hashPassword } from "@/common/utils/encript";

export class UserService {

	// Retrieves all users from the database
	async findAll(): Promise<ServiceResponse<User[] | null>> {
		try {
			const users = await prisma.user.findMany();
			if (!users || users.length === 0) {
				return ServiceResponse.failure("No Users found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<User[]>("Users found", users);
		} catch (ex) {
			const errorMessage = `Error finding all users: $${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving users.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// Retrieves a single user by their ID
	async findById(id: number): Promise<ServiceResponse<User | null>> {
		try {
			const user = await prisma.user.findUnique({
				where: {id: id}});
			if (!user) {
				return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<User>("User found", user);
		} catch (ex) {
			const errorMessage = `Error finding user with id ${id}:, ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure("An error occurred while finding user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	async create(usuario: CreateUser): Promise<ServiceResponse<User | null>> {
        logger.info(`Creating user: ${usuario}`);
        const userValidated = CreateUserSchema.safeParse(usuario);
        if(!userValidated.success){
            return ServiceResponse.failure("Invalid user data", null, StatusCodes.BAD_REQUEST);
        }
        try {
            const newUser = await prisma.user.create({
                data: {
                    nombre: userValidated.data.nombre,
                    correo: userValidated.data.correo,
                    contrasena: await hashPassword(userValidated.data.contrasena)
                }
            });
            return ServiceResponse.success<User>("User created", newUser);
        } catch (ex) {
            const errorMessage = `Error creating user: ${(ex as Error).message}`;
            logger.error(errorMessage);
            return ServiceResponse.failure("An error occurred while creating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async update(id: number, usuario: User): Promise<ServiceResponse<User | null>> {
        const usuarioValidate = await UserSchema.partial().safeParse(usuario);
            if(!usuarioValidate.success){
                return ServiceResponse.failure("Invalid user data", null, StatusCodes.BAD_REQUEST);
            }
        try {
            const user = await prisma.user.update({
                where: {
                    id: id
                },
                data: {
                    nombre: usuario.nombre,
                    contrasena: await hashPassword(usuario.contrasena)
                }
            });
            return ServiceResponse.success<User>("User updated", user);
        } catch (error) {
            return ServiceResponse.failure("An error occurred while updating user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async delete(id: number): Promise<ServiceResponse<User | null>> {
        try {
            const eliminatedUser = await prisma.user.delete({where: {id: id}});
            return ServiceResponse.success<User>("User deleted", eliminatedUser);
        } catch (error) {
            return ServiceResponse.failure("An error occurred while deleting user.", null, StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}

export const userService = new UserService();
