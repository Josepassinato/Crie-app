// components/ApiKeySelector.tsx
import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { testApiKey } from '../services/geminiService.ts';

type VerificationStatus = 'idle' | 'checking_initial' | 'unselected' | 'verifying' | 'verified' | 'invalid' | 'editing';
const API_KEY_STORAGE_KEY = 'gemini-api-key';

const ApiKeySelector: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const [status, setStatus] = useState<VerificationStatus>('checking_initial');
    const [apiKeyInput, setApiKeyInput] = useState('');

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

    const checkAndVerifyKey = async () => {
        setStatus('checking_initial');
        const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (storedKey) {
            // This is a workaround for the dev environment to make the key available to services.
            // In a real backend, this would be handled differently.
            process.env.API_KEY = storedKey;
            await verifyKey();
        } else {
            setStatus('unselected');
        }
    };
    
    useEffect(() => {
        checkAndVerifyKey();
    }, []);

    const handleSaveKey = async () => {
        if (!apiKeyInput.trim()) return;
        localStorage.setItem(API_KEY_STORAGE_KEY, apiKeyInput.trim());
        process.env.API_KEY = apiKeyInput.trim();
        await verifyKey();
    };
    
    const handleRemoveKey = () => {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        delete process.env.API_KEY;
        setApiKeyInput('');
        setStatus('unselected');
    };

    if (status === 'checking_initial' || status === 'verifying') {
        return (
            <div className="text-center p-4 bg-brand-soft-bg rounded-lg animate-pulse">
                <p className="text-sm text-brand-subtle flex items-center justify-center gap-2">
                     <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {t('apiKeyVerifying')}
                </p>
            </div>
        );
    }
    
    if (status === 'verified') {
        return (
             <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                <p className="text-sm text-brand-success font-medium flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {t('apiKeyVerified')}
                </p>
                <div className="flex justify-center gap-2 mt-2">
                    <button onClick={() => setStatus('editing')} className="text-xs text-brand-subtle hover:text-brand-text underline">{t('changeApiKey')}</button>
                    <button onClick={handleRemoveKey} className="text-xs text-brand-subtle hover:text-red-400 underline">{t('removeApiKey')}</button>
                </div>
            </div>
        )
    }

    // Render input form for 'unselected', 'invalid', 'editing'
    return (
        <div className={`p-4 rounded-lg text-center space-y-3 ${
            status === 'invalid' 
            ? 'bg-red-500/10 border border-red-500/20' 
            : 'bg-yellow-500/10 border border-yellow-500/20'
        }`}>
            {status === 'invalid' && (
                 <p className="font-semibold text-brand-error">{t('apiKeyInvalidError')}</p>
            )}
            <h3 className={`font-semibold ${status === 'invalid' ? 'text-red-600' : 'text-amber-600'}`}>{t('apiKeySelectorTitle')}</h3>
            <p className={`text-sm ${status === 'invalid' ? 'text-red-600/80' : 'text-amber-600/80'}`}>
                {t('apiKeySelectorInfo')}
                {' '}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-500">
                    {t('getApiKeyHere')}
                </a>
                {' '}
                {t('apiKeySelectorInfo2')}
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-500">
                    {t('apiKeySelectorBillingInfo')}
                </a>
            </p>
            <div className="flex gap-2">
                <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={t('pasteApiKeyHere')}
                    className="flex-grow w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                />
                <button
                    onClick={handleSaveKey}
                    disabled={!apiKeyInput.trim()}
                    className="py-2 px-4 bg-amber-500 text-amber-950 font-bold rounded-md shadow-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
                >
                    {t('save')}
                </button>
            </div>
        </div>
    );
};

export default ApiKeySelector;