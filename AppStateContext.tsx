import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import {
    AppPage, AppMode, MediaType, ProductFormData, ContentFormData,
    GeneratedContent, AnalysisResult, AnalyzerFormData,
    TrafficPlanForm, CampaignPlan, UploadedImage, CampaignPerformanceAnalysisResult,
    OrganicGrowthForm, OrganicContentPlan, HolisticStrategyResult, PerformanceReport,
    WhatsappConnectionState
} from './types.ts';
// Fix: Corrected the import path for AuthContext from './AuthContext.tsx' to './lib/AuthContext.tsx'.
import { AuthContext } from '../lib/MongoAuthContext.tsx';
import { LanguageContext } from './contexts/LanguageContext.tsx';
import { AccountsContext } from './contexts/AccountsContext.tsx';
import {
    generateProductPost,
    generateContentMarketingPost
} from './services/contentMarketingService.ts';
import {
    analyzeSocialProfile,
} from './services/analyzerService.ts';
import {
    generateCampaignPlan, analyzeCampaignPerformance, generateOrganicContentPlan
} from './services/trafficManagerService.ts';
import {
    generateHolisticStrategy, analyzeAccountPerformance
} from './services/strategyService.ts';
import { sendWhatsappNotification } from './services/whatsappService.ts';
import { TOKEN_COSTS, VIDEO_COSTS } from './lib/tokenCosts.ts';

// Initial form states
// FIX: Added missing elevenLabs properties to conform to the ProductFormData type.
const initialProductFormData: ProductFormData = {
    productName: '',
    productDescription: '',
    marketingVibe: '',
    productImage: null,
    maskTemplate: 'Nenhum',
    colorPalette: '',
    logoImage: null,
    userSelfie: null,
    artisticStyle: 'Padrão',
    aspectRatio: '1:1',
    negativePrompt: '',
    videoDuration: '5s',
    animationStyle: 'dynamic',
    narrationScript: '',
    backgroundMusic: 'none',
    musicDescription: '',
    postExample1: '',
    postExample2: '',
    postExample3: '',
    profileUrl: '',
    benchmarkProfileUrl: '',
    audioType: 'narration',
    elevenLabsVoiceId: 'Rachel',
    useCustomElevenLabs: false,
    customElevenLabsApiKey: '',
    startImage: null,
};

// FIX: Added missing elevenLabs properties to conform to the ContentFormData type.
const initialContentFormData: ContentFormData = {
    profession: '',
    targetAudience: '',
    professionalContext: '',
    postFormat: 'single',
    carouselSlides: 3,
    maskTemplate: 'Nenhum',
    colorPalette: '',
    logoImage: null,
    userSelfie: null,
    postExample1: '',
    postExample2: '',
    postExample3: '',
    artisticStyle: 'Padrão',
    aspectRatio: '1:1',
    negativePrompt: '',
    videoDuration: '5s',
    animationStyle: 'dynamic',
    narrationScript: '',
    backgroundMusic: 'none',
    musicDescription: '',
    profileUrl: '',
    benchmarkProfileUrl: '',
    audioType: 'narration',
    elevenLabsVoiceId: 'Rachel',
    useCustomElevenLabs: false,
    customElevenLabsApiKey: '',
    startImage: null,
};

const initialAnalyzerFormData: AnalyzerFormData = {
    profileUrl: '',
    feedImages: [],
    analyticsImage: null,
};

const initialTrafficPlanForm: TrafficPlanForm = {
    productService: '',
    targetAudience: '',
    objective: '',
    budget: '',
    duration: '',
    channels: [],
};

const initialOrganicGrowthForm: OrganicGrowthForm = {
    mainKeyword: '',
    targetAudience: '',
    contentFormat: 'blog',
};


interface AppStateContextType {
    // UI State
    activePage: AppPage;
    setActivePage: (page: AppPage) => void;
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
    outputType: MediaType;
    setOutputType: (type: MediaType) => void;
    isLoading: boolean;
    error: string | null;
    contextualPrompt: string | null;
    setContextualPrompt: (prompt: string | null) => void;

    // Creator Page States & Actions
    productFormState: ProductFormData;
    setProductFormState: (data: ProductFormData) => void;
    contentFormState: ContentFormData;
    setContentFormState: (data: ContentFormData) => void;
    generatedContent: GeneratedContent | null;
    setGeneratedContent: (content: GeneratedContent | null) => void;
    handleProductSubmit: () => Promise<void>;
    handleContentSubmit: () => Promise<void>;
    clearForm: (clearOutputToo?: boolean) => void;
    updateCreatorFormField: (mode: AppMode, field: keyof (ProductFormData | ContentFormData), value: any) => void;

    // Analyzer Page States & Actions
    analyzerFormState: AnalyzerFormData;
    setAnalyzerFormState: (data: AnalyzerFormData | ((prev: AnalyzerFormData) => AnalyzerFormData)) => void;
    analysisResult: AnalysisResult | null;
    setAnalysisResult: (result: AnalysisResult | null) => void;
    isAnalyzerLoading: boolean;
    strategyResult: HolisticStrategyResult | null;
    setStrategyResult: (result: HolisticStrategyResult | null) => void;
    isStrategyLoading: boolean;
    performanceReport: PerformanceReport | null;
    setPerformanceReport: (report: PerformanceReport | null) => void;
    isPerformanceReportLoading: boolean;
    handleProfileAnalysisSubmit: () => Promise<void>;
    handleStrategySubmit: () => Promise<void>;
    handlePerformanceReportSubmit: () => Promise<void>;

    // Traffic Manager Page States & Actions
    trafficPlanForm: TrafficPlanForm;
    setTrafficPlanForm: (data: TrafficPlanForm | ((prev: TrafficPlanForm) => TrafficPlanForm)) => void;
    trafficAnalysisImage: UploadedImage | null;
    setTrafficAnalysisImage: (image: UploadedImage | null) => void;
    campaignPlan: CampaignPlan | null;
    setCampaignPlan: (plan: CampaignPlan | null) => void;
    isCampaignPlanLoading: boolean;
    campaignPerformanceFeedback: CampaignPerformanceAnalysisResult | null;
    setCampaignPerformanceFeedback: (feedback: CampaignPerformanceAnalysisResult | null) => void;
    isCampaignPerformanceLoading: boolean;
    organicGrowthForm: OrganicGrowthForm;
    setOrganicGrowthForm: (data: OrganicGrowthForm | ((prev: OrganicGrowthForm) => OrganicGrowthForm)) => void;
    organicContentPlan: OrganicContentPlan | null;
    setOrganicContentPlan: (plan: OrganicContentPlan | null) => void;
    isOrganicGrowthLoading: boolean;
    handleCampaignPlanSubmit: () => Promise<void>;
    handleCampaignPerformanceSubmit: () => Promise<void>;
    handleOrganicGrowthSubmit: () => Promise<void>;
    handleChannelToggle: (channel: string) => void;

    // Global Actions
    handleError: (err: Error, customMessageKey?: string) => void;
    handleTokenCost: (cost: number) => boolean;
    
    // Whatsapp Integration
    whatsappState: WhatsappConnectionState;
    whatsappQrCode: string | null;
    connectWhatsapp: () => void;
    disconnectWhatsapp: () => void;
    setError: (error: string | null) => void;
}

