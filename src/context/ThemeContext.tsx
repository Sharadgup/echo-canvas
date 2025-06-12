
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const initialState: ThemeContextType = {
  theme: 'light', // This default is for the context, provider will override
  setTheme: () => null,
  toggleTheme: () => null,
};

const ThemeContext = createContext<ThemeContextType>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'echo-canvas-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return defaultTheme; // Server-side rendering default
    }
    try {
      const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
      // If no stored theme, check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch (e) {
      // Fallback for environments where localStorage is not available or errors
      console.error('Error reading theme from localStorage', e);
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = window.document.documentElement; // <html> element
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error('Error saving theme to localStorage', e);
    }
  }, [theme, storageKey]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
