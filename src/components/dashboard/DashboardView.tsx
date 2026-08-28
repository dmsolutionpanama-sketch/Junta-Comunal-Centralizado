import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Ticket } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';

interface DashboardViewProps {
  tickets: Ticket[];
  selectedCategoryFilter?: string | null;
  onSelectCategoryFilter?: (categoryId: string | null) => void;
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  selectedCategoryFilter,
  onSelectCategoryFilter,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>(
    selectedCategoryFilter || 'todas'
  );
  const [filterSector, setFilterSector] = useState<string>('todos');
  const [filterTimeframe, setFilterTimeframe] = useState<'todo' | 'mes' | 'semana'>('todo');

  // Sync prop changes
  React.useEffect(() => {
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
      result = result.filter((t) => t.sectorNombre === filterSector);
    }

    return result;
  }, [tickets, filterCategory, filterSector, filterTimeframe]);

  // KPIs
  const totalTickets = filteredTickets.length;
  const resueltosCount = filteredTickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
  const progresoCount = filteredTickets.filter((t) => t.estado === 'en_progreso').length;
  const abiertosCount = filteredTickets.filter((t) => t.estado === 'abierto').length;
  const resolucionPorcentaje = totalTickets > 0 ? Math.round((resueltosCount / totalTickets) * 100) : 0;
  const urgentesCount = filteredTickets.filter((t) => t.prioridad === 'urgente' && t.estado !== 'resuelto' && t.estado !== 'cerrado').length;

  // Chart 1: Tickets by Category
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIAS_SISTEMA.forEach((c) => {
      counts[c.nombre] = 0;
    });

    filteredTickets.forEach((t) => {
      counts[t.categoriaNombre] = (counts[t.categoriaNombre] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        shortName: name.length > 18 ? name.substring(0, 16) + '...' : name,
        tickets: count,
      }))
      .sort((a, b) => b.tickets - a.tickets);
  }, [filteredTickets]);

  // Chart 2: Tickets by Sector (Top Sectores)
  const sectorData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach((t) => {
      counts[t.sectorNombre] = (counts[t.sectorNombre] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        tickets: count,
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 8); // Top 8
  }, [filteredTickets]);

  // Chart 3: Distribution by Status
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {
      abierto: 0,
      en_progreso: 0,
      resuelto: 0,
      cerrado: 0,
    };
    filteredTickets.forEach((t) => {
      counts[t.estado] = (counts[t.estado] || 0) + 1;
    });

    return [
      { name: 'Abierto', value: counts.abierto, color: COLORS_STATUS.abierto },
      { name: 'En Progreso', value: counts.en_progreso, color: COLORS_STATUS.en_progreso },
      { name: 'Resuelto', value: counts.resuelto, color: COLORS_STATUS.resuelto },
      { name: 'Cerrado', value: counts.cerrado, color: COLORS_STATUS.cerrado },
    ].filter((item) => item.value > 0);
  }, [filteredTickets]);

  // Chart 4: Gender Distribution of Reporter
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {
      masculino: 0,
      femenino: 0,
      otro: 0,
    };
    filteredTickets.forEach((t) => {
      const g = t.reportante.genero || 'otro';
      counts[g] = (counts[g] || 0) + 1;
    });

    return [
      { name: 'Masculino', value: counts.masculino, color: '#0066FF' },
      { name: 'Femenino', value: counts.femenino, color: '#EC4899' },
      { name: 'Otro', value: counts.otro, color: '#8B5CF6' },
    ].filter((d) => d.value > 0);
  }, [filteredTickets]);

  // Chart 5: Age Group Distribution
  const ageData = useMemo(() => {
    const groups: Record<string, number> = {
      '18-30 años': 0,
      '31-45 años': 0,
      '46-60 años': 0,
      '60+ años': 0,
    };

    filteredTickets.forEach((t) => {
      const age = t.reportante.edad;
      if (age <= 30) groups['18-30 años']++;
      else if (age <= 45) groups['31-45 años']++;
      else if (age <= 60) groups['46-60 años']++;
      else groups['60+ años']++;
    });

    return Object.entries(groups).map(([group, count]) => ({
      rango: group,
      cantidad: count,
    }));
  }, [filteredTickets]);

  // Chart 6: Time Trend
  const trendData = useMemo(() => {
    const dates: Record<string, number> = {};
    filteredTickets.forEach((t) => {
      const d = t.fechaCreacion;
      dates[d] = (dates[d] || 0) + 1;
    });

    return Object.entries(dates)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, count]) => ({
        fecha: fecha.substring(5), // MM-DD
        registros: count,
      }));
  }, [filteredTickets]);

  const activeCategoryObject = CATEGORIAS_SISTEMA.find((c) => c.id === filterCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="dashboard-analytics-view">
      {/* Top Header Card with Dynamic Filters Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeCategoryObject ? `Dashboard: ${activeCategoryObject.nombre}` : 'Dashboard Ejecutivo General'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
                Power BI Style
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              Métricas dinámicas, tasas de resolución y distribución demográfica interactiva
            </p>
          </div>

          {/* Interactive Filters Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              id="dashboard-category-filter"
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              <option value="todas">Consolidado (Todas las Categorías)</option>
              {CATEGORIAS_SISTEMA.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* Sector Filter */}
            <select
              id="dashboard-sector-filter"
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              <option value="todos">Todos los Sectores</option>
              {SECTORES_RESIDENCIA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            {(filterCategory !== 'todas' || filterSector !== 'todos') && (
              <button
                type="button"
                id="btn-reset-dashboard-filters"
                onClick={resetDashboardFilters}
                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                title="Restablecer filtros"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Strip (Power BI Style Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Tickets */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Registros
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{totalTickets}</div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              100% de la muestra activa
            </span>
          </div>
        </div>

        {/* KPI 2: Tickets Resueltos + % */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resueltos / Cerrados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-600 tracking-tight">
                {resueltosCount}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {resolucionPorcentaje}% Eficacia
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${resolucionPorcentaje}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Tickets en Progreso */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              En Progreso
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-amber-600 tracking-tight">{progresoCount}</div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              Cuadrillas en campo activas
            </span>
          </div>
        </div>

        {/* KPI 4: Tickets Abiertos / Pendientes */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Abiertos / Pendientes
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-rose-600 tracking-tight">{abiertosCount}</div>
            <span className="text-[11px] text-slate-400 font-medium mt-1 block">
              Por inspeccionar o asignar
            </span>
          </div>
        </div>

        {/* KPI 5: Tiempo Promedio de Resolución */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tiempo Promedio SLA
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">18.4 hrs</div>
            <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
              ↓ 14% vs. mes anterior
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tickets by Category */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Volumen por Categoría de Incidencia
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">6 Categorías</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="shortName" type="category" stroke="#475569" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="tickets" fill="#2563EB" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Sectors */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Incidencias por Sector Residencial
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Top Sectores</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="tickets" fill="#0284C7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Distribution by Status */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Distribución por Estado del Caso
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">En tiempo real</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Demographics - Gender & Age */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Demografía de los Reportantes (Género & Edad)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Perfil Ciudadano</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-64">
            {/* Gender Pie */}
            <div className="h-full flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 mb-1">Por Género</span>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                  >
                    {genderData.map((entry, idx) => (
                      <Cell key={`g-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Age Bar */}
            <div className="h-full flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-400 mb-1">Por Rango de Edad</span>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={ageData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="rango" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="cantidad" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Time Trend Line Chart */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tendencia Cronológica de Radicación de Incidencias
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Evolución en el tiempo</span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="registros"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563EB' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
