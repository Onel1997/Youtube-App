"use client";

import { useState } from "react";
import type { GeneratedContent } from "@/types";

interface ActionButtonsProps {
  data: GeneratedContent;
  hasAudio?: boolean;
  audioFilename?: string;
  onDownloadMp3?: () => void | Promise<void>;
  hasVideo?: boolean;
  videoFilename?: string;
  onDownloadMp4?: () => void | Promise<void>;
}

function formatAllContent(data: GeneratedContent): string {
  return [
    "=== SKRIPT ===",
    data.script,
    "",
    "=== TITEL ===",
    data.title,
    "",
    "=== BESCHREIBUNG ===",
    data.description,
    "",
    "=== TAGS ===",
    data.tags.join(", "),
    "",
    "=== THUMBNAIL-IDEE ===",
    data.thumbnailIdea,
  ].join("\n");
}

async function runDownloadHandler(
  label: string,
  handler?: () => void | Promise<void>
): Promise<void> {
  if (!handler) {
    console.warn(`[Download] ${label}: kein Handler verbunden`);
    return;
  }
  await handler();
}

export default function ActionButtons({
  data,
  hasAudio,
  audioFilename,
  onDownloadMp3,
  hasVideo,
  videoFilename,
  onDownloadMp4,
}: ActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState<"mp3" | "mp4" | null>(null);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(formatAllContent(data));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Kopieren fehlgeschlagen. Bitte manuell kopieren.");
    }
  };

  const handleDownloadScript = () => {
    const blob = new Blob([data.script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.title.slice(0, 50).replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").trim() || "skript"}.txt`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 2000);
  };

  const handleMp3Click = async () => {
    setDownloading("mp3");
    try {
      await runDownloadHandler("MP3 (ActionButtons)", onDownloadMp3);
    } finally {
      setDownloading(null);
    }
  };

  const handleMp4Click = async () => {
    setDownloading("mp4");
    try {
      await runDownloadHandler("MP4 (ActionButtons)", onDownloadMp4);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleCopyAll}
        className="flex items-center gap-2 rounded-xl border border-gaming-purple/40 bg-gaming-purple/10 px-5 py-2.5 text-sm font-medium text-gaming-neon transition-all hover:border-gaming-purple hover:bg-gaming-purple/20"
      >
        {copied ? (
          <>
            <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Kopiert!
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Alles kopieren
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleDownloadScript}
        className="flex items-center gap-2 rounded-xl border border-gaming-border bg-gaming-card px-5 py-2.5 text-sm font-medium text-gray-300 transition-all hover:border-gaming-purple/40 hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Skript als .txt
      </button>
      {hasAudio && onDownloadMp3 && (
        <button
          type="button"
          onClick={() => void handleMp3Click()}
          disabled={downloading === "mp3"}
          className="flex items-center gap-2 rounded-xl border border-gaming-glow/30 bg-gaming-glow/10 px-5 py-2.5 text-sm font-medium text-gaming-glow transition-all hover:border-gaming-glow/50 hover:bg-gaming-glow/20 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
          {downloading === "mp3" ? "Lädt…" : audioFilename || "audio.mp3"}
        </button>
      )}
      {hasVideo && onDownloadMp4 && (
        <button
          type="button"
          onClick={() => void handleMp4Click()}
          disabled={downloading === "mp4"}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gaming-accent to-gaming-purple px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-neon disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {downloading === "mp4" ? "Lädt…" : videoFilename || "video.mp4"}
        </button>
      )}
    </div>
  );
}
