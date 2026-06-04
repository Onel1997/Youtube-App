export interface ClipItem {
  title: string;
  hook: string;
  script: string;
  cta: string;
}

export interface ClipGeneratorResult {
  clips: ClipItem[];
}

export interface ClipGeneratorResponse {
  success: true;
  data: ClipGeneratorResult;
}
