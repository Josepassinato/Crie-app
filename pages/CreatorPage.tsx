import React, { useContext, useEffect, useState } from 'react';
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import { AccountsContext } from '../contexts/AccountsContext.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { ProductInputForm } from '../components/ProductInputForm.tsx';
import { ContentInputForm } from '../components/ContentInputForm.tsx';
import PersonaCreatorForm from '../components/PersonaCreatorForm.tsx';
import OutputDisplay from '../components/OutputDisplay.tsx';
import AccountManager from '../components/AccountManager.tsx';
import HistoryPanel from '../components/HistoryPanel.tsx';
import SaveAccountModal from '../components/SaveAccountModal.tsx';
import SpecialCreatorForm from '../components/SpecialCreatorForm.tsx';
import JingleCreatorForm from '../components/JingleCreatorForm.tsx';
import { GeneratedHistoryItem, ProductFormData, ContentFormData, Schedule, AppMode } from '../types.ts';

// Copied from AppStateContext to have a reset reference without modifying context file
const initialProductFormData: ProductFormData = {
    productName: '',
    productDescription: '',
    marketingVibe: '',
    productImage: null,
    maskTemplate: 'Nenhum',
    colorPalette: '',
    logoImage: null,
    userSelfie: null,
    artisticStyle: 'Padrão',
    aspectRatio: '1:1',
    negativePrompt: '',
    videoDuration: '5s',
    animationStyle: 'dynamic',
    narrationScript: '',
    backgroundMusic: 'none',
    musicDescription: '',
    postExample1: '',
    postExample2: '',
    postExample3: '',
    profileUrl: '',
    benchmarkProfileUrl: '',
    audioType: 'narration',
    // FIX: Add missing elevenLabs properties to match the ProductFormData type.
    elevenLabsVoiceId: 'Rachel',
    useCustomElevenLabs: false,
    customElevenLabsApiKey: '',
    // FIX: Add missing startImage property to match the ProductFormData type.
    startImage: null,
};

// Copied from AppStateContext to have a reset reference without modifying context file
const initialContentFormData: ContentFormData = {
    profession: '',
    targetAudience: '',
    professionalContext: '',
    postFormat: 'single',
    carouselSlides: 3,
    maskTemplate: 'Nenhum',
    colorPalette: '',
    logoImage: null,
    userSelfie: null,
    postExample1: '',
    postExample2: '',
    postExample3: '',
    artisticStyle: 'Padrão',
    aspectRatio: '1:1',
    negativePrompt: '',
    videoDuration: '5s',
    animationStyle: 'dynamic',
    narrationScript: '',
    backgroundMusic: 'none',
    musicDescription: '',
    profileUrl: '',
    benchmarkProfileUrl: '',
    audioType: 'narration',
    // FIX: Add missing elevenLabs properties to match the ContentFormData type.
    elevenLabsVoiceId: 'Rachel',
    useCustomElevenLabs: false,
    customElevenLabsApiKey: '',
    // FIX: Add missing startImage property to match the ContentFormData type.
    startImage: null,
};

type CreatorTab = 'standard' | 'special' | 'personas' | 'jingles';

