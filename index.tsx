import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './contexts/LanguageContext';
import { AccountsProvider } from './contexts/AccountsContext';
// Fix: Add file extension to fix module resolution error.
import { AppStateProvider } from './contexts/AppStateContext.tsx';
import { AuthProvider } from './contexts/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <AccountsProvider>
          <AppStateProvider>
            <App />
          </AppStateProvider>
        </AccountsProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);