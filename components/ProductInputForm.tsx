// components/ProductInputForm.tsx
import React, { useState, useContext, useCallback, useEffect, useRef } from 'react';
import { ProductFormData, MediaType, UploadedImage, CreativeSuggestions, Schedule } from '../types.ts';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import VoicePromptButton from './VoicePromptButton.tsx';
import SelfieCaptureModal from './SelfieCaptureModal.tsx';
import StyleSelector from './StyleSelector.tsx';
import { generateNarrationScript } from '../services/geminiService.ts';
import { generateCreativeSuggestions } from '../services/geminiService.ts';
import { TOKEN_COSTS, VIDEO_COSTS } from '../lib/tokenCosts.ts';
import AutomationScheduler from './AutomationScheduler.tsx';
import ApiKeySelector from './ApiKeySelector.tsx';

// Helper component for a more prominent image upload area
const ImageUploadArea: React.FC<{
    label: string;
    uploadedImage: UploadedImage | null;
    onUploadClick: () => void;
    onRemoveClick: () => void;
    isPrimary?: boolean;
}> = ({ label, uploadedImage, onUploadClick, onRemoveClick, isPrimary = false }) => {
    const { t } = useContext(LanguageContext);

    let containerClasses = "relative flex justify-center items-center w-full h-32 px-6 py-4 border-2 border-brand-border border-dashed rounded-md cursor-pointer hover:border-brand-primary transition-colors";
    let iconClasses = "mx-auto h-8 w-8 text-brand-subtle";
    let titleClasses = "mt-2 text-sm font-medium text-brand-subtle";
    let labelClasses = "block text-sm font-medium text-brand-subtle mb-2";

    if (isPrimary) {
        containerClasses = "relative flex flex-col justify-center items-center w-full h-52 px-6 py-4 border-2 border-brand-border border-dashed rounded-lg cursor-pointer bg-brand-soft-bg hover:bg-brand-hover-bg transition-all duration-300 ring-offset-brand-surface focus-within:ring-2 focus-within:ring-brand-primary focus-within:ring-offset-2";
        iconClasses = "mx-auto h-12 w-12 text-brand-subtle group-hover:text-brand-primary transition-colors";
        titleClasses = "mt-2 text-base font-semibold text-brand-subtle group-hover:text-brand-text transition-colors";
        labelClasses = "block text-lg font-semibold text-brand-text mb-2";
    }

    return (
        <div>
            <label className={labelClasses}>{label}</label>
            <div
                className={`${containerClasses} group`}
                onClick={onUploadClick}
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onUploadClick() }}
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
                        <svg className={iconClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" /></svg>
                        <h3 className={titleClasses}>{t('uploadAreaTitle')}</h3>
                        <p className="mt-1 text-xs text-brand-subtle">{t('uploadAreaSubtitle')}</p>
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 text-xs font-medium bg-brand-surface text-brand-text border border-brand-border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal z-10 pointer-events-none">
            {text}
        </div>
    </div>
);


export interface ProductInputFormProps {
    formData: ProductFormData;
    onFormChange: (formData: ProductFormData) => void;
    onFormSubmit: () => void;
    isLoading: boolean;
    outputType: MediaType;
    onOutputTypeChange: (type: MediaType) => void;
    onSaveAccount: () => void;
    schedule: Schedule;
    onScheduleChange: (schedule: Schedule) => void;
    isAutomationDisabled: boolean;
}

