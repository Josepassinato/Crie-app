// components/ApiKeySelector.tsx
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { testApiKey } from '../services/geminiService.ts';

type VerificationStatus = 'idle' | 'checking_initial' | 'unselected' | 'verifying' | 'verified' | 'invalid';

const ApiKeySelector: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const [status, setStatus] = useState<VerificationStatus>('checking_initial');
    const [error, setError] = useState<string | null>(null);

    const verifyKey = async () => {
        setStatus('verifying');
        try {
            const isValid = await testApiKey();
            setStatus(isValid ? 'verified' : 'invalid');
        } catch (e) {
            console.error("Error during API key verification:", e);
            setStatus('invalid');
        }
    };

    const checkInitialKey = async () => {
        setStatus('checking_initial');
        try {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                if (hasKey) {
                    await verifyKey();
                } else {
                    setStatus('unselected');
                }
            } else {
                console.warn("aistudio API not found, assuming key is selected for development.");
                setStatus('verified'); // Dev fallback
            }
        } catch (e) {
            console.error("Error checking for initial API key:", e);
            setError("Failed to check API key status.");
            setStatus('unselected');
        }
    };
    
    useEffect(() => {
        checkInitialKey();
    }, []);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // After the dialog closes, re-run the verification process.
            await checkInitialKey();
        } catch (e) {
            console.error("Error opening select key dialog:", e);
            setError("Could not open the API key selection dialog.");
            setStatus('unselected');
        }
    };
    
    if (status === 'checking_initial') {
        return (
            <div className="text-center p-4 bg-slate-800 rounded-lg animate-pulse">
                <p className="text-sm text-brand-subtle">{t('apiKeyVerifying')}</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-brand-error">{error}</p>
            </div>
        );
    }

    if (status === 'verified') {
        return (
             <div className="text-center p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-brand-success font-medium flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {t('apiKeyVerified')}
                </p>
            </div>
        )
    }
    
    if (status === 'verifying') {
        return (
            <div className="text-center p-4 bg-slate-800 rounded-lg animate-pulse">
                <p className="text-sm text-brand-subtle flex items-center justify-center gap-2">
                     <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {t('apiKeyVerifying')}
                </p>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-lg text-center space-y-3 ${
            status === 'invalid' 
            ? 'bg-red-900/20 border border-red-500/30' 
            : 'bg-yellow-900/20 border border-yellow-500/30'
        }`}>
            {status === 'invalid' && (
                 <p className="font-semibold text-brand-error">{t('apiKeyInvalidError')}</p>
            )}
            <h3 className={`font-semibold ${status === 'invalid' ? 'text-red-300' : 'text-brand-warning'}`}>{t('apiKeySelectorTitle')}</h3>
            <p className={`text-sm ${status === 'invalid' ? 'text-red-300/80' : 'text-yellow-300/80'}`}>
                {t('apiKeySelectorInfo')}
                {' '}
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">
                    {t('apiKeySelectorBillingInfo')}
                </a>
            </p>
            <button
                onClick={handleSelectKey}
                className="w-full py-2 px-4 bg-yellow-500 text-yellow-950 font-bold rounded-md shadow-sm hover:bg-yellow-400 transition-colors"
            >
                {t('apiKeySelectorButton')}
            </button>
        </div>
    );
};

export default ApiKeySelector;