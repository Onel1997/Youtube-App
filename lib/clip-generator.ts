import Anthropic from "@anthropic-ai/sdk";
import type { ClipGeneratorResult, ClipItem } from "@/types/clips";

const MODEL = "claude-sonnet-4-6";

const MIN_SCRIPT_WORDS = 55;
const MAX_SCRIPT_WORDS = 115;
const CLIP_COUNT = 5;

const ITEM_SCHEMA = `{
  "title": "Clip-Titel (max 60 Zeichen, Emojis ok)",
  "hook": "Erster Satz = starker Hook aus dem Moment, stoppt den Scroll",
  "script": "30-45 Sek Sprechzeit (ca. 60-100 Wörter), NUR Inhalt aus dem Hauptskript",
  "cta": "Call-to-Action für Shorts/TikTok/Reels"
}`;

const SYSTEM = `Du bist ein Clip-Editor für deutsche Gaming & Entertainment YouTube Kanäle.

AUFGABE:
Teile das Hauptvideo-Skript in genau 5 Clips auf – die 5 Momente mit der höchsten Retention.

KRITISCH:
- NUR Inhalt aus dem bereitgestellten Skript verwenden
- KEINE neuen Themen, Fakten, Stories oder Meinungen erfinden
- Jeder Clip = ein konkreter Moment/Abschnitt aus dem Hauptvideo, für Short-Form zugeschnitten
- Keine Wiederholung: 5 verschiedene Momente, möglichst ohne inhaltliche Überschneidung

Retention-Kriterien (priorisiere diese Momente):
1. Starker Hook / Schock / Überraschung
2. Enthüllung, Punchline, WTF-Moment
3. Emotionale Spitze oder Spannungspeak
4. Kontroverse oder provokante Aussage aus dem Skript
5. Cliffhanger oder offene Frage aus dem Original

Pro Clip:
- Länge: 30-45 Sekunden = ca. 60-100 Wörter (STRICT)
- Hook: erster Satz muss sofort fesseln
- Skript: verdichtet aus dem Original, flüssig gesprochen, standalone verständlich
- CTA: passt für YouTube Shorts, TikTok und Instagram Reels

Reihenfolge: Clip #1 = stärkster Retention-Moment, Clip #5 = fünftstärkster.

Antworte IMMER als valides JSON ohne Markdown:
{
  "clips": [${ITEM_SCHEMA}, ... genau 5]
}`;

export async function generateClips(
  anthropic: Anthropic,
  input: { script: string; title?: string }
): Promise<ClipGeneratorResult> {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0.4,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Extrahiere 5 Clips aus diesem Video-Skript (höchste Retention zuerst).

${input.title ? `Video-Titel (nur Kontext): ${input.title}\n\n` : ""}⚠️ VERBOTEN:
- Neue Themen oder Inhalte erfinden
- Fakten hinzufügen, die nicht im Skript stehen
- Das ganze Video zusammenfassen – nur einzelne Momente isolieren
- Länger als 45 Sekunden pro Clip

HAUPTVIDEO-SKRIPT:
${input.script}

Erstelle genau 5 Clips. Jeder Clip nutzt ausschließlich Wissen und Formulierungen aus diesem Skript.`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Keine Clips von Claude erhalten.");
  }

  let parsed: ClipGeneratorResult;
  try {
    parsed = JSON.parse(block.text);
  } catch {
    const match = block.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Clips konnten nicht verarbeitet werden.");
    parsed = JSON.parse(match[0]);
  }

  validateClips(parsed);

  return parsed;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validateClips(parsed: ClipGeneratorResult): void {
  if (!parsed.clips?.length) {
    throw new Error("Keine Clips erhalten.");
  }

  if (parsed.clips.length !== CLIP_COUNT) {
    throw new Error(`Erwartet ${CLIP_COUNT} Clips, erhalten ${parsed.clips.length}.`);
  }

  parsed.clips.forEach((item, i) => {
    if (!item.title?.trim() || !item.hook?.trim() || !item.script?.trim() || !item.cta?.trim()) {
      throw new Error(`Clip #${i + 1} ist unvollständig.`);
    }

    const words = countWords(item.script);
    if (words < MIN_SCRIPT_WORDS - 15 || words > MAX_SCRIPT_WORDS + 20) {
      console.warn(
        `[Clip Generator] Clip #${i + 1} "${item.title}" – ${words} Wörter (Ziel: ${MIN_SCRIPT_WORDS}-${MAX_SCRIPT_WORDS})`
      );
    }
  });
}

export function formatClipItem(item: ClipItem, index: number): string {
  return [
    `Clip #${index + 1}: ${item.title}`,
    "",
    "HOOK:",
    item.hook,
    "",
    "SKRIPT (30-45 Sek):",
    item.script,
    "",
    "CTA:",
    item.cta,
  ].join("\n");
}

export function formatAllClips(data: ClipGeneratorResult): string {
  return data.clips.map((item, i) => formatClipItem(item, i)).join("\n\n---\n\n");
}
