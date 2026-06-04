import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/env";
import { createThumbnailPromptsWithGpt } from "@/lib/thumbnail-prompt";
import { generateThumbnailPng } from "@/lib/openai-thumbnail";
import { slugifyFilename } from "@/lib/filename";
import type { ThumbnailVariation } from "@/types/thumbnail";

export const runtime = "nodejs";
export const maxDuration = 300;

const VARIATION_COUNT = 3;

export async function POST(request: NextRequest) {
  try {
    const openaiKey = getOpenAIApiKey();

    if (!openaiKey) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY ist nicht konfiguriert." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const topic = body?.topic?.trim();
    const title = body?.title?.trim();
    const script = body?.script?.trim();
    const thumbnailIdea = body?.thumbnailIdea?.trim() || "";
    const tags: string[] = Array.isArray(body?.tags) ? body.tags : [];

    if (!topic || !title || !script) {
      return NextResponse.json(
        {
          success: false,
          error: "topic, title und script werden für das Thumbnail benötigt.",
        },
        { status: 400 }
      );
    }

    console.log("[Thumbnail API] Start", { topic, title, tagCount: tags.length });

    const promptVariants = await createThumbnailPromptsWithGpt(openaiKey, {
      topic,
      title,
      script,
      thumbnailIdea,
      tags,
    });

    console.log("[Thumbnail API] GPT prompts ready", {
      count: promptVariants.length,
      strategies: promptVariants.map((v) => v.strategy),
    });

    const imageResults = await Promise.all(
      promptVariants.map(async (variant) => {
        const image = await generateThumbnailPng(
          openaiKey,
          variant.prompt,
          variant.label
        );
        return { variant, image };
      })
    );

    const variations: ThumbnailVariation[] = imageResults.map(
      ({ variant, image }) => ({
        id: variant.id,
        label: variant.label,
        strategy: variant.strategy,
        imagePrompt: variant.prompt,
        revisedPrompt: image.revisedPrompt,
        base64: image.base64,
        dataUrl: image.dataUrl,
        imageUrl: image.imageUrl,
        openAiSourceUrl: image.openAiSourceUrl,
      })
    );

    const thumbnailFilename = slugifyFilename(title, "png");

    console.log("[Thumbnail API] Done", {
      variations: variations.length,
      imageUrls: variations.map((v) => ({
        id: v.id,
        hasDataUrl: !!v.dataUrl,
        hasOpenAiUrl: !!v.openAiSourceUrl,
      })),
    });

    return NextResponse.json({
      success: true,
      variations,
      thumbnailFilename,
      count: VARIATION_COUNT,
    });
  } catch (error) {
    console.error("[Thumbnail API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Thumbnail-Generierung fehlgeschlagen.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
