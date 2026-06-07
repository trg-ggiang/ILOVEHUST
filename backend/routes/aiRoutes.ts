import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

const MAX_MESSAGES = 12;
const MAX_CONTENT_LENGTH = 2000;
const DEFAULT_MODEL = "gemini-2.5-flash";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

function normalizeMessages(rawMessages: unknown): ChatMessage[] {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .map((message) => {
      if (!message || typeof message !== "object") return null;

      const candidate = message as { role?: unknown; content?: unknown };
      const role = candidate.role === "assistant" ? "assistant" : candidate.role === "user" ? "user" : null;
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";

      if (!role || !content) return null;

      return {
        role,
        content: content.slice(0, MAX_CONTENT_LENGTH),
      };
    })
    .filter((message): message is ChatMessage => Boolean(message))
    .slice(-MAX_MESSAGES);
}

function buildSystemPrompt(language: unknown) {
  const answerInJapanese = language === "ja";
  const responseLanguage = answerInJapanese ? "Japanese" : "Vietnamese";

  return [
    "You are the AI assistant inside ILOVEHUST, a student support app for HUST students.",
    `Always reply in natural ${responseLanguage}, matching the user's selected interface language, unless the user explicitly asks for a translation or another language.`,
    "Be concise, friendly, and practical. Help with study planning, GPA, schedules, tasks, campus-life questions, and app usage.",
    "Do not claim access to private student data unless it is provided in the conversation.",
    "If the user asks for personal records you cannot see, guide them to the relevant app page instead of inventing data.",
  ].join(" ");
}

function errorMessage(language: "vi" | "ja", type: "invalid" | "unavailable" | "empty") {
  const messages = {
    vi: {
      invalid: "Tin nhan khong hop le",
      unavailable: "Khong the ket noi AI luc nay",
      empty: "AI chua tra ve noi dung hop le",
    },
    ja: {
      invalid: "メッセージが無効です",
      unavailable: "現在AIに接続できません",
      empty: "AIから有効な回答が返されませんでした",
    },
  };

  return messages[language][type];
}

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const response = data as {
    candidates?: Array<{
      content?: Array<{
        parts?: Array<{ text?: unknown }>;
      }> | {
        parts?: Array<{ text?: unknown }>;
      };
    }>;
  };

  return (response.candidates || [])
    .flatMap((candidate) => {
      const content = candidate.content;
      if (!content) return [];
      return Array.isArray(content)
        ? content.flatMap((item) => item.parts || [])
        : content.parts || [];
    })
    .map((part) => typeof part.text === "string" ? part.text : "")
    .join("\n")
    .trim();
}

router.post("/chat", authMiddleware, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      message: "AI chat chua duoc cau hinh. Hay them GEMINI_API_KEY trong backend/.env.",
      code: "GEMINI_NOT_CONFIGURED",
    });
  }

  const messages = normalizeMessages(req.body?.messages);
  const language = req.body?.language === "ja" ? "ja" : "vi";

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ message: errorMessage(language, "invalid") });
  }

  try {
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(language) }],
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          maxOutputTokens: 800,
        },
      }),
    });

    const responseText = await geminiResponse.text();
    let responseData: unknown = null;

    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = null;
    }

    if (!geminiResponse.ok) {
      console.error("Gemini chat request failed", {
        status: geminiResponse.status,
        body: responseText.slice(0, 500),
      });
      return res.status(502).json({ message: errorMessage(language, "unavailable") });
    }

    const answer = extractOutputText(responseData);

    if (!answer) {
      return res.status(502).json({ message: errorMessage(language, "empty") });
    }

    return res.json({ message: answer });
  } catch (error) {
    console.error("AI chat route failed", error);
    return res.status(502).json({ message: errorMessage(language, "unavailable") });
  }
});

export default router;
