import express from "express";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (_req, res) => {
  try {
    const majors = await prisma.major.findMany({
      orderBy: [{ majorCode: "asc" }],
      select: {
        id: true,
        majorCode: true,
        majorName: true,
        facultyName: true,
      },
    });

    return res.json({ majors });
  } catch (error) {
    console.error("MAJORS ERROR:", error);
    return res.status(500).json({ message: "Loi server khi lay danh sach nganh" });
  }
});

export default router;
