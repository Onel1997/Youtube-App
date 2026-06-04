import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { generateClips } from "@/lib/clip-generator";
import { logTimingBreakdown, timeStep, type TimingStep } from "@/lib/performance-log";

export const runtime = "nodejs";
export const maxDuration = 120;

const TIMING_PREFIX = "[Clip Generator]";

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
    const script = body?.script?.trim();
    const title = body?.title?.trim() || undefined;

    if (!script) {
      return NextResponse.json(
        { success: false, error: "script wird benötigt." },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const data = await timeStep(
      `${TIMING_PREFIX} Claude clip generation`,
      () => generateClips(anthropic, { script, title }),
      steps
    );

    const totalMs = Date.now() - routeStarted;
    const summary = logTimingBreakdown("api/clips", steps, totalMs);
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
    console.error("[Clip Generator API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Clip-Generierung fehlgeschlagen.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
