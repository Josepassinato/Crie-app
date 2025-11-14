import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
// Reverted: Incorrect import path.
// FIX: Corrected import path for AppStateContext.
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { AnalyzerFormData, AnalysisResult, UploadedImage, GeneratedHistoryItem, HolisticStrategyResult, PerformanceReport } from '../types.ts';
import { TOKEN_COSTS } from '../lib/tokenCosts.ts';
import AccountManager from '../components/AccountManager.tsx';
import HistoryPanel from '../components/HistoryPanel.tsx';
// FIX: Import AccountsContext to correctly source account-related state.
import { AccountsContext } from '../contexts/AccountsContext.tsx';

const AnalyzerPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const appState = useContext(AppStateContext);
    const { selectedAccountId } = useContext(AccountsContext);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const analyticsFileInputRef = useRef<HTMLInputElement>(null);

    if (!appState) return null; // Guard clause while context initializes
    const {
        analyzerFormState, setAnalyzerFormState,
        analysisResult, setAnalysisResult,
        isAnalyzerLoading, error, handleError,
        handleProfileAnalysisSubmit,
        strategyResult, setStrategyResult,
        performanceReport, setPerformanceReport,
        isStrategyLoading, isPerformanceReportLoading,
        handleStrategySubmit, handlePerformanceReportSubmit,
    } = appState;


    const updateForm = useCallback((field: keyof AnalyzerFormData, value: any) => {
        setAnalyzerFormState(prev => ({ ...prev, [field]: value }));
    }, [setAnalyzerFormState]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, field: 'feedImages' | 'analyticsImage') => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const processFile = (file: File): Promise<UploadedImage> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        resolve({
                            base64: (reader.result as string).split(',')[1],
                            mimeType: file.type,
                            name: file.name,
                        });
                    } else {
                        // FIX: Reject with a proper Error object instead of a string.
                        reject(new Error('Failed to read file'));
                    }
                };
                // FIX: Reject with a proper Error object for more specific error handling.
                reader.onerror = () => reject(new Error(reader.error?.message || 'File could not be read'));
                reader.readAsDataURL(file);
            });
        };

        if (field === 'feedImages') {
            // FIX: Add explicit type `File` to the map callback parameter to resolve inference issue.
            const uploadedPromises = Array.from(files).map((file: File) => processFile(file));
            Promise.all(uploadedPromises)
                .then(images => updateForm('feedImages', [...analyzerFormState.feedImages, ...images]))
                .catch((err: unknown) => {
                    console.error("Error uploading feed images:", err);
                    // Reverted: Passing a potentially non-Error object to the handler.
                    // FIX: Ensure that an actual Error object is passed to the error handler.
                    handleError(err instanceof Error ? err : new Error(String(err)), 'uploadFeedImagesError');
                });
        } else { // analyticsImage
            processFile(files[0])
                .then(image => updateForm('analyticsImage', image))
                .catch((err: unknown) => {
                    console.error("Error uploading analytics image:", err);
                     // Reverted: Passing a potentially non-Error object to the handler.
                     // FIX: Ensure that an actual Error object is passed to the error handler.
                    handleError(err instanceof Error ? err : new Error(String(err)), 'uploadAnalyticsImageError');
                });
        }
        if (event.target) {
            event.target.value = ''; // Clear input for next upload
        }
    };

    const removeFeedImage = useCallback((index: number) => {
        setAnalyzerFormState(prev => ({
            ...prev,
            feedImages: prev.feedImages.filter((_, i) => i !== index),
        }));
    }, [setAnalyzerFormState]);

    const removeAnalyticsImage = useCallback(() => {
        setAnalyzerFormState(prev => ({
            ...prev,
            analyticsImage: null,
        }));
    }, [setAnalyzerFormState]);

    const handleSelectHistoryItem = (item: GeneratedHistoryItem) => {
        if (item.type === 'analysis') {
            setAnalysisResult(item.data as AnalysisResult);
        } else if (item.type === 'holisticStrategy') {
            setStrategyResult(item.data as HolisticStrategyResult);
        } else if (item.type === 'performanceReport') {
            setPerformanceReport(item.data as PerformanceReport);
        }
        // Also clear other results to focus on the selected history item
        if (item.type !== 'analysis') setAnalysisResult(null);
        if (item.type !== 'holisticStrategy') setStrategyResult(null);
        if (item.type !== 'performanceReport') setPerformanceReport(null);
    };

    const renderAnalysisResult = () => {
        if (!analysisResult) return null;
        return (
            <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('analysisSummary')}</h3>
                <div className="bg-brand-soft-bg p-4 rounded-md text-brand-subtle text-sm border border-brand-border font-mono">
                    <p className="mb-4"><strong>{t('performanceSummary')}:</strong> {analysisResult.performanceSummary}</p>
                    <p className="mb-4"><strong>{t('audienceProfile')}:</strong> {analysisResult.audienceProfile}</p>
                    <p className="mb-4"><strong>{t('brandArchetype')}:</strong> {analysisResult.brandArchetype}</p>
                    <strong>{t('strategicRecommendations')}:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        {analysisResult.strategicRecommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    const renderHolisticStrategyResult = () => {
        if (!strategyResult) return null;
        return (
            <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('holisticStrategyTitle')}</h3>
                <div className="bg-brand-soft-bg p-4 rounded-md text-brand-subtle text-sm border border-brand-border font-mono">
                    <p className="mb-4"><strong>{t('overallDiagnosis')}:</strong> {strategyResult.overallDiagnosis}</p>
                    <p className="mb-4"><strong>{t('strategicPillars')}:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1 mb-4">
                        {strategyResult.strategicPillars.map((pillar, index) => (
                            <li key={index}>{pillar}</li>
                        ))}
                    </ul>
                    <p className="mb-4"><strong>{t('actionableRecommendations')}:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1 mb-4">
                        {strategyResult.actionableRecommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                        ))}
                    </ul>
                    <p className="mb-4"><strong>{t('kpisToTrack')}:</strong></p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        {strategyResult.kpisToTrack.map((kpi, index) => (
                            <li key={index}>{kpi}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    const renderPerformanceReport = () => {
        if (!performanceReport) return null;
        return (
            <div className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('performanceReportTitle')}</h3>
                <div className="bg-brand-soft-bg p-4 rounded-md text-brand-subtle text-sm border border-brand-border font-mono">
                    <p className="mb-4"><strong>{t('reportOverview')}:</strong> {performanceReport.quantitativeSummary.reportOverview}</p>
                    <p className="mb-4"><strong>{t('totalPosts')}:</strong> {performanceReport.quantitativeSummary.totalPosts}</p>
                    <p className="mb-4"><strong>{t('totalCampaigns')}:</strong> {performanceReport.quantitativeSummary.totalCampaigns}</p>
                    <p className="mb-4"><strong>{t('totalAnalyses')}:</strong> {performanceReport.quantitativeSummary.totalAnalyses}</p>
                    <p className="mb-4"><strong>{t('growthAnalysis')}:</strong> {performanceReport.growthAnalysis}</p>
                    <p className="mb-4"><strong>{t('engagementTrends')}:</strong> {performanceReport.engagementTrends}</p>
                    <p className="mb-4"><strong>{t('campaignEffectiveness')}:</strong> {performanceReport.campaignEffectiveness}</p>
                    <p className="mb-4"><strong>{t('strategicSummary')}:</strong> {performanceReport.strategicSummary}</p>
                </div>
            </div>
        );
    };

    const isAnyAnalysisLoading = isAnalyzerLoading || isStrategyLoading || isPerformanceReportLoading;
    const isAccountSelected = selectedAccountId && selectedAccountId !== 'new-post';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border">
                    <h2 className="text-xl font-bold text-brand-text mb-6">{t('analyzeProfile')}</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="profileUrl" className="block text-sm font-medium text-brand-subtle mb-2">
                                {t('socialProfileUrl')}
                            </label>
                            <input
                                type="url"
                                id="profileUrl"
                                value={analyzerFormState.profileUrl}
                                onChange={(e) => updateForm('profileUrl', e.target.value)}
                                placeholder={t('profileUrlPlaceholder')}
                                className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-subtle mb-2">
                                {t('feedScreenshots')} ({analyzerFormState.feedImages.length})
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {analyzerFormState.feedImages.map((img, index) => (
                                    <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden border border-brand-border">
                                        <img src={`data:${img.mimeType};base64,${img.base64}`} alt={`Feed screenshot ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeFeedImage(index)}
                                            className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => handleImageUpload(e, 'feedImages')}
                                multiple
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-2 px-4 border border-brand-border rounded-md shadow-sm text-sm font-medium text-brand-subtle bg-brand-soft-bg hover:bg-brand-hover-bg transition-colors"
                            >
                                {t('uploadFeedImages')}
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-subtle mb-2">
                                {t('analyticsScreenshot')}
                            </label>
                            {analyzerFormState.analyticsImage ? (
                                <div className="relative w-32 h-32 mx-auto mb-2 rounded-md overflow-hidden border border-brand-border">
                                    <img src={`data:${analyzerFormState.analyticsImage.mimeType};base64,${analyzerFormState.analyticsImage.base64}`} alt="Analytics screenshot" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={removeAnalyticsImage}
                                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <input
                                        type="file"
                                        ref={analyticsFileInputRef}
                                        onChange={(e) => handleImageUpload(e, 'analyticsImage')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => analyticsFileInputRef.current?.click()}
                                        className="w-full py-2 px-4 border border-brand-border rounded-md shadow-sm text-sm font-medium text-brand-subtle bg-brand-soft-bg hover:bg-brand-hover-bg transition-colors"
                                    >
                                        {t('uploadAnalyticsImage')}
                                    </button>
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleProfileAnalysisSubmit}
                            disabled={isAnalyzerLoading || !analyzerFormState.profileUrl}
                            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        >
                            {isAnalyzerLoading ? t('analyzing') : t('startAnalysis')}
                        </button>
                    </div>
                </div>

                {analysisResult && (
                    <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border">
                        {renderAnalysisResult()}
                        <div className="mt-8 pt-6 border-t border-brand-border space-y-4">
                            <h3 className="text-xl font-bold text-brand-text">{t('nextSteps')}</h3>
                            <button
                                onClick={handleStrategySubmit}
                                disabled={isStrategyLoading || !isAccountSelected || isAnyAnalysisLoading}
                                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                {isStrategyLoading ? t('holisticStrategyGenerating') : t('generateHolisticStrategy')} ({TOKEN_COSTS.STRATEGY_ANALYSIS} {t('tokens')})
                            </button>
                            <button
                                onClick={handlePerformanceReportSubmit}
                                disabled={isPerformanceReportLoading || !isAccountSelected || isAnyAnalysisLoading}
                                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                {isPerformanceReportLoading ? t('performanceReportGenerating') : t('generatePerformanceReport')} ({TOKEN_COSTS.ACCOUNT_PERFORMANCE_ANALYSIS} {t('tokens')})
                            </button>
                            {!isAccountSelected && (
                                <p className="text-sm text-brand-warning mt-2 text-center">{t('selectAccountError')}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-1 space-y-8">
                <AccountManager />
                <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border min-h-[500px] flex flex-col justify-center relative overflow-hidden">
                    {isAnyAnalysisLoading ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-brand-primary opacity-75"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <svg className="h-10 w-10 text-brand-secondary animate-bounce-subtle" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 13v-2H6v2H8zm6-2v2h-2v-2h2zm-3-5v6h-2V6h2zm-3 0v6H6V6h2zM15 6h-2v6h2V6zM5 6v6H3V6h2z" /></svg>
                                </div>
                            </div>
                            <p className="text-xl font-semibold text-brand-text animate-pulse">
                                {isAnalyzerLoading && t('analyzingProfileMessage')}
                                {isStrategyLoading && t('holisticStrategyGenerating')}
                                {isPerformanceReportLoading && t('performanceReportGenerating')}
                            </p>
                            <p className="text-sm text-brand-subtle">
                                {isAnalyzerLoading && t('analyzingProfileSubtext')}
                                {isStrategyLoading && t('campaignPlanSubtext')} {/* Reusing spinner subtext for now */}
                                {isPerformanceReportLoading && t('organicPlanSubtext')} {/* Reusing spinner subtext for now */}
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-brand-error p-4 bg-red-500/10 border border-red-500/20 rounded-md animate-pop-in">{t(error)}</div>
                    ) : (
                        <div className="space-y-6">
                            {renderAnalysisResult()}
                            {renderHolisticStrategyResult()}
                            {renderPerformanceReport()}
                            {!analysisResult && !strategyResult && !performanceReport && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-brand-subtle">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 text-brand-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <h3 className="text-xl font-semibold text-brand-text">{t('analysisSummaryPlaceholderTitle')}</h3>
                                    <p className="mt-1">{t('analysisSummaryPlaceholderSubtitle')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <HistoryPanel onSelectHistoryItem={handleSelectHistoryItem} />
            </div>
        </div>
    );
};

export default AnalyzerPage;