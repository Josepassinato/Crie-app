import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { SavedAccount, AppMode, ContentFormData, ProductFormData, GeneratedHistoryItem, Schedule } from '../types.ts';

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
                    formData: { profession: '', targetAudience: '', professionalContext: '', postFormat: 'single', carouselSlides: 3, maskTemplate: 'Nenhum', colorPalette: '', logoImage: null, userSelfie: null, postExample1: '', postExample2: '', postExample3: '', profileUrl: '', artisticStyle: 'Padrão', aspectRatio: '1:1', negativePrompt: '', videoDuration: '5s', animationStyle: 'dynamic', narrationScript: '', backgroundMusic: 'none', musicDescription: '', benchmarkProfileUrl: '', audioType: 'narration' }, // Added benchmarkProfileUrl & audioType
                    history: [],
                    schedule: { isEnabled: false, postsPerDay: 1, times: ['09:00'] }
                };
            }

            // migration for old accounts
            Object.keys(loadedAccounts).forEach(key => {
                try {
                    const account = loadedAccounts[key];

                    // DEFINITIVE FIX: If account is malformed or its formData is not a valid object,
                    // skip it entirely to prevent a startup crash.
                    if (!account || typeof account.formData !== 'object' || account.formData === null) {
                        console.warn(`Skipping migration for malformed account with key: ${key}`);
                        return;
                    }

                    const formData = account.formData;

                    if (!account.schedule) {
                        account.schedule = { isEnabled: false, postsPerDay: 1, times: ['09:00'] };
                    }
                     if (!formData.artisticStyle) {
                        formData.artisticStyle = 'Padrão';
                    }
                    if (formData.userSelfie === undefined) {
                        formData.userSelfie = null;
                    }
                     if (formData.aspectRatio === undefined) {
                        formData.aspectRatio = '1:1';
                    }
                    if (formData.negativePrompt === undefined) {
                        formData.negativePrompt = '';
                    }
                    if (formData.profileUrl === undefined) {
                        formData.profileUrl = '';
                    }
                    // New migration for benchmarkProfileUrl
                    if (formData.benchmarkProfileUrl === undefined) { 
                        formData.benchmarkProfileUrl = '';
                    }
                    if (formData.audioType === undefined) {
                        formData.audioType = 'narration';
                    }


                    // Robustly migrate video duration regardless of account type
                    if (formData.videoDuration !== '5s' && formData.videoDuration !== '8s') {
                        // This catches undefined, null, '10s', '15s', the numbers 10, 15, etc.
                        formData.videoDuration = '8s'; // Default all invalid cases to a safe, valid value.
                    }
                    
                    if (account.type === 'content') {
                        const contentFormData = formData as ContentFormData;
                        if (contentFormData.postFormat === undefined) {
                            contentFormData.postFormat = 'single';
                        }
                        if (contentFormData.carouselSlides === undefined) {
                            contentFormData.carouselSlides = 3;
                        }
                        if (contentFormData.postExample1 === undefined) {
                            contentFormData.postExample1 = '';
                            contentFormData.postExample2 = '';
                            contentFormData.postExample3 = '';
                        }
                         if (contentFormData.animationStyle === undefined) contentFormData.animationStyle = 'dynamic';
                        if (contentFormData.narrationScript === undefined) contentFormData.narrationScript = '';
                        if (contentFormData.backgroundMusic === undefined) contentFormData.backgroundMusic = 'none';
                        if (contentFormData.musicDescription === undefined) contentFormData.musicDescription = '';
                    }
                    if (account.type === 'product') {
                        const productFormData = formData as ProductFormData;
                         if (productFormData.animationStyle === undefined) {
                            productFormData.animationStyle = 'dynamic';
                        }
                         if (productFormData.narrationScript === undefined) {
                            productFormData.narrationScript = '';
                        }
                         if (productFormData.backgroundMusic === undefined) {
                            productFormData.backgroundMusic = 'none';
                        }
                        if (productFormData.musicDescription === undefined) {
                            productFormData.musicDescription = '';
                        }
                    }
                     // Generic background music migration (can be applied to both)
                    const oldToNewMap: { [key: string]: string } = {
                        'Nenhuma': 'none', 'None': 'none', 'Ninguna': 'none',
                        'Épica Orquestral': 'epic', 'Epic Orchestral': 'epic',
                        'Pop Animado': 'upbeat', 'Upbeat Pop': 'upbeat',
                        'Lo-fi Calmo': 'lofi', 'Chill Lo-fi': 'lofi', 'Lo-fi Relajante': 'lofi'
                    };
                    if (formData.backgroundMusic && oldToNewMap[formData.backgroundMusic]) {
                        formData.backgroundMusic = oldToNewMap[formData.backgroundMusic] as any;
                    }
                } catch (e) {
                    console.error(`Failed to migrate account with key: ${key}. Skipping to prevent crash.`, e);
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
        let finalFormData: ContentFormData | ProductFormData = { 
            artisticStyle: 'Padrão', 
            userSelfie: null, 
            aspectRatio: '1:1', 
            negativePrompt: '', 
            profileUrl: '', // Ensure default for profileUrl
            benchmarkProfileUrl: '', // Ensure default for benchmarkProfileUrl
            ...formData 
        };
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
                audioType: 'narration',
                ...finalFormData,
            } as ContentFormData;
        } else {
             finalFormData = {
                videoDuration: '5s',
                animationStyle: 'dynamic',
                narrationScript: '',
                backgroundMusic: 'none',
                musicDescription: '',
                audioType: 'narration',
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

            // Add the new item to the beginning of the history
            const newHistory = [item, ...accountToUpdate.history];

            // Define the types of posts we want to limit
            const postTypesToLimit: GeneratedHistoryItem['type'][] = [
                'productPost', 
                'contentPost', 
                'specialVideo', 
                'personaPost'
            ];

            // Separate the posts to be limited from other history items
            const postsToLimit = newHistory.filter(h => postTypesToLimit.includes(h.type));
            const otherHistoryItems = newHistory.filter(h => !postTypesToLimit.includes(h.type));

            // If we have more than 3 posts of the specified types, keep only the 3 newest
            const limitedPosts = postsToLimit.length > 3 ? postsToLimit.slice(0, 3) : postsToLimit;

            // Combine the limited posts with the other items and re-sort by timestamp to maintain order
            const updatedHistory = [...limitedPosts, ...otherHistoryItems].sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            
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