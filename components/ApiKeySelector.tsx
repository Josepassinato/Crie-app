import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

interface ApiKeySelectorProps {
  onKeySelect: () => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelect }) => {
  const { t } = useContext(LanguageContext);

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 text-brand-text font-sans">
      <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 max-w-lg text-center animate-fade-in">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-4">
          {t('apiKeyTitle')}
        </h1>
        <p className="text-brand-subtle mb-6">
          {t('apiKeyDescription')}
        </p>
        <button
          onClick={onKeySelect}
          className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-brand-bg transition-opacity"
        >
          {t('selectApiKey')}
        </button>
        <p className="text-xs text-slate-500 mt-4">
          {t('apiKeyBillingPreLink')}{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-brand-primary"
          >
            {t('apiKeyBillingLink')}
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default ApiKeySelector;