import React, { useState } from 'react';
import {
  LayoutList,
  GitCommit,
  Search,
  FileText,
  Settings,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
  Droplets,
  TreePine,
  HeartHandshake,
  FileCheck,
  Trophy,
  Shield,
  Users,
  Map,
  PhoneCall,
  MessageSquare,
  Sliders,
} from 'lucide-react';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { useTheme } from '../../context/ThemeContext';
import { User } from '../../types';

export type MainNavView =
  | 'vista-general'
  | 'trazabilidad'
  | 'busqueda-rapida'
  | 'reportes'
  | 'mapa-reportes'
  | 'directorio-ciudadanos'
  | 'personalizacion-diseno'
  | 'configuracion'
  | 'mantenimiento-admin'
  | 'dashboard';

interface SidebarProps {
  currentView: MainNavView;
  selectedCategoryDashboard: string | null;
  currentUser?: User | null;
  onNavigate: (view: MainNavView, categoryId?: string | null) => void;
  openNewTicketModal: () => void;
  onOpenCitizenPortal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedCategoryDashboard,
  currentUser,
  onNavigate,
  onOpenCitizenPortal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { isDarkMode, systemTheme } = useTheme();
  const [dashboardSubmenuOpen, setDashboardSubmenuOpen] = useState(true);
  const isSuperiorAdmin = currentUser?.rol === 'administrador';

