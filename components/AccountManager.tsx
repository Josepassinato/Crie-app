import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { AccountsContext } from '../contexts/AccountsContext';
// Fix: Import SavedAccount to use for type assertion.
import { AppMode, SavedAccount } from '../types';

interface AccountManagerProps {
    appMode?: AppMode;
    showAll?: boolean;
}

const AccountManager: React.FC<AccountManagerProps> = ({ appMode, showAll = false }) => {
    const { t } = useContext(LanguageContext);
    const { 
        accounts, 
        selectedAccountId, 
        selectAccount, 
        deleteAccount 
    } = useContext(AccountsContext);

    // Fix: Add type assertion to correctly type the result of Object.values.
    const filteredAccounts = (Object.values(accounts) as SavedAccount[]).filter(acc => showAll || acc.type === appMode);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedAccountId && selectedAccountId !== 'new-post') {
            const accountName = accounts[selectedAccountId].name;
            if (confirm(`${t('deleteAccountConfirm')} "${accountName}"?`)) {
                deleteAccount(selectedAccountId);
            }
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-text">{t('accountManagerTitle')}</h2>
            <div className="flex flex-col sm:flex-row gap-4">
                <select
                    value={selectedAccountId || 'new-post'}
                    onChange={(e) => selectAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text"
                >
                    <option value="new-post">{t('newPost')}</option>
                    {filteredAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                            {account.name} ({account.type === 'content' ? t('accountTypePersonality') : t('accountTypeBusiness')})
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleDelete}
                    disabled={!selectedAccountId || selectedAccountId === 'new-post'}
                    className="p-2.5 bg-red-800/50 hover:bg-red-800/80 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('deleteAccount')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AccountManager;