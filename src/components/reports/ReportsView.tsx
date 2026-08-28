import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  Clock,
  Printer,
} from 'lucide-react';
import { Ticket } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';

interface ReportsViewProps {
  tickets: Ticket[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ tickets }) => {
  const [reportType, setReportType] = useState<'general' | 'categoria' | 'sector' | 'sla'>('general');
  const [selectedCat, setSelectedCat] = useState('todas');
  const [selectedSector, setSelectedSector] = useState('todos');
  const [dateRange, setDateRange] = useState('este_mes');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleGenerateReport = () => {
    // Generate CSV export
    let filtered = [...tickets];
    if (selectedCat !== 'todas') {
      filtered = filtered.filter((t) => t.categoriaId === selectedCat);
    }
    if (selectedSector !== 'todos') {
      filtered = filtered.filter((t) => t.sectorNombre === selectedSector);
    }

    const headers = [
      'ID Registro',
      'Asunto',
      'Categoria',
      'Sector',
      'Estado',
      'Prioridad',
      'Reportante',
      'Cedula',
      'Fecha Creacion',
      'Hora',
      'Asignado A',
    ];

    const rows = filtered.map((t) => [
      `"${t.numeroRegistro}"`,
      `"${t.asunto.replace(/"/g, '""')}"`,
      `"${t.categoriaNombre}"`,
      `"${t.sectorNombre}"`,
      `"${t.estado}"`,
      `"${t.prioridad}"`,
      `"${t.reportante.nombre}"`,
      `"${t.reportante.cedula}"`,
      `"${t.fechaCreacion}"`,
      `"${t.horaCreacion}"`,
      `"${t.asignadoA || 'Sin asignar'}"`,
    ]);

    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `informe_helpdesk_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Generador de Reportes e Informes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066FF] text-xs font-bold border border-blue-100">
              Exportación Oficial
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-normal">
            Emisión de actas de servicio, consolidados mensuales y auditorías de gestión de incidencias
          </p>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Informe descargado exitosamente. Listo para abrir en Excel o Google Sheets.</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileSpreadsheet className="w-4 h-4 text-[#0066FF]" />
            Parámetros del Informe
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Tipo de Reporte a Generar
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setReportType('general')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'general'
                      ? 'border-[#0066FF] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900">
                    <FileText className="w-4 h-4 text-[#0066FF]" />
                    <span>Consolidado General</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Listado exhaustivo con todos los tickets, cuadrillas y resoluciones.
                  </p>
                </div>

                <div
                  onClick={() => setReportType('categoria')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'categoria'
                      ? 'border-[#0066FF] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900">
                    <Layers className="w-4 h-4 text-[#0066FF]" />
                    <span>Por Categoría de Incidencia</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Informe específico enfocado en alumbrado, agua, poda o ayudas.
                  </p>
                </div>

                <div
                  onClick={() => setReportType('sector')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'sector'
                      ? 'border-[#0066FF] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900">
                    <FileCheck className="w-4 h-4 text-[#0066FF]" />
                    <span>Por Sector Residencial</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Diagnóstico geográfico de comunidades para planificación de obras.
                  </p>
                </div>

                <div
                  onClick={() => setReportType('sla')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'sla'
                      ? 'border-[#0066FF] bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900">
                    <Clock className="w-4 h-4 text-[#0066FF]" />
                    <span>Auditoría de SLAs y Tiempos</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Métricas de cumplimiento y tiempos promedio de respuesta técnica.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filtrar por Categoría
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0066FF]"
                >
                  <option value="todas">Todas las Categorías</option>
                  {CATEGORIAS_SISTEMA.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filtrar por Sector
                </label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0066FF]"
                >
                  <option value="todos">Todos los Sectores</option>
                  {SECTORES_RESIDENCIA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Período Temporal
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0066FF]"
              >
                <option value="este_mes">Mes en Curso (Febrero 2025)</option>
                <option value="mes_anterior">Mes Anterior (Enero 2025)</option>
                <option value="ano_actual">Año Completo 2025</option>
                <option value="historico">Histórico Total Acumulado</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleGenerateReport}
                className="py-2.5 px-6 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Reporte en Formato CSV / Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Report Summaries Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs h-fit space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Resumen de Datos a Exportar
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span className="text-slate-500">Tickets en Muestra:</span>
              <span className="font-bold text-slate-900">{tickets.length} registros</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span className="text-slate-500">Categorías Activas:</span>
              <span className="font-bold text-slate-900">{CATEGORIAS_SISTEMA.length}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span className="text-slate-500">Sectores Monitoreados:</span>
              <span className="font-bold text-slate-900">{SECTORES_RESIDENCIA.length}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
              <span className="text-slate-500">Compatibilidad:</span>
              <span className="font-bold text-emerald-600">Excel, Calc, Sheets</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 block">Formato UTF-8 con BOM</span>
            <p className="text-[11px] text-slate-500">
              Garantiza la correcta visualización de caracteres especiales como tildes y la letra ñ en Microsoft Excel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
