import React, { createContext, useState, ReactNode, useContext, useCallback, useEffect } from 'react';
import {
  AppPage, AppMode, MediaType, GeneratedContent, ProductFormData,
  ContentFormData, AnalysisResult, CampaignPlan, HolisticStrategyResult,
  PerformanceReport, UploadedImage
} from '../types';
import { generateProductPost } from '../services/geminiService';
import { generateContentMarketingPost } from '../services/contentMarketingService';
import { analyzeSocialProfile } from '../services/analyzerService';
import { generateCampaignPlan, analyzeCampaignPerformance } from '../services/trafficManagerService';
import { generateHolisticStrategy, analyzeAccountPerformance } from '../services/strategyService';
import { LanguageContext } from './LanguageContext';
import { AuthContext } from './AuthContext';
import { AccountsContext } from './AccountsContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';

// Define the shape of the context state
interface AppState {
  activePage: AppPage;
  appMode: AppMode;
  outputType: MediaType;
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  hasSelectedApiKey: boolean; 

  // Forms
  productFormState: ProductFormData;
  contentFormState: ContentFormData;
  analyzerFormState: { profileUrl: string; feedImages: UploadedImage[]; analyticsImage: UploadedImage | null; };
  trafficPlanForm: { productService: string; targetAudience: string; objective: string; budget: string; platform: string; abTestRequest: string; };
  trafficAnalysisImage: UploadedImage | null;
  
  // Results
  analysisResult: AnalysisResult | null;
  campaignPlan: CampaignPlan | null;
  analysisFeedback: string | null;
  strategyResult: HolisticStrategyResult | null;
  performanceReport: PerformanceReport | null;

  // Loading States
  isCreatorLoading: boolean;
  isAnalyzerLoading: boolean;
  isTrafficPlanLoading: boolean;
  isTrafficAnalysisLoading: boolean;
  isStrategyLoading: boolean;
  isPerformanceReportLoading: boolean;
}

// Define the shape of the context, including state and actions
interface AppStateContextType extends AppState {
  setActivePage: (page: AppPage) => void;
  setAppMode: (mode: AppMode) => void;
  setOutputType: (type: MediaType) => void;
  setProductFormState: React.Dispatch<React.SetStateAction<ProductFormData>>;
  setContentFormState: React.Dispatch<React.SetStateAction<ContentFormData>>;
  setAnalyzerFormState: React.Dispatch<React.SetStateAction<{ profileUrl: string; feedImages: UploadedImage[]; analyticsImage: UploadedImage | null; }>>;
  setTrafficPlanForm: React.Dispatch<React.SetStateAction<{ productService: string; targetAudience: string; objective: string; budget: string; platform: string; abTestRequest: string; }>>;
  setTrafficAnalysisImage: React.Dispatch<React.SetStateAction<UploadedImage | null>>;

  // Handlers
  handleProductSubmit: () => Promise<void>;
  handleContentSubmit: () => Promise<void>;
  handleProfileAnalysisSubmit: () => Promise<void>;
  handleCampaignPlanSubmit: () => Promise<void>;
  handleCampaignPerformanceSubmit: () => Promise<void>;
  handleStrategySubmit: () => Promise<void>;
  handlePerformanceReportSubmit: () => Promise<void>;

  clearForm: (resetAccount?: boolean) => void;
  startGeneration: () => Promise<void>;
  updateCreatorFormField: (field: keyof ContentFormData | keyof ProductFormData, value: any) => void;
}

