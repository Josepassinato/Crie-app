import React, { useState, useContext } from 'react';
// Fix: Corrected the import path for AuthContext from '../contexts/AuthContext.tsx' to '../lib/AuthContext.tsx'.
import { AuthContext } from '../lib/AuthContext.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

const LoginPage: React.FC = () => {
  const { login, signup, activateTestMode } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLoginView && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      if (isLoginView) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: any) {
      let friendlyMessage = "Ocorreu um erro inesperado.";
      switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
              friendlyMessage = "E-mail ou senha inválidos.";
              break;
          case 'auth/email-already-in-use':
              friendlyMessage = "Já existe uma conta com este e-mail.";
              break;
          case 'auth/weak-password':
              friendlyMessage = "A senha deve ter pelo menos 6 caracteres.";
              break;
           case 'auth/invalid-email':
              friendlyMessage = "O formato do e-mail é inválido.";
              break;
      }
      setError(friendlyMessage);
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 text-brand-text font-sans">
      <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border max-w-sm w-full">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
            crie-app
            </h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
              required
            />
          </div>
           {!isLoginView && (
             <div>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar Senha"
                    className="w-full px-3 py-2 border border-brand-border bg-brand-input-bg rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text placeholder-brand-subtle"
                    required
                />
            </div>
           )}
           {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-brand-surface transition-opacity disabled:opacity-50"
          >
            {loading ? "Processando..." : (isLoginView ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
         <div className="text-center mt-4">
            <button onClick={() => { setIsLoginView(!isLoginView); setError('');}} className="text-sm text-brand-subtle hover:text-brand-primary">
                {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
            </button>
        </div>
        <div className="mt-6 border-t border-brand-border pt-4">
             <button onClick={activateTestMode} className="w-full text-center text-sm text-brand-subtle hover:text-brand-primary bg-brand-soft-bg hover:bg-brand-hover-bg py-2 rounded-md transition-colors">
                Acessar para Testes
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;