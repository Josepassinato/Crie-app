import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { AccountsProvider } from './contexts/AccountsContext.tsx';
import { AppStateProvider } from './contexts/AppStateContext.tsx';
import { AuthProvider } from './lib/MongoAuthContext.tsx';

console.log("Crie-App: Starting application render process...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Crie-App: CRITICAL - Could not find root element. Application cannot start.");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <AccountsProvider>
            <AppStateProvider>
              <App />
            </AppStateProvider>
          </AccountsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

console.log("Crie-App: Application render command issued successfully.");