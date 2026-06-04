import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAnthropicApiKey } from "@/lib/env";
import { generateUploadKit } from "@/lib/upload-kit";

export const maxDuration = 60;

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

    console.log("[Upload Kit API] Start", { topic, title });

    const anthropic = new Anthropic({ apiKey });
    const data = await generateUploadKit(anthropic, {
      topic,
      script,
      title,
      description,
      tags,
    });

    console.log("[Upload Kit API] Done", {
      titles: data.titleVariations.length,
      descriptions: data.descriptions.length,
      tags: data.keywordTags.length,
      posts: data.communityPosts.length,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Upload Kit API] Error:", error);
    const message =
      error instanceof Error ? error.message : "Upload Kit Generierung fehlgeschlagen.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
