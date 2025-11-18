import React, { useContext, useState, useEffect } from 'react';
// Fix: Corrected the import path for AuthContext from '../contexts/AuthContext.tsx' to '../lib/AuthContext.tsx'.
import { AuthContext } from '../lib/MongoAuthContext.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import ApiKeySelector from '../components/ApiKeySelector.tsx';

const AdminPage: React.FC = () => {
    const { currentUser } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [stripePublishableKey, setStripePublishableKey] = useState('');
    const [stripeSecretKey, setStripeSecretKey] = useState('');

    useEffect(() => {
        setStripePublishableKey(localStorage.getItem('stripe_publishable_key') || '');
        setStripeSecretKey(localStorage.getItem('stripe_secret_key') || '');
    }, []);

    const handleSaveStripeKeys = () => {
        localStorage.setItem('stripe_publishable_key', stripePublishableKey);
        localStorage.setItem('stripe_secret_key', stripeSecretKey);
        alert('Stripe API keys saved locally.');
    };

    if (!currentUser?.isAdmin) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-brand-subtle mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-brand-text mb-4">Admin Dashboard</h1>
                <p className="text-lg text-brand-subtle">Manage users and application settings.</p>
            </div>

            {/* API Key Management Section */}
            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-brand-border">
                <h2 className="text-2xl font-bold text-brand-text mb-4">{t('adminApiKeyManagementTitle')}</h2>
                <p className="text-brand-subtle mb-6">{t('adminApiKeyManagementDescription')}</p>
                <ApiKeySelector />
            </div>

             {/* Stripe Configuration Section */}
            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-brand-border">
                <h2 className="text-2xl font-bold text-brand-text mb-4">{t('adminStripeTitle')}</h2>
                <p className="text-brand-subtle mb-6">{t('adminStripeDescription')}</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="stripePublishableKey" className="block text-sm font-medium text-brand-subtle mb-2">
                            {t('adminStripePublishableKeyLabel')}
                        </label>
                        <input
                            type="text"
                            id="stripePublishableKey"
                            value={stripePublishableKey}
                            onChange={(e) => setStripePublishableKey(e.target.value)}
                            placeholder="pk_test_..."
                            className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                        />
                    </div>
                     <div>
                        <label htmlFor="stripeSecretKey" className="block text-sm font-medium text-brand-subtle mb-2">
                            {t('adminStripeSecretKeyLabel')}
                        </label>
                        <input
                            type="password"
                            id="stripeSecretKey"
                            value={stripeSecretKey}
                            onChange={(e) => setStripeSecretKey(e.target.value)}
                            placeholder="sk_test_..."
                            className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                        />
                         <p className="mt-2 text-xs text-brand-warning">{t('adminStripeSecretKeyWarning')}</p>
                    </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleSaveStripeKeys}
                        className="py-2 px-4 bg-brand-primary text-white font-bold rounded-md shadow-sm hover:opacity-90 transition-opacity"
                    >
                        {t('saveApiKeysButton')}
                    </button>
                    <a
                        href="https://dashboard.stripe.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-4 text-center bg-gray-600 text-white font-bold rounded-md shadow-sm hover:bg-gray-500 transition-colors"
                    >
                        {t('adminStripeDashboardButton')}
                    </a>
                </div>
            </div>

            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-brand-border">
                <p>Welcome, Admin! This is where user management and other administrative tasks would be located.</p>
                {/* Future implementation could include a list of users, token management, etc. */}
            </div>
        </div>
    );
};

export default AdminPage;