function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function splitIntoSubtitleChunks(script: string): string[] {
  const cleaned = script
    .replace(/\[(.*?)\]/g, "")
    .replace(/\n+/g, " ")
    .trim();

  const sentences = cleaned
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 80) {
      chunks.push(sentence);
      continue;
    }
    const words = sentence.split(/\s+/);
    let current = "";
    for (const word of words) {
      if ((current + " " + word).trim().length > 80) {
        if (current) chunks.push(current.trim());
        current = word;
      } else {
        current = current ? `${current} ${word}` : word;
      }
    }
    if (current) chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [cleaned.slice(0, 120) || "Video"];
}

/** Erzeugt SRT-Untertitel proportional zur Audiolänge (Wortanzahl-basiert). */
export function generateSrtFromScript(
  script: string,
  totalDurationSec: number
): string {
  const chunks = splitIntoSubtitleChunks(script);
  const wordCounts = chunks.map((c) => c.split(/\s+/).filter(Boolean).length);
  const totalWords = wordCounts.reduce((a, b) => a + b, 0) || 1;

  let cursor = 0;
  const lines: string[] = [];

  chunks.forEach((text, index) => {
    const share = (wordCounts[index] / totalWords) * totalDurationSec;
    const duration = Math.max(1.5, Math.min(share, 8));
    const start = cursor;
    const end = Math.min(cursor + duration, totalDurationSec);

    lines.push(String(index + 1));
    lines.push(`${formatSrtTime(start)} --> ${formatSrtTime(end)}`);
    lines.push(text);
    lines.push("");

    cursor = end;
  });

  return lines.join("\n");
}
