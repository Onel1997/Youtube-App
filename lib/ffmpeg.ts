import { execFile } from "child_process";
import { existsSync } from "fs";
import { access, chmod, copyFile } from "fs/promises";
import { join } from "path";
import { promisify } from "util";
import { TMP_DIR, ensureTmpDir } from "@/lib/tmp-dir";

const isVercel = process.env.VERCEL === "1";
const VERCEL_FFMPEG_UNAVAILABLE = "FFmpeg not available in Vercel runtime";

const execFileAsync = promisify(execFile);

let cachedFfmpegPath: string | null = null;

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

async function stageBinaryForVercel(sourcePath: string): Promise<string> {
  await ensureTmpDir();
  const destPath = join(TMP_DIR, "ffmpeg");
  await copyFile(sourcePath, destPath);
  await chmod(destPath, 0o755);
  console.log(`[FFmpeg] Staged ffmpeg for Vercel at ${destPath}`);
  return destPath;
}

async function resolveFfmpegPath(): Promise<string> {
  const candidates = buildFfmpegCandidates();
  console.log(`[FFmpeg] Resolving ffmpeg (vercel=${isVercel})`);

  for (const candidate of candidates) {
    console.log(`[FFmpeg] Checking ffmpeg path: ${candidate}`);
    if (!(await pathExists(candidate))) continue;

    if (isVercel) {
      const staged = await stageBinaryForVercel(candidate);
      console.log(`[FFmpeg] Using ffmpeg path: ${staged}`);
      return staged;
    }

    console.log(`[FFmpeg] Using ffmpeg path: ${candidate}`);
    return candidate;
  }

  console.error("[FFmpeg] ffmpeg not found. Tried:", candidates);

  if (isVercel) {
    throw new Error(VERCEL_FFMPEG_UNAVAILABLE);
  }

  throw new Error(
    "FFmpeg nicht gefunden. Bitte ffmpeg-static installieren (npm install)."
  );
}

export async function getFfmpegPath(): Promise<string> {
  if (cachedFfmpegPath) return cachedFfmpegPath;
  cachedFfmpegPath = await resolveFfmpegPath();
  return cachedFfmpegPath;
}

export async function runFfmpeg(args: string[]): Promise<void> {
  const bin = await getFfmpegPath();
  await execFileAsync(bin, args, { maxBuffer: 1024 * 1024 * 50 });
}

/** Probe duration via ffmpeg stderr (no ffprobe required). */
async function execFfmpegProbe(
  bin: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
      const out = stdout?.toString() ?? "";
      const err = stderr?.toString() ?? "";

      if (error && !err.includes("Duration:")) {
        reject(error);
        return;
      }

      resolve({ stdout: out, stderr: err });
    });
  });
}

export async function getAudioDurationSeconds(audioPath: string): Promise<number> {
  const bin = await getFfmpegPath();
  const { stderr } = await execFfmpegProbe(bin, [
    "-hide_banner",
    "-i",
    audioPath,
    "-f",
    "null",
    "-",
  ]);

  const match = stderr.match(/Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match) {
    throw new Error("Audiodauer konnte nicht ermittelt werden.");
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseFloat(match[3]);
  const duration = hours * 3600 + minutes * 60 + seconds;

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Audiodauer konnte nicht ermittelt werden.");
  }

  return duration;
}
