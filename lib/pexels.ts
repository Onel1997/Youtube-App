import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  url: string;
  duration: number;
  tags: string[];
  video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  videos: PexelsVideo[];
}

const PEXELS_VIDEO_API = "https://api.pexels.com/v1/videos/search";

/** Nur echtes Minecraft-Gameplay – keine generischen Gaming-Stock-Clips */
const MINECRAFT_GAMEPLAY_QUERIES = [
  "minecraft gameplay screen recording",
  "minecraft survival gameplay pov",
  "minecraft building creative gameplay",
  "minecraft mining crafting gameplay",
  "minecraft exploring world gameplay",
  "minecraft parkour gameplay",
  "playing minecraft on computer",
  "minecraft blocks first person",
] as const;

const GENERIC_STOCK_BLOCKLIST = [
  "business",
  "office",
  "meeting",
  "corporate",
  "handshake",
  "city skyline",
  "nature timelapse",
  "fitness",
  "yoga",
  "cooking",
  "coffee shop",
  "abstract background",
  "people talking",
  "stock footage",
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\säöüß-]/gi, " ").replace(/\s+/g, " ").trim();
}

function isMinecraftTopic(topic: string, tags: string[]): boolean {
  const text = normalizeText(`${topic} ${tags.join(" ")}`);
  return /minecraft|mine craft|mc mod|survival modus|redstone|creeper|ender|nether|crafting/i.test(
    text
  );
}

function extractMinecraftContext(topic: string): string {
  const t = normalizeText(topic);
  const stripped = t
    .replace(/minecraft|mine craft|gameplay|gaming|video|youtube/gi, "")
    .trim();
  return stripped.slice(0, 40);
}

/** Baut mehrere spezifische Minecraft-Gameplay-Suchbegriffe (Priorität: konkret → allgemein). */
export function buildPexelsSearchQueries(topic: string, tags: string[]): string[] {
  const context = extractMinecraftContext(topic);
  const queries: string[] = [];

  if (context.length > 2) {
    queries.push(`minecraft gameplay ${context}`);
    queries.push(`minecraft ${context} screen gameplay`);
  }

  if (isMinecraftTopic(topic, tags)) {
    queries.push("minecraft survival gameplay first person");
    queries.push("minecraft creative mode building gameplay");
  }

  queries.push(...MINECRAFT_GAMEPLAY_QUERIES);

  return Array.from(new Set(queries)).slice(0, 10);
}

/** @deprecated Nur für Tests – nutze buildPexelsSearchQueries */
export function buildPexelsQuery(topic: string, tags: string[]): string {
  return buildPexelsSearchQueries(topic, tags)[0];
}

function pickBestVideoFile(files: PexelsVideoFile[]): string | null {
  const mp4s = files.filter((f) => f.file_type === "video/mp4" && f.width >= f.height);
  if (mp4s.length === 0) return null;

  const sorted = [...mp4s].sort((a, b) => {
    const score = (f: PexelsVideoFile) => {
      if (f.quality === "hd" && f.width >= 1280) return 3;
      if (f.width >= 1280) return 2;
      return 1;
    };
    return score(b) - score(a);
  });

  return sorted[0]?.link ?? null;
}

function isLikelyMinecraftGameplay(video: PexelsVideo): boolean {
  const tagText = normalizeText(video.tags.join(" "));
  const combined = `${tagText}`;

  const hasMinecraftSignal =
    /minecraft|mine craft|survival|creative mode|blocks|crafting|redstone|creeper/i.test(
      combined
    );

  const hasStockSignal = GENERIC_STOCK_BLOCKLIST.some((term) => combined.includes(term));

  if (hasStockSignal && !hasMinecraftSignal) return false;

  // Tags oft leer auf Pexels – Gameplay-Clips sind meist 5–120 Sek.
  if (video.duration >= 4 && video.duration <= 120) return true;

  return hasMinecraftSignal;
}

function scoreVideoRelevance(video: PexelsVideo, query: string): number {
  const q = normalizeText(query);
  const tags = normalizeText(video.tags.join(" "));
  let score = 0;

  if (/minecraft/.test(q) && /minecraft|mine craft/.test(tags)) score += 10;
  if (/gameplay|screen|pov|first person|playing/.test(q)) score += 3;
  if (/gameplay|survival|building|mining|parkour/.test(tags)) score += 5;
  if (video.duration >= 8 && video.duration <= 45) score += 2;
  if (GENERIC_STOCK_BLOCKLIST.some((t) => tags.includes(t))) score -= 20;

  return score;
}

async function searchVideos(
  apiKey: string,
  query: string,
  perPage: number
): Promise<PexelsVideo[]> {
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation: "landscape",
    size: "medium",
    min_duration: "4",
    max_duration: "90",
  });

  const response = await fetch(`${PEXELS_VIDEO_API}?${params}`, {
    headers: { Authorization: apiKey },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Pexels API Fehler (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as PexelsSearchResponse;
  return data.videos ?? [];
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download fehlgeschlagen: ${url}`);
  }

  const nodeStream = Readable.fromWeb(response.body as import("stream/web").ReadableStream);
  await pipeline(nodeStream, createWriteStream(destPath));
}

export async function downloadBrollClips(
  apiKey: string,
  topic: string,
  tags: string[],
  count: number,
  outputDir: string
): Promise<string[]> {
  const queries = buildPexelsSearchQueries(topic, tags);
  const seenIds = new Set<number>();
  const ranked: { video: PexelsVideo; score: number }[] = [];

  for (const query of queries) {
    if (ranked.length >= count * 3) break;

    try {
      const videos = await searchVideos(apiKey, query, 15);

      for (const video of videos) {
        if (seenIds.has(video.id)) continue;
        if (!isLikelyMinecraftGameplay(video)) continue;

        seenIds.add(video.id);
        ranked.push({
          video,
          score: scoreVideoRelevance(video, query),
        });
      }
    } catch {
      continue;
    }
  }

  ranked.sort((a, b) => b.score - a.score);

  const downloaded: string[] = [];

  for (const { video } of ranked) {
    if (downloaded.length >= count) break;

    const fileUrl = pickBestVideoFile(video.video_files);
    if (!fileUrl) continue;

    const dest = `${outputDir}/clip_${downloaded.length}.mp4`;
    try {
      await downloadFile(fileUrl, dest);
      downloaded.push(dest);
    } catch {
      // Einzelne Clips überspringen
    }
  }

  if (downloaded.length === 0) {
    throw new Error(
      "Keine Minecraft-Gameplay Videos auf Pexels gefunden. Bitte Thema mit 'Minecraft' spezifizieren."
    );
  }

  return downloaded;
}
