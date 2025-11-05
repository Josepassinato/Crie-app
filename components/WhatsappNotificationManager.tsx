// components/WhatsappNotificationManager.tsx
import React, { useState, useContext } from 'react';
// Fix: Add file extension to fix module resolution error.
import { useAppState } from '../contexts/AppStateContext';
import { LanguageContext } from '../contexts/LanguageContext';

const WhatsappNotificationManager: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { whatsappState, whatsappQrCode, connectWhatsapp, disconnectWhatsapp } = useAppState();
    const { t } = useContext(LanguageContext);

    const handleDisconnect = () => {
        disconnectWhatsapp();
        setIsModalOpen(false);
    };
    
    const handleConnect = () => {
        connectWhatsapp();
    };

    const getButtonUI = () => {
        switch (whatsappState) {
            case 'connected':
                return {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />,
                    color: 'text-green-400 hover:text-green-300',
                    tooltip: t('whatsappConnected')
                };
            case 'connecting':
                 return {
                    icon: <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />,
                    color: 'text-yellow-400 animate-pulse',
                    tooltip: t('whatsappConnecting')
                };
            case 'disconnected':
            case 'error':
            default:
                 return {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />,
                    color: 'text-brand-subtle hover:text-brand-text',
                    tooltip: t('whatsappConnect')
                };
        }
    };
    
    const { icon, color, tooltip } = getButtonUI();

    const renderModalContent = () => {
        switch (whatsappState) {
            case 'connected':
                return (
                    <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                             <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </div>
                        <h3 className="mt-4 text-xl font-semibold leading-6 text-brand-text">{t('whatsappConnectionSuccess')}</h3>
                        <p className="mt-2 text-brand-subtle">{t('whatsappConnectionStatus')}</p>
                        <button onClick={handleDisconnect} className="mt-6 w-full rounded-md bg-red-800/80 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700">{t('whatsappDisconnect')}</button>
                    </div>
                );
            case 'connecting':
                return (
                    <div className="text-center">
                        <h3 className="text-xl font-semibold leading-6 text-brand-text">{t('whatsappModalTitle')}</h3>
                        <div className="mt-4 flex justify-center">
                            {whatsappQrCode ? (
                                <img src={whatsappQrCode} alt="QR Code" className="w-48 h-48 rounded-lg bg-white p-2 animate-fade-in" />
                            ) : (
                                <div className="w-48 h-48 rounded-lg bg-slate-700 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                                </div>
                            )}
                        </div>
                        <p className="mt-4 text-brand-subtle">{t('whatsappScanInstruction')}</p>
                    </div>
                );
            case 'disconnected':
            case 'error':
                 return (
                    <div className="text-center">
                        <h3 className="text-xl font-semibold leading-6 text-brand-text">{t('whatsappModalTitle')}</h3>
                        <p className="mt-2 text-brand-subtle">{t('connectToReceiveNotifications')}</p>
                        <button onClick={handleConnect} className="mt-6 w-full rounded-md bg-gradient-to-r from-brand-primary to-brand-secondary px-4 py-2.5 text-lg font-semibold text-white shadow-sm hover:opacity-90">{t('whatsappConnect')}</button>
                    </div>
                );
        }
    };

    return (
        <>
            <div className="relative group">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`p-2 rounded-full transition-colors ${color}`}
                    aria-label={tooltip}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        {icon}
                    </svg>
                </button>
                 <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 text-xs font-medium text-white bg-slate-900 border border-slate-700 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {tooltip}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        {renderModalContent()}
                    </div>
                </div>
            )}
        </>
    );
};

export default WhatsappNotificationManager;