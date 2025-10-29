import React, { useContext } from 'react';
import { ContentFormData } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';

interface ContentInputFormProps {
    formState: ContentFormData;
    setFormState: (state: any) => void;
    onSubmit: () => void;
    onClear: () => void;
    isLoading: boolean;
    onOpenSaveModal: () => void;
}

const ContentInputForm: React.FC<ContentInputFormProps> = ({ formState, setFormState, onSubmit, onClear, isLoading, onOpenSaveModal }) => {
    const { t } = useContext(LanguageContext);
    const { currentUser } = useContext(AuthContext);

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
    
    const cost = TOKEN_COSTS.CONTENT_POST * (formState.postFormat === 'carousel' ? formState.carouselSlides : 1);
    const buttonText = currentUser?.isAdmin
        ? t('generate')
        : `${t('generateContentPost')} (${cost} ${t('tokens')})`;


    return (
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
                <label htmlFor="professionalContext" className="block text-sm font-medium text-brand-subtle mb-2">{t('contextLabel')}</label>
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
                     <div>
                        <label htmlFor="postFormat" className="block text-sm font-medium text-brand-subtle mb-2">{t('format')}</label>
                        <select name="postFormat" id="postFormat" value={formState.postFormat} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text">
                            <option value="single">{t('singlePost')}</option>
                            <option value="carousel">{t('carouselPost')}</option>
                        </select>
                    </div>
                     {formState.postFormat === 'carousel' && (
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
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <svg className="h-12 w-12 text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" /></svg>
                        )}
                        <label htmlFor="logo-upload" className="rounded-md bg-slate-800 px-2.5 py-1.5 text-sm font-semibold text-brand-subtle shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-700">
                           <span>{formState.logoImage ? t('changeLogo') : t('uploadLogo')}</span>
                           <input id="logo-upload" name="logo-upload" type="file" className="sr-only" onChange={handleLogoChange} accept="image/*"/>
                        </label>
                    </div>
                </div>
            </div>

            {/* Writing Personalization */}
            <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <h3 className="text-md font-semibold text-brand-text">{t('writingPersonalizationTitle')}</h3>
                <p className="text-sm text-brand-subtle -mt-2">{t('writingPersonalizationDesc')}</p>
                 <div>
                    <label htmlFor="postExample1" className="block text-sm font-medium text-brand-subtle mb-2">{t('postExampleLabel')} 1</label>
                    <textarea name="postExample1" id="postExample1" rows={2} value={formState.postExample1} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                </div>
                 <div>
                    <label htmlFor="postExample2" className="block text-sm font-medium text-brand-subtle mb-2">{t('postExampleLabel')} 2</label>
                    <textarea name="postExample2" id="postExample2" rows={2} value={formState.postExample2} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                </div>
                 <div>
                    <label htmlFor="postExample3" className="block text-sm font-medium text-brand-subtle mb-2">{t('postExampleLabel')} 3</label>
                    <textarea name="postExample3" id="postExample3" rows={2} value={formState.postExample3} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
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
    );
};

export default ContentInputForm;
