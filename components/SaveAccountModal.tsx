import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { AppMode } from '../types.ts';

interface SaveAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (accountName: string) => void;
    accountType: AppMode;
}

const SaveAccountModal: React.FC<SaveAccountModalProps> = ({ isOpen, onClose, onSave, accountType }) => {
    const { t } = useContext(LanguageContext);
    const [accountName, setAccountName] = useState('');

    const handleSave = () => {
        if (accountName.trim()) {
            onSave(accountName.trim());
            setAccountName('');
        }
    };

    if (!isOpen) return null;

    const typeText = accountType === 'content' ? t('accountTypePersonality') : t('accountTypeBusiness');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 max-w-sm w-full">
                <h2 className="text-2xl font-bold text-brand-text mb-2">{t('saveAccountModalTitle')}</h2>
                <p className="text-brand-subtle mb-6">
                    {t('saveAccountModalPrompt')} ({typeText})
                </p>

                <div>
                    <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder={t('saveAccountModalPlaceholder')}
                        className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                        autoFocus
                    />
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto py-3 px-6 border border-slate-600 rounded-md font-medium text-brand-subtle bg-slate-700/50 hover:bg-slate-700"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90"
                    >
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SaveAccountModal;