const GPT_MODEL = "gpt-4o";

export interface ThumbnailPromptVariant {
  id: string;
  label: string;
  strategy: string;
  prompt: string;
}

const SYSTEM = `You are an elite YouTube thumbnail strategist for Gaming & Entertainment channels.
Your goal is maximum CTR (click-through rate).

YouTube thumbnail best practices you MUST apply to every prompt:
1. LARGE TEXT AREA – leave bold empty space for huge overlay text (do NOT render readable letters; DALL-E cannot spell)
2. HIGH CONTRAST – subject pops against dark or vivid background
3. EMOTIONAL REACTION – exaggerated shock, hype, fear, or excitement on face/character
4. CURIOSITY GAP – visual mystery, something hidden, arrow pointing, "what happens next" energy
5. BRIGHT COLORS – neon purple, electric yellow, hot pink, cyan; saturated and eye-catching

Each variation must use a DIFFERENT creative angle while staying on-topic.

Respond ONLY with valid JSON (no markdown):
{
  "variations": [
    {
      "id": "1",
      "label": "Short label in German",
      "strategy": "Strategy name in English",
      "prompt": "Detailed English DALL-E 3 prompt, max 800 chars, landscape 16:9, 1280x720 style"
    }
  ]
}

Create exactly 3 variations.`;

export async function createThumbnailPromptsWithGpt(
  openaiApiKey: string,
  input: {
    topic: string;
    title: string;
    script: string;
    thumbnailIdea: string;
    tags: string[];
  }
): Promise<ThumbnailPromptVariant[]> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GPT_MODEL,
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Create 3 distinct high-CTR YouTube thumbnail prompts (1280x720).

Topic: ${input.topic}
Title: ${input.title}
Tags: ${input.tags.join(", ")}
Thumbnail concept: ${input.thumbnailIdea}

Script excerpt (mood/context):
${input.script.slice(0, 1500)}

Variation 1: Curiosity gap focus
Variation 2: Extreme emotional reaction focus
Variation 3: Bold high-contrast action + bright colors focus`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GPT Prompt API (${response.status}): ${err.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("GPT hat keine Thumbnail-Prompts zurückgegeben.");
  }

  let parsed: { variations?: ThumbnailPromptVariant[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("GPT-Antwort konnte nicht geparst werden.");
    parsed = JSON.parse(match[0]);
  }

  const variations = parsed.variations?.filter((v) => v.prompt?.trim()) ?? [];
  if (variations.length < 3) {
    throw new Error("GPT hat weniger als 3 Thumbnail-Prompts geliefert.");
  }

  return variations.slice(0, 3).map((v, i) => ({
    id: v.id || String(i + 1),
    label: v.label || `Variante ${i + 1}`,
    strategy: v.strategy || "High CTR",
    prompt: v.prompt.trim(),
  }));
}
