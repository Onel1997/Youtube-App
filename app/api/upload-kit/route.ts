import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { logTimingBreakdown, timeStep, type TimingStep } from "@/lib/performance-log";
import { generateUploadKit } from "@/lib/upload-kit";

export const runtime = "nodejs";
export const maxDuration = 60;

const TIMING_PREFIX = "[Upload Kit]";

export async function POST(request: NextRequest) {
  const routeStarted = Date.now();
  const steps: TimingStep[] = [];

  console.time(`${TIMING_PREFIX} total`);

  try {
    const apiKey = getAnthropicApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY ist nicht konfiguriert." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const topic = body?.topic?.trim();
    const script = body?.script?.trim();
    const title = body?.title?.trim();
    const description = body?.description?.trim() || "";
    const tags: string[] = Array.isArray(body?.tags) ? body.tags : [];

    if (!topic || !script || !title) {
      return NextResponse.json(
        { success: false, error: "topic, script und title werden benötigt." },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const data = await timeStep(
      `${TIMING_PREFIX} Claude upload kit generation`,
      () =>
        generateUploadKit(anthropic, {
          topic,
          script,
          title,
          description,
          tags,
        }),
      steps
    );

    const totalMs = Date.now() - routeStarted;
    const summary = logTimingBreakdown("api/upload-kit", steps, totalMs);
    console.timeEnd(`${TIMING_PREFIX} total`);

    return NextResponse.json({
      success: true,
      data,
      timingMs: {
        total: totalMs,
        slowest: summary.slowest.name,
        slowestMs: summary.slowest.ms,
        steps: summary.steps.map((s) => ({ name: s.name, ms: s.ms })),
      },
    });
  } catch (error) {
    console.timeEnd(`${TIMING_PREFIX} total`);
    console.error("[Upload Kit API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Upload Kit Generierung fehlgeschlagen.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