export const ProductInputForm: React.FC<ProductInputFormProps> = ({
    formData, onFormChange, onFormSubmit, isLoading, outputType, onOutputTypeChange, onSaveAccount,
    schedule, onScheduleChange, isAutomationDisabled
}) => {
    const { t, language } = useContext(LanguageContext);
    const appState = useContext(AppStateContext);
    const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
    const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
    const [aiSuggestedFields, setAiSuggestedFields] = useState<Record<string, boolean>>({});
    const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);

    const productImageInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const userSelfieInputRef = useRef<HTMLInputElement>(null);

    if (!appState) return null;
    const { handleError, handleTokenCost } = appState;

    const updateForm = useCallback((field: keyof ProductFormData, value: any) => {
        onFormChange({ ...formData, [field]: value });
    }, [formData, onFormChange]);

    useEffect(() => {
        // When switching to video, always default to 9:16 for Reels/Stories.
        if (outputType === 'video' && formData.audioType !== 'elevenlabs') {
            updateForm('aspectRatio', '9:16');
        }
    }, [outputType, formData.audioType, updateForm]);

    const handleSingleImageUpload = (file: File, field: 'productImage' | 'logoImage' | 'userSelfie') => {
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
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: 'productImage' | 'logoImage' | 'userSelfie') => {
        const file = event.target.files?.[0];
        if (!file) return;
        handleSingleImageUpload(file, field);
        if (event.target) event.target.value = '';
    };

    const removeImage = useCallback((field: 'productImage' | 'logoImage' | 'userSelfie') => {
        updateForm(field, null);
    }, [updateForm]);


    const handleVoicePromptGenerated = useCallback((text: string, field: keyof ProductFormData) => {
        updateForm(field, text);
    }, [updateForm]);
    
    const handleGenerateNarrationScript = useCallback(async () => {
        if (!formData.productName || !formData.productDescription || !formData.videoDuration) {
            handleError(new Error('narrationScriptMissingFields'), 'narrationScriptApiError');
            return;
        }
        if (!handleTokenCost(TOKEN_COSTS.PRODUCT_IMAGE / 2)) return; // Assuming half cost for just script

        try {
            const script = await generateNarrationScript(
                formData.productName,
                formData.productDescription,
                formData.marketingVibe,
                formData.videoDuration,
                language,
                formData.audioType
            );
            updateForm('narrationScript', script);
        } catch (err) {
            handleError(err as Error, 'narrationScriptApiError');
        }
    }, [formData, handleError, handleTokenCost, language, updateForm]);
    
    const handleGenerateAISuggestions = useCallback(async () => {
        setIsSuggestionLoading(true);
        try {
            if (!handleTokenCost(TOKEN_COSTS.CREATIVE_SUGGESTIONS_ANALYSIS)) {
                setIsSuggestionLoading(false);
                return;
            }

            const suggestions = await generateCreativeSuggestions(
                {
                    productName: formData.productName,
                    productDescription: formData.productDescription,
                    marketingVibe: formData.marketingVibe,
                    profileUrl: formData.profileUrl,
                    benchmarkProfileUrl: formData.benchmarkProfileUrl,
                },
                outputType,
                language
            );

            const updatedAiSuggestedFields: Record<string, boolean> = {};
            const newFormData = { ...formData };
            for (const key in suggestions) {
                const fieldKey = key as keyof CreativeSuggestions;
                const value = suggestions[fieldKey];
                if (value != null && value !== '' && !(newFormData as any)[fieldKey]) {
                    (newFormData as any)[fieldKey] = value;
                    updatedAiSuggestedFields[fieldKey] = true;
                }
            }
            onFormChange(newFormData);
            setAiSuggestedFields(updatedAiSuggestedFields);
            setTimeout(() => setAiSuggestedFields({}), 5000);

        } catch (err) {
            handleError(err as Error, 'creativeSuggestionsApiError');
        } finally {
            setIsSuggestionLoading(false);
        }
    }, [formData, outputType, language, handleError, handleTokenCost, onFormChange]);

    const isAudioOnly = formData.audioType === 'elevenlabs';
    let tokenCost;
    if (isAudioOnly) {
        tokenCost = TOKEN_COSTS.ELEVENLABS_AUDIO_GENERATION;
    } else if (outputType === 'image') {
        tokenCost = TOKEN_COSTS.PRODUCT_IMAGE;
    } else {
        tokenCost = VIDEO_COSTS[formData.videoDuration];
    }
    const generationButtonText = t('startGenerationWithCost', { cost: tokenCost });

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                {/* Basic Fields */}
                <div>
                    <label htmlFor="productName" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('productNameLabel')}
                    </label>
                    <input
                        type="text"
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => updateForm('productName', e.target.value)}
                        placeholder={t('productNamePlaceholder')}
                        className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                    />
                </div>
                <div>
                    <label htmlFor="productDescription" className="block text-sm font-medium text-brand-subtle mb-2">
                        {t('productDescriptionLabel')}
                    </label>
                    <div className="relative">
                        <textarea
                            id="productDescription"
                            value={formData.productDescription}
                            onChange={(e) => updateForm('productDescription', e.target.value)}
                            placeholder={t('productDescriptionPlaceholder')}
                            rows={3}
                            className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle pr-10 resize-y"
                        />
                        <div className="absolute top-2 right-2">
                            <VoicePromptButton 
                                onPromptGenerated={(text) => handleVoicePromptGenerated(text, 'productDescription')}
                                context={t('productDescriptionLabel')}
                                ariaLabel={t('voiceInputFor') + t('productDescriptionLabel')}
                            />
                        </div>
                    </div>
                </div>
                <input type="file" ref={productImageInputRef} onChange={(e) => handleFileChange(e, 'productImage')} accept="image/*" className="hidden" />
                <ImageUploadArea label={t('uploadProductImage')} uploadedImage={formData.productImage} onUploadClick={() => productImageInputRef.current?.click()} onRemoveClick={() => removeImage('productImage')} isPrimary />

                {/* Output Type Toggle */}
                <div className="flex space-x-4">
                    <button
                        onClick={() => onOutputTypeChange('image')}
                        className={`px-6 py-2 rounded-full text-base font-medium transition-colors ${
                            outputType === 'image' && !isAudioOnly
                                ? 'bg-brand-secondary text-white shadow-md'
                                : 'bg-brand-soft-bg text-brand-subtle hover:bg-brand-hover-bg'
                        }`}
                        disabled={isAudioOnly}
                    >
                        {t('outputFormatImage')}
                    </button>
                    <button
                        onClick={() => onOutputTypeChange('video')}
                        className={`px-6 py-2 rounded-full text-base font-medium transition-colors ${
                            outputType === 'video' && !isAudioOnly
                                ? 'bg-brand-secondary text-white shadow-md'
                                : 'bg-brand-soft-bg text-brand-subtle hover:bg-brand-hover-bg'
                        }`}
                        disabled={isAudioOnly}
                    >
                        {t('outputFormatVideo')}
                    </button>
                </div>
                
                {/* Advanced Settings */}
                <div className="border-t border-brand-border pt-6">
                    <button
                        onClick={() => setIsAdvancedSettingsOpen(!isAdvancedSettingsOpen)}
                        className="w-full flex justify-between items-center text-left text-xl font-bold text-brand-text mb-4"
                        aria-expanded={isAdvancedSettingsOpen}
                    >
                        <span>{t('advancedSettings')}</span>
                        <svg
                            className={`w-6 h-6 transform transition-transform ${isAdvancedSettingsOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isAdvancedSettingsOpen && (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <label htmlFor="marketingVibe" className="block text-sm font-medium text-brand-subtle mb-2">
                                    <span className="flex items-center">
                                        {t('marketingVibeLabel')}
                                        <HelpTooltip text={t('tooltipMarketingVibe')} />
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    id="marketingVibe"
                                    value={formData.marketingVibe}
                                    onChange={(e) => updateForm('marketingVibe', e.target.value)}
                                    placeholder={t('marketingVibePlaceholder')}
                                    className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                                />
                            </div>
                            <div>
                                <label htmlFor="profileUrl" className="block text-sm font-medium text-brand-subtle mb-2">
                                    {t('socialProfileUrl')}
                                </label>
                                <input
                                    type="url"
                                    id="profileUrl"
                                    value={formData.profileUrl}
                                    onChange={(e) => updateForm('profileUrl', e.target.value)}
                                    placeholder={t('profileUrlPlaceholder')}
                                    className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                                />
                            </div>
                            <div>
                                <label htmlFor="benchmarkProfileUrl" className="block text-sm font-medium text-brand-subtle mb-2">
                                    {t('benchmarkProfileUrl')}
                                </label>
                                <input
                                    type="url"
                                    id="benchmarkProfileUrl"
                                    value={formData.benchmarkProfileUrl || ''}
                                    onChange={(e) => updateForm('benchmarkProfileUrl', e.target.value)}
                                    placeholder={t('benchmarkProfileUrlPlaceholder')}
                                    className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                                />
                            </div>
                            <button
                                onClick={handleGenerateAISuggestions}
                                disabled={isSuggestionLoading || isLoading}
                                className="w-full py-2 px-4 border border-brand-primary/50 text-brand-primary/90 hover:bg-brand-primary/10 rounded-md shadow-sm text-sm font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSuggestionLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>{t('generating')}</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9.375 3.375A3 3 0 006.75 6v1.5a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5v-1.5c0-.966.784-1.75 1.75-1.75h1.5zm1.5-1.5a.75.75 0 00-1.5 0V3h-1.5A.75.75 0 006 3.75h-.75a.75.75 0 00-.75.75v.75a.75.75 0 00.75.75H6a.75.75 0 00.75-.75V6a.75.75 0 00-1.5 0v1.5a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5v-1.5c0-.966.784-1.75 1.75-1.75h1.5zM12 2.25a.75.75 0 00-1.5 0V3h-1.5A.75.75 0 006 3.75h-.75a.75.75 0 00-.75.75v.75a.75.75 0 00.75.75H6a.75.75 0 00.75-.75V6a.75.75 0 00-1.5 0v1.5a.75.75 0 01-.75.75H4.5a.75.75 0 010-1.5v-1.5c0-.966.784-1.75 1.75-1.75h1.5z" /><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3.5-3.5a.75.75 0 10-1.06 1.06l2.22 2.22H9.75a.75.75 0 000 1.5h4.19l-2.22 2.22a.75.75 0 101.06 1.06l3.5-3.5z" clipRule="evenodd" /></svg>
                                        <span>{t('generateAISuggestions')}</span>
                                    </>
                                )}
                            </button>
                            {/* Writing Personalization */}
                            <div>
                                <h3 className="text-lg font-semibold text-brand-text mb-2 flex items-center">{t('writingPersonalization')} <HelpTooltip text={t('tooltipWritingPersonalization')} /></h3>
                                <p className="text-sm text-brand-subtle mb-4">{t('writingPersonalizationDescription')}</p>
                                <div className="space-y-3">
                                    <input type="text" value={formData.postExample1} onChange={(e) => updateForm('postExample1', e.target.value)} placeholder={t('postExample1Placeholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />
                                    <input type="text" value={formData.postExample2} onChange={(e) => updateForm('postExample2', e.target.value)} placeholder={t('postExample2Placeholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />
                                    <input type="text" value={formData.postExample3} onChange={(e) => updateForm('postExample3', e.target.value)} placeholder={t('postExample3Placeholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />
                                </div>
                            </div>

                            {/* Creative Customizations */}
                            <div>
                                <h3 className="text-lg font-semibold text-brand-text mb-2">{t('creativeCustomizations')}</h3>
                                <p className="text-sm text-brand-subtle mb-4">{t('creativeCustomizationsDescription')}</p>
                                <div className="space-y-3">
                                    <div className="relative">
                                         <StyleSelector selectedStyle={formData.artisticStyle} onStyleChange={(style) => updateForm('artisticStyle', style)} />
                                        {aiSuggestedFields.artisticStyle && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}
                                    </div>
                                    <div className="relative">
                                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-brand-subtle mb-2">{t('aspectRatioLabel')}</label>
                                        {(outputType === 'image' || isAudioOnly) ? (
                                        <select id="aspectRatio" value={formData.aspectRatio} onChange={(e) => updateForm('aspectRatio', e.target.value)} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text" disabled={isAudioOnly}>
                                            <option value="1:1">{t('aspectRatio_1_1')}</option>
                                            <option value="9:16">{t('aspectRatio_9_16')}</option>
                                            <option value="16:9">{t('aspectRatio_16_9')}</option>
                                            <option value="4:3">{t('aspectRatio_4_3')}</option>
                                            <option value="3:4">{t('aspectRatio_3_4')}</option>
                                        </select>
                                        ) : (
                                        <div className="w-full px-3 py-2 border border-brand-border bg-brand-hover-bg rounded-md text-brand-subtle">
                                            {t('aspectRatio_9_16_video')}
                                        </div>
                                        )}
                                        {aiSuggestedFields.aspectRatio && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}
                                    </div>
                                    <div className="relative"><label htmlFor="negativePrompt" className="block text-sm font-medium text-brand-subtle mb-2"><span className="flex items-center">{t('negativePromptLabel')}<HelpTooltip text={t('tooltipNegativePrompt')} /></span></label><input type="text" id="negativePrompt" value={formData.negativePrompt} onChange={(e) => updateForm('negativePrompt', e.target.value)} placeholder={t('negativePromptPlaceholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />{aiSuggestedFields.negativePrompt && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}</div>
                                    <div className="relative"><label htmlFor="maskTemplate" className="block text-sm font-medium text-brand-subtle mb-2"><span className="flex items-center">{t('maskTemplateLabel')}<HelpTooltip text={t('tooltipMaskTemplate')} /></span></label><select id="maskTemplate" value={formData.maskTemplate} onChange={(e) => updateForm('maskTemplate', e.target.value)} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text"><option value="Nenhum">{t('maskTemplateNone')}</option><option value="Moderno com Círculo">{t('maskTemplateModernCircle')}</option><option value="Grunge com Pinceladas">{t('maskTemplateGrungeBrush')}</option><option value="Minimalista com Linhas">{t('maskTemplateMinimalLines')}</option><option value="minhaLogo">{t('maskTemplateMyLogo')}</option></select>{aiSuggestedFields.maskTemplate && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}</div>
                                    {formData.maskTemplate === 'minhaLogo' && (<><input type="file" ref={logoInputRef} onChange={(e) => handleFileChange(e, 'logoImage')} accept="image/*" className="hidden" /><ImageUploadArea label={t('uploadLogoImage')} uploadedImage={formData.logoImage} onUploadClick={() => logoInputRef.current?.click()} onRemoveClick={() => removeImage('logoImage')} /></>)}
                                    <div className="relative"><label htmlFor="colorPalette" className="block text-sm font-medium text-brand-subtle mb-2"><span className="flex items-center">{t('colorPaletteLabel')}<HelpTooltip text={t('tooltipColorPalette')} /></span></label><input type="text" id="colorPalette" value={formData.colorPalette} onChange={(e) => updateForm('colorPalette', e.target.value)} placeholder={t('colorPalettePlaceholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />{aiSuggestedFields.colorPalette && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}</div>
                                    <div><input type="file" ref={userSelfieInputRef} onChange={(e) => handleFileChange(e, 'userSelfie')} accept="image/*" className="hidden" /><ImageUploadArea label={t('uploadSelfie')} uploadedImage={formData.userSelfie} onUploadClick={() => setIsSelfieModalOpen(true)} onRemoveClick={() => removeImage('userSelfie')} /></div>
                                </div>
                            </div>
                            {(outputType === 'video' || isAudioOnly) && (
                                <div className="space-y-4 animate-fade-in">
                                    <h3 className="text-lg font-semibold text-brand-text mb-2">{t('videoSpecificSettings')}</h3>
                                    {outputType === 'video' && <ApiKeySelector />}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {!isAudioOnly && (
                                            <div className="relative">
                                                <label htmlFor="videoDuration" className="block text-sm font-medium text-brand-subtle mb-2">{t('videoDurationLabel')}</label>
                                                <select id="videoDuration" value={formData.videoDuration} onChange={(e) => updateForm('videoDuration', e.target.value as ProductFormData['videoDuration'])} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text">
                                                    <option value="5s">5 {t('seconds')}</option>
                                                    <option value="8s">8 {t('seconds')}</option>
                                                </select>
                                                {aiSuggestedFields.videoDuration && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}
                                            </div>
                                        )}
                                        <div className="relative">
                                            <label htmlFor="audioType" className="block text-sm font-medium text-brand-subtle mb-2">
                                                <span className="flex items-center">{t('audioTypeLabel')} <HelpTooltip text={t('tooltipElevenLabs')} /></span>
                                            </label>
                                            <select id="audioType" value={formData.audioType} onChange={(e) => updateForm('audioType', e.target.value as ProductFormData['audioType'])} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text">
                                                <option value="narration">{t('audioTypeNarration')}</option>
                                                <option value="dialogue">{t('audioTypeDialogue')}</option>
                                                <option value="elevenlabs">{t('audioTypeElevenLabs')}</option>
                                            </select>
                                            {aiSuggestedFields.audioType && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}
                                        </div>
                                    </div>

                                    {isAudioOnly && (
                                        <div className="animate-fade-in space-y-4 p-4 bg-brand-soft-bg border border-brand-border rounded-lg">
                                            <h4 className="font-semibold text-brand-text">{t('elevenLabsSettings')}</h4>
                                            {!formData.useCustomElevenLabs && (
                                                <div>
                                                    <label htmlFor="elevenLabsVoiceId" className="block text-sm font-medium text-brand-subtle mb-2">{t('elevenLabsPredefinedVoice')}</label>
                                                    <select id="elevenLabsVoiceId" value={formData.elevenLabsVoiceId} onChange={(e) => updateForm('elevenLabsVoiceId', e.target.value)} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text">
                                                        <option value="Rachel">Rachel (Calm, American)</option>
                                                        <option value="Adam">Adam (Deep, American)</option>
                                                        <option value="Antoni">Antoni (Well-rounded, American)</option>
                                                        <option value="Arnold">Arnold (Crisp, American)</option>
                                                        <option value="Bella">Bella (Warm, American)</option>
                                                    </select>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <input id="useCustomElevenLabs" type="checkbox" checked={formData.useCustomElevenLabs} onChange={(e) => updateForm('useCustomElevenLabs', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                                <label htmlFor="useCustomElevenLabs" className="ml-2 block text-sm text-brand-subtle">{t('elevenLabsUseCustomAccount')}</label>
                                            </div>
                                            {formData.useCustomElevenLabs && (
                                                <div className="space-y-2 animate-fade-in">
                                                    <input type="password" value={formData.customElevenLabsApiKey} onChange={(e) => updateForm('customElevenLabsApiKey', e.target.value)} placeholder={t('elevenLabsApiKeyPlaceholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />
                                                    <input type="text" value={formData.elevenLabsVoiceId} onChange={(e) => updateForm('elevenLabsVoiceId', e.target.value)} placeholder={t('elevenLabsVoiceIdPlaceholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!isAudioOnly && (
                                        <div className="relative">
                                            <label htmlFor="animationStyle" className="block text-sm font-medium text-brand-subtle mb-2">{t('animationStyleLabel')}</label>
                                            <select id="animationStyle" value={formData.animationStyle} onChange={(e) => updateForm('animationStyle', e.target.value as ProductFormData['animationStyle'])} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text">
                                                <option value="dynamic">{t('animationStyleDynamic')}</option>
                                                <option value="elegant">{t('animationStyleElegant')}</option>
                                                <option value="minimalist">{t('animationStyleMinimalist')}</option>
                                                <option value="cinematic">{t('animationStyleCinematic')}</option>
                                            </select>
                                            {aiSuggestedFields.animationStyle && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <label htmlFor="narrationScript" className="block text-sm font-medium text-brand-subtle mb-2">
                                            {/* FIX: Use renamed translation keys */}
                                            <span className="flex items-center">{t('narrationScriptLabel')}<HelpTooltip text={t('tooltipNarrationScript')} /></span>
                                        </label>
                                        <div className="flex space-x-2">
                                            <textarea id="narrationScript" value={formData.narrationScript} onChange={(e) => updateForm('narrationScript', e.target.value)} placeholder={formData.audioType === 'dialogue' ? t('dialogueScriptPlaceholder') : t('narrationScriptPlaceholder')} rows={4} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle resize-y" />
                                            <button type="button" onClick={handleGenerateNarrationScript} className="p-2 bg-brand-soft-bg hover:bg-brand-hover-bg rounded-md text-brand-text self-start disabled:opacity-50" disabled={isLoading}>{t('generate')}</button>
                                        </div>
                                    </div>
                                    {!isAudioOnly && (
                                        <>
                                            <div className="relative">
                                                <label htmlFor="backgroundMusic" className="block text-sm font-medium text-brand-subtle mb-2">{t('backgroundMusicLabel')}</label>
                                                <select id="backgroundMusic" value={formData.backgroundMusic} onChange={(e) => updateForm('backgroundMusic', e.target.value as ProductFormData['backgroundMusic'])} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text">
                                                    <option value="none">{t('backgroundMusicNone')}</option>
                                                    <option value="epic">{t('backgroundMusicEpic')}</option>
                                                    <option value="upbeat">{t('backgroundMusicUpbeat')}</option>
                                                    <option value="lofi">{t('backgroundMusicLofi')}</option>
                                                    <option value="ai_generated">{t('backgroundMusicAIGenerated')}</option>
                                                </select>
                                                {aiSuggestedFields.backgroundMusic && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}
                                            </div>
                                            {formData.backgroundMusic === 'ai_generated' && (
                                                <div className="relative">
                                                    <label htmlFor="musicDescription" className="block text-sm font-medium text-brand-subtle mb-2">{t('musicDescriptionLabel')}</label>
                                                    <input type="text" id="musicDescription" value={formData.musicDescription} onChange={(e) => updateForm('musicDescription', e.target.value)} placeholder={t('musicDescriptionPlaceholder')} className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle" />
                                                    {aiSuggestedFields.musicDescription && <span className="absolute top-0 right-0 -mt-2 -mr-2 text-xs text-brand-success animate-pop-in">{t('aiSuggested')}</span>}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            
                            <div className="border-t border-brand-border pt-6">
                                <AutomationScheduler
                                    schedule={schedule}
                                    setSchedule={onScheduleChange}
                                    isDisabled={isAutomationDisabled}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mt-8">
                    <button onClick={onSaveAccount} className="py-2 px-4 border border-brand-border rounded-md shadow-sm text-sm font-medium text-brand-subtle bg-brand-soft-bg hover:bg-brand-hover-bg transition-colors">{t('saveAccountButton')}</button>
                    <button onClick={onFormSubmit} disabled={isLoading} className="py-3 px-6 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">{isLoading ? t('generating') : generationButtonText}</button>
                </div>
            </div>

            <SelfieCaptureModal
                isOpen={isSelfieModalOpen}
                onClose={() => setIsSelfieModalOpen(false)}
                onSelfieConfirm={(selfie) => {
                    updateForm('userSelfie', selfie);
                }}
            />
        </div>
    );
};