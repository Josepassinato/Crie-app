// components/ErrorBoundary.tsx
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Replaced the constructor with public class field syntax for state initialization.
  // This is the modern standard for React class components and correctly
  // establishes the component's state, resolving all reported errors where `this.state`,
  // `this.setState`, and `this.props` were not being recognized.
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          fontFamily: 'Inter, sans-serif',
          padding: '1rem',
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#ef4444' }}>Ocorreu um erro inesperado</h1>
            <p style={{ marginTop: '1rem', color: '#94a3b8' }}>
              O aplicativo encontrou um problema e não pôde continuar. Isso pode ser causado por dados de contas salvas que foram corrompidos.
            </p>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  try {
                    localStorage.removeItem('crie-app-accounts');
                    alert('Os dados salvos foram limpos. O aplicativo será recarregado.');
                  } catch (e) {
                    alert('Não foi possível limpar os dados. Por favor, limpe os dados do site manually nas configurações do seu navegador.');
                  }
                  window.location.reload();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Limpar Dados e Recarregar
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Tentar Recarregar
              </button>
            </div>
            <details style={{ marginTop: '2rem', color: '#94a3b8', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '500' }}>Detalhes do Erro</summary>
              <pre style={{
                backgroundColor: '#0f172a',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginTop: '0.5rem',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '0.75rem',
                maxHeight: '200px',
                overflowY: 'auto',
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
