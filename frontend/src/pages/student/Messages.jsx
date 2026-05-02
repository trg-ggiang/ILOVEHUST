import { useEffect, useRef, useState } from "react";
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
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import "./Dashboard.css";
import "./Messages.css";

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Hom qua";

  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function formatFileSize(size) {
  if (!Number.isFinite(size)) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchText, setChatSearchText] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const visibleMessages = selectedConversation?.messages?.filter((message) => {
    const query = chatSearchText.trim().toLowerCase();
    if (!query) return true;

    return (
      message.content.toLowerCase().includes(query) ||
      message.sender.toLowerCase().includes(query) ||
      (message.attachments || []).some((attachment) => attachment.fileName.toLowerCase().includes(query))
    );
  }) || [];

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
        setError("Khong the tai tin nhan.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timeoutId = window.setTimeout(loadConversations, 180);
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [navigate, searchText]);

  useEffect(() => {
    let mounted = true;

    async function loadConversationDetail() {
      if (!selectedChatId) {
        setSelectedConversation(null);
        return;
      }

      try {
        const response = await api.get(`/messages/${selectedChatId}`);
        if (!mounted) return;
        setSelectedConversation(response.data?.conversation || null);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === selectedChatId ? { ...conversation, unread: 0 } : conversation
          )
        );
      } catch {
        if (!mounted) return;
        setError("Khong the tai cuoc tro chuyen.");
      }
    }

    loadConversationDetail();
    return () => {
      mounted = false;
    };
  }, [selectedChatId]);

  function handleMenuClick(key) {
    if (key === "logout") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("fullName");
      navigate("/login", { replace: true });
      return;
    }

    if (key === "home") {
      navigate("/dashboard");
      return;
    }

    if (key === "grades") {
      navigate("/grades");
      return;
    }

    if (key === "forum") {
      navigate("/forum");
      return;
    }

    if (key === "messages") {
      return;
    }
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
    } catch {
      setError("Khong the gui tin nhan.");
    }
  }

  async function handleToggleStar() {
    if (!selectedChatId) return;

    try {
      setError("");
      const response = await api.patch(`/messages/${selectedChatId}/star`);
      setSelectedConversation(response.data?.conversation || selectedConversation);
      setConversations(response.data?.conversations || conversations);
    } catch {
      setError("Khong the cap nhat danh dau.");
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
      setError("Khong the tai tep dinh kem.");
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
          fullName={localStorage.getItem("fullName") || "Student"}
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
                  <h1>Tin nhan</h1>
                  <button type="button" aria-label="New conversation">
                    <Plus size={20} />
                  </button>
                </div>
                <label className="conversation-search">
                  <Search size={18} />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Tim kiem cuoc tro chuyen..."
                  />
                </label>
              </div>

              <div className="conversation-list">
                {loading ? <p className="empty-text">Dang tai tin nhan...</p> : null}
                {!loading && conversations.length === 0 ? <p className="empty-text">Chua co cuoc tro chuyen.</p> : null}
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
                        <small>{formatTime(conversation.lastMessageAt)}</small>
                      </span>
                      <em>{conversation.lastMessage}</em>
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
                        <p>{selectedConversation.online ? "Dang hoat dong" : "Khong hoat dong"}</p>
                      </div>
                    </div>
                    <div className="chat-actions">
                      <button
                        type="button"
                        className={chatSearchOpen ? "active" : ""}
                        aria-label="Search"
                        onClick={() => setChatSearchOpen((current) => !current)}
                      >
                        <Search size={19} />
                      </button>
                      <button
                        type="button"
                        className={selectedConversation.isStarred ? "starred" : ""}
                        aria-label="Star"
                        onClick={handleToggleStar}
                      >
                        <Star size={19} fill={selectedConversation.isStarred ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        className={infoOpen ? "active" : ""}
                        aria-label="Info"
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
                        placeholder="Tim trong cuoc tro chuyen..."
                        autoFocus
                      />
                      <span>{visibleMessages.length}/{selectedConversation.messages.length}</span>
                      <button type="button" onClick={() => { setChatSearchOpen(false); setChatSearchText(""); }} aria-label="Close search">
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
                                {message.content ? <p>{message.content}</p> : null}
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
                              <small>{formatTime(message.time)}</small>
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

                      <div className="message-input-row">
                        <button type="button" aria-label="Image" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
                          <Image size={20} />
                        </button>
                        <button type="button" aria-label="Attach" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          <Paperclip size={20} />
                        </button>
                        <textarea
                          value={messageInput}
                          onChange={(event) => setMessageInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder={uploading ? "Dang tai tep..." : "Nhap tin nhan..."}
                          rows={1}
                        />
                        <button type="button" aria-label="Emoji"><Smile size={20} /></button>
                        <button type="button" className="send-message-btn" onClick={handleSendMessage} aria-label="Send">
                          <Send size={20} />
                        </button>
                      </div>
                    </div>

                    {infoOpen ? (
                      <aside className="chat-info-panel">
                        <div className="chat-info-head">
                          <span className={`conversation-avatar ${selectedConversation.isGroup ? "group" : "direct"}`}>
                            {selectedConversation.avatarInitial}
                          </span>
                          <h3>{selectedConversation.name}</h3>
                          <p>{selectedConversation.isGroup ? `${selectedConversation.members?.length || 0} thanh vien` : "Tin nhan truc tiep"}</p>
                        </div>

                        <section>
                          <h4>Thanh vien</h4>
                          {(selectedConversation.members || []).map((member) => (
                            <div key={member.id} className="chat-member-row">
                              <span>{member.initial}</span>
                              <div>
                                <strong>{member.name}</strong>
                                <small>{member.online ? "Dang hoat dong" : "Khong hoat dong"}</small>
                              </div>
                            </div>
                          ))}
                        </section>

                        <section>
                          <h4>Tep da gui</h4>
                          {(selectedConversation.attachments || []).length === 0 ? <p className="chat-info-empty">Chua co tep dinh kem.</p> : null}
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
                  <h2>Chon mot cuoc tro chuyen</h2>
                  <p>de bat dau nhan tin</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
