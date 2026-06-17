import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { createClient } from "@/lib/supabase/client";
import { BACKEND_URL } from "@/lib/config";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import SearchBar from "@/components/SearchBar";
import WelcomeScreen from "@/components/WelcomeScreen";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { url: string }[];
};

type Conversation = {
  id: string;
  title: string | null;
  slug: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const justStreamedRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/auth");
      } else {
        setUser(data.user);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!user || !conversationId) return;
    if (justStreamedRef.current === conversationId) {
      justStreamedRef.current = null;
      return;
    }
    loadConversation(conversationId);
  }, [conversationId, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }

  async function fetchConversations() {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadConversation(id: string) {
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/conversation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const msgs: Message[] = data.conversation.messages.map((m: any) => ({
        id: String(m.id),
        role: m.role === "User" ? "user" : "assistant",
        content: m.content,
        sources: m.role === "Assistant" ? [] : undefined,
      }));
      setMessages(msgs);
      setCurrentConvId(id);
    } catch (err) {
      console.error(err);
    }
  }

  function parseStream(raw: string): { answer: string; sources: { url: string }[] } {
    const sourcesMatch = raw.match(/<SOURCES>([\s\S]*?)<\/SOURCES>/);
    let sources: { url: string }[] = [];
    let answer = raw;

    if (sourcesMatch) {
      try {
        sources = JSON.parse(sourcesMatch[1].trim());
      } catch {}
      answer = raw.replace(/<SOURCES>[\s\S]*?<\/SOURCES>/, "").trim();
    }

    // strip <ANSWER> tags if LLM uses them
    answer = answer.replace(/<\/?ANSWER>/g, "").trim();

    return { answer, sources };
  }

  async function handleSearch(query: string) {
    if (!query.trim() || loading) return;

    const token = await getToken();
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: query },
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);
    setLoading(true);

    abortRef.current = new AbortController();

    const isFollowUp = currentConvId !== null;
    const url = isFollowUp
      ? `${BACKEND_URL}/purplexity_ask/follow_up`
      : `${BACKEND_URL}/purplexity_ask`;

    const body = isFollowUp
      ? JSON.stringify({ conversation_id: currentConvId, query })
      : JSON.stringify({ query });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const { answer } = parseStream(accumulated);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: answer } : m
          )
        );
      }

      const { answer, sources } = parseStream(accumulated);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: answer, sources } : m
        )
      );

      // wait a beat then refresh conversations list + set current conv
      setTimeout(async () => {
        await fetchConversations();
        if (!isFollowUp) {
          const { data } = await supabase.auth.getSession();
          const tkn = data.session?.access_token ?? "";
          const convRes = await fetch(`${BACKEND_URL}/conversations`, {
            headers: { Authorization: `Bearer ${tkn}` },
          });
          const convData = await convRes.json();
          const latest = convData.conversations?.[0];
          if (latest) {
            justStreamedRef.current = latest.id;
            setCurrentConvId(latest.id);
            navigate(`/c/${latest.id}`, { replace: true });
          }
        }
      }, 500);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error(err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: "Something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setCurrentConvId(null);
    navigate("/", { replace: true });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* background ambient glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-30%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "600px",
            background:
              "radial-gradient(ellipse, rgba(124, 58, 237, 0.07) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={currentConvId}
        user={user}
        onNewChat={startNewChat}
        onSelectConversation={(id) => {
          setCurrentConvId(id);
          navigate(`/c/${id}`);
        }}
        onSignOut={signOut}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main
        className="flex-1 flex flex-col relative overflow-hidden z-10"
        style={{ minWidth: 0 }}
      >
        {/* top bar */}
        <header
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{
            borderBottom: "1px solid rgba(167, 139, 250, 0.06)",
          }}
        >
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#6b6b85" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(167,139,250,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <span
            className="text-sm font-medium"
            style={{ color: "#6b6b85" }}
          >
            {currentConvId
              ? conversations.find((c) => c.id === currentConvId)?.title ?? "Chat"
              : "New chat"}
          </span>
        </header>

        {/* messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen onSearch={handleSearch} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} onFollowUp={handleSearch} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* search input at bottom (only shown when there are messages) */}
        {messages.length > 0 && (
          <div
            className="shrink-0 px-4 py-4"
            style={{
              borderTop: "1px solid rgba(167, 139, 250, 0.06)",
              background: "rgba(10,10,15,0.8)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="max-w-3xl mx-auto">
              <SearchBar onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}