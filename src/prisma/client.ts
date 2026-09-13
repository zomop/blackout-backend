// Every part of our backend that needs the database imports THIS file,
// instead of creating its own connection. One shared connection = simpler and safer.

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
