// Fix: Create the payment modal component for the token purchase flow.
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Mantido para possível uso futuro, mas o fluxo principal é via redirect.
    packageAmount: number;
    packagePrice: string;
}

// Carrega a instância do Stripe.js
declare const Stripe: any;
let stripe: any;

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, packageAmount, packagePrice }) => {
    const { t } = useContext(LanguageContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega a instância do Stripe uma vez quando o componente é montado
    useEffect(() => {
        if (typeof Stripe !== 'undefined') {
            const stripePublishableKey = localStorage.getItem('stripe_publishable_key');
            if (stripePublishableKey) {
                stripe = Stripe(stripePublishableKey);
            }
        }
    }, []);

    const handlePayment = async () => {
        setIsProcessing(true);
        setError(null);

        const stripePublishableKey = localStorage.getItem('stripe_publishable_key');
        if (!stripePublishableKey || !stripe) {
            setError("A chave publicável do Stripe não está configurada no painel de admin.");
            setIsProcessing(false);
            return;
        }

        try {
            // URL da sua Firebase Cloud Function. Substitua pelo URL real após o deploy.
            // Para testar localmente, use o URL fornecido pelo emulador do Firebase.
            const functionUrl = 'https://us-central1-crie-app-a310b.cloudfunctions.net/createStripeCheckout'; // Exemplo de URL de produção

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ packageAmount, packagePrice }),
            });

            if (!response.ok) {
                throw new Error('Falha ao comunicar com o servidor de pagamentos.');
            }

            const { sessionId } = await response.json();

            if (!sessionId) {
                throw new Error('ID da sessão de checkout não recebido.');
            }

            // Redireciona o usuário para a página de pagamento do Stripe
            const result = await stripe.redirectToCheckout({
                sessionId: sessionId,
            });

            if (result.error) {
                setError(result.error.message);
                setIsProcessing(false);
            }

        } catch (err: any) {
            console.error("Payment error:", err);
            setError(err.message || "Ocorreu um erro inesperado ao processar o pagamento.");
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border max-w-md w-full">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-brand-text mb-2">{t('paymentTitle')}</h2>
                    <p className="text-brand-subtle">{t('buyTokensPackage', { amount: packageAmount.toLocaleString() })}</p>
                </div>
                
                <p className="text-center text-brand-subtle mb-6">Você será redirecionado para um ambiente de pagamento seguro da Stripe.</p>
                
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full sm:w-auto py-3 px-6 border border-brand-border rounded-md font-medium text-brand-subtle bg-brand-soft-bg hover:bg-brand-hover-bg disabled:opacity-50"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-75 disabled:cursor-wait flex items-center justify-center gap-2"
                    >
                        {isProcessing && <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                        <span>{isProcessing ? t('processingPayment') : `${t('pay')} ${packagePrice}`}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;