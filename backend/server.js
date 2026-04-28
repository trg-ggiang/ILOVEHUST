import "dotenv/config";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "./database.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

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

app.get("/", (req, res) => {
  res.json({ message: "ILoveHust backend is running" });
});

app.get("/api/test-users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        studentProfile: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("TEST USERS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Thiếu email hoặc password" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: true,
      },
    });

    console.log("FOUND USER:", user?.email);

    if (!user) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    const isMatched = await bcrypt.compare(password, user.passwordHash);
    console.log("PASSWORD MATCH:", isMatched);

    if (!isMatched) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

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
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});