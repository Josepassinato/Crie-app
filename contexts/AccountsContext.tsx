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
const TEST_ACCOUNT_ID = 'test-admin-id';

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
            const loadedAccounts = JSON.parse(savedAccountsJSON || '{}');

            // Ensure test account exists
            if (!loadedAccounts[TEST_ACCOUNT_ID]) {
                loadedAccounts[TEST_ACCOUNT_ID] = {
                    id: TEST_ACCOUNT_ID,
                    name: 'Conta Teste',
                    type: 'content',
                    formData: { profession: '', targetAudience: '', professionalContext: '', postFormat: 'single', carouselSlides: 3, maskTemplate: 'Nenhum', colorPalette: '', logoImage: null, userSelfie: null, postExample1: '', postExample2: '', postExample3: '', profileUrl: '', artisticStyle: 'Padrão', aspectRatio: '1:1', negativePrompt: '', videoDuration: '5s', animationStyle: 'dynamic', narrationScript: '', backgroundMusic: 'none', musicDescription: '' },
                    history: [],
                    schedule: { isEnabled: false, postsPerDay: 1, times: ['09:00'] }
                };
            }

            // migration for old accounts
            Object.keys(loadedAccounts).forEach(key => {
                if (!loadedAccounts[key].schedule) {
                    loadedAccounts[key].schedule = { isEnabled: false, postsPerDay: 1, times: ['09:00'] };
                }
                 if (!loadedAccounts[key].formData.artisticStyle) {
                    loadedAccounts[key].formData.artisticStyle = 'Padrão';
                }
                if (loadedAccounts[key].formData.userSelfie === undefined) {
                    loadedAccounts[key].formData.userSelfie = null;
                }
                 if (loadedAccounts[key].formData.aspectRatio === undefined) {
                    loadedAccounts[key].formData.aspectRatio = '1:1';
                }
                if (loadedAccounts[key].formData.negativePrompt === undefined) {
                    loadedAccounts[key].formData.negativePrompt = '';
                }
                if (loadedAccounts[key].type === 'content') {
                    const formData = loadedAccounts[key].formData as ContentFormData;
                    if (formData.postFormat === undefined) {
                        formData.postFormat = 'single';
                    }
                    if (formData.carouselSlides === undefined) {
                        formData.carouselSlides = 3;
                    }
                    if (formData.postExample1 === undefined) {
                        formData.postExample1 = '';
                        formData.postExample2 = '';
                        formData.postExample3 = '';
                    }
                    if (formData.videoDuration === undefined) {
                        formData.videoDuration = '5s';
                        formData.animationStyle = 'dynamic';
                        formData.narrationScript = '';
                        formData.backgroundMusic = 'none';
                        formData.musicDescription = '';
                    }
                }
                if (loadedAccounts[key].type === 'product') {
                    const formData = loadedAccounts[key].formData as ProductFormData;
                     if (formData.videoDuration === undefined) {
                        formData.videoDuration = '5s';
                    }
                    if (formData.animationStyle === undefined) {
                        formData.animationStyle = 'dynamic';
                    }
                     if (formData.narrationScript === undefined) {
                        formData.narrationScript = '';
                    }
                     if (formData.backgroundMusic === undefined) {
                        formData.backgroundMusic = 'none';
                    } else {
                        // Fix: Specify the correct value type for the map to ensure type compatibility.
                        const oldToNewMap: Record<string, ProductFormData['backgroundMusic']> = {
                            'Nenhuma': 'none', 'None': 'none', 'Ninguna': 'none',
                            'Épica Orquestral': 'epic', 'Epic Orchestral': 'epic',
                            'Pop Animado': 'upbeat', 'Upbeat Pop': 'upbeat',
                            'Lo-fi Calmo': 'lofi', 'Chill Lo-fi': 'lofi', 'Lo-fi Relajante': 'lofi'
                        };
                        if (oldToNewMap[formData.backgroundMusic]) {
                            formData.backgroundMusic = oldToNewMap[formData.backgroundMusic];
                        }
                    }
                    if (formData.musicDescription === undefined) {
                        formData.musicDescription = '';
                    }
                }
            });
            setAccounts(loadedAccounts);

             // If in test mode, select the test account by default.
            if (sessionStorage.getItem('testMode') === 'true') {
                setSelectedAccountId(TEST_ACCOUNT_ID);
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
        
        // Ensure new accounts have defaults
        let finalFormData: ContentFormData | ProductFormData = { artisticStyle: 'Padrão', userSelfie: null, aspectRatio: '1:1', negativePrompt: '', ...formData };
        if (type === 'content') {
            finalFormData = {
                postFormat: 'single',
                carouselSlides: 3,
                postExample1: '',
                postExample2: '',
                postExample3: '',
                videoDuration: '5s',
                animationStyle: 'dynamic',
                narrationScript: '',
                backgroundMusic: 'none',
                musicDescription: '',
                ...finalFormData,
            } as ContentFormData;
        } else {
             finalFormData = {
                videoDuration: '5s',
                animationStyle: 'dynamic',
                narrationScript: '',
                backgroundMusic: 'none',
                musicDescription: '',
                ...finalFormData,
            } as ProductFormData;
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
        if (accountId === TEST_ACCOUNT_ID) {
            alert("A Conta Teste não pode ser excluída.");
            return;
        }
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
