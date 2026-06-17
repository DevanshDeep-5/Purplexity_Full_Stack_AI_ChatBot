import { useState, useRef, useEffect } from "react";

type Props = {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder?: string;
};

export default function SearchBar({ onSearch, loading, placeholder }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [value]);

  function handleSubmit() {
    const q = value.trim();
    if (!q || loading) return;
    setValue("");
    onSearch(q);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div
      className="flex items-end gap-3 px-4 py-3 rounded-2xl"
      style={{
        background: "rgba(22, 22, 31, 0.9)",
        border: "1px solid rgba(167, 139, 250, 0.12)",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(167, 139, 250, 0.3)";
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(167, 139, 250, 0.12)";
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder ?? "Ask anything..."}
        rows={1}
        className="flex-1 resize-none text-sm outline-none bg-transparent leading-relaxed"
        style={{
          color: "#e8e8f0",
          caretColor: "#a78bfa",
          fontFamily: "inherit",
          minHeight: "24px",
          maxHeight: "160px",
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
        style={{
          background:
            value.trim() && !loading
              ? "linear-gradient(135deg, #7c3aed, #a78bfa)"
              : "rgba(167, 139, 250, 0.1)",
          cursor: value.trim() && !loading ? "pointer" : "default",
          opacity: value.trim() && !loading ? 1 : 0.5,
        }}
      >
        {loading ? (
          <span
            style={{
              width: "14px",
              height: "14px",
              border: "2px solid rgba(167, 139, 250, 0.3)",
              borderTopColor: "#a78bfa",
              borderRadius: "50%",
              display: "block",
              animation: "spin 0.7s linear infinite",
            }}
          />
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        textarea::placeholder { color: #6b6b85; }
      `}</style>
    </div>
  );
}
