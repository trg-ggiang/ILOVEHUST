import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import toUserResponse from "../../utils/toUserResponse.js";

const router = express.Router();

const messages = {
  vi: {
    missingCredentials: "Thieu email hoac mat khau",
    invalidCredentials: "Email hoac mat khau khong dung",
    inactiveAccount: "Tai khoan da bi khoa",
    loginSuccess: "Dang nhap thanh cong",
    loginServerError: "Loi server khi dang nhap",
    userNotFound: "Khong tim thay user",
    meServerError: "Loi server",
  },
  ja: {
    missingCredentials:
      "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u307e\u305f\u306f\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u672a\u5165\u529b\u3067\u3059",
    invalidCredentials:
      "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u307e\u305f\u306f\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u6b63\u3057\u304f\u3042\u308a\u307e\u305b\u3093",
    inactiveAccount:
      "\u3053\u306e\u30a2\u30ab\u30a6\u30f3\u30c8\u306f\u30ed\u30c3\u30af\u3055\u308c\u3066\u3044\u307e\u3059",
    loginSuccess: "\u30ed\u30b0\u30a4\u30f3\u6210\u529f",
    loginServerError:
      "\u30ed\u30b0\u30a4\u30f3\u6642\u306b\u30b5\u30fc\u30d0\u30fc\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f",
    userNotFound: "\u30e6\u30fc\u30b6\u30fc\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093",
    meServerError: "\u30b5\u30fc\u30d0\u30fc\u30a8\u30e9\u30fc",
  },
};

function tr(lang, key) {
  const selected = lang === "ja" ? "ja" : "vi";
  return messages[selected][key];
}

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
  const lang = req.body?.preferredLanguage === "ja" ? "ja" : "vi";
  try {
    const { email, password, preferredLanguage } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: tr(lang, "missingCredentials") });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        studentProfile: {
          include: {
            major: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: tr(lang, "invalidCredentials") });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: tr(lang, "inactiveAccount") });
    }

    const isMatched = await bcrypt.compare(password, user.passwordHash);

    if (!isMatched) {
      return res.status(401).json({ message: tr(lang, "invalidCredentials") });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        preferredLanguage: preferredLanguage || user.preferredLanguage,
      },
      include: {
        studentProfile: {
          include: {
            major: true,
          },
        },
      },
    });

    const token = signToken(updatedUser);

    return res.json({
      message: tr(lang, "loginSuccess"),
      token,
      user: toUserResponse(updatedUser),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: tr(lang, "loginServerError") });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
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
      return res.status(404).json({ message: tr("vi", "userNotFound") });
    }

    return res.json({ user: toUserResponse(user) });
  } catch (error) {
    console.error("ME ERROR:", error);
    return res.status(500).json({ message: tr("vi", "meServerError") });
  }
});

export default router;
