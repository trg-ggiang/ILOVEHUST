import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/env.js";
import prisma from "../database.js";

function getTokenPayload(token) {
  const payload = jwt.verify(token, getJwtSecret());

  if (typeof payload === "string" || !Number.isInteger(Number(payload.id))) {
    return null;
  }

  return {
    id: Number(payload.id),
    role: Number(payload.role),
    email: String(payload.email || ""),
  };
}

export default async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Chua co token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = getTokenPayload(token);

    if (!payload) {
      return res.status(401).json({ message: "Token khong hop le hoac da het han" });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ message: "Tai khoan da bi khoa hoac khong ton tai" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Token khong hop le hoac da het han" });
  }
}
