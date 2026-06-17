import type { User } from "@supabase/supabase-js";

type Conversation = {
  id: string;
  title: string | null;
  slug: string;
};

type Props = {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  user: User | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onSignOut: () => void;
  onToggle: () => void;
};

export default function Sidebar({
  open,
  conversations,
  activeId,
  user,
  onNewChat,
  onSelectConversation,
  onSignOut,
  onToggle,
}: Props) {
  if (!open) return null;

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <aside
      className="flex flex-col shrink-0 h-full relative z-20"
      style={{
        width: "260px",
        background: "rgba(14, 14, 20, 0.95)",
        borderRight: "1px solid rgba(167, 139, 250, 0.07)",
      }}
    >
      {/* header */}
      <div
        className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(167, 139, 250, 0.06)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(124, 58, 237, 0.2)",
              border: "1px solid rgba(167, 139, 250, 0.2)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#a78bfa"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold" style={{ color: "#e8e8f0" }}>
            Purplexity
          </span>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: "#6b6b85" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(167,139,250,0.08)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* new chat button */}
      <div className="px-3 pt-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          style={{
            background: "rgba(124, 58, 237, 0.12)",
            border: "1px solid rgba(167, 139, 250, 0.15)",
            color: "#a78bfa",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(124, 58, 237, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(124, 58, 237, 0.12)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New chat
        </button>
      </div>

      {/* conversations list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 mt-1">
        {conversations.length > 0 && (
          <p
            className="text-xs px-2 mb-1.5 font-medium uppercase tracking-wider"
            style={{ color: "#6b6b85" }}
          >
            Recent
          </p>
        )}
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          return (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm mb-0.5 transition-all duration-150 truncate block"
              style={{
                background: isActive
                  ? "rgba(124, 58, 237, 0.15)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(167, 139, 250, 0.15)"
                  : "1px solid transparent",
                color: isActive ? "#c4b5fd" : "#9090aa",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(167,139,250,0.06)";
                  e.currentTarget.style.color = "#e8e8f0";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9090aa";
                }
              }}
            >
              {conv.title ?? conv.slug ?? "Untitled"}
            </button>
          );
        })}

        {conversations.length === 0 && (
          <p className="text-xs px-2 py-4 text-center" style={{ color: "#6b6b85" }}>
            No conversations yet
          </p>
        )}
      </div>

      {/* user footer */}
      <div
        className="shrink-0 px-3 py-3"
        style={{ borderTop: "1px solid rgba(167, 139, 250, 0.06)" }}
      >
        <div className="flex items-center justify-between px-2 py-2 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                color: "#fff",
              }}
            >
              {initials}
            </div>
            <span
              className="text-xs truncate"
              style={{ color: "#9090aa" }}
            >
              {user?.email}
            </span>
          </div>
          <button
            onClick={onSignOut}
            className="p-1.5 rounded-lg shrink-0 transition-colors"
            style={{ color: "#6b6b85" }}
            title="Sign out"
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "#f87171")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "#6b6b85")
            }
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
