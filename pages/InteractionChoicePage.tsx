import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

interface InteractionChoicePageProps {
    onSelectDashboard: () => void;
    onSelectVoiceAgent: () => void;
}

const InteractionChoicePage: React.FC<InteractionChoicePageProps> = ({ onSelectDashboard, onSelectVoiceAgent }) => {
    const { t } = useContext(LanguageContext);

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 text-brand-text font-sans">
            <div className="w-full max-w-2xl text-center">
                <h1 className="text-4xl font-bold text-brand-text mb-4 animate-fade-in">
                    {t('agentChoiceTitle')}
                </h1>
                <p className="text-lg text-brand-subtle mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    Selecione como você prefere começar.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    {/* Dashboard Option */}
                    <button
                        onClick={onSelectDashboard}
                        className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 hover:border-brand-primary hover:scale-105 transition-all duration-300 group"
                    >
                        <div className="flex flex-col items-center justify-center h-full">
                            <svg className="h-16 w-16 mb-4 text-brand-subtle group-hover:text-brand-primary transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                            </svg>
                            <h2 className="text-2xl font-bold text-brand-text">Dashboard</h2>
                            <p className="mt-2 text-brand-subtle">{t('configureOnDashboard')}</p>
                        </div>
                    </button>

                    {/* Voice Agent Option */}
                    <button
                        onClick={onSelectVoiceAgent}
                        className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 hover:border-brand-secondary hover:scale-105 transition-all duration-300 group"
                    >
                        <div className="flex flex-col items-center justify-center h-full">
                            <svg className="h-16 w-16 mb-4 text-brand-subtle group-hover:text-brand-secondary transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <h2 className="text-2xl font-bold text-brand-text">Agente de Voz</h2>
                            <p className="mt-2 text-brand-subtle">{t('interactByVoice')}</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InteractionChoicePage;
