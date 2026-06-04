"use client";

interface TopicInputProps {
  topic: string;
  onTopicChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function TopicInput({
  topic,
  onTopicChange,
  onSubmit,
  isLoading,
}: TopicInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && topic.trim() && !isLoading) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="neon-border rounded-2xl bg-gaming-card p-6 shadow-neon-sm">
      <label
        htmlFor="topic"
        className="mb-3 block text-sm font-semibold uppercase tracking-wider text-gaming-neon"
      >
        Video-Thema
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='z.B. "AI spielt Minecraft"'
          disabled={isLoading}
          className="flex-1 rounded-xl border border-gaming-border bg-gaming-darker px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-gaming-purple focus:outline-none focus:ring-2 focus:ring-gaming-purple/30 disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={!topic.trim() || isLoading}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gaming-accent to-gaming-purple px-8 py-3 font-semibold text-white transition-all hover:shadow-neon disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generiere...
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generieren
              </>
            )}
          </span>
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Komplettes YouTube-Video: Skript, Audio, B-Roll & MP4 mit Untertiteln
      </p>
    </div>
  );
}