const CreatorPage: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const appState = useContext(AppStateContext);
    
    const {
        accounts,
        selectedAccountId,
        saveAccount,
        updateAccountSchedule
    } = useContext(AccountsContext);

    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<CreatorTab>('standard');

    if (!appState) return null; // Guard clause while context initializes
    const {
        appMode, setAppMode,
        outputType, setOutputType,
        productFormState, setProductFormState,
        contentFormState, setContentFormState,
        generatedContent, setGeneratedContent,
        isLoading, error, setError,
        handleProductSubmit, handleContentSubmit,
    } = appState;

    useEffect(() => {
        if (selectedAccountId && selectedAccountId !== 'new-post' && accounts[selectedAccountId]) {
            const account = accounts[selectedAccountId];
            setAppMode(account.type);
            if (account.type === 'product') {
                setProductFormState(account.formData as ProductFormData);
                setContentFormState(initialContentFormData); // Reset other form
            } else {
                setContentFormState(account.formData as ContentFormData);
                setProductFormState(initialProductFormData); // Reset other form
            }
            setGeneratedContent(null);
            setError(null);
        } else if (selectedAccountId === 'new-post') {
            // Manually reset both forms when switching to 'new-post'
            setProductFormState(initialProductFormData);
            setContentFormState(initialContentFormData);
            setGeneratedContent(null);
            setError(null);
        }
    }, [selectedAccountId, accounts, setAppMode, setProductFormState, setContentFormState, setGeneratedContent, setError]);

    const handleSelectHistoryItem = (item: GeneratedHistoryItem) => {
        // FIX: Removed check for 'personaVideo' as it is not a valid type in GeneratedHistoryItem. This comparison would always be false.
        if (item.type === 'productPost' || item.type === 'contentPost' || item.type === 'specialVideo' || item.type === 'personaPost') {
            setGeneratedContent(item.data);
        }
    };

    const handleSaveAccount = () => {
        if (selectedAccountId && selectedAccountId !== 'new-post') {
             alert("Alterações em contas salvas são aplicadas, mas não salvas permanentemente nesta versão. Salve como uma nova conta se desejar.");
        } else {
            setIsSaveModalOpen(true);
        }
    };

    const confirmSaveAccount = (accountName: string) => {
        const formData = appMode === 'product' ? productFormState : contentFormState;
        saveAccount(accountName, appMode, formData);
        setIsSaveModalOpen(false);
    };

    const selectedAccount = selectedAccountId ? accounts[selectedAccountId] : null;
    const isAutomationDisabled = !selectedAccountId || selectedAccountId === 'new-post';
    const schedule = selectedAccount?.schedule || { isEnabled: false, postsPerDay: 1, times: ['09:00'] };

    const handleScheduleChange = (newSchedule: Schedule) => {
        if (selectedAccountId && selectedAccountId !== 'new-post') {
            updateAccountSchedule(selectedAccountId, newSchedule);
        }
    };
    
    const handleSetAppMode = (mode: AppMode) => {
        if (mode !== appMode) {
             setProductFormState(initialProductFormData);
             setContentFormState(initialContentFormData);
             setGeneratedContent(null);
             setError(null);
             setAppMode(mode);
        }
    };
    
    const renderStandardCreator = () => (
         <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border">
            {/* Mode Toggle */}
            <div className="flex justify-center items-center mb-8 border border-brand-border rounded-full p-1 max-w-sm mx-auto bg-brand-soft-bg">
                <button
                    onClick={() => handleSetAppMode('content')}
                    className={`w-1/2 py-2 px-4 rounded-full text-sm font-semibold transition-colors ${appMode === 'content' ? 'bg-brand-primary text-white' : 'text-brand-subtle hover:bg-brand-hover-bg'}`}
                >
                    {t('accountTypePersonality')}
                </button>
                <button
                    onClick={() => handleSetAppMode('product')}
                    className={`w-1/2 py-2 px-4 rounded-full text-sm font-semibold transition-colors ${appMode === 'product' ? 'bg-brand-primary text-white' : 'text-brand-subtle hover:bg-brand-hover-bg'}`}
                >
                    {t('accountTypeBusiness')}
                </button>
            </div>
             <div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-2">
                    {appMode === 'content' ? t('accountTypePersonality') : t('accountTypeBusiness')}
                </h2>
                <p className="text-brand-subtle mb-6">
                    {appMode === 'content' ? t('creatorPageContentSubtitle') : t('creatorPageProductSubtitle')}
                </p>
            </div>
            {appMode === 'product' ? (
                <ProductInputForm
                    formData={productFormState}
                    onFormChange={setProductFormState}
                    onFormSubmit={handleProductSubmit}
                    isLoading={isLoading}
                    outputType={outputType}
                    onOutputTypeChange={setOutputType}
                    onSaveAccount={handleSaveAccount}
                    schedule={schedule}
                    onScheduleChange={handleScheduleChange}
                    isAutomationDisabled={isAutomationDisabled}
                />
            ) : (
                <ContentInputForm
                    formData={contentFormState}
                    onFormChange={setContentFormState}
                    onFormSubmit={handleContentSubmit}
                    isLoading={isLoading}
                    outputType={outputType}
                    onOutputTypeChange={setOutputType}
                    onSaveAccount={handleSaveAccount}
                    schedule={schedule}
                    onScheduleChange={handleScheduleChange}
                    isAutomationDisabled={isAutomationDisabled}
                />
            )}
        </div>
    );

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Creator Tabs */}
                    <div className="border-b border-brand-border overflow-x-auto">
                        <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('standard')}
                                className={`whitespace-nowrap py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg ${
                                    activeTab === 'standard'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-300'
                                }`}
                            >
                                {t('creatorTabStandard')}
                            </button>
                            <button
                                onClick={() => setActiveTab('personas')}
                                className={`whitespace-nowrap py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg ${
                                    activeTab === 'personas'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-300'
                                }`}
                            >
                                {t('creatorTabPersonas')}
                            </button>
                            <button
                                onClick={() => setActiveTab('special')}
                                className={`whitespace-nowrap py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg ${
                                    activeTab === 'special'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-300'
                                }`}
                            >
                                {t('creatorTabSpecial')}
                            </button>
                            <button
                                onClick={() => setActiveTab('jingles')}
                                className={`whitespace-nowrap py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-lg ${
                                    activeTab === 'jingles'
                                    ? 'border-brand-primary text-brand-primary'
                                    : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-300'
                                }`}
                            >
                                🎵 Jingles
                            </button>
                        </nav>
                    </div>

                    {activeTab === 'standard' && renderStandardCreator()}
                    {activeTab === 'personas' && <PersonaCreatorForm />}
                    {activeTab === 'special' && <SpecialCreatorForm />}
                    {activeTab === 'jingles' && <JingleCreatorForm />}
                    
                    {/* Mobile Output Display */}
                    <div className="lg:hidden">
                        <OutputDisplay
                            generatedContent={generatedContent}
                            isLoading={isLoading}
                            error={error ? t(error) : null}
                            appMode={appMode}
                            outputType={outputType}
                        />
                    </div>
                </div>

                <div className="hidden lg:block lg:col-span-1 space-y-8">
                    <AccountManager appMode={appMode} />
                    <OutputDisplay
                        generatedContent={generatedContent}
                        isLoading={isLoading}
                        error={error ? t(error) : null}
                        appMode={appMode}
                        outputType={outputType}
                    />
                    <HistoryPanel onSelectHistoryItem={handleSelectHistoryItem} />
                </div>
            </div>
            <SaveAccountModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={confirmSaveAccount}
                accountType={appMode}
            />
        </>
    );
};

export default CreatorPage;