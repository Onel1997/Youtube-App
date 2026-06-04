/** Drew – vielseitige männliche Stimme, gut für Deutsch mit eleven_multilingual_v2 */
export const GERMAN_MALE_VOICE_ID = "29vD33N1CtxCmqQRPOHJ";

const MODEL_ID = "eleven_multilingual_v2";
const MAX_CHUNK_LENGTH = 4500;

function prepareScriptForSpeech(script: string): string {
  return script
    .replace(/^(HOOK|STORY|CONTENT|CTA)[:\s]*/gim, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining.trim());
      break;
    }

    let splitAt = remaining.lastIndexOf("\n\n", maxLength);
    if (splitAt < maxLength * 0.4) {
      splitAt = remaining.lastIndexOf(". ", maxLength);
    }
    if (splitAt < maxLength * 0.4) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks.filter((c) => c.length > 0);
}

async function synthesizeChunk(
  apiKey: string,
  text: string
): Promise<ArrayBuffer> {
  const cleanKey = apiKey.trim();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${GERMAN_MALE_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": cleanKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        language_code: "de",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `ElevenLabs Fehler (${response.status}): ${errBody.slice(0, 200)}`
    );
  }

  return response.arrayBuffer();
}

export async function generateSpeechMp3(
  apiKey: string,
  script: string
): Promise<Buffer> {
  const prepared = prepareScriptForSpeech(script);
  const chunks = chunkText(prepared, MAX_CHUNK_LENGTH);
  const audioBuffers: Buffer[] = [];

  for (const chunk of chunks) {
    const arrayBuffer = await synthesizeChunk(apiKey, chunk);
    audioBuffers.push(Buffer.from(arrayBuffer));
  }

  return Buffer.concat(audioBuffers);
}
