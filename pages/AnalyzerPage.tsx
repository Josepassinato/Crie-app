import React, { useContext } from 'react';
import { AnalysisResult, UploadedImage, AppPage } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';
import AccountManager from '../components/AccountManager';
import HistoryPanel from '../components/HistoryPanel';
import { useAppState } from '../contexts/AppStateContext';

const AnalyzerPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const { currentUser } = useContext(AuthContext);
    const {
        analyzerFormState, setAnalyzerFormState,
        analysisResult,
        isAnalyzerLoading,
        error,
        handleProfileAnalysisSubmit,
        setContextualPrompt,
        setActivePage,
    } = useAppState();

    const handleFeedImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const fileArray = Array.from(files).slice(0, 5);
            const newImages: UploadedImage[] = [];
            if (fileArray.length === 0) {
                setAnalyzerFormState(prev => ({ ...prev, feedImages: [] }));
                return;
            }
            fileArray.forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newImages.push({
                        base64: (reader.result as string).split(',')[1],
                        mimeType: file.type,
                        name: file.name,
                    });
                    if (newImages.length === fileArray.length) {
                        setAnalyzerFormState(prev => ({ ...prev, feedImages: newImages }));
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeFeedImage = (index: number) => {
        setAnalyzerFormState(prev => ({
            ...prev,
            feedImages: prev.feedImages.filter((_, i) => i !== index)
        }));
    };

    const handleAnalyticsImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAnalyzerFormState(prev => ({
                    ...prev,
                    analyticsImage: {
                        base64: (reader.result as string).split(',')[1],
                        mimeType: file.type,
                        name: file.name,
                    }
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setAnalyzerFormState(prev => ({ ...prev, analyticsImage: null }));
        }
    };
    
    const handleUseRecommendation = (recommendation: string, page: AppPage) => {
        setContextualPrompt(recommendation);
        setActivePage(page);
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
    
    const analyzeButtonText = currentUser?.isAdmin 
        ? t('analyze') 
        : `${t('analyze')} (${TOKEN_COSTS.PROFILE_ANALYSIS} ${t('tokens')})`;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-text mb-4 animate-fade-in">{t('analyzerTitle')}</h1>
                <p className="text-lg text-brand-subtle animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {t('analyzerSubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                     <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6">
                        <div className="bg-blue-900/20 border border-blue-500/30 text-blue-200 px-4 py-3 rounded-lg relative" role="alert">
                            <div className="flex">
                                <div className="py-1">
                                    <svg className="fill-current h-6 w-6 text-blue-400 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 11v4h2v-4H9zm0-4h2v2H9V7z"/></svg>
                                </div>
                                <div>
                                    <p className="font-bold">{t('proTipTitle')}</p>
                                    <p className="text-sm">{t('proTipDescription')}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="profileUrl" className="block text-sm font-medium text-brand-subtle mb-2">{t('profileUrlLabel')}</label>
                            <input
                                type="url"
                                name="profileUrl"
                                id="profileUrl"
                                value={analyzerFormState.profileUrl}
                                onChange={(e) => setAnalyzerFormState(prev => ({ ...prev, profileUrl: e.target.value }))}
                                placeholder={t('profileUrlPlaceholder')}
                                className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                            />
                        </div>

                        {/* Feed Screenshots Upload */}
                        <div>
                             <label className="block text-sm font-medium text-brand-subtle mb-2">{t('feedScreenshotsLabel')}</label>
                             <p className="text-xs text-slate-500 -mt-1 mb-3">{t('feedScreenshotsDescription')}</p>
                             <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600 px-6 py-10">
                                <div className="text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="mt-4 flex text-sm text-gray-400">
                                        <label htmlFor="feed-images-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-primary hover:text-brand-secondary"><span>{t('uploadFile')}</span><input id="feed-images-upload" type="file" className="sr-only" onChange={handleFeedImagesChange} accept="image/*" multiple/></label>
                                        <p className="pl-1">{t('uploadFileDescription')}</p>
                                    </div>
                                </div>
                            </div>
                            {analyzerFormState.feedImages.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                                    {analyzerFormState.feedImages.map((image, index) => (
                                        <div key={index} className="relative group">
                                            <img src={`data:${image.mimeType};base64,${image.base64}`} alt={`Feed preview ${index + 1}`} className="h-24 w-full object-cover rounded-md" />
                                            <button onClick={() => removeFeedImage(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Analytics Screenshot Upload */}
                        <div>
                             <label className="block text-sm font-medium text-brand-subtle mb-2">{t('analyticsScreenshotLabel')}</label>
                              <p className="text-xs text-slate-500 -mt-1 mb-3">{t('analyticsScreenshotDescription')}</p>
                             <div className="mt-2 flex items-center gap-x-3">
                                {analyzerFormState.analyticsImage ? (
                                    <img src={`data:${analyzerFormState.analyticsImage.mimeType};base64,${analyzerFormState.analyticsImage.base64}`} alt="Analytics Preview" className="h-16 w-auto rounded-md bg-slate-700 object-contain" />
                                ) : (
                                    <svg className="h-16 w-16 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
                                )}
                                <label htmlFor="analytics-image-upload" className="rounded-md bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-brand-subtle shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-700">
                                   <span>{analyzerFormState.analyticsImage ? t('changeLogo') : t('uploadFile')}</span>
                                   <input id="analytics-image-upload" type="file" className="sr-only" onChange={handleAnalyticsImageChange} accept="image/*"/>
                                </label>
                            </div>
                        </div>


                        <button
                            onClick={handleProfileAnalysisSubmit}
                            disabled={isAnalyzerLoading}
                            className="w-full py-3 px-8 mt-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-brand-bg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isAnalyzerLoading ? t('analyzing') : analyzeButtonText}
                        </button>
                    </div>
                     <div className="mt-8">
                        {isAnalyzerLoading && (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
                                <p className="text-lg text-brand-subtle">{t('analyzerSpinnerMessage')}</p>
                                <p className="text-sm text-slate-500">{t('spinnerSubtext')}</p>
                            </div>
                        )}
                        {error && <div className="text-center text-red-400 p-4 bg-red-900/20 border border-red-500/30 rounded-md">{error}</div>}
                        {analysisResult && (
                            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-center text-brand-text mb-4">{t('strategicReport')}</h2>
                                <ResultSection title={t('performanceSummary')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}>
                                    <p>{analysisResult.performanceSummary}</p>
                                </ResultSection>
                                <ResultSection title={t('audienceProfile')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}>
                                    <p>{analysisResult.audienceProfile}</p>
                                </ResultSection>
                                <ResultSection title={t('brandArchetype')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}>
                                    <p>{analysisResult.brandArchetype}</p>
                                </ResultSection>
                                <ResultSection title={t('strategicRecommendations')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}>
                                    <div className="space-y-4">
                                        {analysisResult.strategicRecommendations.map((rec, index) => (
                                            <div key={index} className="border-t border-slate-700/50 pt-3 space-y-3">
                                                <p>{rec}</p>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => handleUseRecommendation(rec, 'creator')}
                                                        className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-900/50 hover:bg-cyan-900/80 rounded-full transition-colors flex items-center gap-1.5"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                                                        {t('useForContent')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUseRecommendation(rec, 'trafficManager')}
                                                        className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-900/50 hover:bg-amber-900/80 rounded-full transition-colors flex items-center gap-1.5"
                                                    >
                                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                        {t('useForCampaign')}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ResultSection>
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <AccountManager showAll={true} />
                    </div>
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <HistoryPanel 
                           onSelectHistoryItem={(item) => {
                             if (item.type === 'analysis') {
                                // This needs to be handled in context now, maybe by setting active result
                             }
                           }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyzerPage;
