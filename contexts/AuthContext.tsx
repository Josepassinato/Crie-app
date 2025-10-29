import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import { initializeFirebaseServices } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateUserTokens: (newTokens: number) => void;
  activateTestMode: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  updateUserTokens: () => {},
  activateTestMode: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseServices, setFirebaseServices] = useState<{ auth: Auth; db: Firestore } | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [isInTestMode, setIsInTestMode] = useState(false);
  
  const activateTestMode = useCallback(() => {
    const mockAdminUser: User = {
      id: 'test-admin-id',
      email: 'admin-test@crie-app.com',
      isAdmin: true,
      tokens: 99999999,
    };
    sessionStorage.setItem('testMode', 'true');
    setCurrentUser(mockAdminUser);
    setLoading(false);
    setIsInTestMode(true);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem('testMode') === 'true') {
      activateTestMode();
      return; 
    }

    try {
      const { auth, db } = initializeFirebaseServices();
      if (!auth || !db) {
        throw new Error('FIREBASE_SERVICES_NOT_AVAILABLE');
      }
      setFirebaseServices({ auth, db });
    } catch (error: any) {
      console.error("Firebase initialization error:", error.message);
      if (error.message === "FIREBASE_CONFIG_INVALID") {
        setInitError("A configuração do Firebase está faltando ou foi corrompida. Verifique o arquivo `firebaseConfig.ts`.");
      } else if (error.message === "FIREBASE_INIT_FAILED") {
        setInitError("Falha ao conectar-se ao Firebase. Verifique suas credenciais e as configurações do projeto Firebase (ex: domínios autorizados).");
      } else if (error.message === "FIREBASE_SERVICES_NOT_AVAILABLE") {
        setInitError("Os serviços do Firebase não puderam ser iniciados. Por favor, valide sua configuração.");
      } else {
        setInitError("Ocorreu um erro inesperado ao inicializar o backend.");
      }
    }
  }, [activateTestMode]);


  const login = async (email: string, pass: string) => {
    if (!firebaseServices) throw new Error("Firebase services not available");
    await signInWithEmailAndPassword(firebaseServices.auth, email, pass);
  };

  const signup = async (email: string, pass: string) => {
    if (!firebaseServices) throw new Error("Firebase services not available");
    const { auth, db } = firebaseServices;
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
        id: user.uid,
        email: user.email,
        isAdmin: email === 'admin@crie-app.com',
        tokens: 20,
        createdAt: serverTimestamp(),
    });
  };

  const logout = () => {
    if (isInTestMode) {
      sessionStorage.removeItem('testMode');
      setCurrentUser(null);
      setIsInTestMode(false);
    } else if (firebaseServices) {
      signOut(firebaseServices.auth);
    }
  };

  const updateUserTokens = useCallback(async (newTokens: number) => {
    if (isInTestMode) {
        setCurrentUser((prevUser) => (prevUser ? { ...prevUser, tokens: newTokens } : null));
        return;
    }

    if (currentUser && firebaseServices) {
      const { db } = firebaseServices;
      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, { tokens: newTokens });
      setCurrentUser((prevUser) => (prevUser ? { ...prevUser, tokens: newTokens } : null));
    }
  }, [currentUser, firebaseServices, isInTestMode]);

  useEffect(() => {
    if (isInTestMode || !firebaseServices) {
      if (!isInTestMode) setLoading(false);
      return;
    }

    const { auth, db } = firebaseServices;
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setCurrentUser({
            id: user.uid,
            email: user.email!,
            isAdmin: userData.isAdmin,
            tokens: userData.tokens,
          });
        } else {
          console.error("No user document found in Firestore. Logging out.");
          signOut(auth);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseServices, isInTestMode]);
  
  if (initError) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 text-brand-text font-sans">
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-red-500/30 max-w-lg text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Erro Crítico de Configuração</h1>
          <p className="text-brand-subtle">{initError}</p>
          <p className="text-xs text-slate-500 mt-6">Por favor, verifique a configuração do seu projeto e recarregue a página.</p>
        </div>
      </div>
    );
  }

  const value = { currentUser, loading, login, signup, logout, updateUserTokens, activateTestMode };

  return (
    <AuthContext.Provider value={value}>
       {children}
    </AuthContext.Provider>
  );
};