export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const authContext = useContext(AuthContext);
    const languageContext = useContext(LanguageContext);
    const accountsContext = useContext(AccountsContext);

    if (!authContext || !languageContext || !accountsContext) {
        // This can happen if the context providers are not set up correctly.
        // It's a safeguard against the circular dependency issue causing context to be `{}`
        return <div>Loading contexts...</div>;
    }

    const { currentUser, updateUserTokens } = authContext;
    const { t, language } = languageContext;
    const { accounts, selectedAccountId, addHistoryItem } = accountsContext;

    // UI State
    const [activePage, setActivePage] = useState<AppPage>('creator');
    const [appMode, setAppMode] = useState<AppMode>('content');
    const [outputType, setOutputType] = useState<MediaType>('image');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contextualPrompt, setContextualPrompt] = useState<string | null>(null);

    // Creator Page States
    const [productFormState, setProductFormState] = useState<ProductFormData>(initialProductFormData);
    const [contentFormState, setContentFormState] = useState<ContentFormData>(initialContentFormData);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

    // Analyzer Page States
    const [analyzerFormState, setAnalyzerFormState] = useState<AnalyzerFormData>(initialAnalyzerFormData);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzerLoading, setIsAnalyzerLoading] = useState(false);
    const [strategyResult, setStrategyResult] = useState<HolisticStrategyResult | null>(null);
    const [isStrategyLoading, setIsStrategyLoading] = useState(false);
    const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
    const [isPerformanceReportLoading, setIsPerformanceReportLoading] = useState(false);

    // Traffic Manager Page States
    const [trafficPlanForm, setTrafficPlanForm] = useState<TrafficPlanForm>(initialTrafficPlanForm);
    const [trafficAnalysisImage, setTrafficAnalysisImage] = useState<UploadedImage | null>(null);
    const [campaignPlan, setCampaignPlan] = useState<CampaignPlan | null>(null);
    const [isCampaignPlanLoading, setIsCampaignPlanLoading] = useState(false);
    const [campaignPerformanceFeedback, setCampaignPerformanceFeedback] = useState<CampaignPerformanceAnalysisResult | null>(null);
    const [isCampaignPerformanceLoading, setIsCampaignPerformanceLoading] = useState(false);
    const [organicGrowthForm, setOrganicGrowthForm] = useState<OrganicGrowthForm>(initialOrganicGrowthForm);
    const [organicContentPlan, setOrganicContentPlan] = useState<OrganicContentPlan | null>(null);
    const [isOrganicGrowthLoading, setIsOrganicGrowthLoading] = useState(false);
    
    // Whatsapp Integration State (simulated)
    const [whatsappState, setWhatsappState] = useState<WhatsappConnectionState>('disconnected');
    const [whatsappQrCode, setWhatsappQrCode] = useState<string | null>(null);

    // --- Global Actions ---
    const handleError = useCallback((err: Error, customMessageKey?: string) => {
        console.error("Application Error:", err);
        setError(customMessageKey || err.message || 'unknownError');
        setIsLoading(false);
        setIsAnalyzerLoading(false);
        setIsStrategyLoading(false);
        setIsPerformanceReportLoading(false);
        setIsCampaignPlanLoading(false);
        setIsCampaignPerformanceLoading(false);
        setIsOrganicGrowthLoading(false);
    }, []);

    const handleTokenCost = useCallback((cost: number): boolean => {
        if (!currentUser) {
            handleError(new Error("authRequired"), 'authRequired');
            return false;
        }
        if (!currentUser.isAdmin && currentUser.tokens < cost) {
            handleError(new Error("insufficientTokens"), 'insufficientTokens');
            return false;
        }
        if (!currentUser.isAdmin) {
            updateUserTokens(currentUser.tokens - cost);
        }
        return true;
    }, [currentUser, updateUserTokens, handleError]);

    // --- Creator Page Actions ---
    const clearForm = useCallback((clearOutputToo: boolean = false) => {
        if (appMode === 'product') {
            setProductFormState(initialProductFormData);
        } else {
            setContentFormState(initialContentFormData);
        }
        if (clearOutputToo) {
            setGeneratedContent(null);
        }
        setError(null);
    }, [appMode]);

    const updateCreatorFormField = useCallback((mode: AppMode, field: keyof (ProductFormData | ContentFormData), value: any) => {
        if (mode === 'product') {
            setProductFormState(prev => ({ ...prev, [field]: value }));
        } else {
            setContentFormState(prev => ({ ...prev, [field]: value }));
        }
    }, []);

    const handleProductSubmit = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        setGeneratedContent(null);

        const tokenCost = outputType === 'image' ? TOKEN_COSTS.PRODUCT_IMAGE : VIDEO_COSTS[productFormState.videoDuration];
        if (!handleTokenCost(tokenCost)) {
            setIsLoading(false);
            return;
        }

        try {
            const content = await generateProductPost(productFormState, outputType, language);
            setGeneratedContent(content);
            if (selectedAccountId) {
                addHistoryItem(selectedAccountId, {
                    id: Date.now().toString(),
                    type: 'productPost',
                    timestamp: new Date().toISOString(),
                    data: content,
                    accountName: accounts[selectedAccountId]?.name || 'new-post',
                });
                sendWhatsappNotification(whatsappState, t('whatsappNotificationProductSuccess', { productName: productFormState.productName }));
            }
        } catch (err: any) {
            handleError(err, 'productGenerationError');
            sendWhatsappNotification(whatsappState, t('whatsappNotificationProductError', { productName: productFormState.productName }));
        } finally {
            setIsLoading(false);
        }
    }, [productFormState, outputType, language, handleTokenCost, handleError, selectedAccountId, addHistoryItem, accounts, whatsappState, t]);

    const handleContentSubmit = useCallback(async () => {
        setError(null);
        setIsLoading(true);
        setGeneratedContent(null);

        const tokenCost = outputType === 'image' ? TOKEN_COSTS.CONTENT_POST : VIDEO_COSTS[contentFormState.videoDuration];
        if (!handleTokenCost(tokenCost)) {
            setIsLoading(false);
            return;
        }

        try {
            const content = await generateContentMarketingPost(contentFormState, outputType, language);
            setGeneratedContent(content);
            if (selectedAccountId) {
                addHistoryItem(selectedAccountId, {
                    id: Date.now().toString(),
                    type: 'contentPost',
                    timestamp: new Date().toISOString(),
                    data: content,
                    accountName: accounts[selectedAccountId]?.name || 'new-post',
                });
                 sendWhatsappNotification(whatsappState, t('whatsappNotificationContentSuccess', { profession: contentFormState.profession }));
            }
        } catch (err: any) {
            handleError(err, 'contentGenerationError');
            sendWhatsappNotification(whatsappState, t('whatsappNotificationContentError', { profession: contentFormState.profession }));
        } finally {
            setIsLoading(false);
        }
    }, [contentFormState, outputType, language, handleTokenCost, handleError, selectedAccountId, addHistoryItem, accounts, whatsappState, t]);

    // --- Analyzer Page Actions ---
    const handleProfileAnalysisSubmit = useCallback(async () => {
        setError(null);
        setIsAnalyzerLoading(true);
        setAnalysisResult(null);
        setStrategyResult(null);
        setPerformanceReport(null);

        if (!analyzerFormState.profileUrl) {
            handleError(new Error("profileUrlRequired"), 'profileUrlRequired');
            setIsAnalyzerLoading(false);
            return;
        }

        if (!handleTokenCost(TOKEN_COSTS.PROFILE_ANALYSIS)) {
            setIsAnalyzerLoading(false);
            return;
        }

        try {
            const result = await analyzeSocialProfile(
                analyzerFormState.profileUrl,
                analyzerFormState.feedImages,
                analyzerFormState.analyticsImage,
                language
            );
            setAnalysisResult(result);
            if (selectedAccountId) {
                addHistoryItem(selectedAccountId, {
                    id: Date.now().toString(),
                    type: 'analysis',
                    timestamp: new Date().toISOString(),
                    data: result,
                    accountName: accounts[selectedAccountId]?.name || 'new-post',
                });
            }
        } catch (err: any) {
            handleError(err, 'analyzerApiError');
        } finally {
            setIsAnalyzerLoading(false);
        }
    }, [analyzerFormState, language, handleTokenCost, handleError, selectedAccountId, addHistoryItem, accounts]);

    const handleStrategySubmit = useCallback(async () => {
        setError(null);
        setIsStrategyLoading(true);
        setStrategyResult(null);

        if (!selectedAccountId || !accounts[selectedAccountId]) {
            handleError(new Error("noAccountSelected"), 'selectAccountError');
            setIsStrategyLoading(false);
            return;
        }

        if (!handleTokenCost(TOKEN_COSTS.STRATEGY_ANALYSIS)) {
            setIsStrategyLoading(false);
            return;
        }

        try {
            const account = accounts[selectedAccountId];
            const result = await generateHolisticStrategy(account, language);
            setStrategyResult(result);
            addHistoryItem(selectedAccountId, {
                id: Date.now().toString(),
                type: 'holisticStrategy',
                timestamp: new Date().toISOString(),
                data: result,
                accountName: account.name,
            });
        } catch (err: any) {
            handleError(err, 'strategyApiError');
        } finally {
            setIsStrategyLoading(false);
        }
    }, [selectedAccountId, accounts, language, handleTokenCost, handleError, addHistoryItem]);

    const handlePerformanceReportSubmit = useCallback(async () => {
        setError(null);
        setIsPerformanceReportLoading(true);
        setPerformanceReport(null);

        if (!selectedAccountId || !accounts[selectedAccountId]) {
            handleError(new Error("noAccountSelected"), 'selectAccountError');
            setIsPerformanceReportLoading(false);
            return;
        }

        if (!handleTokenCost(TOKEN_COSTS.ACCOUNT_PERFORMANCE_ANALYSIS)) {
            setIsPerformanceReportLoading(false);
            return;
        }

        try {
            const account = accounts[selectedAccountId];
            const report = await analyzeAccountPerformance(account, language);
            setPerformanceReport(report);
            addHistoryItem(selectedAccountId, {
                id: Date.now().toString(),
                type: 'performanceReport',
                timestamp: new Date().toISOString(),
                data: report,
                accountName: account.name,
            });
        } catch (err: any) {
            handleError(err, 'performanceApiError');
        } finally {
            setIsPerformanceReportLoading(false);
        }
    }, [selectedAccountId, accounts, language, handleTokenCost, handleError, addHistoryItem]);

    // --- Traffic Manager Page Actions ---
    const handleChannelToggle = useCallback((channel: string) => {
        setTrafficPlanForm(prev => {
            const newChannels = prev.channels.includes(channel)
                ? prev.channels.filter(c => c !== channel)
                : [...prev.channels, channel];
            return { ...prev, channels: newChannels };
        });
    }, []);

    const handleCampaignPlanSubmit = useCallback(async () => {
        setError(null);
        setIsCampaignPlanLoading(true);
        setCampaignPlan(null);

        if (!trafficPlanForm.productService || !trafficPlanForm.objective || trafficPlanForm.channels.length === 0) {
            handleError(new Error("campaignPlanRequiredFields"), 'trafficPlanError');
            setIsCampaignPlanLoading(false);
            return;
        }

        if (!handleTokenCost(TOKEN_COSTS.CAMPAIGN_PLAN)) {
            setIsCampaignPlanLoading(false);
            return;
        }

        try {
            const plan = await generateCampaignPlan(trafficPlanForm, language);
            setCampaignPlan(plan);
            if (selectedAccountId) {
                addHistoryItem(selectedAccountId, {
                    id: Date.now().toString(),
                    type: 'campaignPlan',
                    timestamp: new Date().toISOString(),
                    data: plan,
                    accountName: accounts[selectedAccountId]?.name || 'new-post',
                });
            }
        } catch (err: any) {
            handleError(err, 'trafficPlanError');
        } finally {
            setIsCampaignPlanLoading(false);
        }
    }, [trafficPlanForm, language, handleTokenCost, handleError, selectedAccountId, addHistoryItem, accounts]);

    const handleCampaignPerformanceSubmit = useCallback(async () => {
        setError(null);
        setIsCampaignPerformanceLoading(true);
        setCampaignPerformanceFeedback(null);

        if (!trafficAnalysisImage) {
            handleError(new Error("adsScreenshotRequired"), 'trafficAnalysisImageError');
            setIsCampaignPerformanceLoading(false);
            return;
        }

        if (!handleTokenCost(TOKEN_COSTS.PERFORMANCE_ANALYSIS)) {
            setIsCampaignPerformanceLoading(false);
            return;
        }

        try {
            const feedback = await analyzeCampaignPerformance(trafficAnalysisImage, language);
            setCampaignPerformanceFeedback(feedback);
            if (selectedAccountId) {
                addHistoryItem(selectedAccountId, {
                    id: Date.now().toString(),
                    type: 'performanceFeedback',
                    timestamp: new Date().toISOString(),
                    data: feedback,
                    accountName: accounts[selectedAccountId]?.name || 'new-post',
                });
            }
        } catch (err: any) {
            handleError(err, 'trafficAnalysisImageError');
        } finally {
            setIsCampaignPerformanceLoading(false);
        }
    }, [trafficAnalysisImage, language, handleTokenCost, handleError, selectedAccountId, addHistoryItem, accounts]);

    const handleOrganicGrowthSubmit = useCallback(async () => {
        setError(null);
        setIsOrganicGrowthLoading(true);
        setOrganicContentPlan(null);

        if (!organicGrowthForm.mainKeyword || !organicGrowthForm.targetAudience) {
            handleError(new Error("organicGrowthRequiredFields"), 'organicContentPlanError');
            setIsOrganicGrowthLoading(false);
            return;
        }

        if (!handleTokenCost(TOKEN_COSTS.CAMPAIGN_PLAN)) {
            setIsOrganicGrowthLoading(false);
            return;
        }

        try {
            const plan = await generateOrganicContentPlan(organicGrowthForm, language);
            setOrganicContentPlan(plan);
            if (selectedAccountId) {
                addHistoryItem(selectedAccountId, {
                    id: Date.now().toString(),
                    type: 'organicContentPlan',
                    timestamp: new Date().toISOString(),
                    data: plan,
                    accountName: accounts[selectedAccountId]?.name || 'new-post',
                });
            }
        } catch (err: any) {
            handleError(err, 'organicContentPlanError');
        } finally {
            setIsOrganicGrowthLoading(false);
        }
    }, [organicGrowthForm, language, handleTokenCost, handleError, selectedAccountId, addHistoryItem, accounts]);

    // --- Whatsapp Integration Actions ---
    const connectWhatsapp = useCallback(() => {
        setWhatsappState('connecting');
        setTimeout(() => {
            setWhatsappQrCode('https://via.placeholder.com/200/FFFFFF/000000?text=Simulated+QR');
            setTimeout(() => {
                setWhatsappState('connected');
                setWhatsappQrCode(null);
            }, 3000);
        }, 1500);
    }, []);

    const disconnectWhatsapp = useCallback(() => {
        setWhatsappState('disconnected');
    }, []);
    
    const value: AppStateContextType = {
        activePage, setActivePage, appMode, setAppMode, outputType, setOutputType, isLoading, error, contextualPrompt, setContextualPrompt,
        productFormState, setProductFormState, contentFormState, setContentFormState, generatedContent, setGeneratedContent, handleProductSubmit, handleContentSubmit, clearForm, updateCreatorFormField,
        analyzerFormState, setAnalyzerFormState, analysisResult, setAnalysisResult, isAnalyzerLoading, strategyResult, setStrategyResult, isStrategyLoading, performanceReport, setPerformanceReport, isPerformanceReportLoading, handleProfileAnalysisSubmit, handleStrategySubmit, handlePerformanceReportSubmit,
        trafficPlanForm, setTrafficPlanForm, trafficAnalysisImage, setTrafficAnalysisImage, campaignPlan, setCampaignPlan, isCampaignPlanLoading, campaignPerformanceFeedback, setCampaignPerformanceFeedback, isCampaignPerformanceLoading, organicGrowthForm, setOrganicGrowthForm, organicContentPlan, setOrganicContentPlan, isOrganicGrowthLoading, handleCampaignPlanSubmit, handleCampaignPerformanceSubmit, handleOrganicGrowthSubmit, handleChannelToggle,
        handleError, handleTokenCost,
        whatsappState, whatsappQrCode, connectWhatsapp, disconnectWhatsapp, setError
    };
    
    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
};