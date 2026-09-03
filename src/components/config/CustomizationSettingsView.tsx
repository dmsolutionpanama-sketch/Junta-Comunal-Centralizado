import React, { useState } from 'react';
import {
  Palette,
  Maximize2,
  Type,
  Layout,
  Database,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Eye,
  SlidersHorizontal,
  Laptop,
  Smartphone,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { SystemCustomTheme } from '../../types';

export const CustomizationSettingsView: React.FC = () => {
  const {
    systemTheme,
    updateThemeSetting,
    updateMultipleSettings,
    resetThemeToDefaults,
    isSavingToDb,
    dbSyncStatus,
    isDarkMode,
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'backend-colors' | 'dimensions' | 'typography' | 'frontend-colors'>('backend-colors');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sober Color Presets (Clean, non-colorful, dignified municipal palettes)
  const SOBER_PALETTES = [
    {
      name: 'Institucional Clásico',
      description: 'Azul marino sobrio y neutrales suaves de alta legibilidad',
      primary: '#1e3a8a',
      accent: '#2563eb',
      sidebar: '#0f172a',
      header: '#ffffff',
      bg: '#f8fafc',
    },
    {
      name: 'Gris Grafito Minimalista',
      description: 'Paleta neutra de alto contraste, cero distracción visual',
      primary: '#334155',
      accent: '#475569',
      sidebar: '#18181b',
      header: '#ffffff',
      bg: '#fafafa',
    },
    {
      name: 'Azul Ejecutivo Noche',
      description: 'Tonalidades profundas ejecutivas para máxima sobriedad',
      primary: '#1e293b',
      accent: '#3b82f6',
      sidebar: '#020617',
      header: '#ffffff',
      bg: '#f1f5f9',
    },
    {
      name: 'Verde Cívico Comunal',
      description: 'Verde bosque institucional equilibrado y sereno',
      primary: '#166534',
      accent: '#15803d',
      sidebar: '#052e16',
      header: '#ffffff',
      bg: '#f8fafc',
    },
    {
      name: 'Vino Tinto / Borgoña',
      description: 'Elegancia institucional con acentos de distinción cívica',
      primary: '#831843',
      accent: '#9d174d',
      sidebar: '#1e1b4b',
      header: '#ffffff',
      bg: '#fafaf9',
    },
  ];

  const applyPalette = (p: typeof SOBER_PALETTES[0]) => {
    updateMultipleSettings({
      frontendPrimaryColor: p.primary,
      frontendAccentColor: p.accent,
      frontendBgColor: p.bg,
      backendSidebarBg: p.sidebar,
      backendPrimaryColor: p.primary,
      backendBgColor: p.bg,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Personalización & Diseño del Sistema
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Front-end & Back-end
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Ajuste los colores del panel administrativo, del portal ciudadano, el ancho, alto y escala de tipografías. 
                Cada cambio se guarda <strong>automáticamente en la base de datos MySQL</strong> en tiempo real.
              </p>
            </div>
          </div>

          {/* Database Persistence Status Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                isSavingToDb
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : dbSyncStatus?.savedInDb
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Database className={`w-4 h-4 ${isSavingToDb ? 'animate-spin' : ''}`} />
              <div>
                <span className="font-semibold block">
                  {isSavingToDb
                    ? 'Guardando en Base de Datos...'
                    : dbSyncStatus?.savedInDb
                    ? 'Base de Datos MySQL Sincronizada'
                    : 'Guardado en Servidor'}
                </span>
                <span className="text-[10px] opacity-80">
                  {dbSyncStatus?.timestamp ? `Última actualización: ${dbSyncStatus.timestamp}` : 'u483786231_ticket_db'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restablecer tema a valores sobrios predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>

        {/* Confirmation Modal for Reset */}
        {showResetConfirm && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-amber-800 dark:text-amber-200">
              ¿Desea restablecer todos los colores, dimensiones y tipografías a los valores institucionales sobrios por defecto?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  resetThemeToDefaults();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
              >
                Sí, Restablecer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Control Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('backend-colors')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'backend-colors'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Colores del Back-end (Panel Administrativo)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dimensions')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'dimensions'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Maximize2 className="w-4 h-4" />
          <span>Dimensiones (Ancho y Alto)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('typography')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'typography'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Tamaño de las Tipografías</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('frontend-colors')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'frontend-colors'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Colores del Front-end (Portal Ciudadano)</span>
        </button>
      </div>

      {/* SOBER PRESETS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Paletas Sobrias & Elegantes (Cero Saturación Excesiva)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Haga clic en una paleta para aplicarla y guardarla en BD</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {SOBER_PALETTES.map((pal) => {
            const isSelected = systemTheme.backendPrimaryColor === pal.primary;
            return (
              <button
                key={pal.name}
                type="button"
                onClick={() => applyPalette(pal)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: pal.sidebar }} />
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: pal.primary }} />
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: pal.accent }} />
                  <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: pal.bg }} />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{pal.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{pal.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: BACKEND COLORS */}
      {activeTab === 'backend-colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              Colores de Superficie del Back-end (Administración)
            </h3>

            {/* Sidebar Background Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color del Menú Lateral (Sidebar)
                </label>
                <span className="text-[11px] text-slate-400">Fondo de la barra de navegación lateral izquierda</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.backendSidebarBg}
                  onChange={(e) => updateThemeSetting('backendSidebarBg', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.backendSidebarBg}
                  onChange={(e) => updateThemeSetting('backendSidebarBg', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Header / Navbar Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color de Barra Superior (Header)
                </label>
                <span className="text-[11px] text-slate-400">Fondo de la barra de usuario y búsqueda</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.backendHeaderBg}
                  onChange={(e) => updateThemeSetting('backendHeaderBg', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.backendHeaderBg}
                  onChange={(e) => updateThemeSetting('backendHeaderBg', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Canvas Background Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color de Fondo Principal (Canvas)
                </label>
                <span className="text-[11px] text-slate-400">Superficie base de la vista administrativa</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.backendBgColor}
                  onChange={(e) => updateThemeSetting('backendBgColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.backendBgColor}
                  onChange={(e) => updateThemeSetting('backendBgColor', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Primary Action Button Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color Primario de Acciones y Botones
                </label>
                <span className="text-[11px] text-slate-400">Botones destacados, estados activos y enlaces</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.backendPrimaryColor}
                  onChange={(e) => updateThemeSetting('backendPrimaryColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.backendPrimaryColor}
                  onChange={(e) => updateThemeSetting('backendPrimaryColor', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Card Background */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color de Tarjetas y Paneles
                </label>
                <span className="text-[11px] text-slate-400">Contenedores de información y tablas</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.backendCardBg}
                  onChange={(e) => updateThemeSetting('backendCardBg', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.backendCardBg}
                  onChange={(e) => updateThemeSetting('backendCardBg', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Border Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color de Bordes y Divisores
                </label>
                <span className="text-[11px] text-slate-400">Líneas sutiles de separación estructural</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.backendBorderColor}
                  onChange={(e) => updateThemeSetting('backendBorderColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.backendBorderColor}
                  onChange={(e) => updateThemeSetting('backendBorderColor', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Real-time Preview Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                Vista Previa en Vivo (Back-end)
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Previsualización inmediata del panel con las dimensiones y colores seleccionados:
              </p>

              {/* Back-end Mock Container */}
              <div
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{
                  backgroundColor: systemTheme.backendBgColor,
                  borderColor: systemTheme.backendBorderColor,
                }}
              >
                {/* Header Mock */}
                <div
                  className="h-10 px-4 border-b flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: systemTheme.backendHeaderBg,
                    borderColor: systemTheme.backendBorderColor,
                    color: systemTheme.backendTextColor,
                  }}
                >
                  <span className="font-bold">Panel Junta Comunal</span>
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="flex h-44">
                  {/* Sidebar Mock */}
                  <div
                    className="p-3 text-[11px] text-white flex flex-col gap-2 shrink-0"
                    style={{
                      backgroundColor: systemTheme.backendSidebarBg,
                      width: `${Math.min(180, Math.max(120, systemTheme.sidebarWidth * 0.6))}px`,
                    }}
                  >
                    <div className="font-bold text-[10px] uppercase opacity-70">Menú</div>
                    <div className="px-2 py-1 rounded bg-white/10 font-semibold truncate">Vista General</div>
                    <div className="px-2 py-1 rounded hover:bg-white/5 opacity-80 truncate">Trazabilidad</div>
                    <div className="px-2 py-1 rounded hover:bg-white/5 opacity-80 truncate">Reportes</div>
                  </div>

                  {/* Main Content Mock */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2">
                    <div
                      className="p-3 rounded-lg border shadow-xs"
                      style={{
                        backgroundColor: systemTheme.backendCardBg,
                        borderColor: systemTheme.backendBorderColor,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs" style={{ color: systemTheme.backendTextColor }}>
                          Ticket #TK-2026-001
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: systemTheme.backendPrimaryColor }}
                        >
                          En Progreso
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Reparación y mantenimiento de luminarias.</p>
                      <button
                        type="button"
                        className="mt-2 px-3 py-1 text-[11px] font-semibold text-white rounded cursor-pointer"
                        style={{ backgroundColor: systemTheme.backendPrimaryColor }}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Guardado en BD: <strong>u483786231_ticket_db</strong></span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> En tiempo real
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIMENSIONS (ANCHO Y ALTO) */}
      {activeTab === 'dimensions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-blue-600" />
              Edición de Dimensiones del Back-end (Ancho y Alto)
            </h3>

            {/* Sidebar Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Ancho del Menú Lateral (Sidebar)
                  </label>
                  <span className="block text-[11px] text-slate-400">Espacio horizontal para el menú de navegación</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.sidebarWidth} px
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={340}
                step={10}
                value={systemTheme.sidebarWidth}
                onChange={(e) => updateThemeSetting('sidebarWidth', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex gap-2 pt-1">
                {[220, 260, 300].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => updateThemeSetting('sidebarWidth', w)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      systemTheme.sidebarWidth === w
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {w === 220 ? 'Compacto (220px)' : w === 260 ? 'Estándar (260px)' : 'Amplio (300px)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Navbar Height */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Alto de la Barra Superior (Header / Navbar)
                  </label>
                  <span className="block text-[11px] text-slate-400">Altura vertical del encabezado superior</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.navbarHeight} px
                </span>
              </div>
              <input
                type="range"
                min={52}
                max={80}
                step={4}
                value={systemTheme.navbarHeight}
                onChange={(e) => updateThemeSetting('navbarHeight', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex gap-2 pt-1">
                {[56, 64, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => updateThemeSetting('navbarHeight', h)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      systemTheme.navbarHeight === h
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {h === 56 ? '56px Compacto' : h === 64 ? '64px Normal' : '72px Espacioso'}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Max Width */}
            <div className="space-y-2 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Ancho Máximo del Contenido Principal
                </label>
                <span className="block text-[11px] text-slate-400">Contención horizontal de las pantallas</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '100% Fluido', val: 'full' },
                  { label: '1400 px', val: '1400px' },
                  { label: '1600 px', val: '1600px' },
                  { label: '1800 px', val: '1800px' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => updateThemeSetting('mainMaxWidth', opt.val)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center cursor-pointer ${
                      systemTheme.mainMaxWidth === opt.val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Row Height */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Altura de Filas en Tablas de Incidencias
                  </label>
                  <span className="block text-[11px] text-slate-400">Densidad de datos en listados y registros</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.tableRowHeight} px
                </span>
              </div>
              <input
                type="range"
                min={36}
                max={60}
                step={2}
                value={systemTheme.tableRowHeight}
                onChange={(e) => updateThemeSetting('tableRowHeight', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Map Height */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Altura del Mapa Cartográfico y Paneles
                  </label>
                  <span className="block text-[11px] text-slate-400">Dimensión vertical del visor de Google Maps</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.mapHeight} px
                </span>
              </div>
              <input
                type="range"
                min={300}
                max={580}
                step={20}
                value={systemTheme.mapHeight}
                onChange={(e) => updateThemeSetting('mapHeight', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Visual Demonstration of Dimensions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                Resumen de Dimensiones Configuradas
              </h3>

              <div className="mt-4 space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">Ancho Menú Lateral:</span>
                  <strong className="font-mono text-blue-600">{systemTheme.sidebarWidth} px</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">Alto Barra Superior:</span>
                  <strong className="font-mono text-blue-600">{systemTheme.navbarHeight} px</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">Ancho Máximo Pantalla:</span>
                  <strong className="font-mono text-blue-600">{systemTheme.mainMaxWidth}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">Densidad Filas Tablas:</span>
                  <strong className="font-mono text-blue-600">{systemTheme.tableRowHeight} px</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500">Alto Visor Mapa:</span>
                  <strong className="font-mono text-blue-600">{systemTheme.mapHeight} px</strong>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
              💡 Al modificar cualquiera de estos controles, el diseño de la aplicación adapta sus variables CSS inmediatamente y guarda la configuración en la base de datos MySQL.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TYPOGRAPHY (TAMAÑO DE LAS TIPOGRAFÍAS) */}
      {activeTab === 'typography' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-600" />
              Ajuste de Escala de Tipografías
            </h3>

            {/* Base Font Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Tamaño de Texto Base (Cuerpo & Tablas)
                  </label>
                  <span className="block text-[11px] text-slate-400">Tamaño del texto general de lectura</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.baseFontSize} px
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={18}
                step={1}
                value={systemTheme.baseFontSize}
                onChange={(e) => updateThemeSetting('baseFontSize', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex gap-2">
                {[13, 14, 15, 16].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => updateThemeSetting('baseFontSize', sz)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                      systemTheme.baseFontSize === sz
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    {sz} px
                  </button>
                ))}
              </div>
            </div>

            {/* H1 Heading Size */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Tamaño de Títulos Principales (H1)
                  </label>
                  <span className="block text-[11px] text-slate-400">Encabezados de vistas y secciones</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.h1Size} px
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={34}
                step={2}
                value={systemTheme.h1Size}
                onChange={(e) => updateThemeSetting('h1Size', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* H2 / H3 Subtitle Size */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Tamaño de Subtítulos (H2 / H3)
                  </label>
                  <span className="block text-[11px] text-slate-400">Títulos de tarjetas y bloques analíticos</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.h2Size} px
                </span>
              </div>
              <input
                type="range"
                min={16}
                max={22}
                step={1}
                value={systemTheme.h2Size}
                onChange={(e) => updateThemeSetting('h2Size', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Label / Badge Size */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Tamaño de Etiquetas, Badges y Metadatos
                  </label>
                  <span className="block text-[11px] text-slate-400">Pastillas de estado, fechas y chips</span>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {systemTheme.labelSize} px
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={14}
                step={1}
                value={systemTheme.labelSize}
                onChange={(e) => updateThemeSetting('labelSize', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Line Height Scale */}
            <div className="space-y-2 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Interlineado (Line Height)
                </label>
                <span className="block text-[11px] text-slate-400">Espaciado vertical entre renglones</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Compacto (1.35)', val: 1.35 },
                  { label: 'Normal (1.50)', val: 1.5 },
                  { label: 'Espacioso (1.70)', val: 1.7 },
                ].map((lh) => (
                  <button
                    key={lh.val}
                    type="button"
                    onClick={() => updateThemeSetting('lineHeightScale', lh.val)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center cursor-pointer ${
                      systemTheme.lineHeightScale === lh.val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lh.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-2 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Familia Tipográfica
                </label>
                <span className="block text-[11px] text-slate-400">Fuente tipográfica aplicada al sistema</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sans-Serif', val: 'sans' as const, font: 'font-sans' },
                  { label: 'Serif Clásica', val: 'serif' as const, font: 'font-serif' },
                  { label: 'Monoespaciada', val: 'mono' as const, font: 'font-mono' },
                ].map((ff) => (
                  <button
                    key={ff.val}
                    type="button"
                    onClick={() => updateThemeSetting('fontFamily', ff.val)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center cursor-pointer ${ff.font} ${
                      systemTheme.fontFamily === ff.val
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {ff.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Typography Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              Muestra de Jerarquía Tipográfica
            </h3>

            <div
              className="p-5 rounded-xl border space-y-4 bg-slate-50/50 dark:bg-slate-800/40"
              style={{
                borderColor: systemTheme.backendBorderColor,
                lineHeight: systemTheme.lineHeightScale,
              }}
            >
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Encabezado H1 ({systemTheme.h1Size}px)</span>
                <h1 style={{ fontSize: `${systemTheme.h1Size}px` }} className="font-bold text-slate-900 dark:text-slate-100">
                  Gestión Comunal de Incidencias
                </h1>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Subtítulo H2 ({systemTheme.h2Size}px)</span>
                <h2 style={{ fontSize: `${systemTheme.h2Size}px` }} className="font-semibold text-slate-800 dark:text-slate-200">
                  Trazabilidad de Respuestas Rápidas por Sector
                </h2>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Texto Base ({systemTheme.baseFontSize}px)</span>
                <p style={{ fontSize: `${systemTheme.baseFontSize}px` }} className="text-slate-700 dark:text-slate-300">
                  Las cuadrillas operativas atienden reportes de luminarias, bacheo y fugas de agua. Cada seguimiento queda asentado
                  con el tiempo exacto consumido en minutos por interacción de WhatsApp o llamada telefónica.
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Etiquetas & Badges ({systemTheme.labelSize}px)</span>
                <div className="flex gap-2 flex-wrap">
                  <span
                    style={{ fontSize: `${systemTheme.labelSize}px` }}
                    className="px-2.5 py-1 rounded-full font-bold text-white bg-blue-600"
                  >
                    Resuelto a Tiempo
                  </span>
                  <span
                    style={{ fontSize: `${systemTheme.labelSize}px` }}
                    className="px-2.5 py-1 rounded-full font-bold text-slate-700 bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
                  >
                    15 min WhatsApp
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FRONTEND COLORS (PORTAL CIUDADANO) */}
      {activeTab === 'frontend-colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Colores del Front-end (Portal Público del Ciudadano)
            </h3>

            {/* Frontend Primary Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color Primario Front-end
                </label>
                <span className="text-[11px] text-slate-400">Botón Radicar Ticket, consulta pública y acentos</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.frontendPrimaryColor}
                  onChange={(e) => updateThemeSetting('frontendPrimaryColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.frontendPrimaryColor}
                  onChange={(e) => updateThemeSetting('frontendPrimaryColor', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Frontend Accent Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color Secundario / Acento
                </label>
                <span className="text-[11px] text-slate-400">Tarjetas de categorías y destacados ciudadanos</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.frontendAccentColor}
                  onChange={(e) => updateThemeSetting('frontendAccentColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.frontendAccentColor}
                  onChange={(e) => updateThemeSetting('frontendAccentColor', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Frontend Background */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Fondo del Portal Ciudadano
                </label>
                <span className="text-[11px] text-slate-400">Superficie base de la vista pública</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.frontendBgColor}
                  onChange={(e) => updateThemeSetting('frontendBgColor', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.frontendBgColor}
                  onChange={(e) => updateThemeSetting('frontendBgColor', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Frontend Card Background */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Color de Tarjetas Ciudadanas
                </label>
                <span className="text-[11px] text-slate-400">Tarjetas de incidencias y formulario</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.frontendCardBg}
                  onChange={(e) => updateThemeSetting('frontendCardBg', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.frontendCardBg}
                  onChange={(e) => updateThemeSetting('frontendCardBg', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Frontend Header Background */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Barra Superior Front-end
                </label>
                <span className="text-[11px] text-slate-400">Encabezado público con logotipo y acceso staff</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="color"
                  value={systemTheme.frontendHeaderBg}
                  onChange={(e) => updateThemeSetting('frontendHeaderBg', e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 p-0.5 bg-transparent"
                />
                <input
                  type="text"
                  value={systemTheme.frontendHeaderBg}
                  onChange={(e) => updateThemeSetting('frontendHeaderBg', e.target.value)}
                  className="w-24 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Front-end Mockup Preview */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-600" />
                Vista Previa del Portal Ciudadano (Front-end)
              </h3>

              <div
                className="mt-4 rounded-xl border p-4 shadow-sm space-y-4"
                style={{
                  backgroundColor: systemTheme.frontendBgColor,
                  borderColor: systemTheme.backendBorderColor,
                }}
              >
                {/* Public Navbar Mock */}
                <div
                  className="p-3 rounded-lg border flex items-center justify-between"
                  style={{
                    backgroundColor: systemTheme.frontendHeaderBg,
                    borderColor: systemTheme.backendBorderColor,
                  }}
                >
                  <span className="font-bold text-xs" style={{ color: systemTheme.frontendPrimaryColor }}>
                    Junta Comunal - Portal Ciudadano
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                    style={{ backgroundColor: systemTheme.frontendPrimaryColor }}
                  >
                    Acceso Funcionarios
                  </span>
                </div>

                {/* Hero / Action Box */}
                <div
                  className="p-4 rounded-xl border space-y-2 shadow-xs"
                  style={{
                    backgroundColor: systemTheme.frontendCardBg,
                    borderColor: systemTheme.backendBorderColor,
                  }}
                >
                  <h4 className="font-bold text-xs" style={{ color: systemTheme.frontendTextColor }}>
                    Radique su Incidencia Comunitaria
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Consulte el estado de su solicitud o registre una nueva luminaria o daño de tubería.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold cursor-pointer"
                      style={{ backgroundColor: systemTheme.frontendPrimaryColor }}
                    >
                      + Radicar Nuevo Reporte
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer"
                      style={{
                        borderColor: systemTheme.frontendAccentColor,
                        color: systemTheme.frontendAccentColor,
                      }}
                    >
                      Consultar con Radicado
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-500">
              Todos los cambios aplicados en esta sección se reflejan en la vista pública ciudadana y persisten de forma permanente.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
