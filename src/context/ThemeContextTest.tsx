import React from 'react';

// Create a simple context with a default light theme
const ThemeContext = React.createContext({
  theme: 'light',
  setTheme: () => {},
});

// Simple provider without complex hooks
export function ThemeProvider({ children }) {
  // No state management, just a static value
  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => React.useContext(ThemeContext);