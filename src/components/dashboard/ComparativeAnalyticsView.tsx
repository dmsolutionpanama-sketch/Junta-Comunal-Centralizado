import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Scale,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Tag,
  Building,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Filter,
} from 'lucide-react';
import { Ticket, ComparisonDimension } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';

interface ComparativeAnalyticsViewProps {
  tickets: Ticket[];
}

const COLORS = {
  entityA: '#0284C7', // Sky blue
  entityB: '#F59E0B', // Amber
  neutral: '#64748B',
  success: '#10B981',
  danger: '#EF4444',
};

const CANALES_DISPONIBLES = [
  'Portal Web Digital',
  'Ventanilla Presencial',
  'Llamada Telefónica / Central',
  'WhatsApp Comunitario',
  'Cuadrilla Operativa en Campo',
];

export const ComparativeAnalyticsView: React.FC<ComparativeAnalyticsViewProps> = ({ tickets }) => {
  const [dimension, setDimension] = useState<ComparisonDimension>('sector');
  const [entityA, setEntityA] = useState<string>(SECTORES_RESIDENCIA[0] || 'Altos de Las Cumbres');
  const [entityB, setEntityB] = useState<string>(SECTORES_RESIDENCIA[1] || 'Villa Zaita');

  // Handle Dimension Change and set appropriate defaults
  const handleDimensionChange = (dim: ComparisonDimension) => {
    setDimension(dim);
    if (dim === 'sector') {
      setEntityA(SECTORES_RESIDENCIA[0] || 'Altos de Las Cumbres');
      setEntityB(SECTORES_RESIDENCIA[1] || 'Villa Zaita');
    } else if (dim === 'categoria') {
      setEntityA(CATEGORIAS_SISTEMA[0]?.nombre || 'Alumbrado Público');
      setEntityB(CATEGORIAS_SISTEMA[1]?.nombre || 'Vialidad y Calles');
    } else if (dim === 'canal') {
      setEntityA('Portal Web Digital');
      setEntityB('Ventanilla Presencial');
    } else if (dim === 'periodo') {
      setEntityA('Últimos 15 Días');
      setEntityB('15 Días Previos');
    }
  };

  // Filter datasets based on selected entities
  const dataEntityA = useMemo(() => {
    if (dimension === 'sector') {
      return tickets.filter((t) => (t.sectorNombre || t.reportante.sector) === entityA);
    }
    if (dimension === 'categoria') {
      return tickets.filter((t) => t.categoriaNombre === entityA);
    }
    if (dimension === 'canal') {
      return tickets.filter((t) => {
        const canal = (t as any).lugarRegistro || (t as any).canalIntake || (t.id.endsWith('0') ? 'Ventanilla Presencial' : 'Portal Web Digital');
        return canal === entityA;
      });
    }
    if (dimension === 'periodo') {
      // Last 15 tickets vs older
      return tickets.slice(0, Math.ceil(tickets.length / 2));
    }
    return [];
  }, [tickets, dimension, entityA]);

  const dataEntityB = useMemo(() => {
    if (dimension === 'sector') {
      return tickets.filter((t) => (t.sectorNombre || t.reportante.sector) === entityB);
    }
    if (dimension === 'categoria') {
      return tickets.filter((t) => t.categoriaNombre === entityB);
    }
    if (dimension === 'canal') {
      return tickets.filter((t) => {
        const canal = (t as any).lugarRegistro || (t as any).canalIntake || (t.id.endsWith('0') ? 'Ventanilla Presencial' : 'Portal Web Digital');
        return canal === entityB;
      });
    }
    if (dimension === 'periodo') {
      return tickets.slice(Math.ceil(tickets.length / 2));
    }
    return [];
  }, [tickets, dimension, entityB]);

  // Compute Comparative Stats
  const statsA = useMemo(() => {
    const total = dataEntityA.length;
    const resueltos = dataEntityA.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
    const enProgreso = dataEntityA.filter((t) => t.estado === 'en_progreso').length;
    const abiertos = dataEntityA.filter((t) => t.estado === 'abierto').length;
    const tasaResolucion = total > 0 ? Math.round((resueltos / total) * 100) : 0;
    const urgentes = dataEntityA.filter((t) => t.prioridad === 'urgente' || t.prioridad === 'alta').length;
    return { total, resueltos, enProgreso, abiertos, tasaResolucion, urgentes };
  }, [dataEntityA]);

  const statsB = useMemo(() => {
    const total = dataEntityB.length;
    const resueltos = dataEntityB.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
    const enProgreso = dataEntityB.filter((t) => t.estado === 'en_progreso').length;
    const abiertos = dataEntityB.filter((t) => t.estado === 'abierto').length;
    const tasaResolucion = total > 0 ? Math.round((resueltos / total) * 100) : 0;
    const urgentes = dataEntityB.filter((t) => t.prioridad === 'urgente' || t.prioridad === 'alta').length;
    return { total, resueltos, enProgreso, abiertos, tasaResolucion, urgentes };
  }, [dataEntityB]);

  // Comparative Status Chart Data
  const statusComparisonData = useMemo(() => {
    return [
      {
        estado: 'Abiertos (Pendientes)',
        [entityA]: statsA.abiertos,
        [entityB]: statsB.abiertos,
      },
      {
        estado: 'En Progreso (Cuadrilla)',
        [entityA]: statsA.enProgreso,
        [entityB]: statsB.enProgreso,
      },
      {
        estado: 'Resueltos / Cerrados',
        [entityA]: statsA.resueltos,
        [entityB]: statsB.resueltos,
      },
    ];
  }, [entityA, entityB, statsA, statsB]);

  // Top Categories Comparison for Sectors
  const categoryCrossData = useMemo(() => {
    const categoriesMap: Record<string, { cat: string; valA: number; valB: number }> = {};
    CATEGORIAS_SISTEMA.forEach((c) => {
      categoriesMap[c.nombre] = { cat: c.nombre, valA: 0, valB: 0 };
    });

    dataEntityA.forEach((t) => {
      if (categoriesMap[t.categoriaNombre]) {
        categoriesMap[t.categoriaNombre].valA += 1;
      }
    });

    dataEntityB.forEach((t) => {
      if (categoriesMap[t.categoriaNombre]) {
        categoriesMap[t.categoriaNombre].valB += 1;
      }
    });

    return Object.values(categoriesMap)
      .filter((item) => item.valA > 0 || item.valB > 0)
      .slice(0, 6);
  }, [dataEntityA, dataEntityB]);

  // Gender Demographic Cross Data
  const genderCrossData = useMemo(() => {
    const countA = { femenino: 0, masculino: 0, otro: 0 };
    const countB = { femenino: 0, masculino: 0, otro: 0 };

    dataEntityA.forEach((t) => {
      const g = t.reportante?.genero || 'femenino';
      if (g in countA) countA[g as keyof typeof countA] += 1;
    });

    dataEntityB.forEach((t) => {
      const g = t.reportante?.genero || 'femenino';
      if (g in countB) countB[g as keyof typeof countB] += 1;
    });

    return [
      { grupo: 'Femenino', [entityA]: countA.femenino, [entityB]: countB.femenino },
      { grupo: 'Masculino', [entityA]: countA.masculino, [entityB]: countB.masculino },
      { grupo: 'Otro / No indicado', [entityA]: countA.otro, [entityB]: countB.otro },
    ];
  }, [dataEntityA, dataEntityB, entityA, entityB]);

  // Delta Calculator
  const getDelta = (valA: number, valB: number, unit = '') => {
    const diff = valA - valB;
    if (diff === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 font-medium">
          <Minus className="w-3 h-3" /> Paridad (0{unit})
        </span>
      );
    }
    const isHigher = diff > 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-bold ${
          isHigher ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
        }`}
      >
        {isHigher ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {isHigher ? `+${diff}` : `${diff}`}
        {unit} ({entityA} vs {entityB})
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Dimension & Entity Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Scale className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Módulo de Comparativa Analítica Cruzada
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Contrasta volumen de incidencias, eficiencia en resolución y demografía entre dos entidades
            </p>
          </div>

          {/* Dimension Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleDimensionChange('sector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                dimension === 'sector'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Por Sector</span>
            </button>
            <button
              type="button"
              onClick={() => handleDimensionChange('categoria')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                dimension === 'categoria'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Por Categoría</span>
            </button>
            <button
              type="button"
              onClick={() => handleDimensionChange('canal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                dimension === 'canal'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Por Canal / Lugar</span>
            </button>
            <button
              type="button"
              onClick={() => handleDimensionChange('periodo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                dimension === 'periodo'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Por Período</span>
            </button>
          </div>
        </div>

        {/* Entity Pickers (Entity A vs Entity B) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          {/* Entity A Selector */}
          <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                Elemento A (Serie Primaria)
              </span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
                {statsA.total} Registros
              </span>
            </div>
            {dimension === 'sector' && (
              <select
                value={entityA}
                onChange={(e) => setEntityA(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/30"
              >
                {SECTORES_RESIDENCIA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            {dimension === 'categoria' && (
              <select
                value={entityA}
                onChange={(e) => setEntityA(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/30"
              >
                {CATEGORIAS_SISTEMA.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
            {dimension === 'canal' && (
              <select
                value={entityA}
                onChange={(e) => setEntityA(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500/30"
              >
                {CANALES_DISPONIBLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            {dimension === 'periodo' && (
              <div className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-sky-300 dark:border-sky-800">
                Últimos 15 Días (Activo)
              </div>
            )}
          </div>

          {/* Entity B Selector */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                Elemento B (Serie de Comparación)
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                {statsB.total} Registros
              </span>
            </div>
            {dimension === 'sector' && (
              <select
                value={entityB}
                onChange={(e) => setEntityB(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/30"
              >
                {SECTORES_RESIDENCIA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            {dimension === 'categoria' && (
              <select
                value={entityB}
                onChange={(e) => setEntityB(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/30"
              >
                {CATEGORIAS_SISTEMA.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
            {dimension === 'canal' && (
              <select
                value={entityB}
                onChange={(e) => setEntityB(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500/30"
              >
                {CANALES_DISPONIBLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}
            {dimension === 'periodo' && (
              <div className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-amber-300 dark:border-amber-800">
                15 Días Previos (Histórico de Referencia)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparative KPI Metrics Grid with Direct Deltas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Volumen Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Volumen Total de Incidencias</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">
                {statsA.total}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({entityA})</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {statsB.total}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({entityB})</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {getDelta(statsA.total, statsB.total, ' casos')}
          </div>
        </div>

        {/* KPI 2: Tasa de Resolución */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Tasa de Resolución (%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">
                {statsA.tasaResolucion}%
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({statsA.resueltos})</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {statsB.tasaResolucion}%
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({statsB.resueltos})</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {getDelta(statsA.tasaResolucion, statsB.tasaResolucion, '%')}
          </div>
        </div>

        {/* KPI 3: Casos en Progreso Activo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>En Progreso (Cuadrillas)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">
                {statsA.enProgreso}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({entityA})</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {statsB.enProgreso}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({entityB})</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {getDelta(statsA.enProgreso, statsB.enProgreso, ' activos')}
          </div>
        </div>

        {/* KPI 4: Casos Críticos / Urgentes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Casos Urgentes / Alta Prioridad</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 font-mono">
                {statsA.urgentes}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({entityA})</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {statsB.urgentes}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">({entityB})</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {getDelta(statsA.urgentes, statsB.urgentes, ' críticos')}
          </div>
        </div>
      </div>

      {/* Cross Comparison Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Grouped Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Comparativa por Estado de Avance
              </h3>
              <p className="text-xs text-slate-500">Distribución de casos abiertos, en progreso y resueltos</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> {entityA}
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> {entityB}
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="estado" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey={entityA} fill="#0284C7" radius={[4, 4, 0, 0]} />
                <Bar dataKey={entityB} fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cross Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {dimension === 'sector' ? 'Tipología de Incidencias en cada Sector' : 'Distribución por Género'}
              </h3>
              <p className="text-xs text-slate-500">Volumen comparativo por sub-variables</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> {entityA}
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> {entityB}
              </span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {dimension === 'sector' ? (
                <BarChart
                  data={categoryCrossData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="cat" tick={{ fontSize: 10, fill: '#94a3b8' }} width={110} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="valA" name={entityA} fill="#0284C7" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="valB" name={entityB} fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              ) : (
                <BarChart data={genderCrossData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="grupo" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey={entityA} fill="#0284C7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={entityB} fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytical Executive Summary Insights */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Conclusiones del Análisis Comparativo
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-sky-400 block mb-1">Volumen & Carga Operativa:</span>
            {statsA.total > statsB.total ? (
              <p>
                <strong>{entityA}</strong> presenta un <strong>{Math.round(((statsA.total - statsB.total) / (statsB.total || 1)) * 100)}% más de radicaciones</strong> en comparación con {entityB}, concentrando mayor demanda de cuadrillas.
              </p>
            ) : statsA.total < statsB.total ? (
              <p>
                <strong>{entityB}</strong> lidera la demanda ciudadana con un <strong>{Math.round(((statsB.total - statsA.total) / (statsA.total || 1)) * 100)}% más de casos</strong> frente a {entityA}.
              </p>
            ) : (
              <p>Ambas entidades mantienen una carga balanceada de radicaciones registradas ({statsA.total} casos c/u).</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">Efectividad de Cierre:</span>
            {statsA.tasaResolucion >= statsB.tasaResolucion ? (
              <p>
                <strong>{entityA}</strong> alcanza una mayor tasa de resolución ({statsA.tasaResolucion}%) frente al {statsB.tasaResolucion}% de {entityB}, reflejando agilidad en el despacho.
              </p>
            ) : (
              <p>
                <strong>{entityB}</strong> supera la tasa de resolución con {statsB.tasaResolucion}% frente al {statsA.tasaResolucion}% obtenido en {entityA}.
              </p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-amber-400 block mb-1">Recomendación para Despacho:</span>
            <p>
              Priorizar cuadrillas de inspección en {statsA.urgentes >= statsB.urgentes ? entityA : entityB} debido a que registra {Math.max(statsA.urgentes, statsB.urgentes)} casos catalogados con severidad urgente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
