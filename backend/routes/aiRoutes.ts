import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

const MAX_MESSAGES = 12;
const MAX_CONTENT_LENGTH = 2000;
const DEFAULT_MODEL = "gpt-5-mini";

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

  return [
    "You are the AI assistant inside ILOVEHUST, a student support app for HUST students.",
    answerInJapanese ? "Reply in natural Japanese." : "Reply in natural Vietnamese.",
    "Be concise, friendly, and practical. Help with study planning, GPA, schedules, tasks, campus-life questions, and app usage.",
    "Do not claim access to private student data unless it is provided in the conversation.",
    "If the user asks for personal records you cannot see, guide them to the relevant app page instead of inventing data.",
  ].join(" ");
}

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const response = data as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        text?: unknown;
        content?: unknown;
      }>;
    }>;
  };

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  return (response.output || [])
    .flatMap((item) => item.content || [])
    .map((part) => {
      if (typeof part.text === "string") return part.text;
      if (typeof part.content === "string") return part.content;
      return "";
    })
    .join("\n")
    .trim();
}

router.post("/chat", authMiddleware, async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      message: "AI chat chua duoc cau hinh. Hay them OPENAI_API_KEY trong backend/.env.",
      code: "OPENAI_NOT_CONFIGURED",
    });
  }

  const messages = normalizeMessages(req.body?.messages);
  const language = req.body?.language === "ja" ? "ja" : "vi";

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ message: "Tin nhan khong hop le" });
  }

  try {
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: "system",
            content: buildSystemPrompt(language),
          },
          ...messages,
        ],
      }),
    });

    const responseText = await openAiResponse.text();
    let responseData: unknown = null;

    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = null;
    }

    if (!openAiResponse.ok) {
      console.error("OpenAI chat request failed", {
        status: openAiResponse.status,
        body: responseText.slice(0, 500),
      });
      return res.status(502).json({ message: "Khong the ket noi AI luc nay" });
    }

    const answer = extractOutputText(responseData);

    if (!answer) {
      return res.status(502).json({ message: "AI chua tra ve noi dung hop le" });
    }

    return res.json({ message: answer });
  } catch (error) {
    console.error("AI chat route failed", error);
    return res.status(502).json({ message: "Khong the ket noi AI luc nay" });
  }
});

export default router;
