import React from 'react';
import {
  Sparkles,
  LayoutGrid,
  Columns2,
  Columns3,
  Rows4,
  Sliders,
  Check,
  RotateCcw,
  Save,
  CheckCircle2,
  PieChart,
  BarChart3,
  MapPin,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Building,
  Layers,
} from 'lucide-react';
import { DashboardCustomConfig, DashboardPresetId, DashboardWidgetId } from '../../types';
import { DASHBOARD_AVAILABLE_WIDGETS } from './dashboardWidgetsData';

interface CustomDashboardBuilderProps {
  config: DashboardCustomConfig;
  onChangeConfig: (newConfig: DashboardCustomConfig) => void;
  onResetDefault: () => void;
}

const PRESETS: Array<{
  id: DashboardPresetId;
  name: string;
  badge: string;
  description: string;
  widgets: DashboardWidgetId[];
  columns: 1 | 2 | 3;
}> = [
  {
    id: 'executive',
    name: 'Tablero Ejecutivo Integral',
    badge: 'Recomendado',
    description: 'Visión estratégica completa con métricas clave, distribución territorial y estado.',
    widgets: [
      'kpis-primary',
      'chart-status-donut',
      'chart-category-volume',
      'chart-sector-distribution',
      'chart-time-trend',
      'chart-priority-matrix',
    ],
    columns: 2,
  },
  {
    id: 'operations',
    name: 'Operaciones & Cuadrillas en Campo',
    badge: 'Operativo',
    description: 'Enfocado en severidad, cumplimiento de SLA y seguimiento de cuadrillas activas.',
    widgets: [
      'kpis-primary',
      'chart-priority-matrix',
      'chart-sla-performance',
      'chart-sector-distribution',
      'table-active-incidents',
    ],
    columns: 2,
  },
  {
    id: 'citizen-care',
    name: 'Atención Ciudadana & Demografía',
    badge: 'Social & Género',
    description: 'Análisis de participación comunitaria, perfiles etarios, género y canales de ingreso.',
    widgets: [
      'kpis-primary',
      'chart-demographics-gender',
      'chart-demographics-age',
      'chart-channels-intake',
      'chart-sector-distribution',
    ],
    columns: 2,
  },
  {
    id: 'sla-audit',
    name: 'Auditoría de Tiempos & SLA',
    badge: 'Fiscalización',
    description: 'Control riguroso de tiempos de respuesta, vencimientos de SLA y tendencias temporales.',
    widgets: [
      'kpis-primary',
      'chart-sla-performance',
      'chart-time-trend',
      'chart-priority-matrix',
      'table-active-incidents',
    ],
    columns: 2,
  },
  {
    id: 'custom',
    name: 'Diseño 100% Personalizado',
    badge: 'A la Medida',
    description: 'Elige individualmente cada gráfico y ajusta las columnas a tu preferencia analítica.',
    widgets: [],
    columns: 2,
  },
];

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4 text-blue-500" />,
  PieChart: <PieChart className="w-4 h-4 text-emerald-500" />,
  BarChart3: <BarChart3 className="w-4 h-4 text-indigo-500" />,
  MapPin: <MapPin className="w-4 h-4 text-amber-500" />,
  TrendingUp: <TrendingUp className="w-4 h-4 text-cyan-500" />,
  AlertTriangle: <AlertTriangle className="w-4 h-4 text-red-500" />,
  Clock: <Clock className="w-4 h-4 text-purple-500" />,
  Users: <Users className="w-4 h-4 text-pink-500" />,
  Building: <Building className="w-4 h-4 text-teal-500" />,
  Layers: <Layers className="w-4 h-4 text-blue-600" />,
};

export const CustomDashboardBuilder: React.FC<CustomDashboardBuilderProps> = ({
  config,
  onChangeConfig,
  onResetDefault,
}) => {
  // Handle Preset Select
  const handleSelectPreset = (presetId: DashboardPresetId) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset && presetId !== 'custom') {
      onChangeConfig({
        ...config,
        activePreset: presetId,
        selectedWidgets: preset.widgets,
        columns: preset.columns,
      });
    } else {
      onChangeConfig({
        ...config,
        activePreset: 'custom',
      });
    }
  };

  // Toggle Widget
  const handleToggleWidget = (widgetId: DashboardWidgetId) => {
    let updated: DashboardWidgetId[];
    if (config.selectedWidgets.includes(widgetId)) {
      if (config.selectedWidgets.length <= 1) {
        alert('Debe mantener al menos un elemento visible en el tablero.');
        return;
      }
      updated = config.selectedWidgets.filter((id) => id !== widgetId);
    } else {
      updated = [...config.selectedWidgets, widgetId];
    }

    onChangeConfig({
      ...config,
      activePreset: 'custom',
      selectedWidgets: updated,
    });
  };

  // Change Columns
  const handleChangeColumns = (cols: 1 | 2 | 3) => {
    onChangeConfig({
      ...config,
      columns: cols,
    });
  };

  // Toggle Compact Mode
  const handleToggleCompact = () => {
    onChangeConfig({
      ...config,
      compactMode: !config.compactMode,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Sliders className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Configurador y Constructor del Tablero
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personaliza los elementos visuales, gráficos y distribución de columnas en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* STEP 1: PLANTILLAS PRECONFIGURADAS (PRESETS) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          1. Seleccione una Plantilla de Visualización
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((p) => {
            const isSelected = config.activePreset === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{p.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                    {p.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-400">
                    {p.id === 'custom'
                      ? `${config.selectedWidgets.length} seleccionados`
                      : `${p.widgets.length} elementos`}
                  </span>
                  {isSelected && (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Activo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: LAYOUT & COLUMN DENSITY CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          2. Disposición de Columnas & Densidad
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Columns Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Columnas:</span>
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleChangeColumns(1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  config.columns === 1
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Rows4 className="w-3.5 h-3.5" />
                <span>1 Columna</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeColumns(2)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  config.columns === 2
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>2 Columnas</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeColumns(3)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  config.columns === 3
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>3 Columnas</span>
              </button>
            </div>
          </div>

          {/* Compact Mode */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={config.compactMode}
                onChange={handleToggleCompact}
                className="w-4 h-4 text-blue-600 rounded-md border-slate-300 dark:border-slate-700 focus:ring-blue-500"
              />
              <span>Modo compacto de alta densidad</span>
            </label>
          </div>
        </div>
      </div>

      {/* STEP 3: SELECCIÓN DETALLADA DE ELEMENTOS (WIDGETS PICKER) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            3. Elementos Disponibles para el Tablero ({config.selectedWidgets.length} de{' '}
            {DASHBOARD_AVAILABLE_WIDGETS.length} activos)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {DASHBOARD_AVAILABLE_WIDGETS.map((widget) => {
            const isChecked = config.selectedWidgets.includes(widget.id);
            return (
              <div
                key={widget.id}
                onClick={() => handleToggleWidget(widget.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isChecked
                    ? 'bg-white dark:bg-slate-900 border-blue-400 dark:border-blue-700 shadow-xs ring-1 ring-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                    {WIDGET_ICONS[widget.iconName] || <Sparkles className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {widget.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      {widget.description}
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      {widget.category}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                    isChecked
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
