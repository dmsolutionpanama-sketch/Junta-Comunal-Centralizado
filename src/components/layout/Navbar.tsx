import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  LogOut,
  Plus,
  Clock,
  ChevronDown,
  Shield,
  Sun,
  Moon,
  LayoutGrid,
  Sparkles,
  Briefcase,
  Zap,
  User as UserIcon,
  Camera,
  RefreshCw,
  Database,
  Menu,
  Tag,
  MapPin,
  FileText,
  X,
} from 'lucide-react';
import { User, AppTheme, Ticket } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { matchesTicketSearch, getTicketMatchReason } from '../../utils/ticketSearch';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onQuickSearch: (query: string) => void;
  onOpenNewTicket: () => void;
  onToggleDrawer: () => void;
  onOpenCitizenPortal?: () => void;
  onOpenProfileModal?: () => void;
  onForceSync?: () => void;
  isSyncing?: boolean;
  unreadNotificationsCount?: number;
  onToggleMobileMenu?: () => void;
  tickets?: Ticket[];
  onSelectTicket?: (ticketId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onQuickSearch,
  onOpenNewTicket,
  onToggleDrawer,
  onOpenCitizenPortal,
  onOpenProfileModal,
  onForceSync,
  isSyncing = false,
  unreadNotificationsCount = 3,
  onToggleMobileMenu,
  tickets = [],
  onSelectTicket,
}) => {
  const { theme, setTheme, isDarkMode, toggleDarkMode, systemTheme } = useTheme();
  const [searchInput, setSearchInput] = useState('');
  const [showLiveSearch, setShowLiveSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close live search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowLiveSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute matching tickets for live dropdown
  const liveResults = React.useMemo(() => {
    if (!searchInput.trim() || !tickets || tickets.length === 0) return [];
    return tickets.filter((t) => matchesTicketSearch(t, searchInput)).slice(0, 5);
  }, [searchInput, tickets]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('es-PA', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onQuickSearch(searchInput.trim());
    }
  };

  const themeOptions: { id: AppTheme; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'high-density',
      label: 'High Density',
      shortLabel: 'Density',
      icon: LayoutGrid,
    },
    {
      id: 'clean-minimal',
      label: 'Clean Utility / Minimal',
      shortLabel: 'Clean',
      icon: Sparkles,
    },
    {
      id: 'professional-polish',
      label: 'Professional polish',
      shortLabel: 'Pro',
      icon: Briefcase,
    },
    {
      id: 'sleek-interface',
      label: 'Sleek interface',
      shortLabel: 'Sleek',
      icon: Zap,
    },
  ];

  return (
    <header
      style={{
        height: `${systemTheme.navbarHeight}px`,
        backgroundColor: isDarkMode ? undefined : systemTheme.backendHeaderBg,
      }}
      className={`border-b px-3 sm:px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20 transition-all duration-200 ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-800 backdrop-blur-md'
          : 'border-slate-100'
      }`}
    >
      {/* Left Area: Mobile Hamburger & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {onToggleMobileMenu && (
          <button
            type="button"
            id="btn-mobile-menu-toggle"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer shrink-0"
            title="Abrir Menú Principal"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search Bar Shortcut with Live Multi-Criteria Dropdown */}
        <div ref={searchContainerRef} className="relative w-full max-w-xs sm:max-w-md">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              id="navbar-search-input"
              type="text"
              value={searchInput}
              onFocus={() => setShowLiveSearch(true)}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowLiveSearch(true);
              }}
              placeholder="Buscar por cédula, nombre, tipo o sector..."
              className={`w-full pl-9 sm:pl-10 pr-8 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all outline-hidden font-normal ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:bg-slate-800/90 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500'
                  : 'bg-slate-100 border-transparent text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500'
              }`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setShowLiveSearch(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Live Search Suggestions Dropdown */}
          {showLiveSearch && searchInput.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {liveResults.length > 0
                    ? `Resultados para "${searchInput}" (${liveResults.length}):`
                    : `No hay tickets para "${searchInput}"`}
                </span>
                <span className="text-[10px] text-slate-400">Enter para ver todos</span>
              </div>

              {liveResults.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {liveResults.map((ticket) => {
                    const reason = getTicketMatchReason(ticket, searchInput);
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => {
                          setShowLiveSearch(false);
                          if (onSelectTicket) {
                            onSelectTicket(ticket.id);
                          } else {
                            onQuickSearch(ticket.numeroRegistro);
                          }
                        }}
                        className="p-3 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {ticket.numeroRegistro}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100/70 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                            {reason.label}: {reason.detail}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate text-xs">
                          {ticket.asunto}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          <span className="truncate">👤 {ticket.reportante?.nombre || 'Ciudadano'}</span>
                          <span>•</span>
                          <span className="truncate">📍 {ticket.sectorNombre}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    onClick={() => {
                      setShowLiveSearch(false);
                      onQuickSearch(searchInput.trim());
                    }}
                    className="p-2.5 bg-blue-50/60 dark:bg-blue-950/40 text-center text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100/80 cursor-pointer transition-colors text-[11px]"
                  >
                    Ver búsqueda completa de &quot;{searchInput}&quot; →
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-xs">No se encontraron tickets con este criterio.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pruebe buscando por cédula (ej: 8-888-1234), nombre, tipo de reporte o sector.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls Area */}
      <div className="flex items-center gap-2 lg:gap-3.5">
        {/* Live DB / WhatsApp Polling Badge (5s Interval) */}
        <div
          id="navbar-live-sync-indicator"
          className={`flex items-center gap-2 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all ${
            isDarkMode
              ? 'bg-slate-800/90 border-emerald-900/60 text-emerald-300'
              : 'bg-emerald-50/90 border-emerald-200/80 text-emerald-800'
          }`}
          title="Sincronización en vivo cada 5 segundos con la base de datos (u483786231_ticket_db) e ingresos de WhatsApp"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline font-semibold">Sync BD (5s):</span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">En Vivo</span>
          </div>
          {onForceSync && (
            <button
              type="button"
              id="btn-force-sync-db"
              onClick={onForceSync}
              className={`p-1 rounded-md transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                isDarkMode ? 'hover:bg-emerald-950 text-emerald-300' : 'hover:bg-emerald-100 text-emerald-700'
              }`}
              title="Refrescar ahora inmediatamente desde la base de datos"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Live Date / Time Badge */}
        <div className={`hidden 2xl:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border ${
          isDarkMode
            ? 'bg-slate-800/80 border-slate-700/80 text-slate-400'
            : 'bg-slate-50 border-slate-100 text-slate-500'
        }`}>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{currentTime}</span>
        </div>

        {/* Portal Ciudadano shortcut button */}
        {onOpenCitizenPortal && (
          <button
            type="button"
            id="btn-navbar-citizen-portal"
            onClick={onOpenCitizenPortal}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800/80 border-slate-700 text-blue-400 hover:bg-slate-700'
                : 'bg-blue-50 border-blue-200/70 text-blue-700 hover:bg-blue-100'
            }`}
            title="Ver Portal Ciudadano Público"
          >
            <span>🌐 Portal Ciudadano</span>
          </button>
        )}

        {/* 4 Template Style Switcher Buttons */}
        <div className={`flex items-center p-1 rounded-xl border gap-0.5 ${
          isDarkMode
            ? 'bg-slate-800/90 border-slate-700'
            : 'bg-slate-100 border-slate-200/80'
        }`} title="Seleccionar plantilla de diseño visual">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                id={`btn-theme-${opt.id}`}
                type="button"
                onClick={() => setTheme(opt.id)}
                title={`Plantilla: ${opt.label}`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? isDarkMode
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-blue-600 shadow-xs font-semibold'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">{opt.label}</span>
                <span className="hidden sm:inline xl:hidden">{opt.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          id="btn-toggle-dark-mode"
          onClick={toggleDarkMode}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700/80 shadow-xs'
              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 shadow-xs'
          }`}
          title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Create Ticket Primary Action Button */}
        <button
          type="button"
          id="btn-navbar-new-ticket"
          onClick={onOpenNewTicket}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs shadow-blue-200/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo Reporte</span>
        </button>

        {/* Notifications / Floating Drawer Toggle */}
        <button
          type="button"
          id="btn-toggle-notifications"
          onClick={onToggleDrawer}
          className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
            isDarkMode
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              : 'bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50'
          }`}
          title="Panel de Acciones Rápidas y Notificaciones"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            type="button"
            id="user-profile-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l cursor-pointer select-none bg-transparent hover:opacity-90 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}
          >
            <div className="hidden md:block text-right">
              <p className={`text-xs sm:text-sm font-semibold leading-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                {currentUser?.nombre || 'Usuario'}
              </p>
              <p className={`text-[11px] capitalize ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {currentUser?.rol || 'Administrador'}
              </p>
            </div>
            <div className="relative">
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.nombre}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-blue-600/40 shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-xs">
                  {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div
              id="user-dropdown-menu"
              className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 border ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className={`px-4 py-2.5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  {currentUser?.avatarUrl && (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.nombre}
                      className="w-7 h-7 rounded-full object-cover border border-blue-500"
                    />
                  )}
                  <p className="text-xs font-bold truncate">{currentUser?.nombre}</p>
                </div>
                <p className={`text-[11px] truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentUser?.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900">
                    <Shield className="w-3 h-3" />
                    <span>Rol: {currentUser?.rol}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">2026-08-28</span>
                </div>
              </div>

              <div className="py-1">
                {onOpenProfileModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenProfileModal();
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 cursor-pointer font-medium ${
                      isDarkMode ? 'text-blue-400 hover:bg-slate-800' : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                    Actualizar Foto y Perfil
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    onToggleDrawer();
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 cursor-pointer ${
                    isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  Notificaciones del Sistema
                </button>
              </div>

              <div className={`border-t pt-1 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  id="btn-logout"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
