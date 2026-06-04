import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { generateClips } from "@/lib/clip-generator";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
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

    console.log("[Clip Generator API] Start", { scriptLength: script.length, title });

    const anthropic = new Anthropic({ apiKey });
    const data = await generateClips(anthropic, { script, title });

    console.log("[Clip Generator API] Done", { clips: data.clips.length });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Clip Generator API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Clip-Generierung fehlgeschlagen.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
