import { mkdir } from "fs/promises";

/** Writable temp root on Vercel and other serverless runtimes. */
export const TMP_DIR = "/tmp";

export async function ensureTmpDir(): Promise<void> {
  await mkdir(TMP_DIR, { recursive: true });
}
