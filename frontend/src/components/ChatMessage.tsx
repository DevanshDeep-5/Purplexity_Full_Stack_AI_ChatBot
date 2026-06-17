
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { url: string }[];
};

type Props = {
  message: Message;
  onFollowUp?: (q: string) => void;
};

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function FaviconIcon({ url }: { url: string }) {
  const domain = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
      alt=""
      width={14}
      height={14}
      className="rounded-sm"
      style={{ objectFit: "contain" }}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

// very light markdown renderer — bold, inline code, line breaks, headers
function renderContent(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="text-sm font-semibold mt-4 mb-1"
          style={{ color: "#c4b5fd" }}
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="text-base font-semibold mt-5 mb-1"
          style={{ color: "#c4b5fd" }}
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={i}
          className="text-lg font-bold mt-5 mb-2"
          style={{ color: "#c4b5fd" }}
        >
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li
          key={i}
          className="text-sm ml-4 mb-1 list-disc"
          style={{ color: "#c8c8d8" }}
        >
          {renderInline(line.slice(2))}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm leading-relaxed" style={{ color: "#c8c8d8" }}>
          {renderInline(line)}
        </p>
      );
    }
  });

  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  // handle **bold**, `code`, and plain text
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`)/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(
        <strong key={match.index} style={{ color: "#e8e8f0", fontWeight: 600 }}>
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded text-xs"
          style={{
            background: "rgba(124, 58, 237, 0.15)",
            color: "#c4b5fd",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {match[3]}
        </code>
      );
    }
    last = regex.lastIndex;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

// extract follow-up questions from the response
function parseFollowUps(content: string): string[] {
  // LLM sometimes writes <FOLLOW_UPS> instead of </FOLLOW_UPS> as the closing tag
  const match = content.match(/<FOLLOW_UPS>([\s\S]*?)(<\/FOLLOW_UPS>|<FOLLOW_UPS>)/);
  if (!match) return [];
  const questions: string[] = [];
  const qRegex = /<question>([\s\S]*?)<\/question>/g;
  let m;
  while ((m = qRegex.exec(match[1])) !== null) {
    if (m[1].trim()) questions.push(m[1].trim());
  }
  return questions;
}

function cleanAnswer(content: string): string {
  return content
    .replace(/<FOLLOW_UPS>[\s\S]*?(<\/FOLLOW_UPS>|<FOLLOW_UPS>)/g, "")
    .replace(/<\/?ANSWER>/g, "")
    .trim();
}

export default function ChatMessage({ message, onFollowUp }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-lg px-4 py-3 rounded-2xl text-sm"
          style={{
            background: "rgba(124, 58, 237, 0.15)",
            border: "1px solid rgba(167, 139, 250, 0.15)",
            color: "#e8e8f0",
            lineHeight: "1.6",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const isStreaming = message.sources === undefined;
  const answer = cleanAnswer(message.content);
  const followUps = parseFollowUps(message.content);
  const sources = message.sources ?? [];

  return (
    <div className="space-y-4">
      {/* sources — always visible, no toggle */}
      {sources.length > 0 && (
        <div className="mb-1">
          <p
            className="text-xs font-medium mb-2 flex items-center gap-1.5"
            style={{ color: "#6b6b85" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {sources.length} sources
          </p>
          <div
            className="flex gap-2 pb-1"
            style={{ overflowX: "auto", scrollbarWidth: "none" }}
          >
            {sources.slice(0, 8).map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150"
                style={{
                  background: "rgba(22, 22, 31, 0.9)",
                  border: "1px solid rgba(167, 139, 250, 0.1)",
                  color: "#9090aa",
                  textDecoration: "none",
                  minWidth: "120px",
                  maxWidth: "160px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.25)";
                  e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)";
                  e.currentTarget.style.color = "#e8e8f0";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.1)";
                  e.currentTarget.style.background = "rgba(22, 22, 31, 0.9)";
                  e.currentTarget.style.color = "#9090aa";
                }}
              >
                <FaviconIcon url={src.url} />
                <span className="truncate">{getDomain(src.url)}</span>
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 ml-auto opacity-40"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* answer body */}
      <div className="space-y-1">
        {answer ? (
          renderContent(answer)
        ) : (
          <div className="flex items-center gap-2">
            <span
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid rgba(167, 139, 250, 0.2)",
                borderTopColor: "#a78bfa",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <span className="text-xs" style={{ color: "#6b6b85" }}>
              Thinking...
            </span>
          </div>
        )}
      </div>

      {/* follow-up questions */}
      {!isStreaming && followUps.length > 0 && (
        <div className="pt-2 space-y-1.5">
          <p className="text-xs" style={{ color: "#6b6b85" }}>
            Related
          </p>
          {followUps.map((q, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all duration-150"
              style={{
                background: "rgba(22, 22, 31, 0.6)",
                border: "1px solid rgba(167, 139, 250, 0.08)",
                color: "#9090aa",
              }}
              onClick={() => onFollowUp?.(q)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)";
                e.currentTarget.style.borderColor = "rgba(167,139,250,0.2)";
                e.currentTarget.style.color = "#e8e8f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(22, 22, 31, 0.6)";
                e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.08)";
                e.currentTarget.style.color = "#9090aa";
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2"
                className="shrink-0"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              {q}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
