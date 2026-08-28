import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '../types';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_selected_theme_v1';
const DARK_MODE_STORAGE_KEY = 'app_dark_mode_active_v1';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'high-density' || saved === 'clean-minimal' || saved === 'professional-polish' || saved === 'sleek-interface') {
      return saved as AppTheme;
    }
    return 'clean-minimal';
  });

  const [isDarkMode, setDarkModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
    return false;
  });

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const toggleDarkMode = () => {
    setDarkModeState((prev) => {
      const next = !prev;
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(next));
      return next;
    });
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(val));
  };

  useEffect(() => {
    // Apply dark class to document body / root
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Set data-theme attribute
    root.setAttribute('data-theme', theme);
  }, [isDarkMode, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDarkMode, toggleDarkMode, setDarkMode }}>
      <div
        id="app-theme-wrapper"
        data-theme={theme}
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        } ${
          theme === 'high-density'
            ? 'theme-high-density text-[13px]'
            : theme === 'sleek-interface'
            ? 'theme-sleek font-sans'
            : theme === 'professional-polish'
            ? 'theme-professional font-sans'
            : 'theme-clean-minimal font-sans'
        }`}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
