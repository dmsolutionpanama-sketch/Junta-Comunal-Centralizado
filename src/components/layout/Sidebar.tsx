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
  Shield,
  PhoneCall,
  Sliders,
  Server,
  Flame,
  History,
  Tv,
  PlusCircle,
  User,
  ClipboardCheck,
  Crown,
} from 'lucide-react';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { useTheme } from '../../context/ThemeContext';
import { User as UserType } from '../../types';

export type MainNavView =
  | 'vista-general'
  | 'trazabilidad'
  | 'busqueda-rapida'
  | 'dashboard'
  | 'reportes'
  | 'directorio-ciudadanos'
  | 'mapa-reportes'
  | 'mantenimiento-admin'
  | 'configuracion'
  | 'personalizacion-diseno'
  | 'configuracion-banner'
  | 'control-versiones';

interface SidebarProps {
  currentView: MainNavView;
  selectedCategoryDashboard: string | null;
  currentUser?: UserType | null;
  onNavigate: (view: MainNavView, categoryId?: string | null) => void;
  openNewTicketModal: () => void;
  onOpenCitizenPortal?: () => void;
  onOpenBackendModal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedCategoryDashboard,
  currentUser,
  onNavigate,
  openNewTicketModal,
  onOpenCitizenPortal,
  onOpenBackendModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { isDarkMode, systemTheme } = useTheme();
  const [dashboardSubmenuOpen, setDashboardSubmenuOpen] = useState(true);

  // Role hierarchy evaluation
  const userRole = currentUser?.rol || 'administrador';
  const isSuperAdminRole = userRole === 'super_administrador' || userRole === 'administrador';
  const isAdminRole = isSuperAdminRole || userRole === 'administrador';
  const isSupervisorRole = isAdminRole || userRole === 'supervisor';

  // Preview / Filter state (allows testing any role view; defaults to 'todos' to show all 4 tiers in exact order)
  const [roleFilter, setRoleFilter] = useState<'todos' | 'regular' | 'supervisor' | 'administrador' | 'super_administrador'>('todos');

