// components/StyleSelector.tsx
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { styleTemplates } from '../lib/styleTemplates.ts';

interface StyleSelectorProps {
    selectedStyle: string;
    onStyleChange: (style: string) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onStyleChange }) => {
    const { t } = useContext(LanguageContext);

    return (
        <div>
            <label htmlFor="artisticStyle" className="block text-sm font-medium text-brand-subtle mb-2">
                {t('artisticStyleLabel')}
            </label>
            <select
                id="artisticStyle"
                name="artisticStyle"
                value={selectedStyle}
                onChange={(e) => onStyleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text"
            >
                {Object.keys(styleTemplates).map(styleKey => (
                    <option key={styleKey} value={styleKey}>
                        {t(styleTemplates[styleKey].name)}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default StyleSelector;