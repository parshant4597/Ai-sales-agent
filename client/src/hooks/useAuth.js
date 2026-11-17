import { createContext, useContext } from 'react';

// The shared "who is signed in" value. The provider that fills it is context/AuthContext.jsx.
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
