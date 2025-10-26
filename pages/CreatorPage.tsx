// Fix: Create the main Creator Page component.
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import ProductInputForm from '../components/ProductInputForm';
import ContentInputForm from '../components/ContentInputForm';
import OutputDisplay from '../components/OutputDisplay';
import AutomationScheduler from '../components/AutomationScheduler';
import ApiKeySelector from '../components/ApiKeySelector';
import { generateProductPost } from '../services/geminiService';
import { generateContentMarketingPost } from '../services/contentMarketingService';
import { AppMode, GeneratedContent, MediaType, Schedule, UploadedImage } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';


const CreatorPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const { currentUser, updateUserTokens } = useContext(AuthContext);
    const [appMode, setAppMode] = useState<AppMode>('product');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

    // State for Product form
    const [productForm, setProductForm] = useState({
        productName: '',
        productDescription: '',
        marketingVibe: '',
        productImage: null as UploadedImage | null,
    });
    const [outputType, setOutputType] = useState<MediaType>('image');

    // State for Content form
    const [contentForm, setContentForm] = useState({
        profession: '',
        targetAudience: '',
        professionalContext: '',
    });
    
    // State for automation
    const [schedule, setSchedule] = useState<Schedule>({
        isEnabled: false,
        postsPerDay: 1,
        times: ['09:00'],
        appMode: 'product',
        outputType: 'image',
    });
    const lastRunRef = useRef<Record<string, string>>({});


    // State for Veo API key
    const [isApiKeyRequired, setIsApiKeyRequired] = useState(false);
    const [hasSelectedApiKey, setHasSelectedApiKey] = useState(false);

    // Check for API key if video is selected
    useEffect(() => {
        const checkKey = async () => {
            if (appMode === 'product' && outputType === 'video') {
                if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                    const hasKey = await window.aistudio.hasSelectedApiKey();
                    setHasSelectedApiKey(hasKey);
                    setIsApiKeyRequired(!hasKey);
                } else {
                    setIsApiKeyRequired(false); 
                }
            } else {
                setIsApiKeyRequired(false);
            }
        };
        checkKey();
    }, [appMode, outputType]);
    
    const handleApiKeySelect = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success to avoid race conditions, as per guidelines.
            setHasSelectedApiKey(true);
            setIsApiKeyRequired(false);
        }
    };
    
    const clearForms = () => {
        setProductForm({ productName: '', productDescription: '', marketingVibe: '', productImage: null });
        setContentForm({ profession: '', targetAudience: '', professionalContext: '' });
        setGeneratedContent(null);
        setError(null);
    };

    const handleSubmit = useCallback(async () => {
        setError(null);
        setGeneratedContent(null);
        
        let cost = 0;
        if (appMode === 'product') {
            cost = outputType === 'image' ? TOKEN_COSTS.PRODUCT_IMAGE : TOKEN_COSTS.PRODUCT_VIDEO;
        } else {
            cost = TOKEN_COSTS.CONTENT_POST;
        }

        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens'));
            return;
        }
        
        setIsLoading(true);
        try {
            let result: GeneratedContent;
            if (appMode === 'product') {
                if (!productForm.productName || !productForm.productImage) {
                    throw new Error(t('productFormError'));
                }
                if (outputType === 'video' && !hasSelectedApiKey) {
                    setIsApiKeyRequired(true);
                    throw new Error(t('apiKeyError'));
                }
                result = await generateProductPost(
                    productForm.productName,
                    productForm.productDescription,
                    productForm.marketingVibe,
                    productForm.productImage,
                    outputType
                );
            } else { // appMode === 'content'
                if (!contentForm.profession) {
                    throw new Error(t('contentFormError'));
                }
                result = await generateContentMarketingPost(
                    contentForm.profession,
                    contentForm.targetAudience,
                    contentForm.professionalContext
                );
            }
            setGeneratedContent(result);
            updateUserTokens(currentUser.tokens - cost);
            setError(null);
        } catch (err: any) {
            let errorMessage = err.message || t('unknownError');
            if (err.message && err.message.includes("Requested entity was not found")) {
                errorMessage = t('invalidApiKeyError');
                setHasSelectedApiKey(false);
                setIsApiKeyRequired(true);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [appMode, productForm, outputType, contentForm, hasSelectedApiKey, t, currentUser, updateUserTokens]);

    // Dedicated function for scheduled runs
    const runScheduledAction = useCallback(async () => {
        console.log("Running scheduled action with settings:", schedule);
        setError(null);

        let cost = 0;
        if (schedule.appMode === 'product') {
            cost = schedule.outputType === 'image' ? TOKEN_COSTS.PRODUCT_IMAGE : TOKEN_COSTS.PRODUCT_VIDEO;
        } else {
            cost = TOKEN_COSTS.CONTENT_POST;
        }

        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            console.error("Automation failed: Insufficient tokens.");
            setError(t('insufficientTokens'));
            return;
        }

        setIsLoading(true);
        try {
            let result: GeneratedContent;
            if (schedule.appMode === 'product') {
                if (!productForm.productName || !productForm.productImage) {
                    throw new Error(t('automationProductFormError'));
                }
                 if (schedule.outputType === 'video') {
                    const hasKey = window.aistudio && await window.aistudio.hasSelectedApiKey();
                    if (!hasKey) {
                        throw new Error(t('automationApiKeyError'));
                    }
                 }
                result = await generateProductPost(
                    productForm.productName,
                    productForm.productDescription,
                    productForm.marketingVibe,
                    productForm.productImage,
                    schedule.outputType
                );
            } else { // schedule.appMode === 'content'
                if (!contentForm.profession) {
                    throw new Error(t('automationContentFormError'));
                }
                result = await generateContentMarketingPost(
                    contentForm.profession,
                    contentForm.targetAudience,
                    contentForm.professionalContext
                );
            }
            setGeneratedContent(result);
            updateUserTokens(currentUser.tokens - cost);
            setError(null);
        } catch (err: any) {
            console.error("Automation failed:", err);
            setError(err.message || t('unknownError'));
        } finally {
            setIsLoading(false);
        }
    }, [schedule, productForm, contentForm, t, currentUser, updateUserTokens]);


    // Automation Logic
    useEffect(() => {
        if (!schedule.isEnabled) return;

        const checkSchedule = () => {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const currentDate = now.toISOString().split('T')[0];

            schedule.times.forEach(time => {
                if (time === currentTime && lastRunRef.current[time] !== currentDate) {
                    console.log(`Scheduled time ${time} reached. Running job.`);
                    lastRunRef.current[time] = currentDate;
                    runScheduledAction();
                }
            });
        };

        const intervalId = setInterval(checkSchedule, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, [schedule.isEnabled, schedule.times, runScheduledAction]);
    
    
    if (isApiKeyRequired) {
        return <ApiKeySelector onKeySelect={handleApiKeySelect} />;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-8">
                {/* Mode Switcher */}
                <div>
                    <div className="flex rounded-md shadow-sm">
                        <button onClick={() => { setAppMode('product'); clearForms(); }} className={`relative inline-flex items-center justify-center w-1/2 rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${appMode === 'product' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>
                           {t('productPost')}
                        </button>
                        <button onClick={() => { setAppMode('content'); clearForms(); }} className={`relative -ml-px inline-flex items-center justify-center w-1/2 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${appMode === 'content' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>
                           {t('contentPost')}
                        </button>
                    </div>
                </div>

                {appMode === 'product' ? (
                    <ProductInputForm
                        formState={productForm}
                        setFormState={setProductForm}
                        outputType={outputType}
                        setOutputType={setOutputType}
                        onSubmit={handleSubmit}
                        onClear={clearForms}
                        isLoading={isLoading}
                    />
                ) : (
                    <ContentInputForm
                        formState={contentForm}
                        setFormState={setContentForm}
                        onSubmit={handleSubmit}
                        onClear={clearForms}
                        isLoading={isLoading}
                    />
                )}
                 <hr className="border-slate-700" />
                 <AutomationScheduler schedule={schedule} setSchedule={setSchedule} />
            </div>
            <OutputDisplay
                generatedContent={generatedContent}
                isLoading={isLoading}
                error={error}
                appMode={appMode}
                outputType={outputType}
            />
        </div>
    );
};

export default CreatorPage;