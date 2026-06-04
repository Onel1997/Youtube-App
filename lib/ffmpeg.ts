import { execFile } from "child_process";
import { existsSync } from "fs";
import { access, chmod, copyFile } from "fs/promises";
import { arch, platform } from "os";
import { join } from "path";
import { promisify } from "util";
import { TMP_DIR, ensureTmpDir } from "@/lib/tmp-dir";

const isVercel = process.env.VERCEL === "1";
const VERCEL_FFMPEG_UNAVAILABLE = "FFmpeg not available in Vercel runtime";

const execFileAsync = promisify(execFile);

let cachedFfmpegPath: string | null = null;
let cachedFfprobePath: string | null = null;

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function dedupePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of paths) {
    if (p && !seen.has(p)) {
      seen.add(p);
      unique.push(p);
    }
  }
  return unique;
}

function resolvePackageDir(packageName: string): string | null {
  const bases = [process.cwd(), "/var/task"];

  for (const base of bases) {
    const dir = join(base, "node_modules", packageName);
    if (existsSync(join(dir, "package.json"))) {
      return dir;
    }
  }

  return null;
}

function getFfprobeExecutableName(): string {
  return platform() === "win32" ? "ffprobe.exe" : "ffprobe";
}

function buildFfmpegCandidates(): string[] {
  const candidates: string[] = [];

  if (process.env.FFMPEG_BIN) candidates.push(process.env.FFMPEG_BIN);
  if (process.env.FFMPEG_PATH) candidates.push(process.env.FFMPEG_PATH);

  const pkgDir = resolvePackageDir("ffmpeg-static");
  if (pkgDir) {
    candidates.push(join(pkgDir, "ffmpeg"));
  }

  if (isVercel) {
    candidates.push(
      join("/var/task/node_modules/ffmpeg-static/ffmpeg"),
      join(process.cwd(), "node_modules/ffmpeg-static/ffmpeg")
    );
  } else {
    candidates.push("ffmpeg");
  }

  return dedupePaths(candidates);
}

function buildFfprobeCandidates(): string[] {
  const candidates: string[] = [];
  const plat = platform();
  const cpu = arch();
  const executable = getFfprobeExecutableName();

  if (process.env.FFPROBE_PATH) candidates.push(process.env.FFPROBE_PATH);
  if (process.env.FFPROBE_BIN) candidates.push(process.env.FFPROBE_BIN);

  const pkgDir = resolvePackageDir("ffprobe-static");
  if (pkgDir) {
    candidates.push(join(pkgDir, "bin", plat, cpu, executable));
  }

  if (isVercel) {
    candidates.push(
      join("/var/task/node_modules/ffprobe-static/bin", plat, cpu, executable),
      join(process.cwd(), "node_modules/ffprobe-static/bin", plat, cpu, executable)
    );
  } else {
    candidates.push("ffprobe");
  }

  return dedupePaths(candidates);
}

async function stageBinaryForVercel(
  sourcePath: string,
  tmpName: string
): Promise<string> {
  await ensureTmpDir();
  const destPath = join(TMP_DIR, tmpName);
  await copyFile(sourcePath, destPath);
  await chmod(destPath, 0o755);
  console.log(`[FFmpeg] Staged ${tmpName} for Vercel at ${destPath}`);
  return destPath;
}

async function resolveBinary(
  tool: "ffmpeg" | "ffprobe",
  candidates: string[]
): Promise<string> {
  console.log(`[FFmpeg] Resolving ${tool} (vercel=${isVercel})`);

  for (const candidate of candidates) {
    console.log(`[FFmpeg] Checking ${tool} path: ${candidate}`);
    if (!(await pathExists(candidate))) continue;

    if (isVercel) {
      const staged = await stageBinaryForVercel(
        candidate,
        tool === "ffmpeg" ? "ffmpeg" : "ffprobe"
      );
      console.log(`[FFmpeg] Using ${tool} path: ${staged}`);
      return staged;
    }

    console.log(`[FFmpeg] Using ${tool} path: ${candidate}`);
    return candidate;
  }

  console.error(`[FFmpeg] ${tool} not found. Tried:`, candidates);

  if (isVercel) {
    throw new Error(VERCEL_FFMPEG_UNAVAILABLE);
  }

  if (tool === "ffmpeg") {
    throw new Error(
      "FFmpeg nicht gefunden. Bitte ffmpeg-static installieren (npm install)."
    );
  }

  throw new Error("FFprobe nicht gefunden.");
}

export async function getFfmpegPath(): Promise<string> {
  if (cachedFfmpegPath) return cachedFfmpegPath;
  cachedFfmpegPath = await resolveBinary("ffmpeg", buildFfmpegCandidates());
  return cachedFfmpegPath;
}

export async function getFfprobePath(): Promise<string> {
  if (cachedFfprobePath) return cachedFfprobePath;
  cachedFfprobePath = await resolveBinary("ffprobe", buildFfprobeCandidates());
  return cachedFfprobePath;
}

export async function runFfmpeg(args: string[]): Promise<void> {
  const bin = await getFfmpegPath();
  await execFileAsync(bin, args, { maxBuffer: 1024 * 1024 * 50 });
}

export async function getAudioDurationSeconds(audioPath: string): Promise<number> {
  const ffprobeBin = await getFfprobePath();
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
