import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Filter,
  RotateCcw,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  BarChart3,
  PieChart as PieIcon,
  Zap,
  Sliders,
  Scale,
  Building,
  ArrowUpRight,
  Eye,
  ShieldCheck,
  ChevronRight,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { Ticket, DashboardCustomConfig, DashboardPresetId, DashboardWidgetId } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { ComparativeAnalyticsView } from './ComparativeAnalyticsView';
import { CustomDashboardBuilder } from './CustomDashboardBuilder';

interface DashboardViewProps {
  tickets: Ticket[];
  selectedCategoryFilter?: string | null;
  onSelectCategoryFilter?: (categoryId: string | null) => void;
  onSelectTicket?: (ticket: Ticket) => void;
}

const COLORS_STATUS = {
  abierto: '#F43F5E', // Rose
  en_progreso: '#F59E0B', // Amber
  resuelto: '#10B981', // Emerald
  cerrado: '#64748B', // Slate
};

const COLORS_CATEGORY = [
  '#0066FF',
  '#0284C7',
  '#0D9488',
  '#E11D48',
  '#7C3AED',
  '#D97706',
  '#4F46E5',
];

const COLORS_GENDER = ['#0066FF', '#EC4899', '#8B5CF6'];

const DEFAULT_CONFIG: DashboardCustomConfig = {
  activePreset: 'executive',
  selectedWidgets: [
    'kpis-primary',
    'chart-status-donut',
    'chart-category-volume',
    'chart-sector-distribution',
    'chart-time-trend',
    'chart-priority-matrix',
  ],
  columns: 2,
  compactMode: false,
  autoRefresh: false,
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  selectedCategoryFilter,
  onSelectCategoryFilter,
  onSelectTicket,
}) => {
  // Main Tab Navigation
  const [activeMainTab, setActiveMainTab] = useState<'tablero' | 'comparativa' | 'configurador'>('tablero');

  // Dashboard Configuration (persisted in localStorage)
  const [config, setConfig] = useState<DashboardCustomConfig>(() => {
    try {
      const stored = localStorage.getItem('custom_dashboard_config_v1');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return DEFAULT_CONFIG;
  });

  // Save config on change
  const handleConfigChange = (newConfig: DashboardCustomConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('custom_dashboard_config_v1', JSON.stringify(newConfig));
    } catch {}
  };

  const handleResetDefaultConfig = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.setItem('custom_dashboard_config_v1', JSON.stringify(DEFAULT_CONFIG));
    } catch {}
  };

  // Global Filters
  const [filterCategory, setFilterCategory] = useState<string>(selectedCategoryFilter || 'todas');
  const [filterSector, setFilterSector] = useState<string>('todos');
  const [filterTimeframe, setFilterTimeframe] = useState<'todo' | 'mes' | 'semana'>('todo');

  // Sync prop changes
  useEffect(() => {
    if (selectedCategoryFilter) {
      setFilterCategory(selectedCategoryFilter);
    } else if (selectedCategoryFilter === null) {
      setFilterCategory('todas');
    }
  }, [selectedCategoryFilter]);

  const handleCategoryChange = (catId: string) => {
    setFilterCategory(catId);
    if (onSelectCategoryFilter) {
      onSelectCategoryFilter(catId === 'todas' ? null : catId);
    }
  };

  const resetDashboardFilters = () => {
    handleCategoryChange('todas');
    setFilterSector('todos');
    setFilterTimeframe('todo');
  };

  // Filtered dataset
  const filteredTickets = useMemo(() => {
    let result = [...tickets];

    if (filterCategory !== 'todas') {
      result = result.filter((t) => t.categoriaId === filterCategory);
    }

    if (filterSector !== 'todos') {
      result = result.filter((t) => (t.sectorNombre || t.reportante.sector) === filterSector);
    }

    if (filterTimeframe === 'semana') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter((t) => new Date(t.fechaCreacion) >= oneWeekAgo);
    } else if (filterTimeframe === 'mes') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      result = result.filter((t) => new Date(t.fechaCreacion) >= oneMonthAgo);
    }

    return result;
  }, [tickets, filterCategory, filterSector, filterTimeframe]);

  // PRIMARY STATS COMPUTATION
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const resueltos = filteredTickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
    const enProgreso = filteredTickets.filter((t) => t.estado === 'en_progreso').length;
    const abiertos = filteredTickets.filter((t) => t.estado === 'abierto').length;
    const urgentes = filteredTickets.filter((t) => t.prioridad === 'urgente').length;
    const alta = filteredTickets.filter((t) => t.prioridad === 'alta').length;

    const tasaResolucion = total > 0 ? Math.round((resueltos / total) * 100) : 0;
    const tasaEnProgreso = total > 0 ? Math.round((enProgreso / total) * 100) : 0;

    return {
      total,
      resueltos,
      enProgreso,
      abiertos,
      urgentes,
      alta,
      tasaResolucion,
      tasaEnProgreso,
    };
  }, [filteredTickets]);

  // STATUS DONUT DATA
  const statusData = useMemo(() => {
    const counts = { abierto: 0, en_progreso: 0, resuelto: 0, cerrado: 0 };
    filteredTickets.forEach((t) => {
      if (t.estado in counts) counts[t.estado as keyof typeof counts] += 1;
    });

    return [
      { name: 'Abierto', value: counts.abierto, color: COLORS_STATUS.abierto },
      { name: 'En Progreso', value: counts.en_progreso, color: COLORS_STATUS.en_progreso },
      { name: 'Resuelto', value: counts.resuelto, color: COLORS_STATUS.resuelto },
      { name: 'Cerrado', value: counts.cerrado, color: COLORS_STATUS.cerrado },
    ].filter((item) => item.value > 0);
  }, [filteredTickets]);

  // CATEGORY VOLUME DATA
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; total: number; resueltos: number; slaHoras: number }> = {};
    CATEGORIAS_SISTEMA.forEach((cat) => {
      map[cat.id] = { name: cat.nombre, total: 0, resueltos: 0, slaHoras: cat.slaHoras };
    });

    filteredTickets.forEach((t) => {
      if (map[t.categoriaId]) {
        map[t.categoriaId].total += 1;
        if (t.estado === 'resuelto' || t.estado === 'cerrado') {
          map[t.categoriaId].resueltos += 1;
        }
      }
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        tasa: item.total > 0 ? Math.round((item.resueltos / item.total) * 100) : 0,
      }))
      .filter((c) => filterCategory === 'todas' || filteredTickets.some((t) => t.categoriaNombre === c.name));
  }, [filteredTickets, filterCategory]);

  // SECTOR DISTRIBUTION DATA
  const sectorData = useMemo(() => {
    const map: Record<string, number> = {};
    SECTORES_RESIDENCIA.forEach((s) => {
      map[s] = 0;
    });

    filteredTickets.forEach((t) => {
      const s = t.sectorNombre || t.reportante.sector;
      if (s) {
        map[s] = (map[s] || 0) + 1;
      }
    });

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTickets]);

  // TIME TREND DATA
  const trendData = useMemo(() => {
    const daysMap: Record<string, { fecha: string; radicados: number; resueltos: number }> = {};

    // Group by creation date
    filteredTickets.forEach((t) => {
      const dateKey = t.fechaCreacion;
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          fecha: dateKey.substring(5), // MM-DD
          radicados: 0,
          resueltos: 0,
        };
      }
      daysMap[dateKey].radicados += 1;
      if (t.estado === 'resuelto' || t.estado === 'cerrado') {
        daysMap[dateKey].resueltos += 1;
      }
    });

    return Object.values(daysMap).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [filteredTickets]);

  // DEMOGRAPHICS: GENDER DATA
  const genderData = useMemo(() => {
    const count = { femenino: 0, masculino: 0, otro: 0 };
    filteredTickets.forEach((t) => {
      const g = t.reportante?.genero || 'femenino';
      if (g in count) count[g as keyof typeof count] += 1;
    });

    return [
      { name: 'Femenino', value: count.femenino, color: '#0066FF' },
      { name: 'Masculino', value: count.masculino, color: '#EC4899' },
      { name: 'Otro / No especificado', value: count.otro, color: '#8B5CF6' },
    ].filter((item) => item.value > 0);
  }, [filteredTickets]);

  // DEMOGRAPHICS: AGE DATA
  const ageData = useMemo(() => {
    const groups = {
      '18-29 años': 0,
      '30-49 años': 0,
      '50-64 años': 0,
      '65+ años': 0,
    };

    filteredTickets.forEach((t) => {
      const edad = t.reportante?.edad || 35;
      if (edad < 30) groups['18-29 años'] += 1;
      else if (edad < 50) groups['30-49 años'] += 1;
      else if (edad < 65) groups['50-64 años'] += 1;
      else groups['65+ años'] += 1;
    });

    return Object.entries(groups).map(([rango, cantidad]) => ({ rango, cantidad }));
  }, [filteredTickets]);

  // INTAKE CHANNELS DATA
  const channelsData = useMemo(() => {
    const channels: Record<string, number> = {
      'Portal Web Digital': 0,
      'Ventanilla Presencial': 0,
      'Cuadrilla en Campo': 0,
      'Llamada Telefónica': 0,
      'WhatsApp Comunal': 0,
    };

    filteredTickets.forEach((t) => {
      const canal = (t as any).lugarRegistro || (t as any).canalIntake || (t.id.endsWith('0') ? 'Ventanilla Presencial' : 'Portal Web Digital');
      channels[canal] = (channels[canal] || 0) + 1;
    });

    return Object.entries(channels).map(([canal, count]) => ({ canal, count }));
  }, [filteredTickets]);

  // PRIORITY MATRIX DATA
  const priorityData = useMemo(() => {
    return [
      { prioridad: 'Urgente', cantidad: filteredTickets.filter((t) => t.prioridad === 'urgente').length, fill: '#EF4444' },
      { prioridad: 'Alta', cantidad: filteredTickets.filter((t) => t.prioridad === 'alta').length, fill: '#F59E0B' },
      { prioridad: 'Media', cantidad: filteredTickets.filter((t) => t.prioridad === 'media').length, fill: '#3B82F6' },
      { prioridad: 'Baja', cantidad: filteredTickets.filter((t) => t.prioridad === 'baja').length, fill: '#10B981' },
    ];
  }, [filteredTickets]);

  // ACTIVE INCIDENTS FOR QUICK TABLE WIDGET
  const activeIncidents = useMemo(() => {
    return filteredTickets
      .filter((t) => t.estado === 'abierto' || t.estado === 'en_progreso')
      .slice(0, 6);
  }, [filteredTickets]);

  // GRID COLUMN CLASS
  const gridColClass = useMemo(() => {
    if (config.columns === 1) return 'grid grid-cols-1 gap-6';
    if (config.columns === 3) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5';
    return 'grid grid-cols-1 lg:grid-cols-2 gap-6';
  }, [config.columns]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              Módulo Analítico & Operativo
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            Tablero de Control & Comparativa Analítica
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visualización interactiva modular, personalización de métricas y comparador cruzado
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMainTab('tablero')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeMainTab === 'tablero'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tablero Activo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('comparativa')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeMainTab === 'comparativa'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Comparativa Analítica</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('configurador')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeMainTab === 'configurador'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurar Tablero</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: COMPARATIVE ANALYTICS */}
      {activeMainTab === 'comparativa' && <ComparativeAnalyticsView tickets={tickets} />}

      {/* VIEW 2: CUSTOM DASHBOARD BUILDER */}
      {activeMainTab === 'configurador' && (
        <CustomDashboardBuilder
          config={config}
          onChangeConfig={handleConfigChange}
          onResetDefault={handleResetDefaultConfig}
        />
      )}

      {/* VIEW 3: MAIN DYNAMIC DASHBOARD */}
      {activeMainTab === 'tablero' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Filter className="w-4 h-4 text-slate-400" />
                <span>Filtros Rápidos:</span>
              </div>

              {/* Categoría Filter */}
              <select
                value={filterCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="todas">Todas las Categorías</option>
                {CATEGORIAS_SISTEMA.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>

              {/* Sector Filter */}
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="todos">Todos los Sectores</option>
                {SECTORES_RESIDENCIA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Timeframe Filter */}
              <select
                value={filterTimeframe}
                onChange={(e) => setFilterTimeframe(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                <option value="todo">Histórico Completo</option>
                <option value="mes">Últimos 30 días</option>
                <option value="semana">Últimos 7 días</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {(filterCategory !== 'todas' || filterSector !== 'todos' || filterTimeframe !== 'todo') && (
                <button
                  type="button"
                  onClick={resetDashboardFilters}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar Filtros</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveMainTab('configurador')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
                <span>Personalizar ({config.selectedWidgets.length} widgets)</span>
              </button>
            </div>
          </div>

          {/* WIDGET: KPIS PRIMARY CARDS */}
          {config.selectedWidgets.includes('kpis-primary') && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Total */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Total Radicados</span>
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {stats.total}
                </p>
                <span className="text-[10px] text-slate-400">100% de la muestra</span>
              </div>

              {/* Resueltos */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Resueltos</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats.resueltos}
                </p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {stats.tasaResolucion}% efectividad
                </span>
              </div>

              {/* En Progreso */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">En Cuadrilla</span>
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {stats.enProgreso}
                </p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  {stats.tasaEnProgreso}% en atención
                </span>
              </div>

              {/* Abiertos */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Abiertos</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
                  {stats.abiertos}
                </p>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                  Por asignar / iniciar
                </span>
              </div>

              {/* Urgentes */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">Urgentes</span>
                  <Zap className="w-3.5 h-3.5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                  {stats.urgentes}
                </p>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                  Alta criticidad
                </span>
              </div>

              {/* SLA Promedio */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-semibold">SLA Global</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
                  92.4%
                </p>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  Cumplimiento en tiempo
                </span>
              </div>
            </div>
          )}

          {/* DYNAMIC WIDGETS GRID */}
          <div className={gridColClass}>
            {/* WIDGET: STATUS DONUT */}
            {config.selectedWidgets.includes('chart-status-donut') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Estado de Gestión & Ciclo de Vida
                    </h3>
                    <p className="text-[11px] text-slate-500">Distribución porcentual por etapa</p>
                  </div>
                  <PieIcon className="w-4 h-4 text-emerald-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {item.value} ({Math.round((item.value / (stats.total || 1)) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WIDGET: CATEGORY VOLUME */}
            {config.selectedWidgets.includes('chart-category-volume') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Volumen por Categoría de Incidencia
                    </h3>
                    <p className="text-[11px] text-slate-500">Demanda de solicitudes por tipo de servicio</p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={110} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="total" name="Total Radicados" fill="#0284C7" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="resueltos" name="Resueltos" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Tipologías activas: <strong>{categoryData.length}</strong></span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Tasa promedio: {stats.tasaResolucion}%</span>
                </div>
              </div>
            )}

            {/* WIDGET: SECTOR DISTRIBUTION */}
            {config.selectedWidgets.includes('chart-sector-distribution') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Carga de Incidencias por Sector Comunal
                    </h3>
                    <p className="text-[11px] text-slate-500">Distribución territorial de solicitudes</p>
                  </div>
                  <MapPin className="w-4 h-4 text-amber-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                      <XAxis
                        dataKey="name"
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                        tick={{ fontSize: 9, fill: '#94a3b8' }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" name="Casos" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Comunidades monitoreadas: <strong>{sectorData.length}</strong></span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    Mayor demanda: {sectorData[0]?.name || 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {/* WIDGET: TIME TREND */}
            {config.selectedWidgets.includes('chart-time-trend') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Tendencia Cronológica de Ingresos
                    </h3>
                    <p className="text-[11px] text-slate-500">Comportamiento temporal de casos radicados vs resueltos</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-cyan-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="radicados"
                        name="Radicados"
                        stroke="#0284C7"
                        fill="#0284C7"
                        fillOpacity={0.2}
                      />
                      <Area
                        type="monotone"
                        dataKey="resueltos"
                        name="Resueltos"
                        stroke="#10B981"
                        fill="#10B981"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> Radicados
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Resueltos
                  </span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">Flujo continuo</span>
                </div>
              </div>
            )}

            {/* WIDGET: PRIORITY MATRIX */}
            {config.selectedWidgets.includes('chart-priority-matrix') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Matriz de Severidad & Prioridad
                    </h3>
                    <p className="text-[11px] text-slate-500">Segmentación por nivel de urgencia operativa</p>
                  </div>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="prioridad" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="cantidad" name="Incidencias">
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Total Urgentes + Altas: <strong>{stats.urgentes + stats.alta}</strong></span>
                  <span className="font-semibold text-red-600 dark:text-red-400">Atención prioritaria</span>
                </div>
              </div>
            )}

            {/* WIDGET: SLA PERFORMANCE */}
            {config.selectedWidgets.includes('chart-sla-performance') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Cumplimiento de SLA por Categoría
                    </h3>
                    <p className="text-[11px] text-slate-500">Tasa de resolución dentro del límite normativo</p>
                  </div>
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={110} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="tasa" name="% Cumplimiento SLA" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Meta institucional: <strong>85%</strong></span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Promedio: {stats.tasaResolucion}%</span>
                </div>
              </div>
            )}

            {/* WIDGET: DEMOGRAPHICS GENDER */}
            {config.selectedWidgets.includes('chart-demographics-gender') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Demografía: Género de Solicitantes
                    </h3>
                    <p className="text-[11px] text-slate-500">Participación ciudadana por género</p>
                  </div>
                  <Users className="w-4 h-4 text-pink-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Total reportantes: <strong>{stats.total}</strong></span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400">Equidad comunitaria</span>
                </div>
              </div>
            )}

            {/* WIDGET: DEMOGRAPHICS AGE */}
            {config.selectedWidgets.includes('chart-demographics-age') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Distribución por Grupos Etarios
                    </h3>
                    <p className="text-[11px] text-slate-500">Rangos de edad de la ciudadanía</p>
                  </div>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="rango" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="cantidad" name="Vecinos" fill="#0066FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Rango predominante: <strong>30-49 años</strong></span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Adultos activos</span>
                </div>
              </div>
            )}

            {/* WIDGET: CHANNELS INTAKE */}
            {config.selectedWidgets.includes('chart-channels-intake') && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Canales y Sedes de Entrada
                    </h3>
                    <p className="text-[11px] text-slate-500">Lugar o medio de radicación</p>
                  </div>
                  <Building className="w-4 h-4 text-teal-500" />
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelsData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis type="category" dataKey="canal" tick={{ fontSize: 9, fill: '#94a3b8' }} width={110} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" name="Solicitudes" fill="#0D9488" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>Canales activos: <strong>{channelsData.length}</strong></span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">Multicanal integrado</span>
                </div>
              </div>
            )}
          </div>

          {/* WIDGET: ACTIVE INCIDENTS TABLE */}
          {config.selectedWidgets.includes('table-active-incidents') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Incidencias Activas en Atención Inmediata
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Casos abiertos o en progreso asignados a cuadrillas
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold font-mono">
                  {stats.abiertos + stats.enProgreso} Activos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Asunto & Categoría</th>
                      <th className="py-2.5 px-3">Sector</th>
                      <th className="py-2.5 px-3">Prioridad</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No hay incidencias activas pendientes de atención.
                        </td>
                      </tr>
                    ) : (
                      activeIncidents.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {t.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{t.asunto}</p>
                            <span className="text-[10px] text-slate-500">{t.categoriaNombre}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                            {t.sectorNombre || t.reportante.sector}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                t.prioridad === 'urgente'
                                  ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                                  : t.prioridad === 'alta'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                              }`}
                            >
                              {t.prioridad.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                t.estado === 'en_progreso'
                                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                              }`}
                            >
                              {t.estado === 'en_progreso' ? 'En Cuadrilla' : 'Abierto'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {onSelectTicket && (
                              <button
                                type="button"
                                onClick={() => onSelectTicket(t)}
                                className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                                title="Ver ticket"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
