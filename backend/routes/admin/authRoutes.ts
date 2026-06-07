import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import toUserResponse from "../../utils/toUserResponse.js";
import { getJwtSecret } from "../../config/env.js";
import { sendPasswordResetEmail } from "../../utils/email.js";

const router = express.Router();
const SUPPORTED_LANGUAGES = new Set(["vi", "ja"]);

const messages = {
  vi: {
    missingCredentials: "Thiếu email hoặc mật khẩu",
    missingRegisterInfo: "Vui lòng nhập họ tên, email và mật khẩu",
    invalidEmail: "Email không hợp lệ",
    weakPassword: "Mật khẩu phải có ít nhất 8 ký tự",
    emailExists: "Email này đã được sử dụng",
    phoneExists: "Số điện thoại này đã được sử dụng",
    invalidCredentials: "Email hoặc mật khẩu không đúng",
    inactiveAccount: "Tài khoản đã bị khóa",
    registerSuccess: "Tạo tài khoản thành công",
    loginSuccess: "Đăng nhập thành công",
    registerServerError: "Lỗi server khi tạo tài khoản",
    loginServerError: "Lỗi server khi đăng nhập",
    userNotFound: "Không tìm thấy người dùng",
    meServerError: "Lỗi server",
  },
  ja: {
    missingCredentials:
      "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u307e\u305f\u306f\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u672a\u5165\u529b\u3067\u3059",
    missingRegisterInfo:
      "\u6c0f\u540d\u3001\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3001\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044",
    invalidEmail:
      "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u304c\u6b63\u3057\u304f\u3042\u308a\u307e\u305b\u3093",
    weakPassword:
      "\u30d1\u30b9\u30ef\u30fc\u30c9\u306f8\u6587\u5b57\u4ee5\u4e0a\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044",
    emailExists:
      "\u3053\u306e\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u306f\u3059\u3067\u306b\u4f7f\u7528\u3055\u308c\u3066\u3044\u307e\u3059",
    phoneExists:
      "\u3053\u306e\u96fb\u8a71\u756a\u53f7\u306f\u3059\u3067\u306b\u4f7f\u7528\u3055\u308c\u3066\u3044\u307e\u3059",
    invalidCredentials:
      "\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u307e\u305f\u306f\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u6b63\u3057\u304f\u3042\u308a\u307e\u305b\u3093",
    inactiveAccount:
      "\u3053\u306e\u30a2\u30ab\u30a6\u30f3\u30c8\u306f\u30ed\u30c3\u30af\u3055\u308c\u3066\u3044\u307e\u3059",
    registerSuccess: "\u30a2\u30ab\u30a6\u30f3\u30c8\u3092\u4f5c\u6210\u3057\u307e\u3057\u305f",
    loginSuccess: "\u30ed\u30b0\u30a4\u30f3\u6210\u529f",
    registerServerError:
      "\u30a2\u30ab\u30a6\u30f3\u30c8\u4f5c\u6210\u6642\u306b\u30b5\u30fc\u30d0\u30fc\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f",
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

function normalizeLanguage(value) {
  const language = String(value || "").trim();
  return SUPPORTED_LANGUAGES.has(language) ? language : "vi";
}

function normalizeOptionalLanguage(value) {
  const language = String(value || "").trim();
  return SUPPORTED_LANGUAGES.has(language) ? language : null;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeOptionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hashToken(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function authMessage(lang, key) {
  const extra = {
    vi: {
      resetEmailSent: "Neu email ton tai, he thong da gui lien ket dat lai mat khau",
      resetInvalid: "Lien ket dat lai mat khau khong hop le hoac da het han",
      resetSuccess: "Dat lai mat khau thanh cong",
    },
    ja: {
      resetEmailSent: "メールが存在する場合、パスワード再設定リンクを送信しました",
      resetInvalid: "パスワード再設定リンクが無効または期限切れです",
      resetSuccess: "パスワードを再設定しました",
    },
  };

  return extra[lang === "ja" ? "ja" : "vi"]?.[key] || tr(lang, key);
}

function getFrontendUrl() {
  return process.env.FRONTEND_URL?.split(",")[0]?.trim() || "http://localhost:5173";
}

async function findUserByEmailOrPhone(email, phone) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email },
        ...(phone ? [{ phone }] : []),
      ],
    },
    select: {
      email: true,
      phone: true,
    },
  });
}

router.post("/register", async (req, res) => {
  const lang = normalizeLanguage(req.body?.preferredLanguage);

  try {
    const fullName = String(req.body?.fullName || "").trim();
    const email = normalizeEmail(req.body?.email);
    const phone = normalizeOptionalText(req.body?.phone);
    const password = String(req.body?.password || "");
    const preferredLanguage = lang;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: tr(lang, "missingRegisterInfo") });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: tr(lang, "invalidEmail") });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: tr(lang, "weakPassword") });
    }

    const existingUser = await findUserByEmailOrPhone(email, phone);
    if (existingUser?.email === email) {
      return res.status(409).json({ message: tr(lang, "emailExists") });
    }
    if (phone && existingUser?.phone === phone) {
      return res.status(409).json({ message: tr(lang, "phoneExists") });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: 1,
        preferredLanguage,
        lastLoginAt: new Date(),
        studentProfile: {
          create: {
            fullName,
            profileCompleted: false,
          },
        },
      },
      include: {
        studentProfile: {
          include: {
            major: true,
          },
        },
      },
    });

    const token = signToken(user);

    return res.status(201).json({
      message: tr(lang, "registerSuccess"),
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    if (error?.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target || "");
      const key = target.includes("phone") ? "phoneExists" : "emailExists";
      return res.status(409).json({ message: tr(lang, key) });
    }

    console.error("REGISTER ERROR:", error);
    return res.status(500).json({ message: tr(lang, "registerServerError") });
  }
});

router.post("/login", async (req, res) => {
  const lang = normalizeLanguage(req.body?.preferredLanguage);
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const preferredLanguage = normalizeOptionalLanguage(req.body?.preferredLanguage);

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

router.post("/forgot-password", async (req, res) => {
  const lang = normalizeLanguage(req.body?.preferredLanguage);

  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !isValidEmail(email)) {
      return res.json({ message: authMessage(lang, "resetEmailSent") });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.isActive) {
      const token = crypto.randomBytes(32).toString("hex");
      const resetUrl = new URL("/reset-password", getFrontendUrl());
      resetUrl.searchParams.set("token", token);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: hashToken(token),
          passwordResetExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      try {
        await sendPasswordResetEmail(user.email, resetUrl.toString());
      } catch (error) {
        console.error("PASSWORD RESET EMAIL ERROR:", error);
      }
    }

    return res.json({ message: authMessage(lang, "resetEmailSent") });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({ message: tr(lang, "loginServerError") });
  }
});

router.post("/reset-password", async (req, res) => {
  const lang = normalizeLanguage(req.body?.preferredLanguage);

  try {
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");

    if (!token) {
      return res.status(400).json({ message: authMessage(lang, "resetInvalid") });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: tr(lang, "weakPassword") });
    }

    const user = await prisma.user.findFirst({
      where: {
        passwordResetTokenHash: hashToken(token),
        passwordResetExpiresAt: { gt: new Date() },
        isActive: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: authMessage(lang, "resetInvalid") });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 10),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return res.json({ message: authMessage(lang, "resetSuccess") });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
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
