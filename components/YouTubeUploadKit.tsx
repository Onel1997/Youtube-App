"use client";

import { useState } from "react";
import type { UploadKit } from "@/types/upload-kit";

interface YouTubeUploadKitProps {
  data: UploadKit | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
}

function CopyButton({
  text,
  label = "Kopieren",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Kopieren fehlgeschlagen.");
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="flex items-center gap-1 rounded-md border border-gaming-purple/30 bg-gaming-purple/10 px-2 py-1 text-[10px] font-medium text-gaming-neon transition-all hover:bg-gaming-purple/20"
    >
      {copied ? (
        <>
          <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Kopiert!
        </>
      ) : (
        <>
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function KitSection({
  title,
  copyText,
  children,
}: {
  title: string;
  copyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gaming-border bg-gaming-darker p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gaming-neon">
          {title}
        </h4>
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

function formatAllUploadKit(data: UploadKit): string {
  return [
    "=== VIRALE TITEL (10) ===",
    data.titleVariations.map((t, i) => `${i + 1}. ${t}`).join("\n"),
    "",
    "=== SEO BESCHREIBUNGEN (3) ===",
    ...data.descriptions.map((d, i) => `--- Beschreibung ${i + 1} ---\n${d}\n`),
    "=== KEYWORD TAGS (20) ===",
    data.keywordTags.join(", "),
    "",
    "=== COMMUNITY POSTS (5) ===",
    data.communityPosts.map((p, i) => `${i + 1}. ${p}`).join("\n"),
    "",
    "=== UPLOAD-ZEIT ===",
    data.uploadTime.recommendation,
    `Beste Tage: ${data.uploadTime.bestDays.join(", ")}`,
    `Beste Uhrzeit: ${data.uploadTime.bestHours} (${data.uploadTime.timezone})`,
    data.uploadTime.reasoning,
  ].join("\n");
}

export default function YouTubeUploadKit({
  data,
  isLoading,
  error,
  onRegenerate,
}: YouTubeUploadKitProps) {
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyAll = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(formatAllUploadKit(data));
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch {
      alert("Kopieren fehlgeschlagen.");
    }
  };

  return (
    <div className="neon-border rounded-xl bg-gaming-card p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gaming-purple">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gaming-neon">
              YouTube Upload Kit
            </h3>
            <p className="text-xs text-gray-500">
              Titel · Beschreibungen · Tags · Community · Upload-Zeit
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {data && !isLoading && (
            <button
              type="button"
              onClick={() => void handleCopyAll()}
              className="flex items-center gap-1.5 rounded-lg border border-gaming-glow/40 bg-gaming-glow/10 px-3 py-1.5 text-xs font-medium text-gaming-glow transition-all hover:bg-gaming-glow/20"
            >
              {allCopied ? "Alles kopiert!" : "Alles kopieren"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void onRegenerate()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-gaming-purple/40 bg-gaming-purple/10 px-3 py-1.5 text-xs font-medium text-gaming-neon transition-all hover:bg-gaming-purple/20 disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isLoading ? "Generiert…" : "Neu generieren"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gaming-purple/20 border-t-gaming-purple" />
          <p className="text-xs text-gray-400">Claude erstellt dein Upload Kit…</p>
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-4">
          <KitSection
            title="10 Virale Titel"
            copyText={data.titleVariations.map((t, i) => `${i + 1}. ${t}`).join("\n")}
          >
            <ol className="space-y-2">
              {data.titleVariations.map((title, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-gray-300"
                >
                  <span className="shrink-0 font-mono text-xs text-gaming-purple">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{title}</span>
                </li>
              ))}
            </ol>
          </KitSection>

          <KitSection
            title="3 SEO Beschreibungen"
            copyText={data.descriptions
              .map((d, i) => `--- Beschreibung ${i + 1} ---\n${d}`)
              .join("\n\n")}
          >
            <div className="space-y-4">
              {data.descriptions.map((desc, i) => (
                <div key={i}>
                  <p className="mb-1 text-[10px] font-medium uppercase text-gaming-purple/80">
                    Variante {i + 1}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </KitSection>

          <KitSection
            title="20 Keyword Tags"
            copyText={data.keywordTags.join(", ")}
          >
            <div className="flex flex-wrap gap-2">
              {data.keywordTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gaming-purple/30 bg-gaming-purple/10 px-2.5 py-0.5 text-xs text-gaming-neon"
                >
                  {tag}
                </span>
              ))}
            </div>
          </KitSection>

          <KitSection
            title="5 Community Posts"
            copyText={data.communityPosts.map((p, i) => `${i + 1}. ${p}`).join("\n")}
          >
            <ul className="space-y-2">
              {data.communityPosts.map((post, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="shrink-0 text-gaming-purple">💬</span>
                  <span>{post}</span>
                </li>
              ))}
            </ul>
          </KitSection>

          <KitSection
            title="Upload-Zeit Empfehlung"
            copyText={[
              data.uploadTime.recommendation,
              `Beste Tage: ${data.uploadTime.bestDays.join(", ")}`,
              `Beste Uhrzeit: ${data.uploadTime.bestHours}`,
              `Zeitzone: ${data.uploadTime.timezone}`,
              data.uploadTime.reasoning,
            ].join("\n")}
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-white">
                {data.uploadTime.recommendation}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-gaming-card px-3 py-2">
                  <p className="text-[10px] uppercase text-gray-500">Beste Tage</p>
                  <p className="text-sm text-gaming-neon">
                    {data.uploadTime.bestDays.join(" · ")}
                  </p>
                </div>
                <div className="rounded-md bg-gaming-card px-3 py-2">
                  <p className="text-[10px] uppercase text-gray-500">Uhrzeit</p>
                  <p className="text-sm text-gaming-neon">{data.uploadTime.bestHours}</p>
                </div>
                <div className="rounded-md bg-gaming-card px-3 py-2">
                  <p className="text-[10px] uppercase text-gray-500">Zeitzone</p>
                  <p className="text-sm text-gaming-neon">{data.uploadTime.timezone}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-gray-400">
                {data.uploadTime.reasoning}
              </p>
            </div>
          </KitSection>
        </div>
      )}

      {!isLoading && !data && !error && (
        <p className="py-6 text-center text-xs text-gray-500">
          Upload Kit wird nach dem Video-Paket erstellt…
        </p>
      )}
    </div>
  );
}
