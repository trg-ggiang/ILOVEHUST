import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const { fullName, studentCode, majorId, schoolYear, gpa, cpa, cttConnected } = req.body;

    const currentUser = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    if (currentUser.role !== 1) {
      return res.status(403).json({ message: "Chỉ student mới cập nhật hồ sơ này" });
    }

    const updatedProfile = await req.prisma.studentProfile.update({
      where: { userId: req.user.id },
      data: {
        fullName: fullName || currentUser.studentProfile?.fullName || "",
        studentCode: studentCode || null,
        majorId: majorId ? Number(majorId) : null,
        schoolYear: schoolYear ? Number(schoolYear) : null,
        gpa: gpa !== "" && gpa !== null && gpa !== undefined ? Number(gpa) : null,
        cpa: cpa !== "" && cpa !== null && cpa !== undefined ? Number(cpa) : null,
        cttConnected: Boolean(cttConnected),
        profileCompleted: true,
      },
      include: {
        major: true,
      },
    });

    return res.json({
      message: "Cập nhật hồ sơ thành công",
      profile: {
        ...updatedProfile,
        gpa: updatedProfile.gpa ? Number(updatedProfile.gpa) : null,
        cpa: updatedProfile.cpa ? Number(updatedProfile.cpa) : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;