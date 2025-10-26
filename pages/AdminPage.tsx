import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const AdminPage: React.FC = () => {
    const { currentUser } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);

    if (!currentUser?.isAdmin) {
        return (
            <div className="text-center">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-brand-subtle mt-2">You do not have permission to view this page.</p>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-text mb-4">Admin Dashboard</h1>
                <p className="text-lg text-brand-subtle">Manage users and application settings.</p>
            </div>
            <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700">
                <p>Welcome, Admin! This is where user management and other administrative tasks would be located.</p>
                {/* Future implementation could include a list of users, token management, etc. */}
            </div>
        </div>
    );
};

export default AdminPage;
