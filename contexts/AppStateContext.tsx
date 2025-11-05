import React, { useState, useCallback, useContext, createContext, ReactNode } from 'react';
import { 
    AppPage, AppMode, MediaType, ProductFormData, ContentFormData, AnalyzerFormData,
    GeneratedContent, AnalysisResult, SavedAccount, GeneratedHistoryItem, TrafficPlanForm,
    CampaignPlan, HolisticStrategyResult, PerformanceReport, UploadedImage, WhatsappConnectionState,
    OrganicGrowthForm, OrganicContentPlan
} from '../types';
import { generateProductPost } from '../services/geminiService';
import { generateContentMarketingPost } from '../services/contentMarketingService';
import { analyzeSocialProfile } from '../services/analyzerService';
import { generateCampaignPlan, analyzeCampaignPerformance, generateOrganicContentPlan } from '../services/trafficManagerService';
import { generateHolisticStrategy, analyzeAccountPerformance } from '../services/strategyService';
import { AuthContext } from './AuthContext';
import { AccountsContext } from './AccountsContext';
// Fix: Import VIDEO_COSTS to correctly calculate video generation costs.
import { TOKEN_COSTS, VIDEO_COSTS } from '../lib/tokenCosts';
import { LanguageContext } from './LanguageContext';

// Define initial states
const initialProductFormState: ProductFormData = {
    productName: '', productDescription: '', marketingVibe: '', productImage: null, maskTemplate: 'Nenhum',
    colorPalette: '', logoImage: null, userSelfie: null, artisticStyle: 'Padrão',
    videoDuration: '5s', animationStyle: 'dynamic', aspectRatio: '1:1', negativePrompt: '',
    narrationScript: '', backgroundMusic: 'none', musicDescription: '',
    postExample1: '', postExample2: '', postExample3: '', profileUrl: '',
};

const initialContentFormState: ContentFormData = {
    profession: '', targetAudience: '', professionalContext: '', postFormat: 'single', carouselSlides: 3,
    maskTemplate: 'Nenhum', colorPalette: '', logoImage: null, userSelfie: null, postExample1: '',
    postExample2: '', postExample3: '', profileUrl: '', artisticStyle: 'Padrão', aspectRatio: '1:1',
    negativePrompt: '', videoDuration: '5s', animationStyle: 'dynamic', narrationScript: '',
    backgroundMusic: 'none', musicDescription: '',
};

const initialAnalyzerFormState: AnalyzerFormData = {
    profileUrl: '', feedImages: [], analyticsImage: null,
};

const initialTrafficPlanForm: TrafficPlanForm = {
    productService: '', targetAudience: '', objective: '', budget: '', duration: '', channels: [],
};

const initialOrganicGrowthForm: OrganicGrowthForm = {
    mainKeyword: '', targetAudience: '', contentFormat: 'blog',
};

// Define context type
interface AppStateContextType {
    activePage: AppPage;
    setActivePage: (page: AppPage) => void;
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
    outputType: MediaType;
    setOutputType: (type: MediaType) => void;
    contextualPrompt: string | null;
    setContextualPrompt: React.Dispatch<React.SetStateAction<string | null>>;

    // Creator Page State
    productFormState: ProductFormData;
    setProductFormState: React.Dispatch<React.SetStateAction<ProductFormData>>;
    contentFormState: ContentFormData;
    setContentFormState: React.Dispatch<React.SetStateAction<ContentFormData>>;
    generatedContent: GeneratedContent | null;
    setGeneratedContent: React.Dispatch<React.SetStateAction<GeneratedContent | null>>;
    isLoading: boolean;
    handleProductSubmit: () => Promise<void>;
    handleContentSubmit: () => Promise<void>;
    clearForm: (clearContent?: boolean) => void;
    updateCreatorFormField: (field: string, value: any) => void;
    startGeneration: () => Promise<void>;
    
    // API Key State
    hasSelectedApiKey: boolean;
    setHasSelectedApiKey: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Analyzer Page State
    analyzerFormState: AnalyzerFormData;
    setAnalyzerFormState: React.Dispatch<React.SetStateAction<AnalyzerFormData>>;
    analysisResult: AnalysisResult | null;
    isAnalyzerLoading: boolean;
    handleProfileAnalysisSubmit: () => Promise<void>;
    