  const handleItemClick = (view: MainNavView, categoryId?: string | null) => {
    onNavigate(view, categoryId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div
        className={`h-16 md:h-20 px-5 md:px-6 border-b flex items-center justify-between gap-3 ${
          isDarkMode ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-base tracking-tight leading-tight">
              <span>Junta Comunal</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
              Gestión de Incidencias
            </span>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-sm font-bold"
            title="Cerrar Menú"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Options */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1 scrollbar-thin">
        {/* 1. Vista General (Primera Opción) */}
        <button
          type="button"
          id="nav-vista-general"
          onClick={() => onNavigate('vista-general')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
            currentView === 'vista-general'
              ? isDarkMode
                ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-900/60'
                : 'bg-blue-50 text-blue-600 font-semibold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <LayoutList
            className={`w-4.5 h-4.5 shrink-0 ${
              currentView === 'vista-general'
                ? 'text-blue-500'
                : isDarkMode
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          />
          <span className="truncate">Vista General</span>
        </button>

        {/* 2. Trazabilidad del Ticket (Segunda Opción) */}
        <button
          type="button"
          id="nav-trazabilidad"
          onClick={() => onNavigate('trazabilidad')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
            currentView === 'trazabilidad'
              ? isDarkMode
                ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-900/60'
                : 'bg-blue-50 text-blue-600 font-semibold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <GitCommit
            className={`w-4.5 h-4.5 shrink-0 ${
              currentView === 'trazabilidad'
                ? 'text-blue-500'
                : isDarkMode
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          />
          <span className="truncate">Trazabilidad & Progreso</span>
        </button>

        {/* 3. Búsqueda y Visualización Rápida (Consulta) */}
        <button
          type="button"
          id="nav-busqueda-rapida"
          onClick={() => onNavigate('busqueda-rapida')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
            currentView === 'busqueda-rapida'
              ? isDarkMode
                ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-900/60'
                : 'bg-blue-50 text-blue-600 font-semibold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Search
            className={`w-4.5 h-4.5 shrink-0 ${
              currentView === 'busqueda-rapida'
                ? 'text-blue-500'
                : isDarkMode
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          />
          <span className="truncate">Consulta Rápida</span>
        </button>

        {/* 4. Reportes */}
        <button
          type="button"
          id="nav-reportes"
          onClick={() => onNavigate('reportes')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
            currentView === 'reportes'
              ? isDarkMode
                ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-900/60'
                : 'bg-blue-50 text-blue-600 font-semibold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText
            className={`w-4.5 h-4.5 shrink-0 ${
              currentView === 'reportes'
                ? 'text-blue-500'
                : isDarkMode
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          />
          <span className="truncate">Reportes</span>
        </button>

        {/* 5. Mantenimiento de Categorías & Roles y Mapa Cartográfico (SOLO ADMINISTRADOR SUPERIOR) */}
        {isSuperiorAdmin && (
          <>
            {/* Mapa de Reportes (Solo Administradores) */}
            <button
              type="button"
              id="nav-mapa-reportes"
              onClick={() => onNavigate('mapa-reportes')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'mapa-reportes'
                  ? isDarkMode
                    ? 'bg-purple-950/60 text-purple-300 font-semibold border border-purple-800/60'
                    : 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                  : isDarkMode
                  ? 'text-purple-300 hover:bg-purple-950/40 hover:text-purple-200'
                  : 'text-purple-700 hover:bg-purple-50/80 hover:text-purple-800'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Map className="w-4.5 h-4.5 shrink-0 text-purple-600 dark:text-purple-400" />
                <span className="truncate">Mapa de Incidencias</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase">
                Admin
              </span>
            </button>

            {/* Directorio Ciudadano & WhatsApp (Solo Administradores) */}
            <button
              type="button"
              id="nav-directorio-ciudadanos"
              onClick={() => onNavigate('directorio-ciudadanos')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'directorio-ciudadanos'
                  ? isDarkMode
                    ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-800/60'
                    : 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                  : isDarkMode
                  ? 'text-emerald-300 hover:bg-emerald-950/40 hover:text-emerald-200'
                  : 'text-emerald-700 hover:bg-emerald-50/80 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <PhoneCall className="w-4.5 h-4.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">Directorio & WhatsApp</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
                Admin
              </span>
            </button>

            {/* Mantenimiento Admin */}
            <button
              type="button"
              id="nav-mantenimiento-admin"
              onClick={() => onNavigate('mantenimiento-admin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'mantenimiento-admin'
                  ? isDarkMode
                    ? 'bg-purple-950/60 text-purple-300 font-semibold border border-purple-800/60'
                    : 'bg-purple-50 text-purple-700 font-semibold border border-purple-200'
                  : isDarkMode
                  ? 'text-purple-300 hover:bg-purple-950/40 hover:text-purple-200'
                  : 'text-purple-700 hover:bg-purple-50/80 hover:text-purple-800'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Shield className="w-4.5 h-4.5 shrink-0 text-purple-600 dark:text-purple-400" />
                <span className="truncate">Mantenimiento Admin</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase">
                Admin
              </span>
            </button>
          </>
        )}

        {/* 6. Personalización & Diseño del Sistema */}
        <button
          type="button"
          id="nav-personalizacion-diseno"
          onClick={() => onNavigate('personalizacion-diseno')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
            currentView === 'personalizacion-diseno'
              ? isDarkMode
                ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-900/60'
                : 'bg-blue-50 text-blue-600 font-semibold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders
            className={`w-4.5 h-4.5 shrink-0 ${
              currentView === 'personalizacion-diseno'
                ? 'text-blue-500'
                : isDarkMode
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          />
          <span className="truncate">Diseño & Personalización</span>
        </button>

        {/* 7. Configuración & BD */}
        <button
          type="button"
          id="nav-configuracion"
          onClick={() => onNavigate('configuracion')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
            currentView === 'configuracion'
              ? isDarkMode
                ? 'bg-blue-950/60 text-blue-400 font-semibold border border-blue-900/60'
                : 'bg-blue-50 text-blue-600 font-semibold'
              : isDarkMode
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Settings
            className={`w-4.5 h-4.5 shrink-0 ${
              currentView === 'configuracion'
                ? 'text-blue-500'
                : isDarkMode
                ? 'text-slate-400'
                : 'text-slate-400'
            }`}
          />
          <span className="truncate">Configuración</span>
        </button>

        {/* REGLA FIJA: DASHBOARD SIEMPRE COMO ÚLTIMA OPCIÓN */}
        <div className="pt-4 mt-2">
          <div
            className={`rounded-2xl p-4 border transition-colors ${
              isDarkMode
                ? 'bg-slate-800/60 border-slate-700/80'
                : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                onClick={() => onNavigate('dashboard', null)}
                className={`text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                  currentView === 'dashboard' && !selectedCategoryDashboard
                    ? 'text-blue-500'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Dashboard
              </p>
              <button
                type="button"
                onClick={() => setDashboardSubmenuOpen(!dashboardSubmenuOpen)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isDarkMode
                    ? 'hover:bg-slate-700 text-slate-400'
                    : 'hover:bg-slate-200/50 text-slate-400'
                }`}
              >
                {dashboardSubmenuOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Dashboard Submenu */}
            {dashboardSubmenuOpen && (
              <ul
                className={`space-y-1.5 text-xs ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {CATEGORIAS_SISTEMA.map((cat) => {
                  const isActive =
                    currentView === 'dashboard' &&
                    selectedCategoryDashboard === cat.id;

                  return (
                    <li
                      key={cat.id}
                      id={`nav-dashboard-sub-${cat.id}`}
                      onClick={() => onNavigate('dashboard', cat.id)}
                      className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? isDarkMode
                            ? 'bg-blue-900/50 text-blue-400 font-semibold'
                            : 'bg-blue-50/80 text-blue-600 font-semibold'
                          : isDarkMode
                          ? 'hover:text-blue-400 hover:bg-slate-700/50'
                          : 'hover:text-blue-600 hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#0066FF' }}
                        />
                        <span className="truncate">{cat.nombre}</span>
                      </div>
                    </li>
                  );
                })}
                <li
                  onClick={() => handleItemClick('dashboard', null)}
                  className={`flex items-center gap-1 cursor-pointer italic text-xs pt-1.5 border-t ${
                    isDarkMode
                      ? 'border-slate-700 text-slate-400 hover:text-blue-400'
                      : 'border-slate-200/50 text-slate-400 hover:text-blue-600'
                  }`}
                >
                  <span>Ver todas las categorías</span>
                  <span>→</span>
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {/* Footer / System Status & Portal Ciudadano Switch */}
      <div
        className={`p-4 border-t text-xs space-y-2.5 ${
          isDarkMode
            ? 'border-slate-800 bg-slate-900/90 text-slate-400'
            : 'border-slate-100 bg-white text-slate-400'
        }`}
      >
        {onOpenCitizenPortal && (
          <button
            type="button"
            onClick={() => {
              onOpenCitizenPortal();
              if (onCloseMobile) onCloseMobile();
            }}
            id="btn-sidebar-citizen-portal"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs transition-colors cursor-pointer border border-blue-200/60 dark:border-blue-900/50"
          >
            <span>🌐 Ver Portal Ciudadano</span>
          </button>
        )}
        <div className="flex items-center justify-between">
          <span
            className={`flex items-center gap-1.5 font-medium ${
              isDarkMode ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Junta Comunal MySQL
          </span>
          <span className="text-[11px] font-mono">v2.0.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="main-sidebar-nav"
        style={{
          width: `${systemTheme.sidebarWidth}px`,
          backgroundColor: isDarkMode ? undefined : systemTheme.backendSidebarBg,
        }}
        className={`hidden md:flex border-r flex-col shrink-0 h-screen sticky top-0 select-none z-30 transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-200'
            : 'border-slate-200/90 text-slate-700'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />
          <div
            className={`relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200 ${
              isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white text-slate-700'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
