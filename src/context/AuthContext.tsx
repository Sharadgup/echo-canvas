
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase'; // auth can be undefined if Firebase fails to init
import { onAuthStateChanged } from 'firebase/auth';
import { Spinner } from '@/components/ui/spinner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isUserProcessing: boolean; 
  setIsUserProcessing: (isProcessing: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isUserProcessing: false,
  setIsUserProcessing: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserProcessing, setIsUserProcessing] = useState(false);

  useEffect(() => {
    if (auth) { // Check if auth service is available
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Firebase auth is not initialized (e.g., config missing/invalid)
      setUser(null);
      setLoading(false);
      // No listener to unsubscribe from
    }
  }, []); // auth is stable after initial import, so no need to add it to deps

  if (loading && !auth) {
    // If auth is not available and we are in the initial loading phase due to that,
    // we can stop showing the spinner indefinitely if Firebase is misconfigured.
    // However, the main loading state might still be true if onAuthStateChanged hasn't run.
    // The useEffect above handles setting loading to false once auth status is determined or confirmed unavailable.
  }
  
  if (loading) {
     return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading, isUserProcessing, setIsUserProcessing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

