"use client";

interface VideoPlayerProps {
  videoUrl: string;
  filename: string;
  onDownload: () => void | Promise<void>;
}

export default function VideoPlayer({
  videoUrl,
  filename,
  onDownload,
}: VideoPlayerProps) {
  const handleDownloadClick = () => {
    const absoluteUrl =
      videoUrl.startsWith("http") ? videoUrl : `${window.location.origin}${videoUrl}`;

    console.log("[Download] VideoPlayer Button", {
      videoUrl,
      absoluteUrl,
      filename,
      isEmpty: !videoUrl?.trim(),
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </span>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gaming-neon">
            Fertiges Video (MP4)
          </h3>
        </div>
        <button
          type="button"
          onClick={handleDownloadClick}
          className="flex items-center gap-1.5 rounded-lg border border-gaming-glow/40 bg-gaming-glow/10 px-3 py-1.5 text-xs font-medium text-gaming-glow transition-all hover:bg-gaming-glow/20"
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
      <video
        src={videoUrl}
        controls
        className="w-full rounded-lg border border-gaming-border bg-black"
      />
      <p className="mt-2 text-xs text-gray-500">
        B-Roll von Pexels · Untertitel · FFmpeg · 1920×1080
      </p>
    </div>
  );
}
