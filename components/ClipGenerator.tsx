"use client";

import { useState } from "react";
import type { ClipGeneratorResult, ClipItem } from "@/types/clips";
import { formatAllClips, formatClipItem } from "@/lib/clip-generator";

interface ClipGeneratorSectionProps {
  data: ClipGeneratorResult | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
}

function CopyButton({ text, label = "Kopieren" }: { text: string; label?: string }) {
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
      {copied ? "Kopiert!" : label}
    </button>
  );
}

function ClipCard({ item, index }: { item: ClipItem; index: number }) {
  return (
    <div className="flex flex-col rounded-lg border border-gaming-border bg-gaming-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-[10px] text-gaming-purple">
            Clip #{index + 1}
          </span>
          <h5 className="mt-0.5 text-sm font-semibold text-white">{item.title}</h5>
        </div>
        <CopyButton text={formatClipItem(item, index)} />
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <p className="mb-0.5 font-semibold uppercase tracking-wider text-gaming-glow">
            Hook
          </p>
          <p className="leading-relaxed text-gray-300">{item.hook}</p>
        </div>
        <div>
          <p className="mb-0.5 font-semibold uppercase tracking-wider text-gaming-neon/80">
            Skript (30–45 Sek)
          </p>
          <p className="whitespace-pre-wrap leading-relaxed text-gray-300">{item.script}</p>
        </div>
        <div>
          <p className="mb-0.5 font-semibold uppercase tracking-wider text-gaming-purple">
            CTA
          </p>
          <p className="leading-relaxed text-gray-300">{item.cta}</p>
        </div>
      </div>
    </div>
  );
}

export default function ClipGeneratorSection({
  data,
  isLoading,
  error,
  onRegenerate,
}: ClipGeneratorSectionProps) {
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyAll = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(formatAllClips(data));
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gaming-neon">
              Clip Generator
            </h3>
            <p className="text-xs text-gray-500">
              5 Retention-Momente aus dem Skript · Shorts, TikTok & Reels
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
              {allCopied ? "Alles kopiert!" : "Alle 5 Clips kopieren"}
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
          <p className="text-xs text-gray-400">
            Claude extrahiert die 5 stärksten Retention-Momente…
          </p>
        </div>
      )}

      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {data.clips.map((item, i) => (
            <ClipCard key={`clip-${i}`} item={item} index={i} />
          ))}
        </div>
      )}

      {!isLoading && !data && !error && (
        <p className="py-6 text-center text-xs text-gray-500">
          Clips werden nach dem Video-Paket aus dem Skript erstellt…
        </p>
      )}
    </div>
  );
}
