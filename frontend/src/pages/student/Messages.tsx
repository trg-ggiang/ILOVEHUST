import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Image,
  Info,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Star,
  X,
} from "lucide-react";
import api from "../../api";
import {
  getStoredLanguage,
  getStoredSidebarState,
  setStoredLanguage,
  setStoredSidebarState,
} from "../../i18n/language";
import { MESSAGES_TEXT, STUDENT_COMMON_TEXT } from "../../i18n/translations";
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";
import { useRealtimeRefresh } from "../../utils/useRealtimeRefresh";
import "./Dashboard.css";
import "./Messages.css";

const EMOJI_OPTIONS = [
  "😀",
  "😄",
  "😂",
  "😊",
  "😍",
  "😎",
  "🥲",
  "👍",
  "👏",
  "🔥",
  "💯",
  "🎉",
  "❤️",
  "✨",
  "📚",
  "💻",
  "✅",
  "🙏",
];

function formatTime(value, language, text) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const locale = language === "ja" ? "ja-JP" : "vi-VN";
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return text.yesterday;

  return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
}

function formatFileSize(size) {
  if (!Number.isFinite(size)) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAttachmentContent(content, text) {
  const value = String(content || "").trim();
  const attachmentsMatch = value.match(/^Đã gửi (\d+) tệp đính kèm$/);
  if (attachmentsMatch) return text.sentAttachments(Number(attachmentsMatch[1]));

  const fileMatch = value.match(/^Đã gửi (.+)$/);
  if (fileMatch) return text.sentFile(fileMatch[1]);

  return value;
}

function formatMessageContent(message, text) {
  if (message?.messageType === "attachment") {
    return formatAttachmentContent(message.content, text);
  }

  return message?.content || "";
}

function formatConversationPreview(conversation, text) {
  const preview = conversation.lastMessagePreview;
  if (preview) {
    const sender = preview.senderIsSelf ? text.selfLabel : preview.senderName;
    const content =
      preview.messageType === "attachment"
        ? formatAttachmentContent(preview.content, text)
        : preview.content || text.noMessages;

    return `${sender}: ${content}`;
  }

  const value = String(conversation.lastMessage || "");
  if (!value || value.includes("Chưa có tin nhắn")) return text.noMessages;

  return value
    .replace(/^Bạn:/, `${text.selfLabel}:`)
    .replace(/^Ban:/, `${text.selfLabel}:`)
    .replace(/Đã gửi (\d+) tệp đính kèm/g, (_match, count) => text.sentAttachments(Number(count)))
    .replace(/Đã gửi ([^:]+)$/g, (_match, fileName) => text.sentFile(fileName));
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [studentSearchText, setStudentSearchText] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchText, setChatSearchText] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const t = useMemo(() => MESSAGES_TEXT[language] || MESSAGES_TEXT.vi, [language]);
  const commonText = useMemo(() => STUDENT_COMMON_TEXT[language] || STUDENT_COMMON_TEXT.vi, [language]);

  const visibleMessages = selectedConversation?.messages || [];

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadConversations() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        const response = await api.get("/messages", { params: { search: searchText } });
        if (!mounted) return;

        const nextConversations = response.data?.conversations || [];
        setConversations(nextConversations);
        setSelectedChatId((current) => {
          if (nextConversations.some((conversation) => conversation.id === current)) return current;
          return nextConversations[0]?.id || null;
        });
      } catch {
        if (!mounted) return;
        setError(t.loadFailed);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timeoutId = window.setTimeout(loadConversations, 180);
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [navigate, searchText, t.loadFailed]);

  useEffect(() => {
    let mounted = true;
    const query = studentSearchText.trim();

    if (!newChatOpen || query.length < 2) {
      setStudentResults([]);
      setStudentSearchLoading(false);
      return () => {
        mounted = false;
      };
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setStudentSearchLoading(true);
        const response = await api.get("/messages/students/search", {
          params: { q: query },
        });
        if (!mounted) return;
        setStudentResults(response.data?.students || []);
      } catch {
        if (!mounted) return;
        setError(t.studentSearchFailed);
      } finally {
        if (mounted) setStudentSearchLoading(false);
      }
    }, 220);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [newChatOpen, studentSearchText, t.studentSearchFailed]);

  useEffect(() => {
    let mounted = true;

    if (!selectedChatId) {
      setSelectedConversation(null);
      return () => {
        mounted = false;
      };
    }

    const timeoutId = window.setTimeout(() => {
      async function loadConversationDetail() {
        try {
          const response = await api.get(`/messages/${selectedChatId}`, {
            params: {
              search: chatSearchOpen ? chatSearchText : "",
            },
          });
          if (!mounted) return;
          setSelectedConversation(response.data?.conversation || null);
          setConversations((current) =>
            current.map((conversation) =>
              conversation.id === selectedChatId ? { ...conversation, unread: 0 } : conversation
            )
          );
        } catch {
          if (!mounted) return;
          setError(t.detailFailed);
        }
      }

      loadConversationDetail();
    }, 160);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [chatSearchOpen, chatSearchText, selectedChatId, t.detailFailed]);

  useRealtimeRefresh(async () => {
    const response = await api.get("/messages", { params: { search: searchText } });
    const nextConversations = response.data?.conversations || [];
    setConversations(nextConversations);
    setSelectedChatId((current) => {
      if (nextConversations.some((conversation) => conversation.id === current)) return current;
      return nextConversations[0]?.id || null;
    });
  }, { intervalMs: 6000 });

  useRealtimeRefresh(async () => {
    if (!selectedChatId) return;

    const response = await api.get(`/messages/${selectedChatId}`, {
      params: {
        search: chatSearchOpen ? chatSearchText : "",
      },
    });
    setSelectedConversation(response.data?.conversation || null);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedChatId ? { ...conversation, unread: 0 } : conversation
      )
    );
  }, { enabled: Boolean(selectedChatId), intervalMs: 3500 });

  function handleMenuClick(key) {
    handleStudentMenuNavigation(key, navigate, "messages");
  }

  async function handleSendMessage() {
    const content = messageInput.trim();
    if (!content || !selectedChatId) return;

    try {
      setError("");
      const response = await api.post(`/messages/${selectedChatId}/messages`, { content });
      setSelectedConversation(response.data?.conversation || selectedConversation);
      setConversations(response.data?.conversations || conversations);
      setMessageInput("");
      setEmojiOpen(false);
    } catch {
      setError(t.sendFailed);
    }
  }

  function handleInsertEmoji(emoji) {
    const textarea = messageInputRef.current;
    const start = textarea?.selectionStart ?? messageInput.length;
    const end = textarea?.selectionEnd ?? start;
    const nextMessage = `${messageInput.slice(0, start)}${emoji}${messageInput.slice(end)}`;

    setMessageInput(nextMessage);
    window.requestAnimationFrame(() => {
      if (!messageInputRef.current) return;
      const cursorPosition = start + emoji.length;
      messageInputRef.current.focus();
      messageInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  async function handleToggleStar() {
    if (!selectedChatId) return;

    try {
      setError("");
      const response = await api.patch(`/messages/${selectedChatId}/star`);
      setSelectedConversation(response.data?.conversation || selectedConversation);
      setConversations(response.data?.conversations || conversations);
    } catch {
      setError(t.starFailed);
    }
  }

  async function handleStartDirectChat(studentId) {
    try {
      setError("");
      const response = await api.post("/messages/direct", { userId: studentId });
      const conversation = response.data?.conversation;
      setSelectedConversation(conversation || null);
      setSelectedChatId(conversation?.id || null);
      setConversations(response.data?.conversations || conversations);
      setNewChatOpen(false);
      setStudentSearchText("");
      setStudentResults([]);
    } catch {
      setError(t.startChatFailed);
    }
  }

  async function handleUploadFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!selectedChatId || !files.length) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      setUploading(true);
      setError("");
      const response = await api.post(`/messages/${selectedChatId}/attachments`, formData);
      setSelectedConversation(response.data?.conversation || selectedConversation);
      setConversations(response.data?.conversations || conversations);
    } catch {
      setError(t.uploadFailed);
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="student-layout messages-layout">
      <StudentTaskbar
        language={language}
        activeKey="messages"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <StudentHeader
          fullName={localStorage.getItem("fullName") || commonText.fallbackName}
          studentCode=""
          language={language}
          onLanguageChange={setLanguage}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <section className="student-main-content messages-content">
          <div className="messages-shell">
            <aside className="conversation-panel">
              <div className="conversation-head">
                <div className="conversation-title-row">
                  <div className="conversation-title-icon">
                    <MessageCircle size={20} />
                  </div>
                  <h1>{t.pageTitle}</h1>
                  <button
                    type="button"
                    aria-label={t.newConversation}
                    className={newChatOpen ? "active" : ""}
                    onClick={() => setNewChatOpen((current) => !current)}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <label className="conversation-search">
                  <Search size={18} />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder={t.searchPlaceholder}
                  />
                </label>

                {newChatOpen ? (
                  <div className="new-chat-panel">
                    <label className="new-chat-search">
                      <Search size={17} />
                      <input
                        type="text"
                        value={studentSearchText}
                        onChange={(event) => setStudentSearchText(event.target.value)}
                        placeholder={t.studentSearchPlaceholder}
                        autoFocus
                      />
                    </label>

                    <div className="student-search-results">
                      {studentSearchText.trim().length < 2 ? (
                        <p>{t.studentSearchHint}</p>
                      ) : null}
                      {studentSearchLoading ? <p>{t.studentSearching}</p> : null}
                      {!studentSearchLoading && studentSearchText.trim().length >= 2 && studentResults.length === 0 ? (
                        <p>{t.studentSearchEmpty}</p>
                      ) : null}
                      {studentResults.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          className="student-result-item"
                          onClick={() => handleStartDirectChat(student.id)}
                        >
                          <span className="conversation-avatar direct">
                            {student.avatarInitial}
                            {student.online ? <i /> : null}
                          </span>
                          <span>
                            <strong>{student.fullName}</strong>
                            <small>
                              {student.studentCode || t.noStudentCode} · {student.email}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="conversation-list">
                {loading ? <p className="empty-text">{t.loading}</p> : null}
                {!loading && conversations.length === 0 ? <p className="empty-text">{t.emptyConversations}</p> : null}
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`conversation-item ${selectedChatId === conversation.id ? "active" : ""}`}
                    onClick={() => setSelectedChatId(conversation.id)}
                  >
                    <span className={`conversation-avatar ${conversation.isGroup ? "group" : "direct"}`}>
                      {conversation.avatarInitial}
                      {conversation.online ? <i /> : null}
                    </span>
                    <span className="conversation-copy">
                      <span>
                        <strong>{conversation.name}</strong>
                        <small>{formatTime(conversation.lastMessageAt, language, t)}</small>
                      </span>
                      <em>{formatConversationPreview(conversation, t)}</em>
                    </span>
                    {conversation.unread > 0 ? <b>{conversation.unread}</b> : null}
                  </button>
                ))}
              </div>
            </aside>

            <section className="chat-panel">
              {selectedConversation ? (
                <>
                  <div className="chat-head">
                    <div className="chat-title">
                      <span className={`conversation-avatar ${selectedConversation.isGroup ? "group" : "direct"}`}>
                        {selectedConversation.avatarInitial}
                        {selectedConversation.online ? <i /> : null}
                      </span>
                      <div>
                        <h2>{selectedConversation.name}</h2>
                        <p>{selectedConversation.online ? t.active : t.inactive}</p>
                      </div>
                    </div>
                    <div className="chat-actions">
                      <button
                        type="button"
                        className={chatSearchOpen ? "active" : ""}
                        aria-label={t.search}
                        onClick={() => setChatSearchOpen((current) => !current)}
                      >
                        <Search size={19} />
                      </button>
                      <button
                        type="button"
                        className={selectedConversation.isStarred ? "starred" : ""}
                        aria-label={t.star}
                        onClick={handleToggleStar}
                      >
                        <Star size={19} fill={selectedConversation.isStarred ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        className={infoOpen ? "active" : ""}
                        aria-label={t.info}
                        onClick={() => setInfoOpen((current) => !current)}
                      >
                        <Info size={19} />
                      </button>
                    </div>
                  </div>

                  {chatSearchOpen ? (
                    <div className="chat-search-panel">
                      <Search size={18} />
                      <input
                        type="text"
                        value={chatSearchText}
                        onChange={(event) => setChatSearchText(event.target.value)}
                        placeholder={t.chatSearchPlaceholder}
                        autoFocus
                      />
                      <span>
                        {selectedConversation.messageSearch?.matched ?? visibleMessages.length}/
                        {selectedConversation.messageSearch?.total ?? visibleMessages.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setChatSearchOpen(false);
                          setChatSearchText("");
                        }}
                        aria-label={t.closeSearch}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : null}

                  <div className={`chat-body ${infoOpen ? "with-info" : ""}`}>
                    <div className="chat-stream">
                      <div className="message-list">
                        {visibleMessages.map((message) => (
                          <div key={message.id} className={`message-row ${message.isSelf ? "self" : ""}`}>
                            <div className="message-bundle">
                              {!message.isSelf ? <strong>{message.sender}</strong> : null}
                              <div className="message-bubble">
                                {message.content ? <p>{formatMessageContent(message, t)}</p> : null}
                                {(message.attachments || []).length > 0 ? (
                                  <div className="message-attachments">
                                    {message.attachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={attachment.isImage ? "message-image-attachment" : "message-file-attachment"}
                                      >
                                        {attachment.isImage ? (
                                          <img src={attachment.fileUrl} alt={attachment.fileName} />
                                        ) : (
                                          <>
                                            <FileText size={18} />
                                            <span>
                                              <strong>{attachment.fileName}</strong>
                                              <small>{formatFileSize(attachment.fileSize)}</small>
                                            </span>
                                          </>
                                        )}
                                      </a>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <small>{formatTime(message.time, language, t)}</small>
                            </div>
                          </div>
                        ))}
                      </div>

                      {error ? <p className="messages-error">{error}</p> : null}

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden-file-input"
                        onChange={(event) => handleUploadFiles(event.target.files)}
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden-file-input"
                        onChange={(event) => handleUploadFiles(event.target.files)}
                      />

                      <div className="message-composer">
                        {emojiOpen ? (
                          <div className="emoji-picker" role="menu" aria-label={t.emojiPicker}>
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button key={emoji} type="button" onClick={() => handleInsertEmoji(emoji)}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <div className="message-input-row">
                          <button type="button" aria-label={t.image} onClick={() => imageInputRef.current?.click()} disabled={uploading}>
                            <Image size={20} />
                          </button>
                          <button type="button" aria-label={t.attach} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            <Paperclip size={20} />
                          </button>
                          <textarea
                            ref={messageInputRef}
                            value={messageInput}
                            onChange={(event) => setMessageInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            placeholder={uploading ? t.uploading : t.inputPlaceholder}
                            rows={1}
                          />
                          <button
                            type="button"
                            className={emojiOpen ? "active" : ""}
                            aria-label={t.emoji}
                            aria-expanded={emojiOpen}
                            onClick={() => setEmojiOpen((current) => !current)}
                          >
                            <Smile size={20} />
                          </button>
                          <button type="button" className="send-message-btn" onClick={handleSendMessage} aria-label={t.send}>
                            <Send size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {infoOpen ? (
                      <aside className="chat-info-panel">
                        <div className="chat-info-head">
                          <span className={`conversation-avatar ${selectedConversation.isGroup ? "group" : "direct"}`}>
                            {selectedConversation.avatarInitial}
                          </span>
                          <h3>{selectedConversation.name}</h3>
                          <p>
                            {selectedConversation.isGroup
                              ? t.memberCount(selectedConversation.members?.length || 0)
                              : t.directMessage}
                          </p>
                        </div>

                        <section>
                          <h4>{t.members}</h4>
                          {(selectedConversation.members || []).map((member) => (
                            <div key={member.id} className="chat-member-row">
                              <span>{member.initial}</span>
                              <div>
                                <strong>{member.name}</strong>
                                <small>{member.online ? t.active : t.inactive}</small>
                              </div>
                            </div>
                          ))}
                        </section>

                        <section>
                          <h4>{t.files}</h4>
                          {(selectedConversation.attachments || []).length === 0 ? (
                            <p className="chat-info-empty">{t.emptyFiles}</p>
                          ) : null}
                          {(selectedConversation.attachments || []).map((attachment) => (
                            <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="chat-file-row">
                              {attachment.isImage ? <Image size={18} /> : <FileText size={18} />}
                              <span>
                                <strong>{attachment.fileName}</strong>
                                <small>{formatFileSize(attachment.fileSize)}</small>
                              </span>
                            </a>
                          ))}
                        </section>
                      </aside>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="no-chat">
                  <MessageCircle size={72} />
                  <h2>{t.chooseChat}</h2>
                  <p>{t.chooseChatHint}</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
