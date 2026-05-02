import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();
const uploadDir = path.resolve("uploads/messages");

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^\w.\-]+/g, "_");
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
});

function getDisplayName(user) {
  return user?.studentProfile?.fullName || user?.email || "Student";
}

function getInitial(name) {
  return String(name || "?").trim().charAt(0).toUpperCase() || "?";
}

function isOnline(user) {
  if (!user?.lastLoginAt) return false;
  return Date.now() - new Date(user.lastLoginAt).getTime() < 60 * 60 * 1000;
}

function getConversationPeer(conversation, currentUserId) {
  return conversation.members.find((member) => member.userId !== currentUserId)?.user || null;
}

function toConversationResponse(conversation, currentUserId) {
  const currentMember = conversation.members.find((member) => member.userId === currentUserId);
  const peer = getConversationPeer(conversation, currentUserId);
  const isGroup = conversation.type === "group";
  const name = isGroup ? conversation.title || "Nhom chat" : getDisplayName(peer);
  const lastMessage = conversation.messages?.[0] || null;
  const lastSenderName =
    lastMessage?.senderId === currentUserId ? "Ban" : getDisplayName(lastMessage?.sender);
  const attachmentCount = lastMessage?.attachments?.length || 0;
  const lastContent = lastMessage?.content || (attachmentCount > 0 ? `Da gui ${attachmentCount} tep dinh kem` : "");

  return {
    id: conversation.id,
    name,
    avatarInitial: getInitial(name),
    lastMessage: lastMessage ? `${lastSenderName}: ${lastContent}` : "Chua co tin nhan",
    lastMessageAt: lastMessage?.createdAt || conversation.updatedAt,
    unread: currentMember?.unreadCount || 0,
    isGroup,
    online: isGroup
      ? conversation.members.some((member) => member.userId !== currentUserId && isOnline(member.user))
      : isOnline(peer),
    isStarred: currentMember?.isStarred || false,
  };
}

function toAttachmentResponse(attachment) {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    fileUrl: attachment.fileUrl,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    isImage: attachment.mimeType.startsWith("image/"),
  };
}

async function findConversationForUser(conversationId, userId) {
  return prisma.conversation.findFirst({
    where: {
      id: conversationId,
      members: {
        some: { userId, isArchived: false },
      },
    },
    include: {
      members: {
        include: {
          user: {
            include: { studentProfile: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            include: { studentProfile: true },
          },
          attachments: true,
        },
      },
    },
  });
}

async function getConversationList(userId, search = "") {
  const conversations = await prisma.conversation.findMany({
    where: {
      members: {
        some: { userId, isArchived: false },
      },
    },
    include: {
      members: {
        include: {
          user: {
            include: { studentProfile: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          sender: {
            include: { studentProfile: true },
          },
          attachments: true,
        },
      },
    },
  });

  const normalizedSearch = search.trim().toLowerCase();
  return conversations
    .map((conversation) => toConversationResponse(conversation, userId))
    .filter((conversation) => !normalizedSearch || conversation.name.toLowerCase().includes(normalizedSearch))
    .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

function toConversationDetail(conversation, currentUserId) {
  const base = toConversationResponse(
    {
      ...conversation,
      messages: conversation.messages.length
        ? [conversation.messages[conversation.messages.length - 1]]
        : [],
    },
    currentUserId
  );

  return {
    ...base,
    members: conversation.members.map((member) => {
      const name = getDisplayName(member.user);
      return {
        id: member.userId,
        name,
        initial: getInitial(name),
        role: member.role,
        online: isOnline(member.user),
      };
    }),
    attachments: conversation.messages
      .flatMap((message) => message.attachments || [])
      .map(toAttachmentResponse)
      .slice(-12)
      .reverse(),
    messages: conversation.messages.map((message) => ({
      id: message.id,
      sender: getDisplayName(message.sender),
      content: message.content,
      time: message.createdAt,
      isSelf: message.senderId === currentUserId,
      attachments: (message.attachments || []).map(toAttachmentResponse),
    })),
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const search = String(req.query.search || "");
    const conversations = await getConversationList(req.user.id, search);
    return res.json({ conversations });
  } catch (error) {
    console.error("MESSAGES LIST ERROR:", error);
    return res.status(500).json({ message: "Loi server khi tai tin nhan" });
  }
});

router.get("/:conversationId", authMiddleware, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuoc tro chuyen khong hop le" });
    }

    const conversation = await findConversationForUser(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen" });
    }

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.user.id,
        },
      },
      data: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    return res.json({ conversation: toConversationDetail(conversation, req.user.id) });
  } catch (error) {
    console.error("MESSAGE DETAIL ERROR:", error);
    return res.status(500).json({ message: "Loi server khi tai cuoc tro chuyen" });
  }
});

