import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  getAnthropicApiKey,
  getElevenLabsApiKey,
  getPexelsApiKey,
} from "@/lib/env";
import { generateSpeechMp3 } from "@/lib/elevenlabs";
import { slugifyFilename } from "@/lib/filename";
import { logTimingBreakdown, timeStep, type TimingStep } from "@/lib/performance-log";
import { createVideoJobDir } from "@/lib/video-jobs";
import { buildVideoFromAssets } from "@/lib/video-builder";
import type { GeneratedContent } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-sonnet-4-6";
const TIMING_PREFIX = "[Generate]";

const SYSTEM_PROMPT = `Du bist ein erfahrener YouTube-Scriptwriter für einen deutschen Gaming & Entertainment Kanal.
Dein Stil ist locker, unterhaltsam und jugendlich – wie ein cooler Gaming-YouTuber der mit seinen Zuschauern auf Augenhöhe spricht.

Du antwortest IMMER als valides JSON-Objekt ohne Markdown-Codeblöcke, ohne Backticks und ohne zusätzlichen Text.
Das JSON muss exakt dieses Format haben:

{
  "script": "Das vollständige Video-Skript als Fließtext mit Absätzen. Struktur: HOOK (0-3 Sek, packender Einstieg) → STORY/CONTENT (Hauptinhalt, spannend erzählt) → CTA (Call-to-Action am Ende, z.B. Abo, Like, Kommentar)",
  "title": "Clickbait-optimierter deutscher YouTube-Titel (max 70 Zeichen, mit Emojis erlaubt)",
  "description": "SEO-optimierte deutsche Video-Beschreibung (150-300 Wörter, mit Keywords, Absätzen und Hashtags am Ende)",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "thumbnailIdea": "Detaillierte Beschreibung einer auffälligen Thumbnail-Idee (Farben, Gesichter, Text-Overlay, Emotionen)"
}`;

export async function POST(request: NextRequest) {
  const routeStarted = Date.now();
  const steps: TimingStep[] = [];

  console.time(`${TIMING_PREFIX} total`);

  try {
    const apiKey = getAnthropicApiKey();
    const elevenLabsKey = getElevenLabsApiKey();
    const pexelsKey = getPexelsApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ANTHROPIC_API_KEY ist nicht konfiguriert." },
        { status: 500 }
      );
    }

    if (!elevenLabsKey) {
      return NextResponse.json(
        { success: false, error: "ELEVENLABS_API_KEY ist nicht konfiguriert." },
        { status: 500 }
      );
    }

    if (!pexelsKey) {
      return NextResponse.json(
        { success: false, error: "PEXELS_API_KEY ist nicht konfiguriert." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const topic = body?.topic?.trim();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: "Bitte gib ein Video-Thema ein." },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await timeStep(`${TIMING_PREFIX} Claude script generation`, async () => {
      return anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Erstelle ein komplettes YouTube-Video-Paket für folgendes Thema: "${topic}"

Das Skript soll auf Deutsch sein, ca. 2-3 Minuten Sprechzeit (ca. 300-450 Wörter).
Der Hook muss in den ersten 3 Sekunden fesseln.
Der Ton soll locker, unterhaltsam und jugendlich sein – perfekt für einen Gaming & Entertainment Kanal.`,
          },
        ],
      });
    }, steps);

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { success: false, error: "Keine Antwort von Claude erhalten." },
        { status: 500 }
      );
    }

    let parsed: GeneratedContent;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          { success: false, error: "Antwort konnte nicht verarbeitet werden." },
          { status: 500 }
        );
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (
      !parsed.script ||
      !parsed.title ||
      !parsed.description ||
      !parsed.tags ||
      !parsed.thumbnailIdea
    ) {
      return NextResponse.json(
        { success: false, error: "Unvollständige Antwort von Claude." },
        { status: 500 }
      );
    }

    const audioBuffer = await timeStep(
      `${TIMING_PREFIX} ElevenLabs audio generation`,
      () => generateSpeechMp3(elevenLabsKey, parsed.script),
      steps
    );

    const audioBase64 = audioBuffer.toString("base64");
    const audioFilename = slugifyFilename(parsed.title, "mp3");

    const { jobId, dir: workDir } = await timeStep(
      `${TIMING_PREFIX} Create video job dir`,
      () => createVideoJobDir(),
      steps
    );

    await buildVideoFromAssets({
      workDir,
      topic,
      tags: parsed.tags,
      script: parsed.script,
      audioBuffer,
      pexelsApiKey: pexelsKey,
      timingSteps: steps,
    });

    const videoFilename = slugifyFilename(parsed.title, "mp4");
    const totalMs = Date.now() - routeStarted;
    const summary = logTimingBreakdown("api/generate", steps, totalMs);

    console.timeEnd(`${TIMING_PREFIX} total`);
    console.log(
      `${TIMING_PREFIX} Note: Thumbnail, Upload Kit, and Clip Generator run in separate client requests — not included in this total.`
    );
    console.log(
      `${TIMING_PREFIX} Vercel maxDuration config: ${maxDuration}s — plan limit may be lower (Hobby: 10s, Pro: 60s default).`
    );

    return NextResponse.json({
      success: true,
      data: parsed,
      audioBase64,
      audioFilename,
      videoJobId: jobId,
      videoFilename,
      videoDownloadUrl: `/api/video/${jobId}`,
      timingMs: {
        total: totalMs,
        slowest: summary.slowest.name,
        slowestMs: summary.slowest.ms,
        steps: summary.steps.map((s) => ({ name: s.name, ms: s.ms })),
      },
    });
  } catch (error) {
    console.timeEnd(`${TIMING_PREFIX} total`);
    console.error("Generate error:", error);
    const message =
      error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
