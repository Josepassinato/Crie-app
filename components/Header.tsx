import React, { useContext, useState } from 'react';
// Fix: Corrected the import path for AuthContext from '../contexts/AuthContext.tsx' to '../lib/AuthContext.tsx'.
import { AuthContext } from '../lib/AuthContext.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { Language, AppPage } from '../types.ts';
// Fix: Correct module import path and use useContext for AppStateContext.
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import WhatsappNotificationManager from './WhatsappNotificationManager.tsx';

const Header: React.FC = () => {
    const { currentUser, logout } = useContext(AuthContext);
    const { language, setLanguage, t } = useContext(LanguageContext);
    const appState = useContext(AppStateContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!appState) return null; // Guard clause while context initializes
    const { activePage, setActivePage } = appState;

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
    
    const handleNavClick = (page: AppPage) => {
        setActivePage(page);
        setIsMenuOpen(false);
    };


    return (
        <header className="bg-brand-surface/80 backdrop-blur-sm sticky top-0 z-40 border-b border-brand-border">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Nav */}
                    <div className="flex items-center space-x-8">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">crie-app</h1>
                        </div>
                        <nav className="hidden md:flex space-x-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActivePage(item.id)}
                                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activePage === item.id 
                                        ? 'bg-brand-primary/10 text-brand-primary font-semibold' 
                                        : 'text-brand-subtle hover:bg-brand-hover-bg hover:text-brand-text'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="hidden sm:flex items-center space-x-2">
                             <span className="text-base font-semibold text-brand-text">{currentUser?.tokens.toLocaleString()}</span>
                             <span className="text-sm text-brand-subtle">{t('tokens')}</span>
                             <button onClick={() => setActivePage('buyTokens')} className="ml-2 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full transition-colors shadow-sm hover:shadow-md">
                                + {t('buyMore')}
                             </button>
                        </div>
                         <select onChange={handleLanguageChange} value={language} className="bg-brand-input-bg border-brand-border rounded-md text-sm text-brand-subtle focus:ring-brand-primary">
                            <option>Português</option>
                            <option>English</option>
                            <option>Español</option>
                        </select>
                        <WhatsappNotificationManager />
                        <button onClick={logout} className="p-2 rounded-full text-brand-subtle hover:bg-brand-hover-bg hover:text-brand-text transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                        {/* Hamburger button */}
                        <div className="md:hidden flex items-center">
                             <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-brand-subtle hover:text-brand-text hover:bg-brand-hover-bg" aria-controls="mobile-menu" aria-expanded={isMenuOpen}>
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? (
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Mobile menu, show/hide based on menu state. */}
            {isMenuOpen && (
                <div className="md:hidden animate-fade-in" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                         {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                                    activePage === item.id 
                                    ? 'bg-brand-primary/10 text-brand-primary' 
                                    : 'text-brand-subtle hover:bg-brand-hover-bg hover:text-brand-text'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {/* Token info for mobile */}
                    <div className="sm:hidden pt-4 pb-3 border-t border-brand-border">
                        <div className="flex items-center justify-between px-5">
                            <div>
                                <span className="text-base font-medium text-brand-text">{currentUser?.tokens.toLocaleString()}</span>
                                <span className="text-sm text-brand-subtle ml-2">{t('tokens')}</span>
                            </div>
                            <button onClick={() => handleNavClick('buyTokens')} className="px-3 py-1 text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full transition-colors">
                                + {t('buyMore')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;