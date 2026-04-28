import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc password" });
    }

    const user = await req.prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const matched = await bcrypt.compare(password, user.passwordHash);

    if (!matched) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    await req.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const token = signToken(user);

    return res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fullName: user.studentProfile?.fullName || "Admin",
        profileCompleted: user.studentProfile?.profileCompleted ?? true,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: {
          include: {
            major: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        fullName: user.studentProfile?.fullName || "Admin",
        profileCompleted: user.studentProfile?.profileCompleted ?? true,
        major: user.studentProfile?.major?.majorName || null,
        schoolYear: user.studentProfile?.schoolYear || null,
        gpa: user.studentProfile?.gpa ? Number(user.studentProfile.gpa) : null,
        cpa: user.studentProfile?.cpa ? Number(user.studentProfile.cpa) : null,
        cttConnected: user.studentProfile?.cttConnected ?? false,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;