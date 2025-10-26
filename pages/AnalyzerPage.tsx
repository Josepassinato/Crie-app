import React, { useState, useContext } from 'react';
import { analyzeSocialProfile } from '../services/analyzerService';
import { AnalysisResult } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';

const AnalyzerPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const { currentUser, updateUserTokens } = useContext(AuthContext);
    const [profileUrl, setProfileUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

    const handleSubmit = async () => {
        if (!profileUrl) {
            setError(t('analyzerUrlError'));
            return;
        }

        const cost = TOKEN_COSTS.PROFILE_ANALYSIS;
        if (!currentUser?.isAdmin && (!currentUser || currentUser.tokens < cost)) {
            setError(t('insufficientTokens'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeSocialProfile(profileUrl);
            setAnalysisResult(result);
            updateUserTokens(currentUser.tokens - cost);
        } catch (err: any) {
            setError(err.message || t('analyzerApiError'));
        } finally {
            setIsLoading(false);
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
    
    const analyzeButtonText = currentUser?.isAdmin 
        ? t('analyze') 
        : `${t('analyze')} (${TOKEN_COSTS.PROFILE_ANALYSIS} ${t('tokens')})`;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-text mb-4 animate-fade-in">{t('analyzerTitle')}</h1>
                <p className="text-lg text-brand-subtle animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {t('analyzerSubtitle')}
                </p>
            </div>

            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 space-y-6">
                <div>
                    <label htmlFor="profileUrl" className="block text-sm font-medium text-brand-subtle mb-2">{t('profileUrlLabel')}</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="url"
                            name="profileUrl"
                            id="profileUrl"
                            value={profileUrl}
                            onChange={(e) => setProfileUrl(e.target.value)}
                            placeholder={t('profileUrlPlaceholder')}
                            className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                        />
                         <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full sm:w-auto py-2 px-8 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-brand-bg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isLoading ? t('analyzing') : analyzeButtonText}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                {isLoading && (
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
                            <ul className="list-disc list-inside space-y-2">
                                {analysisResult.strategicRecommendations.map((rec, index) => (
                                    <li key={index}>{rec}</li>
                                ))}
                            </ul>
                        </ResultSection>
                    </div>
                )}
            </div>

        </div>
    );
};

export default AnalyzerPage;