// components/SpecialCreatorForm.tsx
import React, { useState, useContext, useCallback, useRef } from 'react';
import { SpecialCreatorFormData, UploadedImage } from '../types.ts';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import { TOKEN_COSTS } from '../lib/tokenCosts.ts';
import { enhanceVideoPrompt } from '../services/geminiService.ts';
import ApiKeySelector from './ApiKeySelector.tsx';

const ImageUploadArea: React.FC<{
    label: string;
    uploadedImage: UploadedImage | null;
    onUploadClick: () => void;
    onRemoveClick: () => void;
}> = ({ label, uploadedImage, onUploadClick, onRemoveClick }) => {
    const { t } = useContext(LanguageContext);

    return (
        <div>
            <label className="block text-sm font-medium text-brand-subtle mb-2">{label}</label>
            <div
                className="relative flex justify-center items-center w-full aspect-video bg-slate-900/50 px-6 py-4 border-2 border-slate-600 border-dashed rounded-md cursor-pointer hover:border-brand-primary transition-colors overflow-hidden group"
                onClick={onUploadClick}
            >
                {/* Safe Area Overlay */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full aspect-[9/16] border-x-2 border-dashed border-white/20 pointer-events-none group-hover:border-white/40 transition-colors">
                     <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs text-white/20 group-hover:text-white/40">9:16</div>
                </div>

                {uploadedImage ? (
                    <>
                        <img src={`data:${uploadedImage.mimeType};base64,${uploadedImage.base64}`} alt={label} className="h-full w-full object-contain rounded-md" />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveClick();
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs opacity-75 hover:opacity-100 transition-opacity z-10"
                            aria-label={`Remove ${label}`}
                        >
                            &times;
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <svg className="mx-auto h-8 w-8 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" /></svg>
                        <h3 className="mt-2 text-sm font-medium text-brand-subtle">{t('uploadAreaTitle')}</h3>
                        <p className="mt-1 text-xs text-slate-500">{t('uploadAreaSubtitle')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const HelpTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="relative inline-flex items-center group ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-subtle cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal z-10 pointer-events-none">
            {text}
        </div>
    </div>
);

const SpecialCreatorForm: React.FC = () => {
    const { t, language } = useContext(LanguageContext);
    const [isRefining, setIsRefining] = useState(false);
    const [promptIsAiGenerated, setPromptIsAiGenerated] = useState(false);
    const appState = useContext(AppStateContext);
    
    if (!appState) return null;
    const { 
        specialCreatorFormState, 
        setSpecialCreatorFormState,
        handleSpecialCreatorSubmit,
        isLoading,
        handleTokenCost,
        handleError
    } = appState;
    const { formData } = specialCreatorFormState;

    const backgroundImageInputRef = useRef<HTMLInputElement>(null);
    const assetImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const updateForm = useCallback((field: keyof SpecialCreatorFormData, value: any) => {
        setSpecialCreatorFormState(prev => ({ ...prev, formData: { ...prev.formData, [field]: value } }));
    }, [setSpecialCreatorFormState]);

    const handleRefinePrompt = useCallback(async () => {
        setIsRefining(true);
        try {
            if (!handleTokenCost(TOKEN_COSTS.PROMPT_ENHANCEMENT)) {
                setIsRefining(false);
                return;
            }

            const enhancedPrompt = await enhanceVideoPrompt(
                formData.prompt,
                formData.backgroundImage,
                formData.assetImages,
                language
            );
            updateForm('prompt', enhancedPrompt);
            setPromptIsAiGenerated(true);
        } catch (err) {
            handleError(err as Error, 'creativeSuggestionsApiError'); // Reusing error key
        } finally {
            setIsRefining(false);
        }
    }, [formData, language, updateForm, handleTokenCost, handleError]);

    const handleDeleteAiPrompt = () => {
        updateForm('prompt', '');
        setPromptIsAiGenerated(false);
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'backgroundImage' | 'assetImage', index?: number) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                const uploadedImage: UploadedImage = {
                    base64: (reader.result as string).split(',')[1],
                    mimeType: file.type,
                    name: file.name,
                };

                if (field === 'backgroundImage') {
                    updateForm('backgroundImage', uploadedImage);
                } else if (field === 'assetImage' && index !== undefined) {
                    const newAssetImages = [...formData.assetImages];
                    newAssetImages[index] = uploadedImage;
                    updateForm('assetImages', newAssetImages);
                }
            }
        };
        reader.readAsDataURL(file);

        if (event.target) event.target.value = '';
    };

    const removeImage = useCallback((field: 'backgroundImage') => {
        updateForm(field, null);
    }, [updateForm]);

    const addAssetImageSlot = () => {
        if (formData.assetImages.length < 2) {
            updateForm('assetImages', [...formData.assetImages, null]);
        }
    };

    const removeAssetImage = (index: number) => {
        const newAssetImages = formData.assetImages.filter((_, i) => i !== index);
        updateForm('assetImages', newAssetImages);
    };

    const tokenCost = TOKEN_COSTS.SPECIAL_VIDEO_COMPOSITION;
    const generationButtonText = t('generateSpecialVideo', { cost: tokenCost });
    const refineButtonText = t('refineWithAI', { cost: TOKEN_COSTS.PROMPT_ENHANCEMENT });

    return (
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700">
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-2">{t('specialCreatorTitle')}</h2>
                    <p className="text-brand-subtle mb-6">{t('specialCreatorSubtitle')}</p>
                </div>

                <div className="space-y-4">
                    <ApiKeySelector />
                    <input type="file" ref={backgroundImageInputRef} onChange={(e) => handleFileChange(e, 'backgroundImage')} accept="image/*" className="hidden" />
                    <ImageUploadArea label={t('backgroundImageLabel')} uploadedImage={formData.backgroundImage} onUploadClick={() => backgroundImageInputRef.current?.click()} onRemoveClick={() => removeImage('backgroundImage')} />
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-brand-subtle">{t('assetImagesLabel')}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Array.from({ length: formData.assetImages.length }).map((_, index) => (
                                <div key={index}>
                                    <input type="file" ref={el => assetImageInputRefs.current[index] = el} onChange={(e) => handleFileChange(e, 'assetImage', index)} accept="image/*" className="hidden" />
                                    <ImageUploadArea label={t('assetImagePlaceholder', {num: index + 1})} uploadedImage={formData.assetImages[index]} onUploadClick={() => assetImageInputRefs.current[index]?.click()} onRemoveClick={() => removeAssetImage(index)} />
                                </div>
                            ))}
                        </div>
                        {formData.assetImages.length < 2 && (
                            <button type="button" onClick={addAssetImageSlot} className="w-full mt-2 py-2 px-4 border border-slate-600 rounded-md shadow-sm text-sm font-medium text-brand-subtle bg-slate-700/50 hover:bg-slate-700 transition-colors">{t('addAssetImage')}</button>
                        )}
                    </div>

                    <div>
                        <label htmlFor="special-prompt" className="block text-sm font-medium text-brand-subtle mb-2">
                            <span className="flex items-center">
                                {t('videoPromptLabelComposite')}
                                <HelpTooltip text={t('tooltipVideoPromptComposite')} />
                            </span>
                        </label>
                        <div className="relative">
                            <textarea
                                id="special-prompt"
                                value={formData.prompt}
                                onChange={(e) => {
                                    updateForm('prompt', e.target.value);
                                    if(promptIsAiGenerated) setPromptIsAiGenerated(false);
                                }}
                                placeholder={t('tooltipVideoPromptComposite')}
                                rows={5}
                                className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500 pr-10 resize-y"
                            />
                            <div className="absolute top-2 right-2 flex flex-col space-y-2">
                                <div className="relative group">
                                    <button type="button" onClick={handleRefinePrompt} disabled={isRefining || isLoading} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-brand-text self-start disabled:opacity-50">
                                        {isRefining ? <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 2.043A1 1 0 0112 3v1.36l.003.002a7.5 7.5 0 014.656 2.443l.893-1.25a1 1 0 111.69 1.206l-.892 1.25a7.5 7.5 0 010 6.492l.892 1.25a1 1 0 11-1.69 1.206l-.893-1.25a7.5 7.5 0 01-4.656 2.443v1.36a1 1 0 11-2 0v-1.36a7.5 7.5 0 01-4.656-2.443l-.893 1.25a1 1 0 01-1.69-1.206l.892-1.25a7.5 7.5 0 010-6.492l-.892-1.25a1 1 0 111.69-1.206l.893 1.25A7.5 7.5 0 019 4.362V3a1 1 0 01.7-.957zM10 6.5A3.5 3.5 0 1010 13.5 3.5 3.5 0 0010 6.5z" clipRule="evenodd" /></svg>}
                                    </button>
                                     <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{t('tooltipRefineWithAI')}</div>
                                </div>
                                {promptIsAiGenerated && (
                                    <div className="relative group">
                                        <button type="button" onClick={handleDeleteAiPrompt} disabled={isLoading} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-red-400 self-start disabled:opacity-50">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                        </button>
                                        <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{t('tooltipDeleteAiPrompt')}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                        <p className="text-sm text-brand-subtle"><span className="font-bold text-yellow-400">{t('note')}:</span> {t('aspectRatioFixedNote')}</p>
                    </div>

                    <div className="flex justify-end items-center mt-8">
                        <button onClick={handleSpecialCreatorSubmit} disabled={isLoading || (!formData.backgroundImage && formData.assetImages.every(i => !i)) || !formData.prompt} className="py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">{isLoading ? t('generating') : generationButtonText}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialCreatorForm;