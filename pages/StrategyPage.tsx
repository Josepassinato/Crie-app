import React, { useContext } from 'react';
import { HolisticStrategyResult, PerformanceReport } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { AccountsContext } from '../contexts/AccountsContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';
import AccountManager from '../components/AccountManager';
import HistoryPanel from '../components/HistoryPanel';
import { useAppState } from '../contexts/AppStateContext';

const StrategyPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const { currentUser } = useContext(AuthContext);
    const { selectedAccountId } = useContext(AccountsContext);
    const {
        strategyResult,
        performanceReport,
        isStrategyLoading,
        isPerformanceReportLoading,
        error,
        handleStrategySubmit,
        handlePerformanceReportSubmit,
    } = useAppState();

    const selectedAccount = !!selectedAccountId && selectedAccountId !== 'new-post';

    const ResultSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h3 className="flex items-center text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-2">
                <span className="mr-3">{icon}</span>
                {title}
            </h3>
            <div className="text-brand-subtle space-y-2 pl-10">{children}</div>
        </div>
    );
    
    const strategyButtonText = currentUser?.isAdmin 
        ? t('generateStrategyButton') 
        : `${t('generateStrategyButton')} (${TOKEN_COSTS.STRATEGY_ANALYSIS} ${t('tokens')})`;
    
    const performanceButtonText = currentUser?.isAdmin
        ? t('analyzePerformanceButton')
        : `${t('analyzePerformanceButton')} (${TOKEN_COSTS.ACCOUNT_PERFORMANCE_ANALYSIS} ${t('tokens')})`;

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-text mb-4 animate-fade-in">{t('strategyTitle')}</h1>
                <p className="text-lg text-brand-subtle animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {t('strategySubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1 space-y-8">
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <AccountManager showAll={true} />
                    </div>
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <HistoryPanel 
                           onSelectHistoryItem={(item) => {
                             if (item.type === 'holisticStrategy') {
                                // setStrategyResult(item.data as HolisticStrategyResult);
                             } else if (item.type === 'performanceReport') {
                                 // setPerformanceReport(item.data as PerformanceReport);
                             }
                           }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-4">
                         <button
                            onClick={handleStrategySubmit}
                            disabled={isStrategyLoading || isPerformanceReportLoading || !selectedAccount}
                            className="w-full py-3 px-8 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-rose-500 to-red-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 focus:ring-offset-brand-bg disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isStrategyLoading ? t('generatingStrategy') : strategyButtonText}
                        </button>
                        <button
                            onClick={handlePerformanceReportSubmit}
                            disabled={isPerformanceReportLoading || isStrategyLoading || !selectedAccount}
                            className="w-full py-3 px-8 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-brand-bg disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isPerformanceReportLoading ? t('analyzingPerformance') : performanceButtonText}
                        </button>
                        {!selectedAccount && (
                            <p className="text-center text-sm text-brand-subtle">{t('selectAccountPrompt')}</p>
                        )}
                    </div>

                     <div className="mt-8">
                        {(isStrategyLoading || isPerformanceReportLoading) && (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
                                <div className={`animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 ${isStrategyLoading ? 'border-rose-500' : 'border-blue-500'}`}></div>
                                <p className="text-lg text-brand-subtle">{isStrategyLoading ? t('generatingStrategy') : t('analyzingPerformance')}</p>
                                <p className="text-sm text-slate-500">{t('spinnerSubtext')}</p>
                            </div>
                        )}
                        {error && <div className="text-center text-red-400 p-4 bg-red-900/20 border border-red-500/30 rounded-md">{error}</div>}
                        {strategyResult && (
                            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-center text-brand-text mb-4">{t('holisticStrategyReport')}</h2>
                                <ResultSection title={t('overallDiagnosisTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}>
                                    <p>{strategyResult.overallDiagnosis}</p>
                                </ResultSection>
                                <ResultSection title={t('strategicPillarsTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}>
                                    <ul className="list-disc list-inside space-y-2">
                                        {strategyResult.strategicPillars.map((pillar, index) => (
                                            <li key={index}>{pillar}</li>
                                        ))}
                                    </ul>
                                </ResultSection>
                                <ResultSection title={t('actionableRecommendationsTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
                                     <ul className="list-disc list-inside space-y-2">
                                        {strategyResult.actionableRecommendations.map((rec, index) => (
                                            <li key={index}>{rec}</li>
                                        ))}
                                    </ul>
                                </ResultSection>
                                <ResultSection title={t('kpisToTrackTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>}>
                                     <ul className="list-disc list-inside space-y-2">
                                        {strategyResult.kpisToTrack.map((kpi, index) => (
                                            <li key={index}>{kpi}</li>
                                        ))}
                                    </ul>
                                </ResultSection>
                            </div>
                        )}
                        {performanceReport && (
                             <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-center text-brand-text mb-4">{t('performanceReportTitle')}</h2>
                                <ResultSection title={t('quantitativeSummaryTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}>
                                    <p className="mb-4">{performanceReport.quantitativeSummary.reportOverview}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                        <div className="bg-slate-900/50 p-3 rounded-md">
                                            <p className="text-2xl font-bold text-brand-primary">{performanceReport.quantitativeSummary.totalPosts}</p>
                                            <p className="text-xs text-brand-subtle">{t('totalPosts')}</p>
                                        </div>
                                        <div className="bg-slate-900/50 p-3 rounded-md">
                                            <p className="text-2xl font-bold text-brand-primary">{performanceReport.quantitativeSummary.totalCampaigns}</p>
                                            <p className="text-xs text-brand-subtle">{t('totalCampaigns')}</p>
                                        </div>
                                         <div className="bg-slate-900/50 p-3 rounded-md">
                                            <p className="text-2xl font-bold text-brand-primary">{performanceReport.quantitativeSummary.totalAnalyses}</p>
                                            <p className="text-xs text-brand-subtle">{t('totalAnalyses')}</p>
                                        </div>
                                    </div>
                                </ResultSection>
                                <ResultSection title={t('growthAnalysisTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}>
                                    <p>{performanceReport.growthAnalysis}</p>
                                </ResultSection>
                                <ResultSection title={t('engagementTrendsTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}>
                                    <p>{performanceReport.engagementTrends}</p>
                                </ResultSection>
                                <ResultSection title={t('campaignEffectivenessTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>}>
                                    <p>{performanceReport.campaignEffectiveness}</p>
                                </ResultSection>
                                <ResultSection title={t('strategicSummaryTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}>
                                    <p>{performanceReport.strategicSummary}</p>
                                </ResultSection>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StrategyPage;
