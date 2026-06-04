export interface ThumbnailVariation {
  id: string;
  label: string;
  strategy: string;
  imagePrompt: string;
  revisedPrompt?: string;
  base64: string;
  dataUrl: string;
  imageUrl: string;
  openAiSourceUrl?: string;
}

export interface ThumbnailGenerateResponse {
  success: true;
  variations: ThumbnailVariation[];
  thumbnailFilename: string;
}
