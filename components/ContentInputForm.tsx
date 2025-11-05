import React, { useContext, useState } from 'react';
import { ContentFormData, UploadedImage, MediaType } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS, VIDEO_COSTS } from '../lib/tokenCosts';
import VoicePromptButton from './VoicePromptButton';
import StyleSelector from './StyleSelector';
import SelfieCaptureModal from './SelfieCaptureModal';
import { generateContentNarrationScript } from '../services/contentMarketingService';

interface ContentInputFormProps {
    formState: ContentFormData;
    setFormState: (state: any) => void;
    outputType: MediaType;
    setOutputType: (type: MediaType) => void;
    onSubmit: () => void;
    onClear: () => void;
    isLoading: boolean;
    onOpenSaveModal: () => void;
}

const ContentInputForm: React.FC<ContentInputFormProps> = ({ formState, setFormState, outputType, setOutputType, onSubmit, onClear, isLoading, onOpenSaveModal }) => {
    const { t, language } = useContext(LanguageContext);
    const { currentUser } = useContext(AuthContext);
    const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
    const [isNarrationLoading, setIsNarrationLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        // Convert carouselSlides to number
        const newValue = name === 'carouselSlides' ? parseInt(value, 10) : value;
        setFormState({ ...formState, [name]: newValue });
    };

    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState({
                    ...formState,
                    logoImage: {
                        base64: (reader.result as string).split(',')[1],
                        mimeType: file.type,
                        name: file.name,
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelfieConfirm = (selfie: UploadedImage) => {
        setFormState({ ...formState, userSelfie: selfie });
    };
    
     const handleGenerateNarration = async () => {
        setIsNarrationLoading(true);
        try {
            const script = await generateContentNarrationScript(
                formState.profession,
                formState.targetAudience,
                formState.professionalContext,
                formState.videoDuration,
                language
            );
            setFormState({ ...formState, narrationScript: script });
        } catch (error) {
            console.error("Failed to generate narration:", error);
        } finally {
            setIsNarrationLoading(false);
        }
    };
    
    const cost = outputType === 'video' 
        ? VIDEO_COSTS[formState.videoDuration as keyof typeof VIDEO_COSTS]
        : TOKEN_COSTS.CONTENT_POST * (formState.postFormat === 'carousel' ? formState.carouselSlides : 1);

    const buttonText = currentUser?.isAdmin
        ? t('generate')
        : `${t('generateContentPost')} (${cost} ${t('tokens')})`;


    return (
        <>
        <div className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="profession" className="block text-sm font-medium text-brand-subtle mb-2">{t('professionLabel')}</label>
                <input type="text" name="profession" id="profession" value={formState.profession} onChange={handleInputChange} placeholder={t('professionPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
            </div>
             <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-brand-subtle mb-2">{t('targetAudienceLabel')}</label>
                <input type="text" name="targetAudience" id="targetAudience" value={formState.targetAudience} onChange={handleInputChange} placeholder={t('targetAudienceContentPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <label htmlFor="professionalContext" className="block text-sm font-medium text-brand-subtle">{t('contextLabel')}</label>
                    <VoicePromptButton
                        onPromptGenerated={(text) => setFormState({ ...formState, professionalContext: text })}
                        context={formState.professionalContext}
                        ariaLabel={t('generatePromptWithAudio')}
                    />
                </div>
                <textarea name="professionalContext" id="professionalContext" rows={2} value={formState.professionalContext} onChange={handleInputChange} placeholder={t('contextPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
            </div>
            <div>
                <label htmlFor="profileUrl" className="block text-sm font-medium text-brand-subtle mb-2">{t('profileUrlForAnalysis')}</label>
                <input type="url" name="profileUrl" id="profileUrl" value={formState.profileUrl} onChange={handleInputChange} placeholder={t('profileUrlPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
            </div>
            
             {/* Post Format Selection */}
            <div className="space-y-4 pt-4 border-t border-slate-700/50">
                 <h3 className="text-md font-semibold text-brand-text">{t('postFormatTitle')}</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className={`${outputType === 'video' ? 'opacity-50' : ''}`}>
                        <label htmlFor="postFormat" className="block text-sm font-medium text-brand-subtle mb-2">{t('format')}</label>
                        <select name="postFormat" id="postFormat" value={outputType === 'video' ? 'single' : formState.postFormat} onChange={handleInputChange} disabled={outputType === 'video'} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text disabled:cursor-not-allowed">
                            <option value="single">{t('singlePost')}</option>
                            <option value="carousel">{t('carouselPost')}</option>
                        </select>
                         {outputType === 'video' && <p className="text-xs text-slate-500 mt-1">{t('carouselVideoDisabled')}</p>}
                    </div>
                     {formState.postFormat === 'carousel' && outputType === 'image' && (
                        <div className="animate-fade-in">
                            <label htmlFor="carouselSlides" className="block text-sm font-medium text-brand-subtle mb-2">{t('numberOfSlides')}</label>
                            <select name="carouselSlides" id="carouselSlides" value={formState.carouselSlides} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text">
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                                <option value={6}>6</option>
                                <option value={7}>7</option>
                            </select>
                        </div>
                     )}
                </div>
            </div>

            {/* Creative Customizations */}
            <div className="space-y-4 pt-4 border-t border-slate-700/50">
                 <StyleSelector
                    selectedStyle={formState.artisticStyle}
                    onStyleChange={(style) => setFormState({ ...formState, artisticStyle: style })}
                 />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-brand-subtle mb-2">{t('aspectRatioLabel')}</label>
                        <select name="aspectRatio" id="aspectRatio" value={formState.aspectRatio} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text">
                            <option value="1:1">1:1 (Square)</option>
                            <option value="9:16">9:16 (Vertical)</option>
                            <option value="16:9">16:9 (Horizontal)</option>
                            {outputType === 'image' && <option value="4:3">4:3 (Classic)</option>}
                            {outputType === 'image' && <option value="3:4">3:4 (Portrait)</option>}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="negativePrompt" className="block text-sm font-medium text-brand-subtle mb-2">{t('negativePromptLabel')}</label>
                        <input type="text" name="negativePrompt" id="negativePrompt" value={formState.negativePrompt} onChange={handleInputChange} placeholder={t('negativePromptPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
                    </div>
                     <div>
                        <label htmlFor="maskTemplate" className="block text-sm font-medium text-brand-subtle mb-2">{t('maskTemplateLabel')}</label>
                        <select name="maskTemplate" id="maskTemplate" value={formState.maskTemplate} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text">
                            <option>{t('maskNone')}</option>
                            <option>{t('maskModern')}</option>
                            <option>{t('maskGrunge')}</option>
                            <option>{t('maskMinimalist')}</option>
                            <option value="minhaLogo">{t('maskMyLogo')}</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="colorPalette" className="block text-sm font-medium text-brand-subtle mb-2">{t('colorPaletteLabel')}</label>
                        <input type="text" name="colorPalette" id="colorPalette" value={formState.colorPalette} onChange={handleInputChange} placeholder={t('colorPalettePlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-subtle mb-2">{t('logoUploadLabel')}</label>
                    <div className="mt-2 flex items-center gap-x-3">
                        {formState.logoImage ? (
                            <img src={`data:${formState.logoImage.mimeType};base64,${formState.logoImage.base64}`} alt="Logo Preview" className="h-12 w-12 rounded-md bg-slate-700 object-contain" />
                        ) : (
                            <svg className="h-12 w-12 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
                        )}
                        <label htmlFor="logo-upload" className="rounded-md bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-brand-subtle shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-700">
                           <span>{formState.logoImage ? t('changeLogo') : t('uploadLogo')}</span>
                           <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*"/>
                        </label>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-brand-subtle mb-2">{t('includeSelfieLabel')}</label>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSelfieModalOpen(true)} className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-brand-subtle shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-700">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
                           <span>{formState.userSelfie ? t('changeLogo') : t('includeSelfieLabel')}</span>
                        </button>
                         {formState.userSelfie && (
                            <div className="relative group">
                                <img src={`data:${formState.userSelfie.mimeType};base64,${formState.userSelfie.base64}`} alt="Selfie Preview" className="h-12 w-12 rounded-md object-cover" />
                                <button onClick={() => setFormState({ ...formState, userSelfie: null })} className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-4 h-4 rounded-full bg-red-600 group-hover:hidden"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={onOpenSaveModal}
                    className="py-2 px-4 border border-slate-600 rounded-md text-sm font-medium text-brand-subtle bg-slate-700/50 hover:bg-slate-700"
                >
                    {t('savePreferences')}
                </button>
            </div>

            <div>
                <label className="block text-sm font-medium text-brand-subtle mb-2">{t('outputFormat')}</label>
                <div className="flex rounded-md shadow-sm">
                    <button onClick={() => setOutputType('image')} className={`relative inline-flex items-center justify-center w-1/2 rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${outputType === 'image' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>{t('image')}</button>
                    <button onClick={() => setOutputType('video')} className={`relative -ml-px inline-flex items-center justify-center w-1/2 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${outputType === 'video' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>{t('video')}</button>
                </div>
            </div>

            {outputType === 'video' && (
                <div className="space-y-6 pt-4 border-t border-slate-700/50 animate-fade-in">
                    <div className="space-y-4">
                        <h3 className="text-md font-semibold text-brand-text">{t('videoStyleOptions')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="videoDuration" className="block text-sm font-medium text-brand-subtle mb-2">{t('videoDurationLabel')}</label>
                                <select name="videoDuration" id="videoDuration" value={formState.videoDuration} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text">
                                    {(Object.keys(VIDEO_COSTS) as Array<keyof typeof VIDEO_COSTS>).map(duration => {
                                        const durationTextMap: Record<string, string> = {
                                            '5s': t('duration5s'),
                                            '10s': t('duration10s'),
                                            '15s': t('duration15s'),
                                        };
                                        return (
                                            <option key={duration} value={duration}>
                                                {t('videoDurationOption', { duration: durationTextMap[duration], cost: VIDEO_COSTS[duration], tokens: t('tokens') })}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="animationStyle" className="block text-sm font-medium text-brand-subtle mb-2">{t('animationStyleLabel')}</label>
                                <select name="animationStyle" id="animationStyle" value={formState.animationStyle} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text">
                                    <option value="dynamic">{t('styleDynamic')}</option>
                                    <option value="elegant">{t('styleElegant')}</option>
                                    <option value="minimalist">{t('styleMinimalist')}</option>
                                    <option value="cinematic">{t('styleCinematic')}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                     {/* Audio Customizations */}
                    <div className="space-y-4 pt-4 border-t border-slate-700/50">
                        <h3 className="text-md font-semibold text-brand-text">{t('videoAudioOptions')}</h3>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="narrationScript" className="block text-sm font-medium text-brand-subtle">{t('narrationScriptLabel')}</label>
                                <button onClick={handleGenerateNarration} disabled={isNarrationLoading} className="text-xs text-brand-primary hover:text-brand-secondary disabled:opacity-50 flex items-center">
                                    {isNarrationLoading ? (
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    ) : (
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                    )}
                                    {t('generateNarrationAi')}
                                </button>
                            </div>
                            <textarea id="narrationScript" name="narrationScript" rows={3} value={formState.narrationScript} onChange={handleInputChange} placeholder={t('narrationScriptPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
                        </div>
                         <div>
                            <label htmlFor="backgroundMusic" className="block text-sm font-medium text-brand-subtle mb-2">{t('backgroundMusicLabel')}</label>
                            <select name="backgroundMusic" id="backgroundMusic" value={formState.backgroundMusic} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text">
                                <option value="none">{t('musicNone')}</option>
                                <option value="epic">{t('musicEpic')}</option>
                                <option value="upbeat">{t('musicUpbeat')}</option>
                                <option value="lofi">{t('musicLofi')}</option>
                                <option value="ai_generated">{t('musicAiGenerated')}</option>
                            </select>
                        </div>
                        {formState.backgroundMusic === 'ai_generated' && (
                            <div className="animate-fade-in">
                                <label htmlFor="musicDescription" className="block text-sm font-medium text-brand-subtle mb-2">
                                    {t('musicDescriptionLabel')}
                                </label>
                                <textarea
                                    id="musicDescription"
                                    name="musicDescription"
                                    rows={2}
                                    value={formState.musicDescription}
                                    onChange={handleInputChange}
                                    placeholder={t('musicDescriptionPlaceholder')}
                                    className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                    onClick={onSubmit}
                    disabled={isLoading}
                    className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-brand-bg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isLoading ? t('generating') : buttonText}
                </button>
                 <button
                    onClick={onClear}
                    disabled={isLoading}
                    className="w-full sm:w-auto py-3 px-6 border border-slate-600 rounded-md text-lg font-medium text-brand-subtle bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50"
                >
                    {t('clear')}
                </button>
            </div>
        </div>
        <SelfieCaptureModal 
            isOpen={isSelfieModalOpen}
            onClose={() => setIsSelfieModalOpen(false)}
            onSelfieConfirm={handleSelfieConfirm}
        />
        </>
    );
};

export default ContentInputForm;