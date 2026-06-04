import { NextRequest, NextResponse } from "next/server";
import { getOpenAIApiKey } from "@/lib/env";
import { createThumbnailPromptsWithGpt } from "@/lib/thumbnail-prompt";
import { generateThumbnailPng } from "@/lib/openai-thumbnail";
import { slugifyFilename } from "@/lib/filename";
import { logTimingBreakdown, timeStep, type TimingStep } from "@/lib/performance-log";
import type { ThumbnailVariation } from "@/types/thumbnail";

export const runtime = "nodejs";
export const maxDuration = 300;

const VARIATION_COUNT = 3;
const TIMING_PREFIX = "[Thumbnail]";

export async function POST(request: NextRequest) {
  const routeStarted = Date.now();
  const steps: TimingStep[] = [];

  console.time(`${TIMING_PREFIX} total`);

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

    const promptVariants = await timeStep(
      `${TIMING_PREFIX} GPT thumbnail prompts`,
      () =>
        createThumbnailPromptsWithGpt(openaiKey, {
          topic,
          title,
          script,
          thumbnailIdea,
          tags,
        }),
      steps
    );

    const imageResults = await timeStep(
      `${TIMING_PREFIX} OpenAI image generation (3 variants)`,
      () =>
        Promise.all(
          promptVariants.map(async (variant) => {
            const image = await generateThumbnailPng(
              openaiKey,
              variant.prompt,
              variant.label
            );
            return { variant, image };
          })
        ),
      steps
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
    const totalMs = Date.now() - routeStarted;
    const summary = logTimingBreakdown("api/thumbnail", steps, totalMs);
    console.timeEnd(`${TIMING_PREFIX} total`);

    return NextResponse.json({
      success: true,
      variations,
      thumbnailFilename,
      count: VARIATION_COUNT,
      timingMs: {
        total: totalMs,
        slowest: summary.slowest.name,
        slowestMs: summary.slowest.ms,
        steps: summary.steps.map((s) => ({ name: s.name, ms: s.ms })),
      },
    });
  } catch (error) {
    console.timeEnd(`${TIMING_PREFIX} total`);
    console.error("[Thumbnail API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Thumbnail-Generierung fehlgeschlagen.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
