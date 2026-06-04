export function slugifyFilename(title: string, extension: string): string {
  const slug =
    title
      .slice(0, 50)
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase() || "video";

  return `${slug}.${extension}`;
}
