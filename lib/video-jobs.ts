import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const JOBS_ROOT = join(process.cwd(), "tmp", "video-jobs");

export function createVideoJobDir(): { jobId: string; dir: string } {
  if (!existsSync(JOBS_ROOT)) {
    mkdirSync(JOBS_ROOT, { recursive: true });
  }

  const jobId = randomUUID();
  const dir = join(JOBS_ROOT, jobId);
  mkdirSync(dir, { recursive: true });

  return { jobId, dir };
}

export function getJobDir(jobId: string): string {
  const safeId = jobId.replace(/[^a-f0-9-]/gi, "");
  return join(JOBS_ROOT, safeId);
}

export function getFinalVideoPath(jobId: string): string {
  return join(getJobDir(jobId), "final.mp4");
}

export function jobVideoExists(jobId: string): boolean {
  return existsSync(getFinalVideoPath(jobId));
}

export function cleanupJob(jobId: string): void {
  const dir = getJobDir(jobId);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}
