import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { Language, AppPage } from '../types';

interface HeaderProps {
    activePage: AppPage;
    setActivePage: (page: AppPage) => void;
}

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage }) => {
    const { currentUser, logout } = useContext(AuthContext);
    const { language, setLanguage, t } = useContext(LanguageContext);

    const navItems: { id: AppPage; label: string }[] = [
        { id: 'creator', label: t('creatorPage') || 'Creator' },
        { id: 'analyzer', label: t('analyzerPage') || 'Analyzer' },
        { id: 'trafficManager', label: t('trafficManagerPage') || 'Traffic Manager' },
    ];
    if (currentUser?.isAdmin) {
        navItems.push({ id: 'admin', label: 'Admin' });
    }

    const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setLanguage(e.target.value as Language);
    };

    return (
        <header className="bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Nav */}
                    <div className="flex items-center space-x-8">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">crie-app</h1>
                        </div>
                        <nav className="hidden md:flex space-x-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActivePage(item.id)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activePage === item.id 
                                        ? 'bg-brand-primary/10 text-brand-primary' 
                                        : 'text-brand-subtle hover:bg-slate-700/50 hover:text-brand-text'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden sm:flex items-center space-x-2">
                             <span className="text-sm font-medium text-brand-text">{currentUser?.tokens.toLocaleString()}</span>
                             <span className="text-sm text-brand-subtle">{t('tokens')}</span>
                             <button onClick={() => setActivePage('buyTokens')} className="ml-2 px-3 py-1 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full transition-colors">
                                + {t('buyMore')}
                             </button>
                        </div>
                         <select onChange={handleLanguageChange} value={language} className="bg-slate-800 border-slate-600 rounded-md text-sm text-brand-subtle focus:ring-brand-primary">
                            <option>Português</option>
                            <option>English</option>
                            <option>Español</option>
                        </select>
                        <button onClick={logout} className="p-2 rounded-full text-brand-subtle hover:bg-slate-700/50 hover:text-brand-text">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;