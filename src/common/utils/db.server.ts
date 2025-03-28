import { PrismaClient } from "@prisma/client";
import { singleton } from "./misc";

const prisma = singleton("prisma", () => {
  const client = new PrismaClient();
  return client;
});
prisma.$connect();

export { prisma };