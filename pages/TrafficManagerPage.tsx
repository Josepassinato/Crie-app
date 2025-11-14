import React, { useState, useContext, useCallback, useRef } from 'react';
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { TrafficPlanForm, UploadedImage, OrganicGrowthForm, CampaignPlan, CampaignPerformanceAnalysisResult, OrganicContentPlan, GeneratedHistoryItem } from '../types.ts';
import { TOKEN_COSTS } from '../lib/tokenCosts.ts';
import AccountManager from '../components/AccountManager.tsx';
import HistoryPanel from '../components/HistoryPanel.tsx';

const TrafficManagerPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const appState = useContext(AppStateContext);

    const [activeTab, setActiveTab] = useState<'planner' | 'performance' | 'organic'>('planner');
    const adsFileInputRef = React.useRef<HTMLInputElement>(null);

    if (!appState) return null; // Guard clause while context initializes
    const {
        trafficPlanForm, setTrafficPlanForm,
        trafficAnalysisImage, setTrafficAnalysisImage,
        campaignPlan, setCampaignPlan,
        campaignPerformanceFeedback, setCampaignPerformanceFeedback,
        isCampaignPlanLoading, isCampaignPerformanceLoading,
        organicGrowthForm, setOrganicGrowthForm,
        organicContentPlan, setOrganicContentPlan,
        isOrganicGrowthLoading,
        handleCampaignPlanSubmit, handleCampaignPerformanceSubmit, handleOrganicGrowthSubmit,
        handleChannelToggle, error, handleError,
    } = appState;


    const updateTrafficForm = useCallback((field: keyof TrafficPlanForm, value: any) => {
        setTrafficPlanForm(prev => ({ ...prev, [field]: value }));
    }, [setTrafficPlanForm]);

    const updateOrganicForm = useCallback((field: keyof OrganicGrowthForm, value: any) => {
        setOrganicGrowthForm(prev => ({ ...prev, [field]: value }));
    }, [setOrganicGrowthForm]);

    const handleAdsImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setTrafficAnalysisImage({
                    base64: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                    name: file.name,
                });
            }
        };
        // FIX: Correctly handle FileReader errors by creating a new Error object.
        reader.onerror = () => {
            const error = new Error(reader.error?.message || "File could not be read");
            console.error("Error uploading ads image:", reader.error);
            handleError(error, 'uploadAdsImageError');
        };
        reader.readAsDataURL(file);
        if (event.target) {
            event.target.value = '';
        }
    };

    const removeAdsImage = useCallback(() => {
        setTrafficAnalysisImage(null);
    }, [setTrafficAnalysisImage]);

    const handleSelectHistoryItem = (item: GeneratedHistoryItem) => {
        if (item.type === 'campaignPlan') {
            setCampaignPlan(item.data as CampaignPlan);
            setActiveTab('planner');
        } else if (item.type === 'performanceFeedback') {
            setCampaignPerformanceFeedback(item.data as CampaignPerformanceAnalysisResult);
            setActiveTab('performance');
        } else if (item.type === 'organicContentPlan') {
            setOrganicContentPlan(item.data as OrganicContentPlan);
            setActiveTab('organic');
        }
        // Clear other results to focus on the selected history item
        if (item.type !== 'campaignPlan') setCampaignPlan(null);
        if (item.type !== 'performanceFeedback') setCampaignPerformanceFeedback(null);
        if (item.type !== 'organicContentPlan') setOrganicContentPlan(null);
    };

    const isAnyLoading = isCampaignPlanLoading || isCampaignPerformanceLoading || isOrganicGrowthLoading;

    const renderCampaignPlanner = () => (
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700">
            <h2 className="text-xl font-bold text-brand-text mb-6">{t('campaignPlannerTitle')}</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="productService" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('productServiceLabel')}
                    </label>
                    <input
                        type="text"
                        id="productService"
                        value={trafficPlanForm.productService}
                        onChange={(e) => updateTrafficForm('productService', e.target.value)}
                        placeholder={t('productServicePlaceholder')}
                        className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                    />
                </div>
                <div>
                    <label htmlFor="targetAudience" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('targetAudienceForCampaignLabel')}
                    </label>
                    <input
                        type="text"
                        id="targetAudience"
                        value={trafficPlanForm.targetAudience}
                        onChange={(e) => updateTrafficForm('targetAudience', e.target.value)}
                        placeholder={t('targetAudienceForCampaignPlaceholder')}
                        className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                    />
                </div>
                <div>
                    <label htmlFor="objective" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('objectiveLabel')}
                    </label>
                    <input
                        type="text"
                        id="objective"
                        value={trafficPlanForm.objective}
                        onChange={(e) => updateTrafficForm('objective', e.target.value)}
                        placeholder={t('objectivePlaceholder')}
                        className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-brand-subtle mb-2">
                            {t('budgetLabel')}
                        </label>
                        <input
                            type="text"
                            id="budget"
                            value={trafficPlanForm.budget}
                            onChange={(e) => updateTrafficForm('budget', e.target.value)}
                            placeholder={t('budgetPlaceholder')}
                            className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-brand-subtle mb-2">
                            {t('durationLabel')}
                        </label>
                        <input
                            type="text"
                            id="duration"
                            value={trafficPlanForm.duration}
                            onChange={(e) => updateTrafficForm('duration', e.target.value)}
                            placeholder={t('durationPlaceholder')}
                            className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('channelsLabel')}
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {['Meta', 'Google', 'TikTok', 'LinkedIn'].map(channel => (
                            <button
                                key={channel}
                                type="button"
                                onClick={() => handleChannelToggle(channel)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    trafficPlanForm.channels.includes(channel)
                                        ? 'bg-brand-secondary text-white shadow-md'
                                        : 'bg-slate-700/50 text-brand-subtle hover:bg-slate-700'
                                }`}
                            >
                                {t(`channels${channel}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleCampaignPlanSubmit}
                    disabled={isCampaignPlanLoading || !trafficPlanForm.productService || !trafficPlanForm.objective || trafficPlanForm.channels.length === 0}
                    className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    {isCampaignPlanLoading ? t('campaignPlanGenerating') : t('generatePlan')} ({TOKEN_COSTS.CAMPAIGN_PLAN} {t('tokens')})
                </button>
            </div>
            {campaignPlan && (
                <div className="mt-8 pt-8 border-t border-slate-700 animate-fade-in">
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-4">{t('campaignPlanTitle')}</h3>
                    <div className="bg-slate-900/50 p-4 rounded-md text-brand-subtle text-sm border border-slate-700 font-mono space-y-4">
                        <p><strong>{t('campaignStructure')}:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><strong>{t('campaignStructureName')}:</strong> {campaignPlan.campaignStructure.name}</li>
                            <li><strong>{t('campaignStructureObjective')}:</strong> {campaignPlan.campaignStructure.objective}</li>
                            <li><strong>{t('campaignStructureKpis')}:</strong> {campaignPlan.campaignStructure.kpis}</li>
                        </ul>
                        <p><strong>{t('audienceDefinition')}:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><strong>{t('audiencePrimary')}:</strong> {campaignPlan.audienceDefinition.primary}</li>
                            {campaignPlan.audienceDefinition.secondary && <li><strong>{t('audienceSecondary')}:</strong> {campaignPlan.audienceDefinition.secondary}</li>}
                        </ul>
                        <p><strong>{t('creativesAndCopy')}:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li><strong>{t('creativesGuidelines')}:</strong> {campaignPlan.creativesAndCopy.guidelines}</li>
                            <li><strong>{t('creativesPostExamples')}:</strong>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    {campaignPlan.creativesAndCopy.postExamples.map((example, idx) => (
                                        <li key={idx}>
                                            <strong>{example.platform}:</strong> "{example.text}" (Visual: {example.visualIdea})
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );

    const renderCampaignPerformance = () => (
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700">
            <h2 className="text-xl font-bold text-brand-text mb-6">{t('campaignPerformanceAnalysisTitle')}</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('adsScreenshotLabel')}
                    </label>
                    {trafficAnalysisImage ? (
                        <div className="relative w-32 h-32 mx-auto mb-2 rounded-md overflow-hidden border border-slate-600">
                            <img src={`data:${trafficAnalysisImage.mimeType};base64,${trafficAnalysisImage.base64}`} alt="Ads screenshot" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={removeAdsImage}
                                className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                            >
                                &times;
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                ref={adsFileInputRef}
                                onChange={handleAdsImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => adsFileInputRef.current?.click()}
                                className="w-full py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-brand-subtle bg-slate-700/50 hover:bg-slate-700 transition-colors"
                            >
                                {t('uploadAdsScreenshot')}
                            </button>
                        </>
                    )}
                </div>
                <button
                    onClick={handleCampaignPerformanceSubmit}
                    disabled={isCampaignPerformanceLoading || !trafficAnalysisImage}
                    className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    {isCampaignPerformanceLoading ? t('analyzingPerformance') : t('startPerformanceAnalysis')} ({TOKEN_COSTS.PERFORMANCE_ANALYSIS} {t('tokens')})
                </button>
            </div>
            {campaignPerformanceFeedback && (
                <div className="mt-8 pt-8 border-t border-slate-700 animate-fade-in">
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-4">{t('performanceSummary')}</h3>
                    <div className="bg-slate-900/50 p-4 rounded-md text-brand-subtle text-sm border border-slate-700 font-mono space-y-4">
                        <p>{campaignPerformanceFeedback.performanceSummary}</p>
                        <p className="font-bold text-brand-text">{t('stepByStepGuide')}:</p>
                        <ol className="list-decimal list-inside ml-4 space-y-1">
                            {campaignPerformanceFeedback.stepByStepGuide.map((step, idx) => (
                                <li key={idx}>{step}</li>
                            ))}
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );

    const renderOrganicGrowthPlanner = () => (
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700">
            <h2 className="text-xl font-bold text-brand-text mb-6">{t('organicGrowthPlannerTitle')}</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="mainKeyword" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('mainKeywordLabel')}
                    </label>
                    <input
                        type="text"
                        id="mainKeyword"
                        value={organicGrowthForm.mainKeyword}
                        onChange={(e) => updateOrganicForm('mainKeyword', e.target.value)}
                        placeholder={t('mainKeywordPlaceholder')}
                        className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                    />
                </div>
                <div>
                    <label htmlFor="targetAudienceOrganic" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('targetAudienceForCampaignLabel')}
                    </label>
                    <input
                        type="text"
                        id="targetAudienceOrganic"
                        value={organicGrowthForm.targetAudience}
                        onChange={(e) => updateOrganicForm('targetAudience', e.target.value)}
                        placeholder={t('targetAudienceForCampaignPlaceholder')}
                        className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                    />
                </div>
                <div>
                    <label htmlFor="contentFormat" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('contentFormatLabel')}
                    </label>
                    <select
                        id="contentFormat"
                        value={organicGrowthForm.contentFormat}
                        onChange={(e) => updateOrganicForm('contentFormat', e.target.value as OrganicGrowthForm['contentFormat'])}
                        className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text"
                    >
                        <option value="blog">{t('contentFormatBlog')}</option>
                        <option value="youtube">{t('contentFormatYoutube')}</option>
                        <option value="instagram">{t('contentFormatInstagram')}</option>
                        <option value="tiktok">{t('contentFormatTiktok')}</option>
                    </select>
                </div>
                <button
                    onClick={handleOrganicGrowthSubmit}
                    disabled={isOrganicGrowthLoading || !organicGrowthForm.mainKeyword || !organicGrowthForm.targetAudience}
                    className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                    {isOrganicGrowthLoading ? t('organicPlanGenerating') : t('generateOrganicPlan')} ({TOKEN_COSTS.CAMPAIGN_PLAN} {t('tokens')}) {/* Reusing TOKEN_COSTS.CAMPAIGN_PLAN as a placeholder for now */}
                </button>
            </div>
            {organicContentPlan && (
                <div className="mt-8 pt-8 border-t border-slate-700 animate-fade-in">
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-4">{t('organicContentPlanTitle')}</h3>
                    <div className="bg-slate-900/50 p-4 rounded-md text-brand-subtle text-sm border border-slate-700 font-mono space-y-4">
                        <p><strong>{t('optimizedTitles')}:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            {organicContentPlan.optimizedTitles.map((title, idx) => (
                                <li key={idx}>{title}</li>
                            ))}
                        </ul>
                        <p><strong>{t('relatedKeywords')}:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            {organicContentPlan.relatedKeywords.map((keyword, idx) => (
                                <li key={idx}>{keyword}</li>
                            ))}
                        </ul>
                        <p><strong>{t('contentOutline')}:</strong></p>
                        <ol className="list-decimal list-inside ml-4 space-y-1">
                            {organicContentPlan.contentOutline.map((point, idx) => (
                                <li key={idx}>{point}</li>
                            ))}
                        </ol>
                        <p><strong>{t('ctaSuggestions')}:</strong></p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            {organicContentPlan.ctaSuggestions.map((cta, idx) => (
                                <li key={idx}>{cta}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        if (isAnyLoading) {
            const message = isCampaignPlanLoading ? t('campaignPlanGenerating') : (isCampaignPerformanceLoading ? t('analyzingPerformanceMessage') : t('organicPlanGenerating'));
            const subtext = isCampaignPlanLoading ? t('campaignPlanSubtext') : (isCampaignPerformanceLoading ? t('analyzingPerformanceSubtext') : t('organicPlanSubtext'));
            return (
                <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-brand-primary opacity-75"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <svg className="h-10 w-10 text-brand-secondary animate-bounce-subtle" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 13v-2H6v2H8zm6-2v2h-2v-2h2zm-3-5v6h-2V6h2zm-3 0v6H6V6h2zM15 6h-2v6h2V6zM5 6v6H3V6h2z" /></svg>
                        </div>
                    </div>
                    <p className="text-xl font-semibold text-brand-light-text animate-pulse">{message}</p>
                    <p className="text-sm text-brand-subtle">{subtext}</p>
                </div>
            );
        }
        if (error) {
            return <div className="text-center text-brand-error p-4 bg-red-900/20 border border-red-500/30 rounded-md animate-pop-in">{t(error)}</div>;
        }
        // If results exist, prioritize displaying them based on activeTab
        if (activeTab === 'planner' && campaignPlan) return renderCampaignPlanner();
        if (activeTab === 'performance' && campaignPerformanceFeedback) return renderCampaignPerformance();
        if (activeTab === 'organic' && organicContentPlan) return renderOrganicGrowthPlanner();

        // Default placeholder if no results and not loading/error
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-brand-subtle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2zM12 10a1 1 0 100-2 1 1 0 000 2z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 14c-1.657 0-3 .895-3 2v1h6v-1c0-1.105-1.343-2-3-2z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 11.171V15a2 2 0 002 2h10a2 2 0 002-2v-3.829a2 2 0 00-.586-1.414l-2.828-2.829A2 2 0 0013.172 6H10.828a2 2 0 00-1.414.586L6.586 9.757A2 2 0 006 11.171z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 10h-2m-3 0H7m-3 0h-.01" />
                </svg>
                <h3 className="text-xl font-semibold text-brand-text">{t('campaignPlannerTitle')}</h3>
                <p className="mt-1">{t('placeholderSubtitle')}</p>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="border-b border-slate-700 mb-6">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('planner')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg transition-colors ${
                                activeTab === 'planner'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'
                            }`}
                        >
                            {t('campaignPlannerTitle')}
                        </button>
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg transition-colors ${
                                activeTab === 'performance'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'
                            }`}
                        >
                            {t('campaignPerformanceAnalysisTitle')}
                        </button>
                         <button
                            onClick={() => setActiveTab('organic')}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-lg transition-colors ${
                                activeTab === 'organic'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'
                            }`}
                        >
                            {t('organicGrowthPlannerTitle')}
                        </button>
                    </nav>
                </div>
                {activeTab === 'planner' && renderCampaignPlanner()}
                {activeTab === 'performance' && renderCampaignPerformance()}
                {activeTab === 'organic' && renderOrganicGrowthPlanner()}
            </div>

            <div className="lg:col-span-1 space-y-8">
                <AccountManager />
                <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 min-h-[500px] flex flex-col justify-center relative overflow-hidden">
                    {renderContent()}
                </div>
                <HistoryPanel onSelectHistoryItem={handleSelectHistoryItem} />
            </div>
        </div>
    );
};

export default TrafficManagerPage;