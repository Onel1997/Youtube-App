import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { loadEnvConfig } from "@next/env";

const projectDir = process.cwd();

// Next.js Env beim Modul-Load einlesen
loadEnvConfig(projectDir);

function parseDotEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

/** Liest .env.local direkt vom Dateisystem (aktuellster Stand nach Speichern). */
function readEnvLocal(): Record<string, string> {
  const envPath = join(projectDir, ".env.local");
  if (!existsSync(envPath)) return {};
  return parseDotEnv(readFileSync(envPath, "utf8"));
}

function getEnv(name: string): string | undefined {
  // .env.local hat Priorität vor gecachtem process.env (z. B. alter Dev-Server-Stand)
  const fileEnv = readEnvLocal();
  const value = fileEnv[name] ?? process.env[name];

  if (!value || value.trim() === "") return undefined;
  return value.trim().replace(/^['"]|['"]$/g, "");
}

export function getAnthropicApiKey(): string | undefined {
  return getEnv("ANTHROPIC_API_KEY");
}

export function getElevenLabsApiKey(): string | undefined {
  return getEnv("ELEVENLABS_API_KEY");
}

export function getPexelsApiKey(): string | undefined {
  return getEnv("PEXELS_API_KEY");
}

export function getOpenAIApiKey(): string | undefined {
  return getEnv("OPENAI_API_KEY");
}
