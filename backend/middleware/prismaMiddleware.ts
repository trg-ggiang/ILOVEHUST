import prisma from "../database.js";

export default function prismaMiddleware(req, res, next) {
  req.prisma = prisma;
  next();
}