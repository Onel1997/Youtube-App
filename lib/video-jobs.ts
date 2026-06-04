import { existsSync, rmSync } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { TMP_DIR, ensureTmpDir } from "@/lib/tmp-dir";

const JOBS_ROOT = join(TMP_DIR, "video-jobs");

export async function createVideoJobDir(): Promise<{ jobId: string; dir: string }> {
  await ensureTmpDir();
  await mkdir(JOBS_ROOT, { recursive: true });

  const jobId = randomUUID();
  const dir = join(JOBS_ROOT, jobId);
  await mkdir(dir, { recursive: true });

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