router.patch("/:conversationId/star", authMiddleware, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuoc tro chuyen khong hop le" });
    }

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.user.id,
        },
      },
    });

    if (!member || member.isArchived) {
      return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen" });
    }

    await prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: req.user.id,
        },
      },
      data: {
        isStarred: !member.isStarred,
      },
    });

    const conversation = await findConversationForUser(conversationId, req.user.id);
    const conversations = await getConversationList(req.user.id);

    return res.json({
      conversation: toConversationDetail(conversation, req.user.id),
      conversations,
    });
  } catch (error) {
    console.error("STAR CONVERSATION ERROR:", error);
    return res.status(500).json({ message: "Loi server khi cap nhat danh dau" });
  }
});

router.post("/:conversationId/messages", authMiddleware, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const content = String(req.body?.content || "").trim();

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuoc tro chuyen khong hop le" });
    }

    if (!content) {
      return res.status(400).json({ message: "Noi dung tin nhan khong duoc de trong" });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: { userId: req.user.id, isArchived: false },
        },
      },
      include: {
        members: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen" });
    }

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: req.user.id,
          content,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
      ...conversation.members
        .filter((member) => member.userId !== req.user.id)
        .map((member) =>
          prisma.conversationMember.update({
            where: {
              conversationId_userId: {
                conversationId,
                userId: member.userId,
              },
            },
            data: {
              unreadCount: { increment: 1 },
            },
          })
        ),
    ]);

    const updatedConversation = await findConversationForUser(conversationId, req.user.id);
    const conversations = await getConversationList(req.user.id);

    return res.status(201).json({
      conversation: toConversationDetail(updatedConversation, req.user.id),
      conversations,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return res.status(500).json({ message: "Loi server khi gui tin nhan" });
  }
});

router.post("/:conversationId/attachments", authMiddleware, upload.array("files", 5), async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const files = req.files || [];
    const rawContent = String(req.body?.content || "").trim();

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuoc tro chuyen khong hop le" });
    }

    if (!files.length) {
      return res.status(400).json({ message: "Chua co tep dinh kem" });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: { userId: req.user.id, isArchived: false },
        },
      },
      include: {
        members: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Khong tim thay cuoc tro chuyen" });
    }

    const content =
      rawContent ||
      (files.length === 1
        ? `Da gui ${files[0].originalname}`
        : `Da gui ${files.length} tep dinh kem`);

    await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: req.user.id,
          content,
          messageType: "attachment",
        },
      });

      await tx.messageAttachment.createMany({
        data: files.map((file) => ({
          messageId: message.id,
          fileName: file.originalname,
          fileUrl: `/uploads/messages/${file.filename}`,
          mimeType: file.mimetype,
          fileSize: file.size,
        })),
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      for (const member of conversation.members) {
        if (member.userId !== req.user.id) {
          await tx.conversationMember.update({
            where: {
              conversationId_userId: {
                conversationId,
                userId: member.userId,
              },
            },
            data: {
              unreadCount: { increment: 1 },
            },
          });
        }
      }
    });

    const updatedConversation = await findConversationForUser(conversationId, req.user.id);
    const conversations = await getConversationList(req.user.id);

    return res.status(201).json({
      conversation: toConversationDetail(updatedConversation, req.user.id),
      conversations,
    });
  } catch (error) {
    console.error("UPLOAD MESSAGE ATTACHMENT ERROR:", error);
    return res.status(500).json({ message: "Loi server khi tai tep dinh kem" });
  }
});

export default router;
