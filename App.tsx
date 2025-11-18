import React, { useContext } from 'react';
import Header from './components/Header.tsx';
// Fix: Ensure all page components are correctly imported as modules.
import LandingPage from './pages/LandingPage.tsx';
import LandingPageMarketing from './pages/LandingPageMarketing.tsx';
import CreatorPage from './pages/CreatorPage.tsx';
import AnalyzerPage from './pages/AnalyzerPage.tsx';
import TrafficManagerPage from './pages/TrafficManagerPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import AdminPage from './pages/AdminPage.tsx';
import BuyTokensPage from './pages/BuyTokensPage.tsx';
import { AuthContext } from './lib/MongoAuthContext.tsx';
// Fix: Correct module import path and use useContext for AppStateContext.
import { AppStateContext } from './contexts/AppStateContext.tsx';
import InteractionChoicePage from './pages/InteractionChoicePage.tsx';
import VoiceAgentPage from './pages/VoiceAgentPage.tsx';

const AppContent: React.FC = () => {
    const { currentUser, loading } = React.useContext(AuthContext);
    const appState = useContext(AppStateContext);
    
    // State for pre-login flow
    const [preLoginView, setPreLoginView] = React.useState<'landing' | 'login'>('landing');

    // State for post-login flow
    const [viewMode, setViewMode] = React.useState<'choice' | 'dashboard' | 'voiceAgent'>('choice');

    // Effect to reset views on logout
    React.useEffect(() => {
        if (!currentUser) {
            setPreLoginView('landing');
            setViewMode('choice');
        }
    }, [currentUser]);
    
    if (!appState) return null; // Guard clause while context initializes
    const { activePage, setActivePage } = appState;


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

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
            </div>
        );
    }

    if (!currentUser) {
        if (preLoginView === 'landing') {
            return <LandingPage onStart={() => setPreLoginView('login')} />;
        }
        // Once onStart is called, it switches to the login page
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
                <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-10">
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