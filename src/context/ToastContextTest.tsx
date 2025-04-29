import React from 'react';

// Create a simple toast context with no functionality
const ToastContext = React.createContext({
  showToast: () => {},
});

// Simple provider with no hooks
export function ToastProvider({ children }) {
  // Just pass the children through
  return (
    <ToastContext.Provider value={{ showToast: () => {} }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => React.useContext(ToastContext);