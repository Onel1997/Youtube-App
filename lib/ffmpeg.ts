import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";

const execFileAsync = promisify(execFile);

export function getFfmpegPath(): string {
  if (!ffmpegPath) {
    throw new Error(
      "FFmpeg nicht gefunden. Bitte ffmpeg-static installieren (npm install)."
    );
  }
  return ffmpegPath;
}

export function getFfprobePath(): string {
  const path = ffprobe.path as string | undefined;
  if (!path) {
    throw new Error("FFprobe nicht gefunden.");
  }
  return path;
}

export async function runFfmpeg(args: string[]): Promise<void> {
  const bin = getFfmpegPath();
  await execFileAsync(bin, args, { maxBuffer: 1024 * 1024 * 50 });
}

export async function getAudioDurationSeconds(audioPath: string): Promise<number> {
  const ffprobeBin = getFfprobePath();
  const { stdout } = await execFileAsync(ffprobeBin, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    audioPath,
  ]);
  const duration = parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Audiodauer konnte nicht ermittelt werden.");
  }
  return duration;
}
