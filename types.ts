// types.ts

export type AppPage = 'creator' | 'analyzer' | 'trafficManager' | 'strategy' | 'admin' | 'buyTokens';

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
  imageUrls: string[];
  platformTexts: {
    instagram: string;
    linkedin: string;
    tiktok: string;
    facebook: string;
  };
}

export type GeneratedContent = ProductPostContent | ContentMarketingPost;

export interface Schedule {
  isEnabled: boolean;
  postsPerDay: number;
  times: string[];
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

export interface HolisticStrategyResult {
    overallDiagnosis: string;
    strategicPillars: string[];
    actionableRecommendations: string[];
    kpisToTrack: string[];
}

export interface PerformanceReport {
    growthAnalysis: string;
    engagementTrends: string;
    campaignEffectiveness: string;
    strategicSummary: string;
    quantitativeSummary: {
        reportOverview: string;
        totalPosts: number;
        totalCampaigns: number;
        totalAnalyses: number;
    };
}


// --- Account and History Types ---

export interface ContentFormData {
  profession: string;
  targetAudience: string;
  professionalContext: string;
  postFormat: 'single' | 'carousel';
  carouselSlides: number;
  maskTemplate: string;
  colorPalette: string;
  logoImage: UploadedImage | null;
  postExample1: string;
  postExample2: string;
  postExample3: string;
  profileUrl: string; // For Analyzer
}

export interface ProductFormData {
  productName: string;
  productDescription: string;
  marketingVibe: string;
  productImage: UploadedImage | null;
  maskTemplate: string;
  colorPalette: string;
  logoImage: UploadedImage | null;
  profileUrl: string; // For Analyzer
}

export interface GeneratedHistoryItem {
  id: string; 
  type: 'productPost' | 'contentPost' | 'analysis' | 'campaignPlan' | 'performanceFeedback' | 'holisticStrategy' | 'performanceReport';
  timestamp: string;
  data: GeneratedContent | AnalysisResult | CampaignPlan | string | HolisticStrategyResult | PerformanceReport;
  accountName: string;
}

export interface SavedAccount {
  id: string;
  name: string;
  type: 'content' | 'product';
  formData: ContentFormData | ProductFormData;
  history: GeneratedHistoryItem[];
  schedule: Schedule;
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
