import { useEffect, useRef, useState, type FormEvent } from "react";
import { BotMessageSquare, Send, Sparkles, X } from "lucide-react";
import api from "../../services/api";

const AI_CHAT_TEXT = {
  vi: {
    title: "AI Chat",
    subtitle: "Trợ lý học tập ILOVEHUST",
    greeting: "Chào bạn, mình là AI Chat của ILOVEHUST. Bạn muốn hỏi gì về học tập, GPA, lịch học hay nhiệm vụ hôm nay?",
    placeholder: "Nhập câu hỏi cho AI Chat...",
    send: "Gửi",
    close: "Đóng AI Chat",
    thinking: "Đang trả lời...",
    fallbackError: "Chưa kết nối được AI lúc này. Bạn thử lại sau nhé.",
    notConfigured: "AI Chat chưa được cấu hình OPENAI_API_KEY ở backend.",
  },
  ja: {
    title: "AIチャット",
    subtitle: "ILOVEHUST 学習アシスタント",
    greeting: "こんにちは。ILOVEHUSTのAIチャットです。学習、GPA、時間割、今日のタスクについて何を聞きたいですか？",
    placeholder: "AIチャットに質問を入力...",
    send: "送信",
    close: "AIチャットを閉じる",
    thinking: "回答中...",
    fallbackError: "現在AIに接続できません。後でもう一度お試しください。",
    notConfigured: "バックエンドでOPENAI_API_KEYがまだ設定されていません。",
  },
};

type AiChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type AiChatWidgetProps = {
  open: boolean;
  language?: "vi" | "ja";
  onClose: () => void;
};

export default function AiChatWidget({ open, language = "vi", onClose }: AiChatWidgetProps) {
  const t = AI_CHAT_TEXT[language] || AI_CHAT_TEXT.vi;
  const [messages, setMessages] = useState<AiChatMessage[]>([{ role: "assistant", content: t.greeting }]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [messages, open]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (!open) return undefined;
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending) return;

    const userMessage: AiChatMessage = { role: "user", content };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const response = await api.post("/ai/chat", {
        language,
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      const answer = String(response.data?.message || "").trim();
      setMessages([...nextMessages, { role: "assistant", content: answer || t.fallbackError }]);
    } catch (requestError) {
      const status = requestError && typeof requestError === "object" && "response" in requestError
        ? (requestError as { response?: { status?: number } }).response?.status
        : undefined;
      const message = status === 503 ? t.notConfigured : t.fallbackError;

      setError(status === 503 ? "" : message);
      setMessages([...nextMessages, { role: "assistant", content: message }]);
    } finally {
      setIsSending(false);
    }
  }

  if (!open) return null;

  return (
    <section className="ai-chat-panel" aria-label={t.title}>
      <div className="ai-chat-head">
        <div className="ai-chat-title">
          <span className="ai-chat-mark">
            <BotMessageSquare size={19} />
          </span>
          <div>
            <strong>{t.title}</strong>
            <small>{t.subtitle}</small>
          </div>
        </div>
        <button type="button" className="ai-chat-close" aria-label={t.close} onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="ai-chat-messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`ai-chat-message ${message.role}`}>
            {message.role === "assistant" ? <Sparkles size={14} /> : null}
            <p>{message.content}</p>
          </div>
        ))}
        {isSending ? (
          <div className="ai-chat-message assistant is-thinking">
            <Sparkles size={14} />
            <p>{t.thinking}</p>
          </div>
        ) : null}
        <div ref={messageEndRef} />
      </div>

      {error ? <p className="ai-chat-error">{error}</p> : null}

      <form className="ai-chat-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t.placeholder}
          disabled={isSending}
        />
        <button type="submit" aria-label={t.send} disabled={isSending || !draft.trim()}>
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}
