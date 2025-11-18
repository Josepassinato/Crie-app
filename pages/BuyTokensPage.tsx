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
        { name: 'STARTER', amount: TOKEN_PACKAGES.STARTER, price: 'R$ 20,00', description: 'Ideal for getting started and exploring features.' },
        { name: 'PRO', amount: TOKEN_PACKAGES.PRO, price: 'R$ 45,00', description: 'Perfect for regular users and small businesses.' },
        { name: 'BUSINESS', amount: TOKEN_PACKAGES.BUSINESS, price: 'R$ 99,00', description: 'The best value for power users and agencies.' },
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
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-brand-text mb-4">Buy Tokens</h1>
                    <p className="text-lg text-brand-subtle">
                        Choose a package to recharge your account and continue creating.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                        <div key={pkg.name} className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-brand-border flex flex-col text-center">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{pkg.name}</h2>
                            <p className="text-4xl font-extrabold my-4 text-brand-text">{pkg.amount} <span className="text-lg font-medium text-brand-subtle">Tokens</span></p>
                            <p className="text-brand-subtle flex-grow">{pkg.description}</p>
                            <button
                                onClick={() => handleBuyClick(pkg.amount, pkg.price)}
                                className="w-full mt-6 py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none"
                            >
                                Buy for {pkg.price}
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