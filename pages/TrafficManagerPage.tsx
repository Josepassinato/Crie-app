import React, { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { useAppState } from '../contexts/AppStateContext.tsx';
import { TOKEN_COSTS } from '../lib/tokenCosts.ts';
import AccountManager from '../components/AccountManager.tsx';
import HistoryPanel from '../components/HistoryPanel.tsx';
import { CampaignPlan, OrganicContentPlan } from '../types.ts';

const PAID_CHANNELS = [
    { id: 'google', nameKey: 'googleAds', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M5.293 6.707a1 1 0 011.414 0L12 11.001l5.293-5.294a1 1 0 111.414 1.414L13.414 12l5.293 5.293a1 1 0 01-1.414 1.414L12 13.415l-5.293 5.293a1 1 0 01-1.414-1.414L10.586 12 5.293 6.707z" /></svg> },
    { id: 'meta', nameKey: 'metaAds', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 16a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" /></svg> },
    { id: 'tiktok', nameKey: 'tiktokAds', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.525 2.112a.75.75 0 00-1.05 0 11.21 11.21 0 00-2.303 4.672.75.75 0 00.674.928 1.624 1.624 0 011.623 1.623.75.75 0 00.928.674 11.21 11.21 0 004.672-2.303.75.75 0 000-1.05 1.624 1.624 0 01-1.623-1.623.75.75 0 00-.674-.928 11.21 11.21 0 00-2.303-4.672z" /><path d="M12 1.5a10.5 10.5 0 1010.5 10.5A10.512 10.512 0 0012 1.5zm0 19.5a9 9 0 119-9 9.01 9.01 0 01-9 9z" /></svg> },
    { id: 'linkedin', nameKey: 'linkedinAds', icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.5 11.5v5h-3v-5h3zM7 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm6 3v5h3v-2.5c0-1.5-1-2.5-2.5-2.5S13 14 13 15.5V18h-3v-5h2.5v1z" /></svg> },
];


const TrafficManagerPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const { currentUser } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState<'paid' | 'organic'>('paid');
    const {
        trafficPlanForm,
        setTrafficPlanForm,
        trafficAnalysisImage,
        setTrafficAnalysisImage,
        campaignPlan,
        campaignPerformanceFeedback,
        isCampaignPlanLoading,
        isCampaignPerformanceLoading,
        organicGrowthForm,
        setOrganicGrowthForm,
        organicContentPlan,
        isOrganicGrowthLoading,
        error,
        handleCampaignPlanSubmit,
        handleCampaignPerformanceSubmit,
        handleOrganicGrowthSubmit,
        handleChannelToggle,
        contextualPrompt,
        setContextualPrompt,
    } = useAppState();

    useEffect(() => {
        if (contextualPrompt) {
            setTrafficPlanForm(prev => ({
                ...prev,
                objective: `${t('basedOnAnalysis')}:\n"${contextualPrompt}"`
            }));
            setContextualPrompt(null);
        }
    }, [contextualPrompt, setTrafficPlanForm, setContextualPrompt, t]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTrafficAnalysisImage({
                    base64: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                    name: file.name,
                });
            };
            reader.readAsDataURL(file);
        } else {
            setTrafficAnalysisImage(null);
        }
    };

    const ResultSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-brand-primary mb-2">{title}</h3>
            <div className="text-brand-subtle space-y-2">{children}</div>
        </div>
    );
    
    const planButtonText = currentUser?.isAdmin 
        ? t('generateCampaignPlan') 
        : `${t('generateCampaignPlan')} (${TOKEN_COSTS.CAMPAIGN_PLAN} ${t('tokens')})`;
        
    const performanceButtonText = currentUser?.isAdmin
        ? t('analyzePerformance')
        : `${t('analyzePerformance')} (${TOKEN_COSTS.PERFORMANCE_ANALYSIS} ${t('tokens')})`;
        
     const organicButtonText = currentUser?.isAdmin
        ? t('generateContentPlan')
        : `${t('generateContentPlan')} (${TOKEN_COSTS.CAMPAIGN_PLAN} ${t('tokens')})`;

    const renderCampaignPlan = (plan: CampaignPlan) => (
        <div className="space-y-4 animate-fade-in">
            <ResultSection title={t('campaignStructure')}>
                <p><strong>{t('campaignName')}:</strong> {plan.campaignStructure.name}</p>
                <p><strong>{t('campaignObjective')}:</strong> {plan.campaignStructure.objective}</p>
                <p><strong>{t('campaignKPIs')}:</strong> {plan.campaignStructure.kpis}</p>
            </ResultSection>
            <ResultSection title={t('audienceDefinition')}>
                <p><strong>{t('primaryAudience')}:</strong> {plan.audienceDefinition.primary}</p>
                <p><strong>{t('secondaryAudience')}:</strong> {plan.audienceDefinition.secondary}</p>
            </ResultSection>
            <ResultSection title={t('creativesAndCopy')}>
                <p><strong>{t('creativeGuidelines')}:</strong> {plan.creativesAndCopy.guidelines}</p>
                <h4 className="font-semibold pt-2 text-brand-text">{t('postExamples')}</h4>
                {plan.creativesAndCopy.postExamples.map((ex, i) => (
                    <div key={i} className="border-t border-slate-700 pt-2 mt-2">
                        <p><strong>{ex.platform}:</strong> {ex.text}</p>
                        <p className="text-sm text-slate-400"><em>{t('visualIdea')}: {ex.visualIdea}</em></p>
                    </div>
                ))}
            </ResultSection>
        </div>
    );
    
    const renderOrganicPlan = (plan: OrganicContentPlan) => (
        <div className="space-y-4 animate-fade-in">
            <ResultSection title={t('optimizedTitles')}>
                 <ul className="list-disc list-inside space-y-1">{plan.optimizedTitles.map((title, i) => <li key={i}>{title}</li>)}</ul>
            </ResultSection>
             <ResultSection title={t('relatedKeywords')}>
                 <p className="flex flex-wrap gap-2">{plan.relatedKeywords.map((kw, i) => <span key={i} className="bg-slate-700/50 px-2 py-1 rounded-md text-sm">{kw}</span>)}</p>
            </ResultSection>
             <ResultSection title={t('contentOutline')}>
                 <ol className="list-decimal list-inside space-y-1">{plan.contentOutline.map((item, i) => <li key={i}>{item}</li>)}</ol>
            </ResultSection>
             <ResultSection title={t('ctaSuggestions')}>
                <ul className="list-disc list-inside space-y-1">{plan.ctaSuggestions.map((cta, i) => <li key={i}>{cta}</li>)}</ul>
            </ResultSection>
        </div>
    );


    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-text mb-4 animate-fade-in">{t('trafficManagerTitle')}</h1>
                <p className="text-lg text-brand-subtle animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {t('trafficManagerSubtitle')}
                </p>
            </div>
            
            <div className="border-b border-slate-700 mb-8">
                <nav className="-mb-px flex space-x-6 justify-center" aria-label="Tabs">
                    <button onClick={() => setActiveTab('paid')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'paid' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'}`}>{t('paidCampaigns')}</button>
                    <button onClick={() => setActiveTab('organic')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'organic' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'}`}>{t('organicGrowth')}</button>
                </nav>
            </div>


             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <AccountManager showAll={true} />
                    </div>

                   {activeTab === 'paid' && <div className="animate-fade-in space-y-8">
                        <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                            <h2 className="text-xl font-bold text-brand-text mb-4">{t('campaignPlanner')}</h2>
                            <div className="space-y-4">
                               <input value={trafficPlanForm.productService} onChange={e => setTrafficPlanForm(p => ({...p, productService: e.target.value}))} placeholder={t('productService')} className="w-full input-style" />
                               <textarea value={trafficPlanForm.targetAudience} onChange={e => setTrafficPlanForm(p => ({...p, targetAudience: e.target.value}))} placeholder={t('targetAudienceTraffic')} className="w-full input-style" rows={2}></textarea>
                               <textarea value={trafficPlanForm.objective} onChange={e => setTrafficPlanForm(p => ({...p, objective: e.target.value}))} placeholder={t('campaignObjective')} className="w-full input-style" rows={3}></textarea>
                               <input value={trafficPlanForm.budget} onChange={e => setTrafficPlanForm(p => ({...p, budget: e.target.value}))} placeholder={t('budget')} className="w-full input-style" />
                               <input value={trafficPlanForm.duration} onChange={e => setTrafficPlanForm(p => ({...p, duration: e.target.value}))} placeholder={t('duration')} className="w-full input-style" />
                               <div>
                                    <label className="block text-sm font-medium text-brand-subtle mb-2">{t('selectChannels')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {PAID_CHANNELS.map(channel => (
                                            <button 
                                                key={channel.id}
                                                onClick={() => handleChannelToggle(channel.id)}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-md border-2 transition-colors ${trafficPlanForm.channels.includes(channel.id) ? 'bg-brand-primary/10 border-brand-primary' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                                            >
                                                {/* This is a placeholder for actual logos */}
                                                {channel.icon}
                                                <span className="text-sm font-medium">{t(channel.nameKey)}</span>
                                            </button>
                                        ))}
                                    </div>
                               </div>
                            </div>
                             <button onClick={handleCampaignPlanSubmit} disabled={isCampaignPlanLoading} className="w-full mt-6 btn-primary">{isCampaignPlanLoading ? t('generating') : planButtonText}</button>
                        </div>
                        <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                            <h2 className="text-xl font-bold text-brand-text mb-4">{t('performanceAnalysis')}</h2>
                            <p className="text-sm text-brand-subtle mb-4">{t('performanceAnalysisDesc')}</p>
                            <div className="mt-2 flex items-center gap-x-3">
                                {trafficAnalysisImage ? (
                                    <img src={`data:${trafficAnalysisImage.mimeType};base64,${trafficAnalysisImage.base64}`} alt="Ads Manager Preview" className="h-20 w-auto rounded-md bg-slate-700 object-contain" />
                                ) : (
                                   <svg className="h-20 w-20 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
                                )}
                                <label htmlFor="analytics-image-upload" className="rounded-md bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-brand-subtle shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-700">
                                   <span>{trafficAnalysisImage ? t('change') : t('upload')}</span>
                                   <input id="analytics-image-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
                                </label>
                            </div>
                            <button onClick={handleCampaignPerformanceSubmit} disabled={isCampaignPerformanceLoading || !trafficAnalysisImage} className="w-full mt-6 btn-primary">{isCampaignPerformanceLoading ? t('analyzing') : performanceButtonText}</button>
                        </div>
                    </div>}
                    
                    {activeTab === 'organic' && <div className="animate-fade-in space-y-8">
                        <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                             <h2 className="text-xl font-bold text-brand-text mb-4">{t('seoContentPlanner')}</h2>
                             <div className="space-y-4">
                                 <input value={organicGrowthForm.mainKeyword} onChange={e => setOrganicGrowthForm(p => ({...p, mainKeyword: e.target.value}))} placeholder={t('mainKeywordPlaceholder')} className="w-full input-style" />
                                 <input value={organicGrowthForm.targetAudience} onChange={e => setOrganicGrowthForm(p => ({...p, targetAudience: e.target.value}))} placeholder={t('targetAudienceTraffic')} className="w-full input-style" />
                                 <div>
                                     <label className="block text-sm font-medium text-brand-subtle mb-2">{t('contentFormatLabel')}</label>
                                     <select value={organicGrowthForm.contentFormat} onChange={e => setOrganicGrowthForm(p => ({...p, contentFormat: e.target.value as any}))} className="w-full input-style">
                                         <option value="blog">{t('contentFormatBlog')}</option>
                                         <option value="youtube">{t('contentFormatYoutube')}</option>
                                         <option value="instagram">{t('contentFormatInstagram')}</option>
                                         <option value="tiktok">{t('contentFormatTiktok')}</option>
                                     </select>
                                 </div>
                             </div>
                             <button onClick={handleOrganicGrowthSubmit} disabled={isOrganicGrowthLoading} className="w-full mt-6 btn-primary">{isOrganicGrowthLoading ? t('generating') : organicButtonText}</button>
                        </div>
                    </div>}
                </div>

                {/* Right Column: Outputs */}
                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 min-h-[400px] flex flex-col">
                        <h2 className="text-xl font-bold text-brand-text mb-4">{t('results')}</h2>
                        <div className="flex-grow">
                             {isCampaignPlanLoading || isCampaignPerformanceLoading || isOrganicGrowthLoading ? (
                                 <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
                                    <p className="text-lg text-brand-subtle">{isCampaignPlanLoading ? t('generatingPlan') : (isOrganicGrowthLoading ? t('generatingContentPlan') : t('analyzingPerformance'))}</p>
                                </div>
                             ) : error ? (
                                 <div className="text-center text-red-400 p-4 bg-red-900/20 border border-red-500/30 rounded-md">{error}</div>
                             ) : activeTab === 'paid' && campaignPlan ? (
                                renderCampaignPlan(campaignPlan)
                             ) : activeTab === 'paid' && campaignPerformanceFeedback ? (
                                 <div className="whitespace-pre-wrap font-mono text-sm p-4 bg-slate-900/50 rounded-md border border-slate-700">{campaignPerformanceFeedback}</div>
                             ) : activeTab === 'organic' && organicContentPlan ? (
                                renderOrganicPlan(organicContentPlan)
                             ) : (
                                <div className="text-center text-brand-subtle h-full flex flex-col justify-center items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2a4 4 0 00-4-4H3V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                    <p>{t('trafficResultsPlaceholder')}</p>
                                </div>
                             )}
                        </div>
                    </div>
                     <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <HistoryPanel 
                           onSelectHistoryItem={(item) => {
                             // Handle history selection if needed
                           }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrafficManagerPage;