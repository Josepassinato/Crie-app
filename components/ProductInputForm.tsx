import React, { useContext } from 'react';
import { MediaType, UploadedImage } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';

interface ProductInputFormProps {
    formState: {
        productName: string;
        productDescription: string;
        marketingVibe: string;
        productImage: UploadedImage | null;
    };
    setFormState: (state: any) => void;
    outputType: MediaType;
    setOutputType: (type: MediaType) => void;
    onSubmit: () => void;
    onClear: () => void;
    isLoading: boolean;
}

const ProductInputForm: React.FC<ProductInputFormProps> = ({ formState, setFormState, outputType, setOutputType, onSubmit, onClear, isLoading }) => {
    const { t } = useContext(LanguageContext);
    const { currentUser } = useContext(AuthContext);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState({
                    ...formState,
                    productImage: {
                        base64: (reader.result as string).split(',')[1],
                        mimeType: file.type,
                        name: file.name,
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const cost = outputType === 'image' ? TOKEN_COSTS.PRODUCT_IMAGE : TOKEN_COSTS.PRODUCT_VIDEO;
    const buttonText = currentUser?.isAdmin
        ? t('generate')
        : `${t('generateProductMedia')} (${cost} ${t('tokens')})`;

    return (
        <div className="space-y-6 animate-fade-in">
             <div>
                <label htmlFor="productName" className="block text-sm font-medium text-brand-subtle mb-2">{t('productNameLabel')}</label>
                <input type="text" name="productName" id="productName" value={formState.productName} onChange={handleInputChange} placeholder={t('productNamePlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
            </div>
            <div>
                <label htmlFor="productDescription" className="block text-sm font-medium text-brand-subtle mb-2">{t('productDescriptionLabel')}</label>
                <textarea id="productDescription" name="productDescription" rows={3} value={formState.productDescription} onChange={handleInputChange} placeholder={t('productDescriptionPlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
            </div>
            <div>
                <label htmlFor="marketingVibe" className="block text-sm font-medium text-brand-subtle mb-2">{t('campaignVibeLabel')}</label>
                <input type="text" id="marketingVibe" name="marketingVibe" value={formState.marketingVibe} onChange={handleInputChange} placeholder={t('campaignVibePlaceholder')} className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition text-brand-text"/>
            </div>

            <div>
                <label className="block text-sm font-medium text-brand-subtle mb-2">{t('productImageUploadLabel')}</label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600 px-6 py-10">
                    <div className="text-center">
                        {formState.productImage ? (
                             <img src={`data:${formState.productImage.mimeType};base64,${formState.productImage.base64}`} alt="Preview" className="mx-auto h-24 w-auto rounded-md" />
                        ) : (
                            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                        <div className="mt-4 flex text-sm leading-6 text-gray-400">
                            <label htmlFor="product-image-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-secondary focus-within:ring-offset-2 focus-within:ring-offset-brand-surface hover:text-brand-secondary">
                                <span>{t('uploadFile')}</span>
                                <input id="product-image-upload" name="product-image-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*"/>
                            </label>
                            <p className="pl-1">{t('dragAndDrop')}</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500">{t('fileTypes')}</p>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-brand-subtle mb-2">{t('outputFormat')}</label>
                <div className="flex rounded-md shadow-sm">
                    <button onClick={() => setOutputType('image')} className={`relative inline-flex items-center justify-center w-1/2 rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${outputType === 'image' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>{t('image')}</button>
                    <button onClick={() => setOutputType('video')} className={`relative -ml-px inline-flex items-center justify-center w-1/2 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${outputType === 'video' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>{t('video')}</button>
                </div>
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

export default ProductInputForm;