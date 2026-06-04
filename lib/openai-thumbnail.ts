import OpenAI from "openai";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { runFfmpeg } from "@/lib/ffmpeg";
import { TMP_DIR, ensureTmpDir } from "@/lib/tmp-dir";

export const THUMBNAIL_WIDTH = 1280;
export const THUMBNAIL_HEIGHT = 720;
const THUMBNAIL_SIZE = `${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}` as const;
const FALLBACK_SIZE = "1536x1024" as const;
const IMAGE_MODEL = "gpt-image-1";

export interface GeneratedThumbnailResult {
  base64: string;
  imageUrl: string;
  dataUrl: string;
  revisedPrompt?: string;
  openAiSourceUrl?: string;
}

function logImage(step: string, data: Record<string, unknown>): void {
  console.log(`[OpenAI Image] ${step}`, data);
}

async function fetchRemoteImageAsBase64(url: string): Promise<string> {
  logImage("fetch-url", { url: url.slice(0, 120) });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Bild-Download fehlgeschlagen (HTTP ${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

async function ensure1280x720(base64Png: string): Promise<string> {
  await ensureTmpDir();
  const workDir = await mkdtemp(join(TMP_DIR, "thumb-"));
  const inputPath = join(workDir, "input.png");
  const outputPath = join(workDir, "output.png");

  try {
    await writeFile(inputPath, Buffer.from(base64Png, "base64"));

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-vf",
      `scale=${THUMBNAIL_WIDTH}:${THUMBNAIL_HEIGHT}:force_original_aspect_ratio=increase,crop=${THUMBNAIL_WIDTH}:${THUMBNAIL_HEIGHT}`,
      outputPath,
    ]);

    return (await readFile(outputPath)).toString("base64");
  } finally {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

function parseImageFromResponse(
  item: OpenAI.Images.Image | undefined
): { base64?: string; openAiSourceUrl?: string; revisedPrompt?: string } {
  if (!item) return {};

  return {
    base64: item.b64_json ?? undefined,
    openAiSourceUrl: item.url ?? undefined,
    revisedPrompt: item.revised_prompt ?? undefined,
  };
}

async function callOpenAIImage(
  openai: OpenAI,
  prompt: string,
  size: string,
  label?: string
): Promise<{ base64: string; openAiSourceUrl?: string; revisedPrompt?: string }> {
  logImage("request", {
    model: IMAGE_MODEL,
    size,
    label,
    promptLength: prompt.length,
  });

  const result = await openai.images.generate({
    model: IMAGE_MODEL,
    prompt: prompt.slice(0, 4000),
    size: size as "1024x1024" | "1536x1024" | "1024x1536" | "auto",
    quality: "medium",
    output_format: "png",
    n: 1,
  });

  const item = result.data?.[0];
  const parsed = parseImageFromResponse(item);

  logImage("response", {
    label,
    hasB64: !!parsed.base64,
    hasUrl: !!parsed.openAiSourceUrl,
    revisedPrompt: parsed.revisedPrompt?.slice(0, 80),
  });

  let base64 = parsed.base64;

  if (!base64 && parsed.openAiSourceUrl) {
    base64 = await fetchRemoteImageAsBase64(parsed.openAiSourceUrl);
  }

  if (!base64) {
    throw new Error("OpenAI lieferte weder b64_json noch url.");
  }

  return {
    base64,
    openAiSourceUrl: parsed.openAiSourceUrl,
    revisedPrompt: parsed.revisedPrompt,
  };
}

function isUnsupportedSizeError(error: unknown): boolean {
  if (!(error instanceof OpenAI.APIError)) return false;
  const msg = error.message.toLowerCase();
  return error.status === 400 && (msg.includes("size") || msg.includes("invalid"));
}

/** GPT-Image-1: kein response_format – liefert b64_json oder url. */
export async function generateThumbnailPng(
  openaiApiKey: string,
  imagePrompt: string,
  label?: string
): Promise<GeneratedThumbnailResult> {
  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    let imageData: {
      base64: string;
      openAiSourceUrl?: string;
      revisedPrompt?: string;
    };

    try {
      imageData = await callOpenAIImage(
        openai,
        imagePrompt,
        THUMBNAIL_SIZE,
        label
      );
    } catch (primaryError) {
      if (!isUnsupportedSizeError(primaryError)) {
        if (primaryError instanceof OpenAI.APIError) {
          logImage("api-error", {
            status: primaryError.status,
            message: primaryError.message,
            code: primaryError.code,
            label,
          });
        }
        throw primaryError;
      }

      logImage("fallback-size", { from: THUMBNAIL_SIZE, to: FALLBACK_SIZE, label });
      imageData = await callOpenAIImage(openai, imagePrompt, FALLBACK_SIZE, label);
    }

    const resizedBase64 = await ensure1280x720(imageData.base64);
    const dataUrl = base64ToDataUrl(resizedBase64);

    logImage("complete", {
      label,
      size: THUMBNAIL_SIZE,
      bytes: Math.round((resizedBase64.length * 3) / 4),
    });

    return {
      base64: resizedBase64,
      imageUrl: dataUrl,
      dataUrl,
      revisedPrompt: imageData.revisedPrompt,
      openAiSourceUrl: imageData.openAiSourceUrl,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      logImage("failed", {
        status: error.status,
        message: error.message,
        code: error.code,
        label,
      });
      throw new Error(`OpenAI Image API (${error.status}): ${error.message}`);
    }

    logImage("failed", {
      label,
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function base64ToDataUrl(base64: string): string {
  return `data:image/png;base64,${base64}`;
}
