import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { t } = useContext(LanguageContext);

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4 text-brand-text font-sans overflow-hidden">
      {/* Subtle background gradient animation */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-brand-bg to-slate-800 animate-[pulse_10s_ease-in-out_infinite]"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full filter blur-3xl opacity-30 animate-[pulse_8s_ease-in-out_infinite_2s]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-secondary/10 rounded-full filter blur-3xl opacity-30 animate-[pulse_8s_ease-in-out_infinite_4s]"></div>

      <main className="z-10 text-center flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-4 animate-fade-in">
          crie-app ✨
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-brand-text mt-2 mb-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {t('landingTitle')}
        </h2>
        <p className="max-w-xl text-lg text-brand-subtle mb-10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          {t('landingSubtitle')}
        </p>
        <button
          onClick={onStart}
          className="py-4 px-10 border border-transparent rounded-full shadow-lg text-lg font-bold text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-brand-bg transition-all duration-300 transform hover:scale-105 animate-fade-in"
          style={{ animationDelay: '0.9s' }}
        >
          {t('landingCTA')}
        </button>
      </main>
    </div>
  );
};

export default LandingPage;