"use client";

import Image from "next/image";
import { downloadBase64File } from "@/lib/download";
import type { ThumbnailVariation } from "@/types/thumbnail";

interface GeneratedThumbnailProps {
  variations: ThumbnailVariation[];
  selectedId: string | null;
  baseFilename: string;
  isLoading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onRegenerate: () => void;
}

export default function GeneratedThumbnail({
  variations,
  selectedId,
  baseFilename,
  isLoading,
  error,
  onSelect,
  onRegenerate,
}: GeneratedThumbnailProps) {
  const selected = variations.find((v) => v.id === selectedId);

  const handleDownload = async (variation: ThumbnailVariation) => {
    const name = baseFilename.replace(/\.png$/i, `-${variation.id}.png`);
    console.log("[Download] Thumbnail PNG", {
      id: variation.id,
      filename: name,
      prompt: variation.imagePrompt.slice(0, 80),
    });

    try {
      await downloadBase64File(variation.base64, name, "image/png");
    } catch (err) {
      console.error("[Download] Thumbnail fehlgeschlagen", err);
      alert(err instanceof Error ? err.message : "PNG-Download fehlgeschlagen.");
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gaming-neon">
              Generated Thumbnail
            </h3>
            <p className="text-xs text-gray-500">3 CTR-Varianten · 1280×720</p>
          </div>
        </div>
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
          {isLoading ? "Generiert 3 Varianten…" : "Regenerate Thumbnail"}
        </button>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex aspect-video flex-col items-center justify-center rounded-lg border border-gaming-border bg-gaming-darker"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gaming-purple/20 border-t-gaming-purple" />
              <p className="mt-2 text-xs text-gray-500">Variante {n}…</p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && variations.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {variations.map((variation) => {
              const isSelected = variation.id === selectedId;
              return (
                <div
                  key={variation.id}
                  className={`overflow-hidden rounded-xl border bg-gaming-darker transition-all ${
                    isSelected
                      ? "border-gaming-purple shadow-neon ring-2 ring-gaming-purple/50"
                      : "border-gaming-border hover:border-gaming-purple/40"
                  }`}
                >
                  <div className="relative aspect-video w-full">
                    <Image
                      src={variation.dataUrl}
                      alt={variation.label}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 320px"
                    />
                    {isSelected && (
                      <span className="absolute left-2 top-2 rounded-md bg-gaming-purple px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Aktiv
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 p-3">
                    <div>
                      <p className="text-sm font-medium text-white">{variation.label}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gaming-neon/80">
                        {variation.strategy}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelect(variation.id)}
                        className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-gaming-purple/30 text-gaming-neon"
                            : "bg-gradient-to-r from-gaming-accent to-gaming-purple text-white hover:shadow-neon-sm"
                        }`}
                      >
                        {isSelected ? "✓ In Verwendung" : "Use Thumbnail"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDownload(variation)}
                        className="flex w-full items-center justify-center gap-1 rounded-lg border border-gaming-glow/30 bg-gaming-glow/10 px-3 py-1.5 text-xs font-medium text-gaming-glow hover:bg-gaming-glow/20"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        PNG Download
                      </button>
                    </div>

                    <details>
                      <summary className="cursor-pointer text-[10px] text-gray-500 hover:text-gaming-neon">
                        Prompt
                      </summary>
                      <p className="mt-1 max-h-24 overflow-y-auto rounded bg-gaming-card p-2 text-[10px] leading-relaxed text-gray-400">
                        {variation.imagePrompt}
                      </p>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="mt-4 rounded-lg border border-gaming-purple/30 bg-gaming-purple/5 p-3">
              <p className="text-xs text-gray-400">
                <span className="font-medium text-gaming-neon">Ausgewählt:</span>{" "}
                {selected.label} — {selected.strategy}
              </p>
            </div>
          )}
        </>
      )}

      {!isLoading && variations.length === 0 && !error && (
        <div className="flex aspect-video items-center justify-center rounded-lg border border-gaming-border bg-gaming-darker text-xs text-gray-500">
          Thumbnails werden nach dem Video-Paket erstellt…
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500">
        GPT-4o Prompts · DALL-E 3 · Hoher Kontrast · Emotion · Curiosity Gap · Neon-Farben
      </p>
    </div>
  );
}
