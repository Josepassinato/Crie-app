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
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
            case 'analysis':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
            case 'campaignPlan':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l5.447 2.724A1 1 0 0115 7.618v8.764a1 1 0 01-.553.894L9 20z" /></svg>;
            case 'performanceFeedback':
                 return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
            case 'holisticStrategy':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
            case 'performanceReport':
                return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
            default:
                return null;
        }
    };
    
    const getTitleForType = (item: GeneratedHistoryItem) => {
        switch(item.type) {
            case 'contentPost': return `Post: ${(item.data as any)?.platformTexts?.instagram.substring(0, 25)}...`;
            case 'productPost': return `Produto: ${(item.data as any)?.productName}`;
            case 'analysis': return `Análise de Perfil`;
            case 'campaignPlan': return `Plano de Campanha`;
            case 'performanceFeedback': return `Otimização de Anúncios`;
            case 'holisticStrategy': return `Estratégia Holística`;
            case 'performanceReport': return `Relatório de Performance`;
            default: return 'Item de Histórico';
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-brand-text">{t('accountHistory')}</h2>
            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {history.length === 0 ? (
                    <p className="text-brand-subtle text-sm text-center py-4">{t('noHistory')}</p>
                ) : (
                    history.map(item => (
                        <div key={item.id} className="bg-slate-800/50 p-3 rounded-md border border-slate-700 hover:bg-slate-700/50 transition-colors">
                           <div className="flex justify-between items-start">
                               <div className="flex items-start space-x-3">
                                   <div className="flex-shrink-0 pt-1">{getIconForType(item.type)}</div>
                                   <div>
                                       <p className="text-sm font-semibold text-brand-text">{getTitleForType(item)}</p>
                                       <p className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                                   </div>
                               </div>
                               <button onClick={() => onSelectHistoryItem(item)} className="text-xs text-brand-primary hover:underline">
                                 {t('view')}
                               </button>
                           </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;