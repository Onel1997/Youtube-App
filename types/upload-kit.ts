export interface UploadTimeRecommendation {
  recommendation: string;
  bestDays: string[];
  bestHours: string;
  timezone: string;
  reasoning: string;
}

export interface UploadKit {
  titleVariations: string[];
  descriptions: string[];
  keywordTags: string[];
  communityPosts: string[];
  uploadTime: UploadTimeRecommendation;
}

export interface UploadKitResponse {
  success: true;
  data: UploadKit;
}