    // Traffic Manager Page State
    trafficPlanForm: TrafficPlanForm;
    setTrafficPlanForm: React.Dispatch<React.SetStateAction<TrafficPlanForm>>;
    trafficAnalysisImage: UploadedImage | null;
    setTrafficAnalysisImage: React.Dispatch<React.SetStateAction<UploadedImage | null>>;
    campaignPlan: CampaignPlan | null;
    campaignPerformanceFeedback: string | null;
    isCampaignPlanLoading: boolean;
    isCampaignPerformanceLoading: boolean;
    organicGrowthForm: OrganicGrowthForm;
    setOrganicGrowthForm: React.Dispatch<React.SetStateAction<OrganicGrowthForm>>;
    organicContentPlan: OrganicContentPlan | null;
    isOrganicGrowthLoading: boolean;
    handleCampaignPlanSubmit: () => Promise<void>;
    handleCampaignPerformanceSubmit: () => Promise<void>;
    handleOrganicGrowthSubmit: () => Promise<void>;
    handleChannelToggle: (channel: string) => void;

    // Strategy Page State
    strategyResult: HolisticStrategyResult | null;
    performanceReport: PerformanceReport | null;
    isStrategyLoading: boolean;
    isPerformanceReportLoading: boolean;
    handleStrategySubmit: () => Promise<void>;
    handlePerformanceReportSubmit: () => Promise<void>;
    
    // WhatsApp State
    whatsappState: WhatsappConnectionState;
    whatsappQrCode: string | null;
    connectWhatsapp: () => void;
    disconnectWhatsapp: () => void;

