// components/PersonaCreatorForm.tsx
import React, { useContext, useRef } from 'react';
import { PersonaCreatorFormData, UploadedImage } from '../types.ts';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import { PERSONA_TEMPLATES } from '../lib/personaTemplates.ts';
import { TOKEN_COSTS } from '../lib/tokenCosts.ts';

const ImageUploadArea: React.FC<{
    label: string;
    uploadedImage: UploadedImage | null;
    onUploadClick: () => void;
    onRemoveClick: () => void;
}> = ({ label, uploadedImage, onUploadClick, onRemoveClick }) => {
    const { t } = useContext(LanguageContext);

    return (
        <div>
            <h3 className="text-lg font-semibold text-brand-text mb-2">{label}</h3>
            <div
                className="relative flex justify-center items-center w-full h-40 px-6 py-4 border-2 border-brand-border border-dashed rounded-md cursor-pointer hover:border-brand-primary transition-colors"
                onClick={onUploadClick}
            >
                {uploadedImage ? (
                    <>
                        <img src={`data:${uploadedImage.mimeType};base64,${uploadedImage.base64}`} alt={label} className="h-full w-full object-contain rounded-md" />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveClick();
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs opacity-75 hover:opacity-100 transition-opacity"
                            aria-label={`Remove ${label}`}
                        >
                            &times;
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-brand-subtle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-brand-subtle">{t('uploadAreaTitle')}</h3>
                        <p className="mt-1 text-xs text-brand-subtle">{t('uploadAreaSubtitle')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PersonaCreatorForm: React.FC = () => {
    const { t } = useContext(LanguageContext);
    const appState = useContext(AppStateContext);
    const productImageInputRef = useRef<HTMLInputElement>(null);
    const scenarioImageInputRef = useRef<HTMLInputElement>(null);

    if (!appState) return null;
    const {
        personaCreatorFormState,
        setPersonaCreatorFormState,
        handlePersonaSubmit,
        isLoading,
        personaImages,
        generatingPersonaImage,
        handleGeneratePersonaImage,
    } = appState;

    const updateForm = (field: keyof PersonaCreatorFormData, value: any) => {
        setPersonaCreatorFormState({ ...personaCreatorFormState, [field]: value });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'productImage' | 'scenarioImage') => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                updateForm(field, {
                    base64: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                    name: file.name,
                });
            }
        };
        reader.readAsDataURL(file);
        if (event.target) {
            event.target.value = '';
        }
    };

    const removeImage = (field: 'productImage' | 'scenarioImage') => {
        updateForm(field, null);
    };

    const isSubmitDisabled = isLoading || !personaCreatorFormState.productImage || !personaCreatorFormState.scenarioDescription;
    const tokenCost = TOKEN_COSTS.PERSONA_POST;
    const generationButtonText = t('startGenerationWithCost', { cost: tokenCost });

    return (
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border">
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-2">{t('personaCreatorTitle')}</h2>
                    <p className="text-brand-subtle mb-6">{t('personaCreatorSubtitle')}</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-brand-text mb-4">{t('selectPersona')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {Object.entries(PERSONA_TEMPLATES).map(([key, persona]) => {
                                const isGenerating = generatingPersonaImage === key;
                                const customImage = personaImages[key];
                                const imageUrl = customImage ? `data:image/jpeg;base64,${customImage}` : persona.imageUrl;

                                return (
                                    <div
                                        key={key}
                                        onClick={() => updateForm('selectedPersona', key)}
                                        className={`p-3 rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                                            personaCreatorFormState.selectedPersona === key 
                                            ? 'border-brand-primary scale-105 bg-brand-primary/10 ring-2 ring-offset-2 ring-offset-brand-surface ring-brand-primary' 
                                            : 'border-brand-border bg-brand-soft-bg hover:border-brand-subtle hover:bg-brand-hover-bg'
                                        }`}
                                    >
                                        <div className="relative mb-3 group">
                                            <img src={imageUrl} alt={t(persona.nameKey)} className="w-full h-32 object-cover rounded-md" />
                                            
                                            {isGenerating && (
                                                <div className="absolute inset-0 bg-brand-surface/80 flex items-center justify-center rounded-md">
                                                    <svg className="animate-spin h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                </div>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleGeneratePersonaImage(key, persona.prompt);
                                                }}
                                                disabled={isGenerating || isLoading}
                                                className="absolute top-2 right-2 p-2 bg-brand-surface/70 backdrop-blur-sm rounded-full text-brand-secondary hover:bg-brand-surface shadow-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                                title={t('generatePersonaImage')}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M5 2a1 1 0 00-2 0v1h-1a1 1 0 000 2h1v1a1 1 0 002 0V5h1a1 1 0 100-2H5V2zM15 2a1 1 0 00-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0V5h1a1 1 0 100-2h-1V2zM5 12a1 1 0 00-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2H5v-1z" />
                                                    <path d="M11 6a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM3 10a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zM11 14a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="font-semibold text-sm text-brand-text truncate">{t(persona.nameKey)}</p>
                                        <p className="text-xs text-brand-subtle">{t(persona.descKey)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="scenarioDescription" className="block text-lg font-semibold text-brand-text mb-2">
                            {t('scenarioDescriptionLabel')}
                        </label>
                        <textarea
                            id="scenarioDescription"
                            value={personaCreatorFormState.scenarioDescription}
                            onChange={(e) => updateForm('scenarioDescription', e.target.value)}
                            placeholder={t('scenarioDescriptionPlaceholder')}
                            rows={3}
                            className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <input type="file" ref={scenarioImageInputRef} onChange={(e) => handleFileChange(e, 'scenarioImage')} accept="image/*" className="hidden" />
                            <ImageUploadArea label={t('uploadScenarioImage')} uploadedImage={personaCreatorFormState.scenarioImage} onUploadClick={() => scenarioImageInputRef.current?.click()} onRemoveClick={() => removeImage('scenarioImage')} />
                        </div>
                        <div>
                            <input type="file" ref={productImageInputRef} onChange={(e) => handleFileChange(e, 'productImage')} accept="image/*" className="hidden" />
                            <ImageUploadArea label={t('uploadProductForPersona')} uploadedImage={personaCreatorFormState.productImage} onUploadClick={() => productImageInputRef.current?.click()} onRemoveClick={() => removeImage('productImage')} />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center mt-8">
                    <button
                        onClick={handlePersonaSubmit}
                        disabled={isSubmitDisabled}
                        className="py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {isLoading ? t('generating') : generationButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonaCreatorForm;