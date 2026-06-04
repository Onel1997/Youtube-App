import Anthropic from "@anthropic-ai/sdk";
import type { UploadKit } from "@/types/upload-kit";

const MODEL = "claude-sonnet-4-6";

const SYSTEM = `Du bist ein YouTube-Growth-Experte für deutsche Gaming & Entertainment Kanäle.
Erstelle virale, SEO-optimierte Upload-Materialien auf Deutsch.

Antworte IMMER als valides JSON ohne Markdown, ohne Backticks:
{
  "titleVariations": ["10 virale Titel-Varianten, clickbait-optimiert, max 70 Zeichen, Emojis erlaubt"],
  "descriptions": ["3 SEO-optimierte Video-Beschreibungen, je 150-250 Wörter, mit Keywords, Absätzen und Hashtags am Ende"],
  "keywordTags": ["genau 20 Keyword-Tags für YouTube, mix aus breit und nischig, deutsch/englisch gaming terms"],
  "communityPosts": ["5 Community-Tab Post-Ideen zum Video (Fragen, Umfragen, Teaser, Diskussion)"],
  "uploadTime": {
    "recommendation": "Kurze Empfehlung in einem Satz",
    "bestDays": ["Mo", "Di", ...],
    "bestHours": "z.B. 17:00–20:00 Uhr",
    "timezone": "Europe/Berlin (CET/CEST)",
    "reasoning": "2-3 Sätze warum diese Zeit für deutsche Gaming-Zielgruppe optimal ist"
  }
}`;

export async function generateUploadKit(
  anthropic: Anthropic,
  input: {
    topic: string;
    script: string;
    title: string;
    description: string;
    tags: string[];
  }
): Promise<UploadKit> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Erstelle ein komplettes YouTube Upload Kit für:

Thema: ${input.topic}
Aktueller Titel: ${input.title}
Bestehende Tags: ${input.tags.join(", ")}

Skript (Kontext):
${input.script.slice(0, 2500)}

Bestehende Beschreibung (Referenz):
${input.description.slice(0, 800)}

Anforderungen:
- 10 virale Titel-Variationen (Neugier, Emotion, Zahlen, Gaming-Slang)
- 3 unterschiedliche SEO-Beschreibungen (informativ, storytelling, keyword-heavy)
- Genau 20 Tags
- 5 Community-Post-Ideen
- Upload-Zeit für deutsche Gaming/Entertainment Zielgruppe (13-25 Jahre)`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Kein Upload Kit von Claude erhalten.");
  }

  let parsed: UploadKit;
  try {
    parsed = JSON.parse(block.text);
  } catch {
    const match = block.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Upload Kit konnte nicht verarbeitet werden.");
    parsed = JSON.parse(match[0]);
  }

  if (
    !parsed.titleVariations?.length ||
    !parsed.descriptions?.length ||
    !parsed.keywordTags?.length ||
    !parsed.communityPosts?.length ||
    !parsed.uploadTime
  ) {
    throw new Error("Unvollständiges Upload Kit von Claude.");
  }

  return parsed;
}