  const showRegular = roleFilter === 'todos' || roleFilter === 'regular' || roleFilter === 'supervisor' || roleFilter === 'administrador' || roleFilter === 'super_administrador';
  const showSupervisor = (roleFilter === 'todos' && isSupervisorRole) || roleFilter === 'supervisor' || roleFilter === 'administrador' || roleFilter === 'super_administrador';
  const showAdmin = (roleFilter === 'todos' && isAdminRole) || roleFilter === 'administrador' || roleFilter === 'super_administrador';
  const showSuperAdmin = (roleFilter === 'todos' && isSuperAdminRole) || roleFilter === 'super_administrador';

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
        className={`h-16 md:h-20 px-5 md:px-6 border-b flex items-center justify-between gap-3 shrink-0 ${
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

      {/* Selector Rápido de Filtro de Rol Jerárquico */}
      <div className={`px-4 pt-3 pb-2 border-b shrink-0 ${isDarkMode ? 'border-slate-800/80 bg-slate-900/50' : 'border-slate-100 bg-slate-50/60'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
            Jerarquía de Vistas
          </span>
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
            {roleFilter === 'todos' ? '4 Niveles' : roleFilter.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-lg text-[10px] font-semibold text-center">
          <button
            type="button"
            title="Ver Todas las Vistas en Orden Jerárquico"
            onClick={() => setRoleFilter('todos')}
            className={`py-1 rounded cursor-pointer transition-all ${
              roleFilter === 'todos'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            title="Filtrar por Usuario Regular"
            onClick={() => setRoleFilter('regular')}
            className={`py-1 rounded cursor-pointer transition-all ${
              roleFilter === 'regular'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Regular
          </button>
          <button
            type="button"
            title="Filtrar por Supervisor"
            onClick={() => setRoleFilter('supervisor')}
            className={`py-1 rounded cursor-pointer transition-all ${
              roleFilter === 'supervisor'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Superv.
          </button>
          <button
            type="button"
            title="Filtrar por Administrador"
            onClick={() => setRoleFilter('administrador')}
            className={`py-1 rounded cursor-pointer transition-all ${
              roleFilter === 'administrador'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Navigation Options - STRICT HIERARCHICAL ORDER FROM TOP TO BOTTOM */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4 scrollbar-thin">

        {/* ===================================================================
            1. NIVEL 1: USUARIO REGULAR (Operativo, Atención & Radicación)
        =================================================================== */}
        {showRegular && (
          <div id="section-usuario-regular" className="space-y-1">
            {/* Header de Sección: Usuario Regular */}
            <div className="flex items-center justify-between px-2.5 py-1 mb-1">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <User className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  1. Usuario Regular
                </span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 uppercase">
                Operativo
              </span>
            </div>

            {/* 1.1 Registrar Incidencia (Acción Directa de Intake) */}
            <button
              type="button"
              id="nav-crear-incidencia-directa"
              onClick={() => {
                openNewTicketModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs mb-1.5"
            >
              <div className="flex items-center gap-2.5 truncate">
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">Registrar Incidencia</span>
              </div>
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white/25 text-white uppercase tracking-tight">
                + Nuevo
              </span>
            </button>

            {/* 1.2 Vista General */}
            <button
              type="button"
              id="nav-vista-general"
              onClick={() => handleItemClick('vista-general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'vista-general'
                  ? isDarkMode
                    ? 'bg-blue-950/70 text-blue-300 font-semibold border border-blue-900/60 shadow-xs'
                    : 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutList className={`w-4 h-4 shrink-0 ${currentView === 'vista-general' ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="truncate">Vista General</span>
            </button>

            {/* 1.3 Trazabilidad & Progreso */}
            <button
              type="button"
              id="nav-trazabilidad"
              onClick={() => handleItemClick('trazabilidad')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'trazabilidad'
                  ? isDarkMode
                    ? 'bg-blue-950/70 text-blue-300 font-semibold border border-blue-900/60 shadow-xs'
                    : 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <GitCommit className={`w-4 h-4 shrink-0 ${currentView === 'trazabilidad' ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="truncate">Trazabilidad & Progreso</span>
            </button>

            {/* 1.4 Consulta Rápida */}
            <button
              type="button"
              id="nav-busqueda-rapida"
              onClick={() => handleItemClick('busqueda-rapida')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'busqueda-rapida'
                  ? isDarkMode
                    ? 'bg-blue-950/70 text-blue-300 font-semibold border border-blue-900/60 shadow-xs'
                    : 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Search className={`w-4 h-4 shrink-0 ${currentView === 'busqueda-rapida' ? 'text-blue-500' : 'text-slate-400'}`} />
              <span className="truncate">Consulta Rápida</span>
            </button>
          </div>
        )}

        {/* ===================================================================
            2. NIVEL 2: SUPERVISOR (Supervisión, KPIs & Padrón Comunal)
        =================================================================== */}
        {showSupervisor && (
          <div id="section-supervisor" className="space-y-1 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            {/* Header de Sección: Supervisor */}
            <div className="flex items-center justify-between px-2.5 py-1 mb-1">
              <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  2. Supervisor
                </span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 uppercase">
                Supervisión
              </span>
            </div>

            {/* 2.1 Dashboard & Indicadores con Submenú por Categoría */}
            <div className="space-y-1">
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                  currentView === 'dashboard' && !selectedCategoryDashboard
                    ? isDarkMode
                      ? 'bg-cyan-950/70 text-cyan-300 font-semibold border border-cyan-800/60 shadow-xs'
                      : 'bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200 shadow-xs'
                    : isDarkMode
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div
                  id="nav-dashboard"
                  onClick={() => handleItemClick('dashboard', null)}
                  className="flex items-center gap-2.5 truncate flex-1"
                >
                  <LayoutDashboard className={`w-4 h-4 shrink-0 ${currentView === 'dashboard' ? 'text-cyan-500' : 'text-slate-400'}`} />
                  <span className="truncate font-medium">Dashboard & KPIs</span>
                </div>
                <button
                  type="button"
                  title="Expandir/contraer áreas"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDashboardSubmenuOpen(!dashboardSubmenuOpen);
                  }}
                  className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {dashboardSubmenuOpen ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Submenú de Categorías de Dashboard */}
              {dashboardSubmenuOpen && (
                <div className={`ml-4 pl-2.5 py-1.5 space-y-1 border-l text-xs ${isDarkMode ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'}`}>
                  {CATEGORIAS_SISTEMA.map((cat) => {
                    const isActive = currentView === 'dashboard' && selectedCategoryDashboard === cat.id;
                    return (
                      <div
                        key={cat.id}
                        id={`nav-dashboard-sub-${cat.id}`}
                        onClick={() => handleItemClick('dashboard', cat.id)}
                        className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-colors text-[11px] ${
                          isActive
                            ? isDarkMode
                              ? 'bg-cyan-950/60 text-cyan-300 font-semibold'
                              : 'bg-cyan-50 text-cyan-700 font-semibold'
                            : isDarkMode
                            ? 'hover:text-cyan-400 hover:bg-slate-800/40'
                            : 'hover:text-cyan-600 hover:bg-slate-100/60'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color || '#06b6d4' }}
                        />
                        <span className="truncate">{cat.nombre}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2.2 Reportes Estadísticos */}
            <button
              type="button"
              id="nav-reportes"
              onClick={() => handleItemClick('reportes')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'reportes'
                  ? isDarkMode
                    ? 'bg-cyan-950/70 text-cyan-300 font-semibold border border-cyan-800/60 shadow-xs'
                    : 'bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200 shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FileText className={`w-4 h-4 shrink-0 ${currentView === 'reportes' ? 'text-cyan-500' : 'text-slate-400'}`} />
              <span className="truncate">Reportes Estadísticos</span>
            </button>

            {/* 2.3 Directorio Ciudadano & WhatsApp */}
            <button
              type="button"
              id="nav-directorio-ciudadanos"
              onClick={() => handleItemClick('directorio-ciudadanos')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'directorio-ciudadanos'
                  ? isDarkMode
                    ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-800/60 shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shadow-xs'
                  : isDarkMode
                  ? 'text-emerald-300/90 hover:bg-emerald-950/40 hover:text-emerald-200'
                  : 'text-emerald-700/90 hover:bg-emerald-50/80 hover:text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <PhoneCall className="w-4 h-4 shrink-0 text-emerald-500" />
                <span className="truncate">Directorio & WhatsApp</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 uppercase">
                Padrón
              </span>
            </button>
          </div>
        )}

        {/* ===================================================================
            3. NIVEL 3: ADMINISTRADOR (Administración Comunal & Cartografía)
        =================================================================== */}
        {showAdmin && (
          <div id="section-administrador" className="space-y-1 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            {/* Header de Sección: Administrador */}
            <div className="flex items-center justify-between px-2.5 py-1 mb-1">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  3. Administrador
                </span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 uppercase">
                Admin
              </span>
            </div>

            {/* 3.1 Mapa Cartográfico & Focos de Calor */}
            <button
              type="button"
              id="nav-mapa-reportes"
              onClick={() => handleItemClick('mapa-reportes')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'mapa-reportes'
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-red-950/70 to-amber-950/70 text-amber-300 font-bold border border-red-800/60 shadow-xs'
                    : 'bg-gradient-to-r from-red-50 to-amber-50 text-red-700 font-bold border border-red-200 shadow-xs'
                  : isDarkMode
                  ? 'text-red-300 hover:bg-red-950/40 hover:text-red-200'
                  : 'text-red-700 hover:bg-red-50/80 hover:text-red-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Flame className="w-4 h-4 shrink-0 text-red-500 animate-pulse" />
                <span className="truncate">Mapa de Calor & Cartografía</span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 uppercase tracking-tight">
                Heatmap
              </span>
            </button>

            {/* 3.2 Mantenimiento Admin (Roles, Usuarios, Categorías) */}
            <button
              type="button"
              id="nav-mantenimiento-admin"
              onClick={() => handleItemClick('mantenimiento-admin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'mantenimiento-admin'
                  ? isDarkMode
                    ? 'bg-purple-950/70 text-purple-300 font-semibold border border-purple-800/60 shadow-xs'
                    : 'bg-purple-50 text-purple-700 font-semibold border border-purple-200 shadow-xs'
                  : isDarkMode
                  ? 'text-purple-300/90 hover:bg-purple-950/40 hover:text-purple-200'
                  : 'text-purple-700/90 hover:bg-purple-50/80 hover:text-purple-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Shield className="w-4 h-4 shrink-0 text-purple-500" />
                <span className="truncate">Mantenimiento Admin</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase">
                Usuarios
              </span>
            </button>

            {/* 3.3 Configuración & Base de Datos */}
            <button
              type="button"
              id="nav-configuracion"
              onClick={() => handleItemClick('configuracion')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'configuracion'
                  ? isDarkMode
                    ? 'bg-purple-950/70 text-purple-300 font-semibold border border-purple-800/60 shadow-xs'
                    : 'bg-purple-50 text-purple-700 font-semibold border border-purple-200 shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Settings className={`w-4 h-4 shrink-0 ${currentView === 'configuracion' ? 'text-purple-500' : 'text-slate-400'}`} />
              <span className="truncate">Configuración & MySQL</span>
            </button>
          </div>
        )}

        {/* ===================================================================
            4. NIVEL 4: SUPER ADMINISTRADOR (Despacho Superior & Control del Sitio)
        =================================================================== */}
        {showSuperAdmin && (
          <div id="section-super-administrador" className="space-y-1 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            {/* Header de Sección: Super Administrador */}
            <div className="flex items-center justify-between px-2.5 py-1 mb-1">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Crown className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  4. Super Administrador
                </span>
              </div>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 uppercase">
                Despacho
              </span>
            </div>

            {/* 4.1 Diseño & Personalización (Frontend/Backend) */}
            <button
              type="button"
              id="nav-personalizacion-diseno"
              onClick={() => handleItemClick('personalizacion-diseno')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'personalizacion-diseno'
                  ? isDarkMode
                    ? 'bg-amber-950/60 text-amber-300 font-semibold border border-amber-800/60 shadow-xs'
                    : 'bg-amber-50 text-amber-800 font-semibold border border-amber-200 shadow-xs'
                  : isDarkMode
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Sliders className={`w-4 h-4 shrink-0 ${currentView === 'personalizacion-diseno' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="truncate">Diseño & Personalización</span>
            </button>

            {/* 4.2 Configuración de Banner Institucional */}
            <button
              type="button"
              id="nav-configuracion-banner"
              onClick={() => handleItemClick('configuracion-banner')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'configuracion-banner'
                  ? isDarkMode
                    ? 'bg-amber-950/60 text-amber-300 font-semibold border border-amber-800/60 shadow-xs'
                    : 'bg-amber-50 text-amber-800 font-semibold border border-amber-200 shadow-xs'
                  : isDarkMode
                  ? 'text-amber-300/90 hover:bg-amber-950/40 hover:text-amber-200'
                  : 'text-amber-700/90 hover:bg-amber-50/80 hover:text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Tv className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="truncate">Configuración de Banner</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 uppercase">
                Media
              </span>
            </button>

            {/* 4.3 Control de Versiones del Sitio */}
            <button
              type="button"
              id="nav-control-versiones"
              onClick={() => handleItemClick('control-versiones')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                currentView === 'control-versiones'
                  ? isDarkMode
                    ? 'bg-indigo-950/60 text-indigo-300 font-semibold border border-indigo-800/60 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shadow-xs'
                  : isDarkMode
                  ? 'text-indigo-300/90 hover:bg-indigo-950/40 hover:text-indigo-200'
                  : 'text-indigo-700/90 hover:bg-indigo-50/80 hover:text-indigo-800'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <History className="w-4 h-4 shrink-0 text-indigo-500" />
                <span className="truncate">Control de Versiones</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase">
                Auditoría
              </span>
            </button>

            {/* 4.4 Conexión Dual Backend */}
            {onOpenBackendModal && (
              <button
                type="button"
                id="nav-dos-backends"
                onClick={() => {
                  onOpenBackendModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200/60 dark:hover:bg-slate-800 font-medium"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Server className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="truncate">2 Backends Activos</span>
                </div>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </button>
            )}
          </div>
        )}

      </nav>

      {/* Footer / System Status & Switch to Citizen Portal */}
      <div
        className={`p-3.5 border-t text-xs space-y-2 shrink-0 ${
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
          <span className="text-[11px] font-mono">v2.1.0</span>
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
