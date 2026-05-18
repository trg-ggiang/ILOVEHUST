import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { createMessageNotifications } from "../../utils/notifications.js";

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
  return user?.studentProfile?.fullName || user?.email || "Sinh viên";
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
  const name = isGroup ? conversation.title || "Nhóm chat" : getDisplayName(peer);
  const lastMessage = conversation.messages?.[0] || null;
  const lastSenderName =
    lastMessage?.senderId === currentUserId ? "Bạn" : getDisplayName(lastMessage?.sender);
  const attachmentCount = lastMessage?.attachments?.length || 0;
  const lastContent = lastMessage?.content || (attachmentCount > 0 ? `Đã gửi ${attachmentCount} tệp đính kèm` : "");

  return {
    id: conversation.id,
    name,
    avatarInitial: getInitial(name),
    lastMessage: lastMessage ? `${lastSenderName}: ${lastContent}` : "Chưa có tin nhắn",
    lastMessagePreview: lastMessage
      ? {
          senderName: lastSenderName,
          senderIsSelf: lastMessage.senderId === currentUserId,
          content: lastContent,
          messageType: lastMessage.messageType,
          attachmentCount,
        }
      : null,
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

function toStudentSearchResponse(user) {
  const profile = user.studentProfile;
  const name = getDisplayName(user);

  return {
    id: user.id,
    fullName: name,
    studentCode: profile?.studentCode || "",
    email: user.email,
    avatarInitial: getInitial(name),
    online: isOnline(user),
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

function messageMatchesSearch(message, search) {
  if (!search) return true;
  const query = search.toLowerCase();
  return (
    String(message.content || "").toLowerCase().includes(query) ||
    getDisplayName(message.sender).toLowerCase().includes(query) ||
    (message.attachments || []).some((attachment) =>
      String(attachment.fileName || "").toLowerCase().includes(query)
    )
  );
}

function toConversationDetail(conversation, currentUserId, search = "") {
  const base = toConversationResponse(
    {
      ...conversation,
      messages: conversation.messages.length
        ? [conversation.messages[conversation.messages.length - 1]]
        : [],
    },
    currentUserId
  );
  const filteredMessages = conversation.messages.filter((message) =>
    messageMatchesSearch(message, search)
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
    messageSearch: {
      query: search,
      total: conversation.messages.length,
      matched: filteredMessages.length,
    },
    messages: filteredMessages.map((message) => ({
      id: message.id,
      sender: getDisplayName(message.sender),
      content: message.content,
      messageType: message.messageType,
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
    return res.status(500).json({ message: "Lỗi server khi tải tin nhắn" });
  }
});

router.get("/students/search", authMiddleware, async (req, res) => {
  try {
    const query = String(req.query?.q || "").trim();

    if (query.length < 2) {
      return res.json({ students: [] });
    }

    const students = await prisma.user.findMany({
      where: {
        id: { not: req.user.id },
        role: 1,
        isActive: true,
        studentProfile: { isNot: null },
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          {
            studentProfile: {
              is: {
                studentCode: { contains: query, mode: "insensitive" },
              },
            },
          },
          {
            studentProfile: {
              is: {
                fullName: { contains: query, mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: { studentProfile: true },
      orderBy: [
        { studentProfile: { studentCode: "asc" } },
        { email: "asc" },
      ],
      take: 12,
    });

    return res.json({ students: students.map(toStudentSearchResponse) });
  } catch (error) {
    console.error("SEARCH STUDENTS ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tìm sinh viên" });
  }
});

router.post("/direct", authMiddleware, async (req, res) => {
  try {
    const targetUserId = Number(req.body?.userId);

    if (!Number.isInteger(targetUserId) || targetUserId <= 0 || targetUserId === req.user.id) {
      return res.status(400).json({ message: "Sinh viên không hợp lệ" });
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        role: 1,
        isActive: true,
      },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }

    const directCandidates = await prisma.conversation.findMany({
      where: {
        type: "direct",
        AND: [
          { members: { some: { userId: req.user.id } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        members: true,
      },
    });
    const existing = directCandidates.find((conversation) => {
      const memberIds = conversation.members.map((member) => member.userId).sort((a, b) => a - b);
      return (
        memberIds.length === 2 &&
        memberIds[0] === Math.min(req.user.id, targetUserId) &&
        memberIds[1] === Math.max(req.user.id, targetUserId)
      );
    });

    if (existing) {
      await prisma.conversationMember.updateMany({
        where: {
          conversationId: existing.id,
          userId: { in: [req.user.id, targetUserId] },
        },
        data: { isArchived: false },
      });
    }

    const conversation =
      (existing ? await findConversationForUser(existing.id, req.user.id) : null) ||
      (await prisma.conversation.create({
        data: {
          type: "direct",
          createdById: req.user.id,
          members: {
            create: [
              { userId: req.user.id },
              { userId: targetUserId },
            ],
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
      }));

    const conversations = await getConversationList(req.user.id);

    return res.status(existing ? 200 : 201).json({
      conversation: toConversationDetail(conversation, req.user.id),
      conversations,
    });
  } catch (error) {
    console.error("START DIRECT CHAT ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo cuộc trò chuyện" });
  }
});

router.get("/:conversationId", authMiddleware, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const search = String(req.query?.search || "").trim();
    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuộc trò chuyện không hợp lệ" });
    }

    const conversation = await findConversationForUser(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
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

    return res.json({ conversation: toConversationDetail(conversation, req.user.id, search) });
  } catch (error) {
    console.error("MESSAGE DETAIL ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải cuộc trò chuyện" });
  }
});

router.patch("/:conversationId/star", authMiddleware, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuộc trò chuyện không hợp lệ" });
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
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
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
    return res.status(500).json({ message: "Lỗi server khi cập nhật đánh dấu" });
  }
});

router.post("/:conversationId/messages", authMiddleware, async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const content = String(req.body?.content || "").trim();

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuộc trò chuyện không hợp lệ" });
    }

    if (!content) {
      return res.status(400).json({ message: "Nội dung tin nhắn không được để trống" });
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
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: req.user.id,
          content,
        },
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

      const sender = await tx.user.findUnique({
        where: { id: req.user.id },
        include: { studentProfile: true },
      });
      await createMessageNotifications(tx, { conversation, sender, message });
    });

    const updatedConversation = await findConversationForUser(conversationId, req.user.id);
    const conversations = await getConversationList(req.user.id);

    return res.status(201).json({
      conversation: toConversationDetail(updatedConversation, req.user.id),
      conversations,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi gửi tin nhắn" });
  }
});

router.post("/:conversationId/attachments", authMiddleware, upload.array("files", 5), async (req, res) => {
  try {
    const conversationId = Number(req.params.conversationId);
    const files = req.files || [];
    const rawContent = String(req.body?.content || "").trim();

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Cuộc trò chuyện không hợp lệ" });
    }

    if (!files.length) {
      return res.status(400).json({ message: "Chưa có tệp đính kèm" });
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
      return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
    }

    const content =
      rawContent ||
      (files.length === 1
        ? `Đã gửi ${files[0].originalname}`
        : `Đã gửi ${files.length} tệp đính kèm`);

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

      const sender = await tx.user.findUnique({
        where: { id: req.user.id },
        include: { studentProfile: true },
      });
      await createMessageNotifications(tx, { conversation, sender, message });
    });

    const updatedConversation = await findConversationForUser(conversationId, req.user.id);
    const conversations = await getConversationList(req.user.id);

    return res.status(201).json({
      conversation: toConversationDetail(updatedConversation, req.user.id),
      conversations,
    });
  } catch (error) {
    console.error("UPLOAD MESSAGE ATTACHMENT ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải tệp đính kèm" });
  }
});

export default router;
