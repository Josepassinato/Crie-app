import React, { useState, useContext } from 'react';
import { generateCampaignPlan, analyzeCampaignPerformance } from '../services/trafficManagerService';
import { CampaignPlan, UploadedImage } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';

const TrafficManagerPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const { currentUser, updateUserTokens } = useContext(AuthContext);
    const [planForm, setPlanForm] = useState({
        productService: '',
        targetAudience: '',
        objective: 'Vendas',
        budget: '',
        platform: 'Meta',
        abTestRequest: '',
    });
    const [analysisImage, setAnalysisImage] = useState<UploadedImage | null>(null);

    const [isLoadingPlan, setIsLoadingPlan] = useState(false);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    
    const [error, setError] = useState<string | null>(null);
    
    const [campaignPlan, setCampaignPlan] = useState<CampaignPlan | null>(null);
    const [analysisFeedback, setAnalysisFeedback] = useState<string | null>(null);

    const handlePlanInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setPlanForm({ ...planForm, [e.target.name]: e.target.value });
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAnalysisImage({
                    base64: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                    name: file.name,
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePlanSubmit = async () => {
        const cost = TOKEN_COSTS.CAMPAIGN_PLAN;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens'));
            return;
        }

        setIsLoadingPlan(true);
        setError(null);
        setCampaignPlan(null);
        try {
            const result = await generateCampaignPlan(planForm);
            setCampaignPlan(result);
            updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) {
            setError(err.message || t('trafficPlanError'));
        } finally {
            setIsLoadingPlan(false);
        }
    };

    const handleAnalysisSubmit = async () => {
        if (!analysisImage) {
            setError(t('trafficAnalysisError'));
            return;
        }

        const cost = TOKEN_COSTS.PERFORMANCE_ANALYSIS;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens'));
            return;
        }

        setIsLoadingAnalysis(true);
        setError(null);
        setAnalysisFeedback(null);
        try {
            const result = await analyzeCampaignPerformance(analysisImage);
            setAnalysisFeedback(result);
            updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) {
            setError(err.message || t('trafficAnalysisImageError'));
        } finally {
            setIsLoadingAnalysis(false);
        }
    };
    
    const ResultSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h3 className="flex items-center text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-2">
                <span className="mr-3">{icon}</span>
                {title}
            </h3>
            <div className="text-brand-subtle space-y-2 pl-10">{children}</div>
        </div>
    );

    const planButtonText = currentUser?.isAdmin
        ? t('generatePlanButton')
        : `${t('generatePlanButton')} (${TOKEN_COSTS.CAMPAIGN_PLAN} ${t('tokens')})`;
    
    const analysisButtonText = currentUser?.isAdmin
        ? t('analyzePerformanceButton')
        : `${t('analyzePerformanceButton')} (${TOKEN_COSTS.PERFORMANCE_ANALYSIS} ${t('tokens')})`;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-text mb-4 animate-fade-in">{t('trafficManagerTitle')}</h1>
                <p className="text-lg text-brand-subtle animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {t('trafficManagerSubtitle')}
                </p>
            </div>

            {/* Campaign Planner */}
            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6 mb-8">
                <h2 className="text-2xl font-bold text-brand-text">{t('planCampaignTitle')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-brand-subtle mb-2">{t('productServiceLabel')}</label>
                        <textarea name="productService" value={planForm.productService} onChange={handlePlanInputChange} rows={3} placeholder={t('productServicePlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-subtle mb-2">{t('targetAudienceLabel')}</label>
                        <textarea name="targetAudience" value={planForm.targetAudience} onChange={handlePlanInputChange} rows={3} placeholder={t('targetAudiencePlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-subtle mb-2">{t('mainObjectiveLabel')}</label>
                        <select name="objective" value={planForm.objective} onChange={handlePlanInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text">
                            <option>{t('objectiveSales')}</option>
                            <option>{t('objectiveLeads')}</option>
                            <option>{t('objectiveEngagement')}</option>
                            <option>{t('objectiveBrandAwareness')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-subtle mb-2">{t('budgetLabel')}</label>
                        <input type="text" name="budget" value={planForm.budget} onChange={handlePlanInputChange} placeholder={t('budgetPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-subtle mb-2">{t('platformLabel')}</label>
                        <select name="platform" value={planForm.platform} onChange={handlePlanInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text">
                            <option>Meta (Facebook/Instagram)</option>
                            <option>TikTok</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-subtle mb-2">{t('abTestLabel')}</label>
                        <input type="text" name="abTestRequest" value={planForm.abTestRequest} onChange={handlePlanInputChange} placeholder={t('abTestPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                    </div>
                </div>
                 <button onClick={handlePlanSubmit} disabled={isLoadingPlan} className="w-full py-3 mt-4 text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-md hover:opacity-90 disabled:bg-slate-700">
                    {isLoadingPlan ? t('generatingPlan') : planButtonText}
                </button>
            </div>
            
            {campaignPlan && (
                <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6 my-8 animate-fade-in">
                    <h2 className="text-2xl font-bold text-center text-brand-text mb-4">{t('strategicCampaignPlan')}</h2>
                    <ResultSection title={t('detailedAudience')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}>
                        <p className="font-semibold">{campaignPlan.targetAudience.description}</p>
                        <p className="text-sm whitespace-pre-wrap">{campaignPlan.targetAudience.details}</p>
                    </ResultSection>
                     <ResultSection title={t('campaignStructure')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}>
                        <p><span className="font-semibold">{t('objective')}:</span> {campaignPlan.campaignStructure.objective}</p>
                        <p className="text-sm whitespace-pre-wrap">{campaignPlan.campaignStructure.setup}</p>
                    </ResultSection>
                    <ResultSection title={t('creativesAndCopy')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}>
                        <p className="font-semibold">{campaignPlan.creativesAndCopy.guidelines}</p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                           {campaignPlan.creativesAndCopy.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </ResultSection>
                     <ResultSection title={t('abTestPlan')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v4.517a1 1 0 00.707.955l2.886 1.442A1 1 0 0120 12v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5a1 1 0 01.293-.707l2.886-1.442A1 1 0 008 10.483V5L7 4z" /></svg>}>
                        <p><span className="font-semibold">{t('hypothesis')}:</span> {campaignPlan.abTestPlan.hypothesis}</p>
                        <p className="text-sm whitespace-pre-wrap">{campaignPlan.abTestPlan.implementation}</p>
                    </ResultSection>
                     <ResultSection title={t('implementationGuide')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014A8.003 8.003 0 0122 12c0 3-1 7-7 7a6.065 6.065 0 01-7.343-2.343" /></svg>}>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                             {campaignPlan.stepByStepGuide.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>
                    </ResultSection>
                </div>
            )}


            {/* Campaign Optimizer */}
            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6">
                 <h2 className="text-2xl font-bold text-brand-text">{t('optimizeCampaignTitle')}</h2>
                 <div>
                    <label className="block text-sm font-medium text-brand-subtle mb-2">{t('uploadScreenshotLabel')}</label>
                    <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600 px-6 py-10">
                        <div className="text-center">
                             {analysisImage ? (
                                <img src={`data:${analysisImage.mimeType};base64,${analysisImage.base64}`} alt="Preview" className="mx-auto h-24 w-auto rounded-md" />
                            ) : (
                                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                            <div className="mt-4 flex text-sm text-gray-400">
                                <label htmlFor="analytics-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-primary hover:text-brand-secondary"><span>{t('uploadFile')}</span><input id="analytics-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/></label>
                                <p className="pl-1">{t('uploadFileDescription')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button onClick={handleAnalysisSubmit} disabled={isLoadingAnalysis} className="w-full py-3 mt-4 text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-md hover:opacity-90 disabled:bg-slate-700">
                    {isLoadingAnalysis ? t('analyzingScreenshot') : analysisButtonText}
                </button>
            </div>
            
            {analysisFeedback && (
                 <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 my-8 animate-fade-in">
                      <ResultSection title={t('optimizationRecommendations')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}>
                        <p className="whitespace-pre-wrap">{analysisFeedback}</p>
                    </ResultSection>
                 </div>
            )}
            
            {error && <div className="text-center text-red-400 p-4 mt-8 bg-red-900/20 border border-red-500/30 rounded-md">{error}</div>}

        </div>
    );
};

export default TrafficManagerPage;