// types.ts

export type Language = 'Português' | 'English' | 'Español';

export type AppPage = 'creator' | 'analyzer' | 'trafficManager' | 'strategy' | 'admin' | 'buyTokens';
export type AppMode = 'product' | 'content';
export type MediaType = 'image' | 'video';

export interface UploadedImage {
    base64: string;
    mimeType: string;
    name: string;
}

export interface ProductFormData {
    productName: string;
    productDescription: string;
    marketingVibe: string;
    productImage: UploadedImage | null;
    maskTemplate: string;
    colorPalette: string;
    logoImage: UploadedImage | null;
    userSelfie: UploadedImage | null;
    artisticStyle: string;
    videoDuration: '5s' | '10s' | '15s';
    animationStyle: 'dynamic' | 'elegant' | 'minimalist' | 'cinematic';
    aspectRatio: string;
    negativePrompt: string;
    narrationScript: string;
    backgroundMusic: 'none' | 'epic' | 'upbeat' | 'lofi' | 'ai_generated';
    musicDescription: string;
    postExample1: string;
    postExample2: string;
    postExample3: string;
    profileUrl: string;
    benchmarkProfileUrl?: string; // New field for benchmark
}

export interface ContentFormData {
    profession: string;
    targetAudience: string;
    professionalContext: string;
    postFormat: 'single' | 'carousel';
    carouselSlides: number;
    maskTemplate: string;
    colorPalette: string;
    logoImage: UploadedImage | null;
    userSelfie: UploadedImage | null;
    postExample1: string;
    postExample2: string;
    postExample3: string;
    artisticStyle: string;
    aspectRatio: string;
    negativePrompt: string;
    videoDuration: '5s' | '10s' | '15s';
    animationStyle: 'dynamic' | 'elegant' | 'minimalist' | 'cinematic';
    narrationScript: string;
    backgroundMusic: 'none' | 'epic' | 'upbeat' | 'lofi' | 'ai_generated';
    musicDescription: string;
    profileUrl: string;
    benchmarkProfileUrl?: string; // New field for benchmark
}

export interface ProductPostContent {
    productName: string;
    postText: string;
    mediaUrl: string;
    mediaType: MediaType;
}

export interface ContentMarketingPost {
    mediaUrls: string[];
    mediaType: MediaType;
    platformTexts: {
        instagram: string;
        facebook: string;
        linkedin: string;
        tiktok: string;
    };
}

export type GeneratedContent = ProductPostContent | ContentMarketingPost;

export interface AnalysisResult {
    performanceSummary: string;
    audienceProfile: string;
    brandArchetype: string;
    strategicRecommendations: string[];
}

export interface AnalyzerFormData {
    profileUrl: string;
    feedImages: UploadedImage[];
    analyticsImage: UploadedImage | null;
}

export interface CampaignPlan {
    campaignStructure: {
        name: string;
        objective: string;
        kpis: string;
    };
    audienceDefinition: {
        primary: string;
        secondary: string;
    };
    creativesAndCopy: {
        guidelines: string;
        postExamples: Array<{
            platform: string;
            text: string;
            visualIdea: string;
        }>;
    };
}

export interface CampaignPerformanceAnalysisResult {
    performanceSummary: string;
    stepByStepGuide: string[];
}

export interface TrafficPlanForm {
    productService: string;
    targetAudience: string;
    objective: string;
    budget: string;
    duration: string;
    channels: string[];
}

export interface OrganicGrowthForm {
    mainKeyword: string;
    targetAudience: string;
    contentFormat: 'blog' | 'youtube' | 'instagram' | 'tiktok';
}

export interface OrganicContentPlan {
    optimizedTitles: string[];
    relatedKeywords: string[];
    contentOutline: string[];
    ctaSuggestions: string[];
}

export interface PerformanceReport {
    quantitativeSummary: {
        reportOverview: string;
        totalPosts: number;
        totalCampaigns: number;
        totalAnalyses: number;
    };
    growthAnalysis: string;
    engagementTrends: string;
    campaignEffectiveness: string;
    strategicSummary: string;
}

export interface HolisticStrategyResult {
    overallDiagnosis: string;
    strategicPillars: string[];
    actionableRecommendations: string[];
    kpisToTrack: string[];
}

export interface Schedule {
  isEnabled: boolean;
  postsPerDay: number;
  times: string[];
}

export interface SavedAccount {
    id: string;
    name: string;
    type: AppMode;
    formData: ProductFormData | ContentFormData;
    history: GeneratedHistoryItem[];
    schedule: Schedule;
}

export interface User {
    id: string;
    email: string;
    isAdmin: boolean;
    tokens: number;
}

export type GeneratedHistoryItemType =
  | 'productPost'
  | 'contentPost'
  | 'analysis'
  | 'campaignPlan'
  | 'performanceFeedback'
  | 'holisticStrategy'
  | 'performanceReport'
  | 'voiceSession'
  | 'organicContentPlan';


export interface GeneratedHistoryItem {
    id: string;
    type: GeneratedHistoryItemType;
    timestamp: string;
    data: any; // Can be ProductPostContent, ContentMarketingPost, AnalysisResult etc.
    accountName: string;
}

export type WhatsappConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface VoiceSessionTranscript {
    role: 'user' | 'model';
    text: string;
}

export interface VoiceSessionData {
    transcript: VoiceSessionTranscript[];
    endedBy: 'user' | 'timeout';
}

export interface CreativeSuggestions {
    targetAudience?: string;
    postFormat?: 'single' | 'carousel';
    carouselSlides?: number;
    artisticStyle?: string;
    aspectRatio?: string;
    negativePrompt?: string;
    maskTemplate?: string;
    colorPalette?: string;
    videoDuration?: '5s' | '10s' | '15s';
    animationStyle?: 'dynamic' | 'elegant' | 'minimalist' | 'cinematic';
    backgroundMusic?: 'none' | 'epic' | 'upbeat' | 'lofi' | 'ai_generated';
    musicDescription?: string;
}