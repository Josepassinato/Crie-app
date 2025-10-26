import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { AuthContext } from '../contexts/AuthContext';
import { TOKEN_COSTS } from '../lib/tokenCosts';

interface ContentInputFormProps {
    formState: {
        profession: string;
        targetAudience: string;
        professionalContext: string;
    };
    setFormState: (state: any) => void;
    onSubmit: () => void;
    onClear: () => void;
    isLoading: boolean;
}

const OptionalLabel: React.FC = () => {
    const { t } = useContext(LanguageContext);
    return <span className="text-xs text-slate-500 ml-1">({t('optional')})</span>;
};

const ContentInputForm: React.FC<ContentInputFormProps> = ({ formState, setFormState, onSubmit, onClear, isLoading }) => {
    const { t } = useContext(LanguageContext);
    const { currentUser } = useContext(AuthContext);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const buttonText = currentUser?.isAdmin
        ? t('generate')
        : `${t('generateContentPost')} (${TOKEN_COSTS.CONTENT_POST} ${t('tokens')})`;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <label htmlFor="profession" className="block text-sm font-medium text-brand-subtle mb-2">{t('professionLabel')}</label>
                <input
                    type="text"
                    name="profession"
                    id="profession"
                    value={formState.profession}
                    onChange={handleInputChange}
                    placeholder={t('professionPlaceholder')}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                />
            </div>
            <div>
                <label htmlFor="targetAudience" className="block text-sm font-medium text-brand-subtle mb-2">{t('targetAudienceLabel')} <OptionalLabel /></label>
                <input
                    type="text"
                    name="targetAudience"
                    id="targetAudience"
                    value={formState.targetAudience}
                    onChange={handleInputChange}
                    placeholder={t('targetAudienceContentPlaceholder')}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                />
            </div>
            <div>
                <label htmlFor="professionalContext" className="block text-sm font-medium text-brand-subtle mb-2">{t('additionalContextLabel')} <OptionalLabel /></label>
                <textarea
                    name="professionalContext"
                    id="professionalContext"
                    rows={4}
                    value={formState.professionalContext}
                    onChange={handleInputChange}
                    placeholder={t('additionalContextPlaceholder')}
                    className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-slate-500"
                />
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