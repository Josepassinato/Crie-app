import React, { useState, useContext } from 'react';
import { TOKEN_PACKAGES } from '../lib/tokenCosts.ts';
import PaymentModal from '../components/PaymentModal.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
// Fix: Corrected the import path for AuthContext from '../contexts/AuthContext.tsx' to '../lib/AuthContext.tsx'.
import { AuthContext } from '../lib/MongoAuthContext.tsx';
import { AppPage } from '../types.ts';

interface BuyTokensPageProps {
  setActivePage: (page: AppPage) => void;
}

const BuyTokensPage: React.FC<BuyTokensPageProps> = ({ setActivePage }) => {
    const { t } = useContext(LanguageContext);
    const { currentUser, updateUserTokens } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState({ amount: 0, price: '' });

    const packages = [
        { name: 'STARTER', amount: TOKEN_PACKAGES.STARTER, price: 'R$ 99,00', description: 'Ideal para começar e explorar funcionalidades.', badge: null },
        { name: 'PRO', amount: TOKEN_PACKAGES.PRO, price: 'R$ 222,00', description: 'Perfeito para usuários regulares e pequenas empresas.', badge: 'Economize 10%' },
        { name: 'BUSINESS', amount: TOKEN_PACKAGES.BUSINESS, price: 'R$ 489,00', description: 'Melhor valor para usuários avançados e agências.', badge: 'Economize 17%' },
        { name: 'MEGA', amount: TOKEN_PACKAGES.MEGA, price: 'R$ 1.089,00', description: 'Para criadores profissionais e alto volume.', badge: 'Economize 27%' },
        { name: 'ENTERPRISE', amount: TOKEN_PACKAGES.ENTERPRISE, price: 'R$ 3.217,00', description: 'Solução empresarial com melhor custo-benefício.', badge: 'Economize 35%' },
    ];
    
    const handleBuyClick = (amount: number, price: string) => {
        setSelectedPackage({ amount, price });
        setIsModalOpen(true);
    };

    const handlePaymentSuccess = () => {
        if (currentUser) {
            updateUserTokens(currentUser.tokens + selectedPackage.amount);
        }
        setIsModalOpen(false);
        alert(`Successfully purchased ${selectedPackage.amount} tokens!`);
        setActivePage('creator');
    };

    return (
        <>
            <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-brand-text mb-4">💰 Comprar Tokens</h1>
                    <p className="text-lg text-brand-subtle">
                        Escolha um pacote para recarregar sua conta e continuar criando conteúdo incrível.
                    </p>
                    <p className="text-sm text-brand-subtle mt-2">
                        Quanto mais você compra, mais economiza! 🎉
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {packages.map((pkg) => (
                        <div key={pkg.name} className={`bg-brand-surface p-6 rounded-lg shadow-2xl border-2 flex flex-col text-center relative ${
                            pkg.name === 'BUSINESS' ? 'border-brand-primary' : 
                            pkg.name === 'MEGA' ? 'border-purple-500' :
                            pkg.name === 'ENTERPRISE' ? 'border-yellow-500' :
                            'border-brand-border'
                        }`}>
                            {pkg.badge && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                                        {pkg.badge}
                                    </span>
                                </div>
                            )}
                            {pkg.name === 'BUSINESS' && (
                                <div className="absolute -top-3 -right-3">
                                    <span className="px-2 py-1 bg-brand-primary text-white text-xs font-bold rounded-full">
                                        Popular
                                    </span>
                                </div>
                            )}
                            {pkg.name === 'ENTERPRISE' && (
                                <div className="absolute -top-3 -right-3">
                                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                                        Melhor Valor
                                    </span>
                                </div>
                            )}
                            <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mt-2">
                                {pkg.name}
                            </h2>
                            <p className="text-3xl md:text-4xl font-extrabold my-4 text-brand-text">
                                {pkg.amount.toLocaleString('pt-BR')}
                                <span className="text-sm md:text-lg font-medium text-brand-subtle block mt-1">Tokens</span>
                            </p>
                            <p className="text-sm text-brand-subtle flex-grow min-h-[3rem]">{pkg.description}</p>
                            <div className="mt-2 mb-4">
                                <p className="text-xs text-brand-subtle">
                                    R$ {(parseFloat(pkg.price.replace('R$ ', '').replace(',', '.')) / pkg.amount).toFixed(4).replace('.', ',')} por token
                                </p>
                            </div>
                            <button
                                onClick={() => handleBuyClick(pkg.amount, pkg.price)}
                                className="w-full mt-auto py-3 px-4 border border-transparent rounded-md shadow-sm text-base md:text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none transition-all hover:scale-105"
                            >
                                Comprar por {pkg.price}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            <PaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handlePaymentSuccess}
                packageAmount={selectedPackage.amount}
                packagePrice={selectedPackage.price}
            />
        </>
    );
};

export default BuyTokensPage;