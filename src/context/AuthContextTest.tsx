import React from 'react';

// Create a simple context with no values
const AuthContext = React.createContext(null);

// Simple provider that just passes children through
export function AuthProvider({ children }) {
  // No hooks, no state, just rendering children
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => React.useContext(AuthContext);