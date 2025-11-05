import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { AccountsContext } from '../contexts/AccountsContext';
import { GeneratedHistoryItem } from '../types';

interface HistoryPanelProps {
    onSelectHistoryItem: (item: GeneratedHistoryItem) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectHistoryItem }) => {
    const { t } = useContext(LanguageContext);
    const { accounts, selectedAccountId } = useContext(AccountsContext);

    const selectedAccount = selectedAccountId ? accounts[selectedAccountId] : null;
    const history = selectedAccount?.history || [];

    const getIconForType = (type: GeneratedHistoryItem['type']) => {
        switch (type) {
            case 'contentPost':
            case 'productPost':
                return <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
            case 'analysis':
                return <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
            case 'campaignPlan':
                return <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l5.447 2.724A1 1 0 0115 7.618v8.764a1 1 0 01-.553.894L9 20z" /></svg>;
            case 'performanceFeedback':
                 return <svg xmlns="http://www.w.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
            case 'holisticStrategy':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
            case 'performanceReport':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H3V7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-3l-4 4z" /></svg>;
            case 'voiceSession':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-6-6v-1.5a6 6 0 00-6 6v1.5a6 6 0 006 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a3 3 0 003-3v-1.5a3 3 0 00-3-3v-1.5a3 3 0 00-3 3v1.5a3 3 0 003 3z" /></svg>
            default:
                return null;
        }
    };
    
    const getTitleForType = (item: GeneratedHistoryItem) => {
        switch (item.type) {
            case 'contentPost': return t('contentPost');
            case 'productPost': return t('productPost');
            case 'analysis': return 'Análise de Perfil';
            case 'campaignPlan': return 'Plano de Campanha';
            case 'performanceFeedback': return 'Análise de Performance';
            case 'holisticStrategy': return 'Estratégia Holística';
            case 'performanceReport': return 'Relatório de Performance';
            case 'voiceSession': return t('voiceSessionHistoryTitle');
            default: return 'Item de Histórico';
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-text">{t('accountHistory')}</h2>
            {history.length > 0 ? (
                <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {history.map(item => (
                        <li key={item.id} className="p-3 bg-slate-800/50 rounded-md border border-slate-700">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    {getIconForType(item.type)}
                                    <div>
                                        <p className="font-semibold text-sm text-brand-text">{getTitleForType(item)}</p>
                                        <p className="text-xs text-brand-subtle">{new Date(item.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onSelectHistoryItem(item)}
                                    className="px-3 py-1 text-xs font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-md transition-colors"
                                >
                                    {t('view')}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-brand-subtle text-sm text-center py-4">{t('noHistory')}</p>
            )}
        </div>
    );
};

export default HistoryPanel;