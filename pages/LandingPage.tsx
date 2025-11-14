import React from 'react';
import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    const { t } = useContext(LanguageContext);
    
    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 text-brand-text font-sans">
            <div className="max-w-2xl text-center">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-6 animate-fade-in">
                    {t('landingPageWelcomeTitle') || 'Bem-vindo ao Crie-App!'}
                </h1>
                <p className="text-xl text-brand-subtle mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {t('landingPageSubtitle') || 'Sua plataforma definitiva para criação e gestão de marketing com IA.'}
                </p>
                <button
                    onClick={onStart}
                    className="py-3 px-8 text-lg font-bold text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out animate-bounce-subtle"
                    style={{ animationDelay: '0.4s' }}
                >
                    {t('landingPageStartButton') || 'Começar Agora'}
                </button>
            </div>
        </div>
    );
};

export default LandingPage;