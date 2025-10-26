import React, { useState, useContext } from 'react';
import Header from './components/Header';
import CreatorPage from './pages/CreatorPage';
import AnalyzerPage from './pages/AnalyzerPage';
import TrafficManagerPage from './pages/TrafficManagerPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import BuyTokensPage from './pages/BuyTokensPage';
import { AuthContext } from './contexts/AuthContext';
import { AppPage } from './types';

const App: React.FC = () => {
    const { currentUser } = useContext(AuthContext);
    const [activePage, setActivePage] = useState<AppPage>('creator');

    const renderPage = () => {
        switch (activePage) {
            case 'creator':
                return <CreatorPage />;
            case 'analyzer':
                return <AnalyzerPage />;
            case 'trafficManager':
                return <TrafficManagerPage />;
            case 'admin':
                return <AdminPage />;
            case 'buyTokens':
                return <BuyTokensPage setActivePage={setActivePage} />;
            default:
                return <CreatorPage />;
        }
    };

    if (!currentUser) {
        return <LoginPage />;
    }

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
            <Header activePage={activePage} setActivePage={setActivePage} />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

export default App;
