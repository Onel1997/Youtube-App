"use client";

import { useCallback, useState } from "react";
import Header from "@/components/Header";
import TopicInput from "@/components/TopicInput";
import ActionButtons from "@/components/ActionButtons";
import AudioPlayer from "@/components/AudioPlayer";
import VideoPlayer from "@/components/VideoPlayer";
import GeneratedThumbnail from "@/components/GeneratedThumbnail";
import YouTubeUploadKit from "@/components/YouTubeUploadKit";
import ClipGeneratorSection from "@/components/ClipGenerator";
import {
  ResultSection,
  ScriptSection,
  TagsSection,
} from "@/components/ResultSections";
import { downloadBase64File, downloadFile } from "@/lib/download";
import type { GeneratedContent } from "@/types";
import type { ThumbnailVariation } from "@/types/thumbnail";
import type { UploadKit } from "@/types/upload-kit";
import type { ClipGeneratorResult } from "@/types/clips";

type LoadingPhase = "script" | "audio" | "broll" | "video" | null;

export default function GeneratorPage() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string>("audio.mp3");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFilename, setVideoFilename] = useState<string>("video.mp4");

  const [thumbnailVariations, setThumbnailVariations] = useState<ThumbnailVariation[]>([]);
  const [selectedThumbnailId, setSelectedThumbnailId] = useState<string | null>(null);
  const [thumbnailFilename, setThumbnailFilename] = useState("thumbnail.png");
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  const [uploadKit, setUploadKit] = useState<UploadKit | null>(null);
  const [uploadKitLoading, setUploadKitLoading] = useState(false);
  const [uploadKitError, setUploadKitError] = useState<string | null>(null);

  const [clips, setClips] = useState<ClipGeneratorResult | null>(null);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [clipsError, setClipsError] = useState<string | null>(null);

  const handleDownloadMp3 = useCallback(async () => {
    if (!audioBase64) {
      console.warn("[Download] MP3: audioBase64 ist leer");
      return;
    }

    try {
      await downloadBase64File(audioBase64, audioFilename, "audio/mpeg");
    } catch (err) {
      console.error("[Download] MP3 fehlgeschlagen", err);
      alert(err instanceof Error ? err.message : "MP3-Download fehlgeschlagen.");
    }
  }, [audioBase64, audioFilename]);

  const handleDownloadMp4 = useCallback(async () => {
    if (!videoUrl?.trim()) return;

    try {
      await downloadFile(videoUrl, videoFilename);
    } catch (err) {
      console.error("[Download] MP4 fehlgeschlagen", err);
      alert(err instanceof Error ? err.message : "MP4-Download fehlgeschlagen.");
    }
  }, [videoUrl, videoFilename]);

  const generateThumbnail = useCallback(
    async (content: GeneratedContent, videoTopic: string) => {
      setThumbnailLoading(true);
      setThumbnailError(null);

      try {
        const response = await fetch("/api/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: videoTopic,
            title: content.title,
            script: content.script,
            thumbnailIdea: content.thumbnailIdea,
            tags: content.tags,
          }),
        });

        const json = await response.json();

        if (!json.success) {
          setThumbnailError(json.error || "Thumbnail fehlgeschlagen.");
          return;
        }

        const vars: ThumbnailVariation[] = json.variations ?? [];
        setThumbnailVariations(vars);
        setSelectedThumbnailId(vars[0]?.id ?? null);
        setThumbnailFilename(json.thumbnailFilename);

        console.log("[Thumbnail] 3 Varianten generiert", {
          count: vars.length,
          ids: vars.map((v) => v.id),
          prompts: vars.map((v) => v.imagePrompt.slice(0, 60) + "…"),
          selected: vars[0]?.id,
        });
      } catch {
        setThumbnailError("Netzwerkfehler bei der Thumbnail-Generierung.");
      } finally {
        setThumbnailLoading(false);
      }
    },
    []
  );

  const handleRegenerateThumbnail = useCallback(() => {
    if (!result || !topic.trim()) return;
    void generateThumbnail(result, topic.trim());
  }, [result, topic, generateThumbnail]);

  const generateUploadKitData = useCallback(
    async (content: GeneratedContent, videoTopic: string) => {
      setUploadKitLoading(true);
      setUploadKitError(null);

      try {
        const response = await fetch("/api/upload-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: videoTopic,
            script: content.script,
            title: content.title,
            description: content.description,
            tags: content.tags,
          }),
        });

        const json = await response.json();

        if (!json.success) {
          setUploadKitError(json.error || "Upload Kit fehlgeschlagen.");
          return;
        }

        setUploadKit(json.data);
        console.log("[Upload Kit] Generiert", {
          titles: json.data.titleVariations?.length,
          tags: json.data.keywordTags?.length,
        });
      } catch {
        setUploadKitError("Netzwerkfehler beim Upload Kit.");
      } finally {
        setUploadKitLoading(false);
      }
    },
    []
  );

  const handleRegenerateUploadKit = useCallback(() => {
    if (!result || !topic.trim()) return;
    void generateUploadKitData(result, topic.trim());
  }, [result, topic, generateUploadKitData]);

  const generateClipsData = useCallback(async (content: GeneratedContent) => {
    setClipsLoading(true);
    setClipsError(null);

    try {
      const response = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: content.script,
          title: content.title,
        }),
      });

      const json = await response.json();

      if (!json.success) {
        setClipsError(json.error || "Clip Generator fehlgeschlagen.");
        return;
      }

      setClips(json.data);
      console.log("[Clip Generator] Generiert", { clips: json.data.clips?.length });
    } catch {
      setClipsError("Netzwerkfehler beim Clip Generator.");
    } finally {
      setClipsLoading(false);
    }
  }, []);

  const handleRegenerateClips = useCallback(() => {
    if (!result) return;
    void generateClipsData(result);
  }, [result, generateClipsData]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    setLoadingPhase("script");
    setError(null);
    setResult(null);
    setAudioBase64(null);
    setVideoUrl(null);
    setThumbnailVariations([]);
    setSelectedThumbnailId(null);
    setThumbnailError(null);
    setUploadKit(null);
    setUploadKitError(null);
    setClips(null);
    setClipsError(null);

    const phaseTimers = [
      setTimeout(() => setLoadingPhase("audio"), 8000),
      setTimeout(() => setLoadingPhase("broll"), 20000),
      setTimeout(() => setLoadingPhase("video"), 35000),
    ];

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      const json = await response.json();

      if (!json.success) {
        setError(json.error || "Generierung fehlgeschlagen.");
        return;
      }

      setResult(json.data);
      setAudioBase64(json.audioBase64);
      setAudioFilename(json.audioFilename);
      setVideoUrl(json.videoDownloadUrl);
      setVideoFilename(json.videoFilename);

      try {
        await downloadBase64File(json.audioBase64, json.audioFilename, "audio/mpeg");
        await downloadFile(json.videoDownloadUrl, json.videoFilename);
      } catch (downloadErr) {
        console.warn("[Download] Auto-Download fehlgeschlagen", downloadErr);
      }

      void generateThumbnail(json.data, topic.trim());
      void generateUploadKitData(json.data, topic.trim());
      void generateClipsData(json.data);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      phaseTimers.forEach(clearTimeout);
      setIsLoading(false);
      setLoadingPhase(null);
    }
  };

  const loadingMessages: Record<NonNullable<LoadingPhase>, string> = {
    script: "Claude schreibt dein Video-Paket...",
    audio: "ElevenLabs erstellt die Sprachausgabe...",
    broll: "Pexels lädt passende B-Roll Videos...",
    video: "FFmpeg rendert dein MP4 mit Untertiteln...",
  };

  return (
    <main className="gradient-bg min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-gaming-purple/5 blur-3xl" />
        <div className="absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-gaming-glow/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-12">
        <Header />

        <TopicInput
          topic={topic}
          onTopicChange={setTopic}
          onSubmit={handleGenerate}
          isLoading={isLoading}
        />

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-gaming-purple/20 border-t-gaming-purple" />
            <p className="text-sm text-gray-400">
              {loadingPhase ? loadingMessages[loadingPhase] : "Starte Generierung..."}
            </p>
            <p className="text-xs text-gray-600">
              Das kann 1–3 Minuten dauern – 3 Thumbnails folgen danach automatisch
            </p>
          </div>
        )}

        {result && !isLoading && (
          <div className="mt-10 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">
                Dein Video-Paket
              </h2>
              <ActionButtons
                data={result}
                hasAudio={!!audioBase64}
                audioFilename={audioFilename}
                onDownloadMp3={handleDownloadMp3}
                hasVideo={!!videoUrl}
                videoFilename={videoFilename}
                onDownloadMp4={handleDownloadMp4}
              />
            </div>

            {videoUrl && (
              <VideoPlayer
                videoUrl={videoUrl}
                filename={videoFilename}
                onDownload={handleDownloadMp4}
              />
            )}

            {audioBase64 && (
              <AudioPlayer
                audioBase64={audioBase64}
                filename={audioFilename}
                onDownload={handleDownloadMp3}
              />
            )}

            <GeneratedThumbnail
              variations={thumbnailVariations}
              selectedId={selectedThumbnailId}
              baseFilename={thumbnailFilename}
              isLoading={thumbnailLoading}
              error={thumbnailError}
              onSelect={setSelectedThumbnailId}
              onRegenerate={handleRegenerateThumbnail}
            />

            <YouTubeUploadKit
              data={uploadKit}
              isLoading={uploadKitLoading}
              error={uploadKitError}
              onRegenerate={handleRegenerateUploadKit}
            />

            <ClipGeneratorSection
              data={clips}
              isLoading={clipsLoading}
              error={clipsError}
              onRegenerate={handleRegenerateClips}
            />

            <ResultSection
              label="Titel"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              }
            >
              <p className="text-base font-medium text-white">{result.title}</p>
            </ResultSection>

            <ScriptSection script={result.script} />

            <ResultSection
              label="Beschreibung"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
              }
            >
              <div className="whitespace-pre-wrap">{result.description}</div>
            </ResultSection>

            <TagsSection tags={result.tags} />

            <ResultSection
              label="Thumbnail-Idee"
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
            >
              <p>{result.thumbnailIdea}</p>
            </ResultSection>
          </div>
        )}

        <footer className="mt-16 text-center text-xs text-gray-600">
          Powered by Claude · ElevenLabs · Pexels · FFmpeg · OpenAI
        </footer>
      </div>
    </main>
  );
}
