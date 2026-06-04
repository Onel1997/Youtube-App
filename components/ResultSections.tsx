"use client";

interface ResultSectionProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export function ResultSection({ label, icon, children }: ResultSectionProps) {
  return (
    <div className="neon-border rounded-xl bg-gaming-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-gaming-purple">{icon}</span>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gaming-neon">
          {label}
        </h3>
      </div>
      <div className="text-sm leading-relaxed text-gray-300">{children}</div>
    </div>
  );
}

interface ScriptSectionProps {
  script: string;
}

export function ScriptSection({ script }: ScriptSectionProps) {
  return (
    <ResultSection
      label="Skript"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      }
    >
      <div className="whitespace-pre-wrap">{script}</div>
    </ResultSection>
  );
}

interface TagsSectionProps {
  tags: string[];
}

export function TagsSection({ tags }: TagsSectionProps) {
  return (
    <ResultSection
      label="Tags"
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
      }
    >
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-gaming-purple/30 bg-gaming-purple/10 px-3 py-1 text-xs font-medium text-gaming-neon"
          >
            #{tag}
          </span>
        ))}
      </div>
    </ResultSection>
  );
}
