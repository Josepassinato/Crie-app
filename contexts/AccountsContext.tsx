import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { SavedAccount, AppMode, ContentFormData, ProductFormData, GeneratedHistoryItem, Schedule } from '../types';

interface AccountsContextType {
    accounts: Record<string, SavedAccount>;
    selectedAccountId: string | null;
    selectAccount: (accountId: string) => void;
    saveAccount: (name: string, type: AppMode, formData: ContentFormData | ProductFormData) => void;
    deleteAccount: (accountId: string) => void;
    addHistoryItem: (accountId: string, item: GeneratedHistoryItem) => void;
    updateAccountSchedule: (accountId: string, schedule: Schedule) => void;
}

const ACCOUNTS_STORAGE_KEY = 'crie-app-accounts';

export const AccountsContext = createContext<AccountsContextType>({
    accounts: {},
    selectedAccountId: null,
    selectAccount: () => {},
    saveAccount: () => {},
    deleteAccount: () => {},
    addHistoryItem: () => {},
    updateAccountSchedule: () => {},
});

export const AccountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [accounts, setAccounts] = useState<Record<string, SavedAccount>>({});
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>('new-post');

    useEffect(() => {
        try {
            const savedAccountsJSON = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
            if (savedAccountsJSON) {
                const loadedAccounts = JSON.parse(savedAccountsJSON);
                // migration for old accounts
                Object.keys(loadedAccounts).forEach(key => {
                    if (!loadedAccounts[key].schedule) {
                        loadedAccounts[key].schedule = { isEnabled: false, postsPerDay: 1, times: ['09:00'] };
                    }
                    if (loadedAccounts[key].type === 'content') {
                        const formData = loadedAccounts[key].formData as ContentFormData;
                        if (formData.postFormat === undefined) {
                            formData.postFormat = 'single';
                        }
                        if (formData.carouselSlides === undefined) {
                            formData.carouselSlides = 3;
                        }
                    }
                });
                setAccounts(loadedAccounts);
            }
        } catch (error) {
            console.error("Failed to load accounts from localStorage:", error);
            localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
        }
    }, []);

    const saveAccountsToStorage = (updatedAccounts: Record<string, SavedAccount>) => {
        try {
            localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
        } catch (error) {
            console.error("Failed to save accounts to localStorage:", error);
        }
    };
    
    const selectAccount = useCallback((accountId: string) => {
        setSelectedAccountId(accountId);
    }, []);

    const saveAccount = useCallback((name: string, type: AppMode, formData: ContentFormData | ProductFormData) => {
        const id = Date.now().toString();
        
        // Ensure new content accounts have carousel defaults
        let finalFormData = formData;
        if (type === 'content') {
            finalFormData = {
                postFormat: 'single',
                carouselSlides: 3,
                ...formData,
            }
        }

        const newAccount: SavedAccount = {
            id,
            name,
            type: type === 'content' ? 'content' : 'product',
            formData: finalFormData,
            history: [],
            schedule: {
                isEnabled: false,
                postsPerDay: 1,
                times: ['09:00'],
            }
        };
        const updatedAccounts = { ...accounts, [id]: newAccount };
        setAccounts(updatedAccounts);
        saveAccountsToStorage(updatedAccounts);
        setSelectedAccountId(id);
    }, [accounts]);
    
    const deleteAccount = useCallback((accountId: string) => {
        const updatedAccounts = { ...accounts };
        delete updatedAccounts[accountId];
        setAccounts(updatedAccounts);
        saveAccountsToStorage(updatedAccounts);
        if (selectedAccountId === accountId) {
            setSelectedAccountId('new-post');
        }
    }, [accounts, selectedAccountId]);

    const addHistoryItem = useCallback((accountId: string, item: GeneratedHistoryItem) => {
        setAccounts(prevAccounts => {
            const accountToUpdate = prevAccounts[accountId];
            if (!accountToUpdate) return prevAccounts;

            const updatedHistory = [item, ...accountToUpdate.history];
            const updatedAccount = { ...accountToUpdate, history: updatedHistory };
            const updatedAccounts = { ...prevAccounts, [accountId]: updatedAccount };
            
            saveAccountsToStorage(updatedAccounts);
            return updatedAccounts;
        });
    }, []);

    const updateAccountSchedule = useCallback((accountId: string, newSchedule: Schedule) => {
        setAccounts(prevAccounts => {
            const accountToUpdate = prevAccounts[accountId];
            if (!accountToUpdate) return prevAccounts;

            const updatedAccount = { ...accountToUpdate, schedule: newSchedule };
            const updatedAccounts = { ...prevAccounts, [accountId]: updatedAccount };
            
            saveAccountsToStorage(updatedAccounts);
            return updatedAccounts;
        });
    }, []);


    const value = { 
        accounts, 
        selectedAccountId, 
        selectAccount, 
        saveAccount, 
        deleteAccount,
        addHistoryItem,
        updateAccountSchedule,
    };

    return (
        <AccountsContext.Provider value={value}>
            {children}
        </AccountsContext.Provider>
    );
};
