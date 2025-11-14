// Fix: Create the payment modal component for the token purchase flow.
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    packageAmount: number;
    packagePrice: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, packageAmount, packagePrice }) => {
    const { t } = useContext(LanguageContext);
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = () => {
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            onSuccess();
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 max-w-md w-full text-center">
                <h2 className="text-2xl font-bold text-brand-text mb-2">{t('paymentTitle')}</h2>
                <p className="text-brand-subtle mb-6">{t('paymentSubtitle')}</p>

                <div className="space-y-4 text-left">
                     <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-brand-subtle mb-1">{t('cardNumber')}</label>
                        <input type="text" id="cardNumber" placeholder="**** **** **** ****" className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                    </div>
                     <div className="flex gap-4">
                        <div className="w-1/2">
                           <label htmlFor="cardExpiry" className="block text-sm font-medium text-brand-subtle mb-1">{t('cardExpiry')}</label>
                           <input type="text" id="cardExpiry" placeholder="MM/YY" className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                        </div>
                        <div className="w-1/2">
                           <label htmlFor="cardCVC" className="block text-sm font-medium text-brand-subtle mb-1">{t('cardCVC')}</label>
                           <input type="text" id="cardCVC" placeholder="CVC" className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md text-brand-text"/>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full sm:w-auto py-3 px-6 border border-slate-600 rounded-md font-medium text-brand-subtle bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-75 disabled:cursor-wait"
                    >
                        {isProcessing ? t('processingPayment') : `${t('pay')} ${packagePrice}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;