    // General Error State
    error: string | null;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser, updateUserTokens } = useContext(AuthContext);
    const { accounts, selectedAccountId, addHistoryItem } = useContext(AccountsContext);
    const { language } = useContext(LanguageContext);
    
    // Common State
    const [activePage, setActivePage] = useState<AppPage>('creator');
    const [appMode, setAppMode] = useState<AppMode>('content');
    const [outputType, setOutputType] = useState<MediaType>('image');
    const [error, setError] = useState<string | null>(null);
    const [contextualPrompt, setContextualPrompt] = useState<string | null>(null);

    // Creator Page State
    const [productFormState, setProductFormState] = useState(initialProductFormState);
    const [contentFormState, setContentFormState] = useState(initialContentFormState);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSelectedApiKey, setHasSelectedApiKey] = useState(false);

    // Analyzer Page State
    const [analyzerFormState, setAnalyzerFormState] = useState(initialAnalyzerFormState);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzerLoading, setIsAnalyzerLoading] = useState(false);
    
    // Traffic Manager Page State
    const [trafficPlanForm, setTrafficPlanForm] = useState(initialTrafficPlanForm);
    const [trafficAnalysisImage, setTrafficAnalysisImage] = useState<UploadedImage | null>(null);
    const [campaignPlan, setCampaignPlan] = useState<CampaignPlan | null>(null);
    const [campaignPerformanceFeedback, setCampaignPerformanceFeedback] = useState<string | null>(null);
    const [isCampaignPlanLoading, setIsCampaignPlanLoading] = useState(false);
    const [isCampaignPerformanceLoading, setIsCampaignPerformanceLoading] = useState(false);
    const [organicGrowthForm, setOrganicGrowthForm] = useState(initialOrganicGrowthForm);
    const [organicContentPlan, setOrganicContentPlan] = useState<OrganicContentPlan | null>(null);
    const [isOrganicGrowthLoading, setIsOrganicGrowthLoading] = useState(false);

    // Strategy Page State
    const [strategyResult, setStrategyResult] = useState<HolisticStrategyResult | null>(null);
    const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
    const [isStrategyLoading, setIsStrategyLoading] = useState(false);
    const [isPerformanceReportLoading, setIsPerformanceReportLoading] = useState(false);
    
    // WhatsApp State
    const [whatsappState, setWhatsappState] = useState<WhatsappConnectionState>('disconnected');
    const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);


    const clearForm = useCallback((clearContent = false) => {
        setProductFormState(initialProductFormState);
        setContentFormState(initialContentFormState);
        if(clearContent) setGeneratedContent(null);
        setError(null);
    }, []);
    
     const handleError = (err: any, defaultKey: string) => {
        console.error(err);
        let messageKey = typeof err.message === 'string' ? err.message : defaultKey;
        // Check if this is a video generation error related to API keys
        if (messageKey === "Requested entity was not found.") {
            if (outputType === 'video') {
                messageKey = "videoApiKeyError";
            } else {
                messageKey = "apiKeyError";
            }
            setHasSelectedApiKey(false);
        }
        setError(messageKey);
    };

    const handleTokenCost = (cost: number): boolean => {
        if (!currentUser || currentUser.isAdmin) return true;
        if (currentUser.tokens < cost) {
            setError('insufficientTokens');
            return false;
        }
        updateUserTokens(currentUser.tokens - cost);
        return true;
    };
    

    // Creator Handlers
    const handleProductSubmit = async () => {
        if (!productFormState.productImage) {
            setError("productImageRequired");
            return;
        }
        // Fix: Correctly calculate video cost based on duration.
        const cost = outputType === 'image'
            ? TOKEN_COSTS.PRODUCT_IMAGE
            : VIDEO_COSTS[productFormState.videoDuration];
        if (!handleTokenCost(cost)) return;

        setIsLoading(true);
        setError(null);
        setGeneratedContent(null);
        try {
            const result = await generateProductPost(
                productFormState.productName, productFormState.productDescription, productFormState.marketingVibe,
                productFormState.productImage, outputType, productFormState.maskTemplate, productFormState.colorPalette,
                productFormState.logoImage, productFormState.userSelfie, productFormState.artisticStyle,
                productFormState.videoDuration, productFormState.animationStyle, productFormState.aspectRatio,
                productFormState.negativePrompt, productFormState.narrationScript, productFormState.backgroundMusic,
                productFormState.musicDescription, productFormState.postExample1, productFormState.postExample2,
                productFormState.postExample3, language
            );
            setGeneratedContent(result);
            if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'productPost', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch (err) {
            handleError(err, 'productPostApiError');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleContentSubmit = async () => {
        // Fix: Correctly calculate video cost based on duration, and use either image or video cost, not both.
        const cost = outputType === 'video'
            ? VIDEO_COSTS[contentFormState.videoDuration]
            : TOKEN_COSTS.CONTENT_POST * (contentFormState.postFormat === 'carousel' ? contentFormState.carouselSlides : 1);
        if (!handleTokenCost(cost)) return;

        setIsLoading(true);
        setError(null);
        setGeneratedContent(null);
        try {
            const result = await generateContentMarketingPost(
                contentFormState.profession, contentFormState.targetAudience, contentFormState.professionalContext,
                outputType, contentFormState.postFormat, contentFormState.carouselSlides, contentFormState.maskTemplate,
                contentFormState.colorPalette, contentFormState.logoImage, contentFormState.userSelfie,
                contentFormState.postExample1, contentFormState.postExample2, contentFormState.postExample3,
                contentFormState.artisticStyle, contentFormState.aspectRatio, contentFormState.negativePrompt,
                contentFormState.videoDuration, contentFormState.animationStyle, contentFormState.narrationScript,
                contentFormState.backgroundMusic, contentFormState.musicDescription, language
            );
            setGeneratedContent(result);
             if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'contentPost', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch (err) {
            handleError(err, 'contentPostApiError');
        } finally {
            setIsLoading(false);
        }
    };
    
    const startGeneration = useCallback(async () => {
        if (appMode === 'product') {
            await handleProductSubmit();
        } else {
            await handleContentSubmit();
        }
    }, [appMode, handleProductSubmit, handleContentSubmit]);

     const updateCreatorFormField = useCallback((field: string, value: any) => {
        if (appMode === 'product') {
            setProductFormState(prev => ({...prev, [field]: value}));
        } else {
            setContentFormState(prev => ({...prev, [field]: value}));
        }
    }, [appMode]);


    // Analyzer Handler
    const handleProfileAnalysisSubmit = async () => {
        if (!handleTokenCost(TOKEN_COSTS.PROFILE_ANALYSIS)) return;
        setIsAnalyzerLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeSocialProfile(analyzerFormState.profileUrl, analyzerFormState.feedImages, analyzerFormState.analyticsImage, language);
            setAnalysisResult(result);
             if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'analysis', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch (err) {
            handleError(err, 'analyzerApiError');
        } finally {
            setIsAnalyzerLoading(false);
        }
    };
    
    // Traffic Manager Handlers
    const handleChannelToggle = (channel: string) => {
        setTrafficPlanForm(prev => {
          const newChannels = prev.channels.includes(channel)
            ? prev.channels.filter(c => c !== channel)
            : [...prev.channels, channel];
          return { ...prev, channels: newChannels };
        });
    };

    const handleCampaignPlanSubmit = async () => {
        if (!handleTokenCost(TOKEN_COSTS.CAMPAIGN_PLAN)) return;
        setIsCampaignPlanLoading(true);
        setError(null);
        setCampaignPlan(null);
        try {
            const result = await generateCampaignPlan(trafficPlanForm, language);
            setCampaignPlan(result);
             if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'campaignPlan', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch(err) {
            handleError(err, 'trafficPlanError');
        } finally {
            setIsCampaignPlanLoading(false);
        }
    };
    
    const handleCampaignPerformanceSubmit = async () => {
        if (!trafficAnalysisImage) {
            setError("adsScreenshotRequired");
            return;
        }
        if (!handleTokenCost(TOKEN_COSTS.PERFORMANCE_ANALYSIS)) return;
        setIsCampaignPerformanceLoading(true);
        setError(null);
        setCampaignPerformanceFeedback(null);
        try {
            const result = await analyzeCampaignPerformance(trafficAnalysisImage, language);
            setCampaignPerformanceFeedback(result);
             if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'performanceFeedback', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch(err) {
            handleError(err, 'trafficAnalysisImageError');
        } finally {
            setIsCampaignPerformanceLoading(false);
        }
    };
    
    const handleOrganicGrowthSubmit = async () => {
        if (!handleTokenCost(TOKEN_COSTS.CAMPAIGN_PLAN)) return;
        setIsOrganicGrowthLoading(true);
        setError(null);
        setOrganicContentPlan(null);
        try {
            const result = await generateOrganicContentPlan(organicGrowthForm, language);
            setOrganicContentPlan(result);
            if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'organicContentPlan', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch (err) {
            handleError(err, 'organicContentPlanError');
        } finally {
            setIsOrganicGrowthLoading(false);
        }
    };

    // Strategy Handlers
    const handleStrategySubmit = async () => {
        if (!selectedAccountId || !accounts[selectedAccountId]) {
            setError("selectAccountError");
            return;
        }
        if (!handleTokenCost(TOKEN_COSTS.STRATEGY_ANALYSIS)) return;
        setIsStrategyLoading(true);
        setError(null);
        setStrategyResult(null);
        setPerformanceReport(null);
        try {
            const account = accounts[selectedAccountId];
            const result = await generateHolisticStrategy(account, language);
            setStrategyResult(result);
             if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'holisticStrategy', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch(err) {
            handleError(err, 'strategyApiError');
        } finally {
            setIsStrategyLoading(false);
        }
    };
    
    const handlePerformanceReportSubmit = async () => {
        if (!selectedAccountId || !accounts[selectedAccountId]) {
            setError("selectAccountError");
            return;
        }
        if (!handleTokenCost(TOKEN_COSTS.ACCOUNT_PERFORMANCE_ANALYSIS)) return;
        setIsPerformanceReportLoading(true);
        setError(null);
        setPerformanceReport(null);
        setStrategyResult(null);
        try {
            const account = accounts[selectedAccountId];
            const result = await analyzeAccountPerformance(account, language);
            setPerformanceReport(result);
            if (selectedAccountId) {
                const historyItem: GeneratedHistoryItem = { id: Date.now().toString(), type: 'performanceReport', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || '' };
                addHistoryItem(selectedAccountId, historyItem);
            }
        } catch(err) {
            handleError(err, 'performanceApiError');
        } finally {
            setIsPerformanceReportLoading(false);
        }
    };
    
    // WhatsApp Handlers (Simulated)
    const connectWhatsapp = useCallback(() => {
        setWhatsappState('connecting');
        setWhatsappQrCode(null);
        setTimeout(() => {
            setWhatsappQrCode('https://www.qr-code-generator.com/wp-content/themes/qr/new_structure/markets/basic_market/generator/dist/generator/assets/images/websiteQRCode_noFrame.png');
        }, 1500);
        setTimeout(() => {
            setWhatsappState('connected');
        }, 5000);
    }, []);

    const disconnectWhatsapp = useCallback(() => {
        setWhatsappState('disconnected');
        setWhatsappQrCode(null);
    }, []);
    

    const value: AppStateContextType = {
        activePage, setActivePage, appMode, setAppMode, outputType, setOutputType,
        contextualPrompt, setContextualPrompt,
        productFormState, setProductFormState, contentFormState, setContentFormState,
        generatedContent, setGeneratedContent, isLoading, error, hasSelectedApiKey, setHasSelectedApiKey,
        handleProductSubmit, handleContentSubmit, clearForm, updateCreatorFormField, startGeneration,
        analyzerFormState, setAnalyzerFormState, analysisResult, isAnalyzerLoading, handleProfileAnalysisSubmit,
        trafficPlanForm, setTrafficPlanForm, trafficAnalysisImage, setTrafficAnalysisImage,
        campaignPlan, campaignPerformanceFeedback, isCampaignPlanLoading, isCampaignPerformanceLoading,
        organicGrowthForm, setOrganicGrowthForm, organicContentPlan, isOrganicGrowthLoading,
        handleCampaignPlanSubmit, handleCampaignPerformanceSubmit, handleOrganicGrowthSubmit, handleChannelToggle,
        strategyResult, performanceReport, isStrategyLoading, isPerformanceReportLoading,
        handleStrategySubmit, handlePerformanceReportSubmit,
        whatsappState, whatsappQrCode, connectWhatsapp, disconnectWhatsapp
    };

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
};

export const useAppState = (): AppStateContextType => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
};
