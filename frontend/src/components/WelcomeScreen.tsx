import SearchBar from "./SearchBar";

type Props = {
  onSearch: (query: string) => void;
};

const suggestions = [
  "What is the James Webb Space Telescope discovering?",
  "How does Rust's borrow checker work?",
  "Best practices for React performance in 2025",
  "Explain quantum computing simply",
];

export default function WelcomeScreen({ onSearch }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-16">
      <div
        className="mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: "rgba(124, 58, 237, 0.12)",
          border: "1px solid rgba(167, 139, 250, 0.18)",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="#a78bfa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        className="text-2xl font-semibold mb-2 text-center"
        style={{ color: "#e8e8f0" }}
      >
        What do you want to explore?
      </h2>
      <p className="text-sm mb-10 text-center" style={{ color: "#6b6b85" }}>
        Ask anything — Purplexity searches the web and explains it clearly.
      </p>

      <div className="w-full max-w-2xl mb-8">
        <SearchBar onSearch={onSearch} loading={false} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSearch(s)}
            className="text-left px-4 py-3 rounded-xl text-sm transition-all duration-150"
            style={{
              background: "rgba(22, 22, 31, 0.7)",
              border: "1px solid rgba(167, 139, 250, 0.08)",
              color: "#9090aa",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(124, 58, 237, 0.1)";
              e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.2)";
              e.currentTarget.style.color = "#e8e8f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(22, 22, 31, 0.7)";
              e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.08)";
              e.currentTarget.style.color = "#9090aa";
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
