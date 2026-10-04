import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'light' | 'dark' | 'midnight';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kroma_theme') as AppTheme;
      if (saved && ['light', 'dark', 'midnight'].includes(saved)) {
        return saved;
      }
      return 'dark'; // Default attractive sleek dark theme
    }
    return 'dark';
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kroma_theme', newTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'midnight' : 'dark');
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-midnight', 'theme-light');

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
    } else {
      root.classList.add('theme-light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
