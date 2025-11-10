import React from 'react';
// Fix: Changed import from default to named export to resolve module resolution error.
import { ProductInputForm } from '../components/ProductInputForm.tsx';
import ContentInputForm from '../components/ContentInputForm.tsx';
import OutputDisplay from '../components/OutputDisplay.tsx';
import SaveAccountModal from '../components/SaveAccountModal.tsx';
import AccountManager from '../components/AccountManager.tsx';
import { LanguageContext } from '../contexts/LanguageContext';
import { AccountsContext } from '../contexts/AccountsContext';
import HistoryPanel from '../components/HistoryPanel.tsx';
import AutomationScheduler from '../components/AutomationScheduler.tsx';
// Fix: Add file extension to fix module resolution error.
import { useAppState } from '../contexts/AppStateContext.tsx';

const CreatorPage: React.FC = () => {
    const { t } = React.useContext(LanguageContext);
    const { 
        accounts,
        selectedAccountId,
        saveAccount,
        updateAccountSchedule,
    } = React.useContext(AccountsContext);
    
    const {
        appMode, setAppMode,
        outputType, setOutputType,
        productFormState, setProductFormState,
        contentFormState, setContentFormState,
        generatedContent, setGeneratedContent,
        isLoading,
        error,
        handleProductSubmit,
        handleContentSubmit,
        clearForm,
        contextualPrompt, setContextualPrompt,
    } = useAppState();

    const [isSaveModalOpen, setIsSaveModalOpen] = React.useState(false);

    const [tempSchedule, setTempSchedule] = React.useState<Schedule>({
        isEnabled: false,
        postsPerDay: 1,
        times: ['09:00'],
    });

    const selectedAccount = selectedAccountId ? accounts[selectedAccountId] : null;
    const currentSchedule = selectedAccount ? selectedAccount.schedule : tempSchedule;

    React.useEffect(() => {
        if (contextualPrompt) {
            setAppMode('content');
            setContentFormState(prev => ({
                ...prev,
                professionalContext: `${t('basedOnAnalysis')}:\n"${contextualPrompt}"`
            }));
            setContextualPrompt(null);
        }
    }, [contextualPrompt, setAppMode, setContentFormState, setContextualPrompt, t]);


    
    const handleSaveAccount = (accountName: string) => {
        const formData = appMode === 'product' ? productFormState : contentFormState;
        saveAccount(accountName, appMode, formData);
        setIsSaveModalOpen(false);
    };

    const handleScheduleChange = (newSchedule: Schedule) => {
        if (selectedAccountId && selectedAccountId !== 'new-post') {
            updateAccountSchedule(selectedAccountId, newSchedule);
        } else {
            setTempSchedule(newSchedule);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <AccountManager
                            appMode={appMode}
                        />
                    </div>
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                         <div>
                            <label className="block text-sm font-medium text-brand-subtle mb-2">
                                {t('creationMode')}
                            </label>
                            <div className="flex rounded-md shadow-sm">
                                <button onClick={() => { setAppMode('content'); }} className={`relative inline-flex items-center justify-center w-1/2 rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${appMode === 'content' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>
                                    {t('contentPost')}
                                </button>
                                <button onClick={() => { setAppMode('product'); }} className={`relative -ml-px inline-flex items-center justify-center w-1/2 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${appMode === 'product' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>
                                    {t('productPost')}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6">
                        {appMode === 'product' ? (
                            <ProductInputForm 
                                formState={productFormState}
                                setFormState={setProductFormState}
                                outputType={outputType}
                                setOutputType={setOutputType}
                                onSubmit={handleProductSubmit}
                                onClear={() => clearForm(true)}
                                isLoading={isLoading}
                                onOpenSaveModal={() => setIsSaveModalOpen(true)}
                            />
                        ) : (
                            <ContentInputForm 
                                formState={contentFormState}
                                setFormState={setContentFormState}
                                outputType={outputType}
                                setOutputType={setOutputType}
                                onSubmit={handleContentSubmit}
                                onClear={() => clearForm(true)}
                                isLoading={isLoading}
                                onOpenSaveModal={() => setIsSaveModalOpen(true)}
                            />
                        )}
                        </div>
                    </div>
                     {appMode === 'content' && (
                        <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 animate-fade-in">
                            <AutomationScheduler
                                schedule={currentSchedule}
                                setSchedule={handleScheduleChange}
                            />
                        </div>
                    )}
                    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                        <HistoryPanel
                          onSelectHistoryItem={(item) => {
                             if (item.type === 'contentPost' || item.type === 'productPost') {
                                 setGeneratedContent(item.data);
                             }
                          }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <OutputDisplay
                        generatedContent={generatedContent}
                        isLoading={isLoading}
                        error={error}
                        appMode={appMode}
                        outputType={outputType}
                    />
                </div>
            </div>
            
            <SaveAccountModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveAccount}
                accountType={appMode}
            />
        </>
    );
};

export default CreatorPage;