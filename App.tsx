import React from 'react';
import Header from './components/Header';
import CreatorPage from './pages/CreatorPage';
import AnalyzerPage from './pages/AnalyzerPage';
import TrafficManagerPage from './pages/TrafficManagerPage';
import StrategyPage from './pages/StrategyPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import BuyTokensPage from './pages/BuyTokensPage';
import { AuthContext } from './contexts/AuthContext';
import { useAppState } from './contexts/AppStateContext';
import InteractionChoicePage from './pages/InteractionChoicePage';
import VoiceAgentPage from './pages/VoiceAgentPage';

const AppContent: React.FC = () => {
    const { currentUser, loading } = React.useContext(AuthContext);
    const { activePage, setActivePage } = useAppState();
    const [viewMode, setViewMode] = React.useState<'choice' | 'dashboard' | 'voiceAgent'>('choice');

    const renderPage = () => {
        switch (activePage) {
            case 'creator':
                return <CreatorPage />;
            case 'analyzer':
                return <AnalyzerPage />;
            case 'trafficManager':
                return <TrafficManagerPage />;
            case 'strategy':
                return <StrategyPage />;
            case 'admin':
                return <AdminPage />;
            case 'buyTokens':
                return <BuyTokensPage setActivePage={setActivePage} />;
            default:
                return <CreatorPage />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage />;
    }
    
    if (viewMode === 'choice') {
        return <InteractionChoicePage 
            onSelectDashboard={() => setViewMode('dashboard')}
            onSelectVoiceAgent={() => setViewMode('voiceAgent')}
        />;
    }

    if (viewMode === 'voiceAgent') {
        return <VoiceAgentPage onExit={() => setViewMode('choice')} />;
    }


    return (
        <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
            <Header />
            <main>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {renderPage()}
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppContent />
    );
};

export default App;
