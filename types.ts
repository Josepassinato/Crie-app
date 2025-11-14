// types.ts

export type Language = 'Português' | 'English' | 'Español';

export type AppPage = 'creator' | 'analyzer' | 'trafficManager' | 'strategy' | 'admin' | 'buyTokens';
export type AppMode = 'product' | 'content';
export type MediaType = 'image' | 'video' | 'audio';

export interface UploadedImage {
    base64: string;
    mimeType: string;
    name: string;
}

export interface PersonaCreatorFormData {
    selectedPersona: string;
    // Image fields
    productImage: UploadedImage | null;
    scenarioDescription: string;
    // Video fields
    scenarioImage: UploadedImage | null;
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
    videoDuration: '5s' | '8s';
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
    audioType: 'narration' | 'dialogue' | 'elevenlabs';
    elevenLabsVoiceId: string;
    useCustomElevenLabs: boolean;
    customElevenLabsApiKey: string;
    // FIX: Added missing property `startImage` to align type with its usage in AppStateContext.tsx.
    startImage: UploadedImage | null;
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
    videoDuration: '5s' | '8s';
    animationStyle: 'dynamic' | 'elegant' | 'minimalist' | 'cinematic';
    narrationScript: string;
    backgroundMusic: 'none' | 'epic' | 'upbeat' | 'lofi' | 'ai_generated';
    musicDescription: string;
    profileUrl: string;
    benchmarkProfileUrl?: string; // New field for benchmark
    audioType: 'narration' | 'dialogue' | 'elevenlabs';
    elevenLabsVoiceId: string;
    useCustomElevenLabs: boolean;
    customElevenLabsApiKey: string;
    // FIX: Added missing property `startImage` to align type with its usage in AppStateContext.tsx.
    startImage: UploadedImage | null;
}

export interface SpecialCreatorFormData {
    prompt: string;
    backgroundImage: UploadedImage | null;
    assetImages: (UploadedImage | null)[];
    videoDuration: '5s' | '8s';
    animationStyle: 'dynamic' | 'elegant' | 'minimalist' | 'cinematic';
    backgroundMusic: 'none' | 'epic' | 'upbeat' | 'lofi' | 'ai_generated';
    musicDescription: string;
}

export interface ProductPostContent {
    productName: string;
    postText: string;
    mediaUrl: string;
    mediaType: MediaType;
    script?: string;
    originalAspectRatio?: '16:9'; // To identify special videos that can be adapted
    adaptedMediaUrl?: string; // To store the URL of the 9:16 cropped video
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
    script?: string;
}

export interface PersonaPostContent {
    personaName: string;
    scenario: string;
    mediaUrl: string;
    mediaType: 'image';
    postText: string;
}

export type GeneratedContent = ProductPostContent | ContentMarketingPost | PersonaPostContent;

// --- Analysis & Strategy Types ---

export interface AnalyzerFormData {
    profileUrl: string;
    feedImages: UploadedImage[];
    analyticsImage: UploadedImage | null;
}

export interface AnalysisResult {
    performanceSummary: string;
    audienceProfile: string;
    brandArchetype: string;
    strategicRecommendations: string[];
}

export interface HolisticStrategyResult {
    overallDiagnosis: string;
    strategicPillars: string[];
    actionableRecommendations: string[];
    kpisToTrack: string[];
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


// --- Traffic Manager Types ---

export interface TrafficPlanForm {
    productService: string;
    targetAudience: string;
    objective: string;
    budget: string;
    duration: string;
    channels: string[];
}

export interface CampaignPlan {
    campaignStructure: { name: string; objective: string; kpis: string };
    audienceDefinition: { primary: string; secondary?: string };
    creativesAndCopy: {
        guidelines: string;
        postExamples: { platform: string; text: string; visualIdea: string }[];
    };
}

export interface CampaignPerformanceAnalysisResult {
    performanceSummary: string;
    stepByStepGuide: string[];
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

// --- User & Account Management Types ---
export interface User {
    id: string;
    email: string;
    isAdmin: boolean;
    tokens: number;
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

export type GeneratedHistoryItem = {
    id: string;
    timestamp: string;
    accountName: string;
} & (
    | { type: 'productPost'; data: ProductPostContent }
    | { type: 'contentPost'; data: ContentMarketingPost }
    | { type: 'specialVideo'; data: ProductPostContent }
    | { type: 'personaPost'; data: PersonaPostContent }
    | { type: 'analysis'; data: AnalysisResult }
    | { type: 'holisticStrategy'; data: HolisticStrategyResult }
    | { type: 'performanceReport'; data: PerformanceReport }
    | { type: 'campaignPlan'; data: CampaignPlan }
    | { type: 'performanceFeedback'; data: CampaignPerformanceAnalysisResult }
    | { type: 'organicContentPlan'; data: OrganicContentPlan }
    | { type: 'voiceSession'; data: VoiceSessionData }
);

// --- Creative & AI Service Types ---
export interface CreativeSuggestions {
    targetAudience?: string;
    postFormat?: 'single' | 'carousel';
    carouselSlides?: number;
    artisticStyle?: string;
    aspectRatio?: string;
    negativePrompt?: string;
    maskTemplate?: string;
    colorPalette?: string;
    videoDuration?: '5s' | '8s';
    audioType?: 'narration' | 'dialogue';
    animationStyle?: 'dynamic' | 'elegant' | 'minimalist' | 'cinematic';
    backgroundMusic?: 'none' | 'epic' | 'upbeat' | 'lofi' | 'ai_generated';
    musicDescription?: string;
}

// --- WhatsApp Integration ---
export type WhatsappConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';


// --- Voice Agent ---
export interface VoiceSessionTranscript {
    role: 'user' | 'model';
    text: string;
}

export interface VoiceSessionData {
    transcript: VoiceSessionTranscript[];
    endedBy: 'user' | 'system' | 'error';
    finalTokenCost: number;
}