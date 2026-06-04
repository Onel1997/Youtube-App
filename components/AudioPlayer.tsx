"use client";

import { useEffect, useRef } from "react";
import { base64ToAudioUrl } from "@/lib/download";

interface AudioPlayerProps {
  audioBase64: string;
  filename: string;
  onDownload: () => void | Promise<void>;
}

export default function AudioPlayer({
  audioBase64,
  filename,
  onDownload,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = base64ToAudioUrl(audioBase64);
    urlRef.current = url;
    console.log("[Download] AudioPlayer Preview-URL", {
      previewUrl: url,
      filename,
      base64Length: audioBase64.length,
    });

    if (audioRef.current) {
      audioRef.current.src = url;
    }

    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
      }
    };
  }, [audioBase64, filename]);

  const handleDownloadClick = () => {
    console.log("[Download] AudioPlayer Button", {
      previewUrl: urlRef.current,
      filename,
    });
    void onDownload();
  };

  return (
    <div className="neon-border rounded-xl bg-gaming-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-gaming-purple">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gaming-neon">
            Sprachausgabe (MP3)
          </h3>
        </div>
        <button
          type="button"
          onClick={handleDownloadClick}
          className="flex items-center gap-1.5 rounded-lg border border-gaming-purple/40 bg-gaming-purple/10 px-3 py-1.5 text-xs font-medium text-gaming-neon transition-all hover:bg-gaming-purple/20"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {filename}
        </button>
      </div>
      <audio ref={audioRef} controls className="w-full" />
      <p className="mt-2 text-xs text-gray-500">
        Deutsche männliche Stimme · ElevenLabs · automatisch generiert
      </p>
    </div>
  );
}
