import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppTheme, SystemCustomTheme } from '../types';
import { DEFAULT_SYSTEM_THEME } from '../config/defaultTheme';
import { ticketService } from '../services/ticketService';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
  // Custom System Theme (Colors, Dimensions, Typography)
  systemTheme: SystemCustomTheme;
  updateThemeSetting: <K extends keyof SystemCustomTheme>(key: K, value: SystemCustomTheme[K]) => void;
  updateMultipleSettings: (updates: Partial<SystemCustomTheme>) => void;
  resetThemeToDefaults: () => void;
  isSavingToDb: boolean;
  dbSyncStatus: {
    savedInDb: boolean;
    timestamp: string;
    message: string;
  } | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_selected_theme_v1';
const DARK_MODE_STORAGE_KEY = 'app_dark_mode_active_v1';
const SYSTEM_THEME_STORAGE_KEY = 'app_custom_system_theme_v2';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'high-density' || saved === 'clean-minimal' || saved === 'professional-polish' || saved === 'sleek-interface') {
        return saved as AppTheme;
      }
    } catch {}
    return 'clean-minimal';
  });

  const [isDarkMode, setDarkModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DARK_MODE_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return false;
  });

  const [systemTheme, setSystemTheme] = useState<SystemCustomTheme>(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_THEME_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SYSTEM_THEME, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SYSTEM_THEME;
  });

  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<{
    savedInDb: boolean;
    timestamp: string;
    message: string;
  } | null>(null);

  const saveTimerRef = useRef<any>(null);

  // Apply CSS variables to root document
  const applyCssVariables = useCallback((t: SystemCustomTheme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    // Frontend Colors
    root.style.setProperty('--frontend-primary', t.frontendPrimaryColor);
    root.style.setProperty('--frontend-accent', t.frontendAccentColor);
    root.style.setProperty('--frontend-bg', t.frontendBgColor);
    root.style.setProperty('--frontend-card-bg', t.frontendCardBg);
    root.style.setProperty('--frontend-text', t.frontendTextColor);
    root.style.setProperty('--frontend-header-bg', t.frontendHeaderBg);

    // Backend Colors
    root.style.setProperty('--backend-sidebar-bg', t.backendSidebarBg);
    root.style.setProperty('--backend-header-bg', t.backendHeaderBg);
    root.style.setProperty('--backend-bg', t.backendBgColor);
    root.style.setProperty('--backend-primary', t.backendPrimaryColor);
    root.style.setProperty('--backend-card-bg', t.backendCardBg);
    root.style.setProperty('--backend-border', t.backendBorderColor);
    root.style.setProperty('--backend-text', t.backendTextColor);

    // Dimensions
    root.style.setProperty('--backend-sidebar-width', `${t.sidebarWidth}px`);
    root.style.setProperty('--backend-navbar-height', `${t.navbarHeight}px`);
    root.style.setProperty('--backend-table-row-height', `${t.tableRowHeight}px`);
    root.style.setProperty('--backend-map-height', `${t.mapHeight}px`);
    root.style.setProperty('--app-max-width', t.mainMaxWidth === 'full' ? '100%' : t.mainMaxWidth);

    // Typography
    root.style.setProperty('--app-font-size-base', `${t.baseFontSize}px`);
    root.style.setProperty('--app-h1-size', `${t.h1Size}px`);
    root.style.setProperty('--app-h2-size', `${t.h2Size}px`);
    root.style.setProperty('--app-label-size', `${t.labelSize}px`);
    root.style.setProperty('--app-line-height', String(t.lineHeightScale));
  }, []);

  // Initial load from MySQL Database
  useEffect(() => {
    let isMounted = true;
    ticketService.getThemeSettings().then((remoteTheme) => {
      if (isMounted && remoteTheme) {
        setSystemTheme((prev) => {
          const merged = { ...prev, ...remoteTheme };
          localStorage.setItem(SYSTEM_THEME_STORAGE_KEY, JSON.stringify(merged));
          applyCssVariables(merged);
          return merged;
        });
        setDbSyncStatus({
          savedInDb: !!remoteTheme.savedInDb,
          timestamp: new Date().toLocaleTimeString(),
          message: 'Configuración cargada desde base de datos MySQL',
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [applyCssVariables]);

  // Sync to Database function with debounce
  const triggerDatabaseSave = useCallback((newTheme: SystemCustomTheme) => {
    setIsSavingToDb(true);
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await ticketService.saveThemeSettings(newTheme);
        setDbSyncStatus({
          savedInDb: !!res.savedInDb,
          timestamp: new Date().toLocaleTimeString(),
          message: res.savedInDb
            ? 'Guardado en base de datos MySQL (u483786231_ticket_db)'
            : 'Guardado en base de datos local y servidor',
        });
      } catch {
        setDbSyncStatus({
          savedInDb: false,
          timestamp: new Date().toLocaleTimeString(),
          message: 'Guardado en memoria local',
        });
      } finally {
        setIsSavingToDb(false);
      }
    }, 450);
  }, []);

  // Update single setting and save to DB
  const updateThemeSetting = useCallback(
    <K extends keyof SystemCustomTheme>(key: K, value: SystemCustomTheme[K]) => {
      setSystemTheme((prev) => {
        const updated = { ...prev, [key]: value };
        localStorage.setItem(SYSTEM_THEME_STORAGE_KEY, JSON.stringify(updated));
        applyCssVariables(updated);
        triggerDatabaseSave(updated);
        return updated;
      });
    },
    [applyCssVariables, triggerDatabaseSave]
  );

  // Update multiple settings at once and save to DB
  const updateMultipleSettings = useCallback(
    (updates: Partial<SystemCustomTheme>) => {
      setSystemTheme((prev) => {
        const updated = { ...prev, ...updates };
        localStorage.setItem(SYSTEM_THEME_STORAGE_KEY, JSON.stringify(updated));
        applyCssVariables(updated);
        triggerDatabaseSave(updated);
        return updated;
      });
    },
    [applyCssVariables, triggerDatabaseSave]
  );

  // Reset to default sober theme
  const resetThemeToDefaults = useCallback(() => {
    const defaults = { ...DEFAULT_SYSTEM_THEME, updatedAt: new Date().toISOString() };
    setSystemTheme(defaults);
    localStorage.setItem(SYSTEM_THEME_STORAGE_KEY, JSON.stringify(defaults));
    applyCssVariables(defaults);
    triggerDatabaseSave(defaults);
  }, [applyCssVariables, triggerDatabaseSave]);

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
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-theme', theme);
    applyCssVariables(systemTheme);
  }, [isDarkMode, theme, systemTheme, applyCssVariables]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
        systemTheme,
        updateThemeSetting,
        updateMultipleSettings,
        resetThemeToDefaults,
        isSavingToDb,
        dbSyncStatus,
      }}
    >
      <div
        id="app-theme-wrapper"
        data-theme={theme}
        style={{
          fontFamily:
            systemTheme.fontFamily === 'serif'
              ? 'Georgia, Cambria, serif'
              : systemTheme.fontFamily === 'mono'
              ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
              : 'system-ui, -apple-system, sans-serif',
          fontSize: `${systemTheme.baseFontSize}px`,
          lineHeight: systemTheme.lineHeightScale,
        }}
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
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
