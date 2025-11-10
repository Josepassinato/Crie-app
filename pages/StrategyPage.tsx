import React, { useContext } from 'react';
import { HolisticStrategyResult, PerformanceReport } from '../types.ts';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { AccountsContext } from '../contexts/AccountsContext';
import { TOKEN_COSTS } from '../lib/tokenCosts.ts';
import AccountManager from '../components/AccountManager.tsx';
import HistoryPanel from '../components/HistoryPanel.tsx';
// Fix: Add file extension to fix module resolution error.
import { useAppState } from '../contexts/AppStateContext.tsx';

// Fix: Changed from default export to named export to resolve module resolution error.
export const StrategyPage: React.FC = () => {
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
                                <ResultSection title={t('overallDiagnosisTitle')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H