// Create the context with a default value
export const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Create the provider component
export const AppStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { t } = useContext(LanguageContext);
    const { currentUser, updateUserTokens } = useContext(AuthContext);
    const { addHistoryItem, selectedAccountId, accounts, selectAccount } = useContext(AccountsContext);
    
    // --- Universal State ---
    const [activePage, setActivePage] = useState<AppPage>('creator');
    const [error, setError] = useState<string | null>(null);
    const [hasSelectedApiKey, setHasSelectedApiKey] = useState(false);

    // --- Creator Page State ---
    const [appMode, setAppMode] = useState<AppMode>('content');
    const [outputType, setOutputType] = useState<MediaType>('image');
    const [productFormState, setProductFormState] = useState<ProductFormData>({ productName: '', productDescription: '', marketingVibe: '', productImage: null, maskTemplate: 'Nenhum', colorPalette: '', logoImage: null, profileUrl: '' });
    const [contentFormState, setContentFormState] = useState<ContentFormData>({ profession: '', targetAudience: '', professionalContext: '', postFormat: 'single', carouselSlides: 3, maskTemplate: 'Nenhum', colorPalette: '', logoImage: null, postExample1: '', postExample2: '', postExample3: '', profileUrl: '' });
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isCreatorLoading, setIsCreatorLoading] = useState(false);

    // --- Analyzer Page State ---
    const [analyzerFormState, setAnalyzerFormState] = useState({ profileUrl: '', feedImages: [], analyticsImage: null as UploadedImage | null });
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzerLoading, setIsAnalyzerLoading] = useState(false);

    // --- Traffic Manager Page State ---
    const [trafficPlanForm, setTrafficPlanForm] = useState({ productService: '', targetAudience: '', objective: 'Vendas', budget: '', platform: 'Meta', abTestRequest: '' });
    const [trafficAnalysisImage, setTrafficAnalysisImage] = useState<UploadedImage | null>(null);
    const [campaignPlan, setCampaignPlan] = useState<CampaignPlan | null>(null);
    const [analysisFeedback, setAnalysisFeedback] = useState<string | null>(null);
    const [isTrafficPlanLoading, setIsTrafficPlanLoading] = useState(false);
    const [isTrafficAnalysisLoading, setIsTrafficAnalysisLoading] = useState(false);

    // --- Strategy Page State ---
    const [strategyResult, setStrategyResult] = useState<HolisticStrategyResult | null>(null);
    const [performanceReport, setPerformanceReport] = useState<PerformanceReport | null>(null);
    const [isStrategyLoading, setIsStrategyLoading] = useState(false);
    const [isPerformanceReportLoading, setIsPerformanceReportLoading] = useState(false);

    const isLoading = isCreatorLoading || isAnalyzerLoading || isTrafficPlanLoading || isTrafficAnalysisLoading || isStrategyLoading || isPerformanceReportLoading;

    // --- Form Population Effect ---
    useEffect(() => {
        const selectedAccount = selectedAccountId ? accounts[selectedAccountId] : null;
        if (selectedAccount) {
             if (selectedAccount.type === 'product') {
                setProductFormState(selectedAccount.formData as ProductFormData);
             } else {
                 setContentFormState({ postFormat: 'single', carouselSlides: 3, ...(selectedAccount.formData as ContentFormData) });
             }
            // Populate other forms
            const formData = selectedAccount.formData;
            if ('profileUrl' in formData) setAnalyzerFormState(prev => ({ ...prev, profileUrl: formData.profileUrl || '' }));
            if (selectedAccount.type === 'product') {
                setTrafficPlanForm(prev => ({ ...prev, productService: (formData as ProductFormData).productName, targetAudience: (formData as ProductFormData).marketingVibe }));
            } else {
                setTrafficPlanForm(prev => ({ ...prev, productService: (formData as ContentFormData).profession, targetAudience: (formData as ContentFormData).targetAudience }));
            }
        } else {
            // Clear all forms if 'new-post' is selected
            setProductFormState({ productName: '', productDescription: '', marketingVibe: '', productImage: null, maskTemplate: 'Nenhum', colorPalette: '', logoImage: null, profileUrl: '' });
            setContentFormState({ profession: '', targetAudience: '', professionalContext: '', postFormat: 'single', carouselSlides: 3, maskTemplate: 'Nenhum', colorPalette: '', logoImage: null, postExample1: '', postExample2: '', postExample3: '', profileUrl: '' });
            setAnalyzerFormState({ profileUrl: '', feedImages: [], analyticsImage: null });
            setTrafficPlanForm({ productService: '', targetAudience: '', objective: 'Vendas', budget: '', platform: 'Meta', abTestRequest: '' });
        }
    }, [selectedAccountId, accounts]);


    const clearForm = useCallback((resetAccount = true) => {
        if (resetAccount) {
            selectAccount('new-post');
        } else {
             // Re-trigger useEffect to clear if needed, but selectAccount handles it
        }
        setGeneratedContent(null);
        setError(null);
    }, [selectAccount]);

    const handleProductSubmit = async () => {
        if (!productFormState.productName || !productFormState.productImage) {
            setError(t('productFormError')); return;
        }
        const cost = outputType === 'image' ? TOKEN_COSTS.PRODUCT_IMAGE : TOKEN_COSTS.PRODUCT_VIDEO;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens')); return;
        }
        setIsCreatorLoading(true); setError(null); setGeneratedContent(null);
        try {
            const result = await generateProductPost(productFormState.productName, productFormState.productDescription, productFormState.marketingVibe, productFormState.productImage, outputType, productFormState.maskTemplate, productFormState.colorPalette, productFormState.logoImage);
            setGeneratedContent(result);
            if (selectedAccountId && selectedAccountId !== 'new-post') addHistoryItem(selectedAccountId, { id: Date.now().toString(), type: 'productPost', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || 'Unknown' });
            if (currentUser && !currentUser.isAdmin) updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) {
             if (err.message === "Requested entity was not found.") { setError(t('apiKeyError')); setHasSelectedApiKey(false); } else { setError(err.message || t('productApiError')); }
        } finally { setIsCreatorLoading(false); }
    };
    
    const handleContentSubmit = async () => {
        if (!contentFormState.profession) {
            setError(t('contentFormError')); return;
        }
        const cost = TOKEN_COSTS.CONTENT_POST * (contentFormState.postFormat === 'carousel' ? contentFormState.carouselSlides : 1);
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens')); return;
        }
        setIsCreatorLoading(true); setError(null); setGeneratedContent(null);
        try {
            const result = await generateContentMarketingPost(contentFormState.profession, contentFormState.targetAudience, contentFormState.professionalContext, contentFormState.postFormat, contentFormState.carouselSlides, contentFormState.maskTemplate, contentFormState.colorPalette, contentFormState.logoImage, contentFormState.postExample1, contentFormState.postExample2, contentFormState.postExample3);
            setGeneratedContent(result);
            if (selectedAccountId && selectedAccountId !== 'new-post') addHistoryItem(selectedAccountId, { id: Date.now().toString(), type: 'contentPost', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || 'Unknown' });
            if (currentUser && !currentUser.isAdmin) updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) { setError(err.message || t('contentApiError')); } finally { setIsCreatorLoading(false); }
    };
    
    const handleProfileAnalysisSubmit = async () => {
        if (!analyzerFormState.profileUrl) {
            setError(t('analyzerUrlError')); return;
        }
        const cost = TOKEN_COSTS.PROFILE_ANALYSIS;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens')); return;
        }
        setIsAnalyzerLoading(true); setError(null); setAnalysisResult(null);
        try {
            const result = await analyzeSocialProfile(analyzerFormState.profileUrl, analyzerFormState.feedImages, analyzerFormState.analyticsImage);
            setAnalysisResult(result);
            if (selectedAccountId && selectedAccountId !== 'new-post') addHistoryItem(selectedAccountId, { id: Date.now().toString(), type: 'analysis', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || 'Unknown' });
            if (currentUser && !currentUser.isAdmin) updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) { setError(err.message || t('analyzerApiError')); } finally { setIsAnalyzerLoading(false); }
    };

    const handleCampaignPlanSubmit = async () => {
        const cost = TOKEN_COSTS.CAMPAIGN_PLAN;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens')); return;
        }
        setIsTrafficPlanLoading(true); setError(null); setCampaignPlan(null);
        try {
            const result = await generateCampaignPlan(trafficPlanForm);
            setCampaignPlan(result);
            if (selectedAccountId && selectedAccountId !== 'new-post') addHistoryItem(selectedAccountId, { id: Date.now().toString(), type: 'campaignPlan', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || 'Unknown' });
            if (currentUser && !currentUser.isAdmin) updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) { setError(err.message || t('trafficPlanError')); } finally { setIsTrafficPlanLoading(false); }
    };
    
    const handleCampaignPerformanceSubmit = async () => {
        if (!trafficAnalysisImage) {
            setError(t('trafficAnalysisError')); return;
        }
        const cost = TOKEN_COSTS.PERFORMANCE_ANALYSIS;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens')); return;
        }
        setIsTrafficAnalysisLoading(true); setError(null); setAnalysisFeedback(null);
        try {
            const result = await analyzeCampaignPerformance(trafficAnalysisImage);
            setAnalysisFeedback(result);
            if (selectedAccountId && selectedAccountId !== 'new-post') addHistoryItem(selectedAccountId, { id: Date.now().toString(), type: 'performanceFeedback', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || 'Unknown' });
            if (currentUser && !currentUser.isAdmin) updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) { setError(err.message || t('trafficAnalysisImageError')); } finally { setIsTrafficAnalysisLoading(false); }
    };
    
    const handleStrategySubmit = async () => {
        const selectedAccount = selectedAccountId ? accounts[selectedAccountId] : null;
        if (!selectedAccount) { setError(t('selectAccountPrompt')); return; }
        const cost = TOKEN_COSTS.STRATEGY_ANALYSIS;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) { setError(t('insufficientTokens')); return; }
        setIsStrategyLoading(true); setError(null); setStrategyResult(null); setPerformanceReport(null);
        try {
            const result = await generateHolisticStrategy(selectedAccount);
            setStrategyResult(result);
            if (selectedAccountId && selectedAccountId !== 'new-post') addHistoryItem(selectedAccountId, { id: Date.now().toString(), type: 'holisticStrategy', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || 'Unknown' });
            if (currentUser && !currentUser.isAdmin) updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) { setError(err.message || t('strategyApiError')); } finally { setIsStrategyLoading(false); }
    };

    const handlePerformanceReportSubmit = async () => {
        const selectedAccount = selectedAccountId ? accounts[selectedAccountId] : null;
        if (!selectedAccount) { setError(t('selectAccountPrompt')); return; }
        const cost = TOKEN_COSTS.ACCOUNT_PERFORMANCE_ANALYSIS;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) { setError(t('insufficientTokens')); return; }
        setIsPerformanceReportLoading(true); setError(null); setStrategyResult(null); setPerformanceReport(null);
        try {
            const result = await analyzeAccountPerformance(selectedAccount);
            setPerformanceReport(result);
            if (selectedAccountId && selectedAccountId !== 'new-post') addHistoryItem(selectedAccountId, { id: Date.now().toString(), type: 'performanceReport', timestamp: new Date().toISOString(), data: result, accountName: accounts[selectedAccountId]?.name || 'Unknown' });
            if (currentUser && !currentUser.isAdmin) updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) { setError(err.message || t('performanceApiError')); } finally { setIsPerformanceReportLoading(false); }
    };

    const startGeneration = useCallback(async () => {
        if (activePage !== 'creator') {
            setError("Generation can only be started from the Creator page."); return;
        }
        if (appMode === 'content') await handleContentSubmit();
        else await handleProductSubmit();
    }, [activePage, appMode, handleContentSubmit, handleProductSubmit]);

    const updateCreatorFormField = useCallback((field: keyof ContentFormData | keyof ProductFormData, value: any) => {
        if (appMode === 'content') {
            setContentFormState(prev => ({...prev, [field]: value}));
        } else {
            setProductFormState(prev => ({...prev, [field]: value}));
        }
    }, [appMode]);

    const value = {
        activePage, setActivePage, appMode, setAppMode, outputType, setOutputType,
        productFormState, setProductFormState, contentFormState, setContentFormState,
        generatedContent,
        isLoading, error, setError, hasSelectedApiKey, setHasSelectedApiKey,
        analyzerFormState, setAnalyzerFormState, analysisResult,
        trafficPlanForm, setTrafficPlanForm, trafficAnalysisImage, setTrafficAnalysisImage,
        campaignPlan, analysisFeedback, strategyResult, performanceReport,
        isCreatorLoading, isAnalyzerLoading, isTrafficPlanLoading, isTrafficAnalysisLoading, isStrategyLoading, isPerformanceReportLoading,
        handleProductSubmit, handleContentSubmit, handleProfileAnalysisSubmit,
        handleCampaignPlanSubmit, handleCampaignPerformanceSubmit,
        handleStrategySubmit, handlePerformanceReportSubmit,
        clearForm, startGeneration, updateCreatorFormField
    };

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
};

// Custom hook to use the AppStateContext
export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
};
