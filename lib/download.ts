function logDownload(
  kind: string,
  source: string,
  filename: string,
  extra?: Record<string, unknown>
): void {
  const preview =
    source.length > 120 ? `${source.slice(0, 120)}…` : source;
  console.log(`[Download] ${kind}`, {
    source: preview,
    filename,
    isEmpty: !source?.trim(),
    ...extra,
  });
}

function sanitizeFilename(filename: string): string {
  const trimmed = filename?.trim();
  if (!trimmed) return "download";
  return trimmed.replace(/[/\\?%*:|"<>]/g, "-");
}

function resolveAbsoluteUrl(url: string): string {
  if (!url?.trim()) {
    throw new Error("Download-URL fehlt (undefined oder leer).");
  }
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return new URL(url, window.location.origin).href;
}

/**
 * Triggert Download via temporärem <a>-Element.
 * URL erst nach Verzögerung revoken – sonst bricht Safari/Chrome den Download ab.
 */
export function triggerAnchorDownload(objectUrl: string, filename: string): void {
  const safeName = sanitizeFilename(filename);
  logDownload("anchor", objectUrl, safeName, { type: "blob" });

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = safeName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (link.parentNode) {
      document.body.removeChild(link);
    }
    if (objectUrl.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrl);
    }
  }, 2000);
}

export async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  const objectUrl = URL.createObjectURL(blob);
  triggerAnchorDownload(objectUrl, filename);
}

/** Fetch + Blob-Download – funktioniert in Chrome & Safari für API-URLs (/api/video/…). */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const absoluteUrl = resolveAbsoluteUrl(url);
  const safeName = sanitizeFilename(filename);

  logDownload("fetch", absoluteUrl, safeName);

  const response = await fetch(absoluteUrl);
  if (!response.ok) {
    console.error("[Download] Fetch fehlgeschlagen", response.status, absoluteUrl);
    throw new Error(`Download fehlgeschlagen (HTTP ${response.status}).`);
  }

  const blob = await response.blob();
  logDownload("blob-ready", absoluteUrl, safeName, {
    sizeBytes: blob.size,
    mimeType: blob.type,
  });

  await downloadBlob(blob, safeName);
}

export async function downloadBase64File(
  base64: string,
  filename: string,
  mimeType: string
): Promise<void> {
  if (!base64?.trim()) {
    console.error("[Download] Base64-Daten fehlen");
    throw new Error("Audiodaten fehlen.");
  }

  const safeName = sanitizeFilename(filename);
  logDownload("base64", `data:${mimeType};base64,…`, safeName, {
    length: base64.length,
  });

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  await downloadBlob(blob, safeName);
}

export function base64ToAudioUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}
