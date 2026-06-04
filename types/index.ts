export interface GeneratedContent {
  script: string;
  title: string;
  description: string;
  tags: string[];
  thumbnailIdea: string;
}

export interface GenerateRequest {
  topic: string;
}

export interface GenerateResponse {
  success: true;
  data: GeneratedContent;
  audioBase64: string;
  audioFilename: string;
  videoJobId: string;
  videoFilename: string;
  videoDownloadUrl: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}
