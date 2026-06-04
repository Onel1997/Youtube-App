import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { downloadBrollClips } from "@/lib/pexels";
import { generateSrtFromScript } from "@/lib/subtitles";
import { getAudioDurationSeconds, runFfmpeg } from "@/lib/ffmpeg";
import { ensureTmpDir } from "@/lib/tmp-dir";

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const OUTPUT_FPS = 30;
const CLIP_COUNT = 8;

function escapeSubtitlesPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

export async function buildVideoFromAssets(options: {
  workDir: string;
  topic: string;
  tags: string[];
  script: string;
  audioBuffer: Buffer;
  pexelsApiKey: string;
}): Promise<string> {
  const { workDir, topic, tags, script, audioBuffer, pexelsApiKey } = options;

  await ensureTmpDir();
  await mkdir(workDir, { recursive: true });

  const audioPath = join(workDir, "audio.mp3");
  const srtPath = join(workDir, "subtitles.srt");
  const normalizedListPath = join(workDir, "normalized.txt");
  const concatVideoPath = join(workDir, "concat.mp4");
  const loopedVideoPath = join(workDir, "looped.mp4");
  const finalPath = join(workDir, "final.mp4");

  await writeFile(audioPath, audioBuffer);

  const clipPaths = await downloadBrollClips(
    pexelsApiKey,
    topic,
    tags,
    CLIP_COUNT,
    workDir
  );

  const audioDuration = await getAudioDurationSeconds(audioPath);
  const segmentDuration = Math.max(3, audioDuration / clipPaths.length);

  const normalizedPaths: string[] = [];
  for (let i = 0; i < clipPaths.length; i++) {
    const normalized = join(workDir, `norm_${i}.mp4`);
    normalizedPaths.push(normalized);

    await runFfmpeg([
      "-y",
      "-i",
      clipPaths[i],
      "-vf",
      `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=increase,crop=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT},fps=${OUTPUT_FPS}`,
      "-t",
      String(segmentDuration),
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "23",
      normalized,
    ]);
  }

  await writeFile(
    normalizedListPath,
    normalizedPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n")
  );

  await runFfmpeg([
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    normalizedListPath,
    "-c",
    "copy",
    concatVideoPath,
  ]);

  await runFfmpeg([
    "-y",
    "-stream_loop",
    "-1",
    "-i",
    concatVideoPath,
    "-t",
    String(audioDuration),
    "-c",
    "copy",
    loopedVideoPath,
  ]);

  const srtContent = generateSrtFromScript(script, audioDuration);
  await writeFile(srtPath, srtContent, "utf8");

  const escapedSrt = escapeSubtitlesPath(srtPath);
  const subtitleStyle =
    "FontName=Arial,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,Alignment=2,MarginV=50,Bold=1";

  await runFfmpeg([
    "-y",
    "-i",
    loopedVideoPath,
    "-i",
    audioPath,
    "-vf",
    `subtitles='${escapedSrt}':force_style='${subtitleStyle}'`,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "22",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-shortest",
    "-movflags",
    "+faststart",
    finalPath,
  ]);

  return finalPath;
}
