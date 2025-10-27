// types.ts

export type AppPage = 'creator' | 'analyzer' | 'trafficManager' | 'admin' | 'buyTokens';

export type AppMode = 'product' | 'content';

export type MediaType = 'image' | 'video';

export type Language = 'Português' | 'English' | 'Español';

export interface UploadedImage {
  base64: string;
  mimeType: string;
  name: string;
}

export interface ProductPostContent {
  productName: string;
  postText: string;
  mediaUrl: string;
  mediaType: MediaType;
}

export interface ContentMarketingPost {
  imageUrl: string;
  platformTexts: {
    instagram: string;
    linkedin: string;
    tiktok: string;
  };
}

export type GeneratedContent = ProductPostContent | ContentMarketingPost;

export interface Schedule {
  isEnabled: boolean;
  postsPerDay: number;
  times: string[];
  appMode: AppMode;
  outputType: MediaType;
}

export interface User {
  id: string;
  email: string;
  tokens: number;
  isAdmin: boolean;
}

export interface AnalysisResult {
    performanceSummary: string;
    audienceProfile: string;
    brandArchetype: string;
    strategicRecommendations: string[];
}

export interface CampaignPlan {
    targetAudience: {
        description: string;
        details: string;
    };
    campaignStructure: {
        objective: string;
        setup: string;
    };
    creativesAndCopy: {
        guidelines: string;
        suggestions: string[];
    };
    abTestPlan: {
        hypothesis: string;
        implementation: string;
    };
    stepByStepGuide: string[];
}

// Fix: Define an interface for the aistudio object to avoid declaration conflicts.
declare global {
  // Fix: Moved AIStudio interface into declare global to resolve type conflict.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
