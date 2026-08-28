import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Download,
  MapPin,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import { Ticket, TicketStatus, TicketPriority } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { TicketModalDetail } from './TicketModalDetail';

interface GeneralViewProps {
  tickets: Ticket[];
  onOpenNewTicket: () => void;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onAddTraceNote: (ticketId: string, note: string, eventType: any, newStatus?: TicketStatus) => void;
  onNavigateToTrace: (ticketId: string) => void;
}

type SortField =
  | 'numeroRegistro'
  | 'reportanteNombre'
  | 'asunto'
  | 'categoriaNombre'
  | 'sectorNombre'
  | 'estado'
  | 'prioridad'
  | 'fechaCreacion';

export const GeneralView: React.FC<GeneralViewProps> = ({
  tickets,
  onOpenNewTicket,
  onUpdateTicketStatus,
  onAddTraceNote,
  onNavigateToTrace,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [selectedSector, setSelectedSector] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState('todos');
  const [selectedPriority, setSelectedPriority] = useState('todas');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('fechaCreacion');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Review Modal state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Expanded description rows state
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todas');
    setSelectedSector('todos');
    setSelectedStatus('todos');
    setSelectedPriority('todas');
    setCurrentPage(1);
  };

  // Filtered and Sorted Tickets calculation
  const processedTickets = useMemo(() => {
    let result = [...tickets];

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.numeroRegistro.toLowerCase().includes(q) ||
          t.asunto.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q) ||
          t.reportante.nombre.toLowerCase().includes(q) ||
          t.reportante.cedula.toLowerCase().includes(q) ||
          t.sectorNombre.toLowerCase().includes(q)
      );
    }

    // Category
    if (selectedCategory !== 'todas') {
      result = result.filter((t) => t.categoriaId === selectedCategory);
    }

    // Sector
    if (selectedSector !== 'todos') {
      result = result.filter((t) => t.sectorNombre === selectedSector);
    }

    // Status
    if (selectedStatus !== 'todos') {
      result = result.filter((t) => t.estado === selectedStatus);
    }

    // Priority
    if (selectedPriority !== 'todas') {
      result = result.filter((t) => t.prioridad === selectedPriority);
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = a[sortField as keyof Ticket];
      let valB: any = b[sortField as keyof Ticket];

      if (sortField === 'reportanteNombre') {
        valA = a.reportante.nombre;
        valB = b.reportante.nombre;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    tickets,
    searchTerm,
    selectedCategory,
    selectedSector,
    selectedStatus,
    selectedPriority,
    sortField,
    sortOrder,
  ]);

  // Pagination calculation
  const totalItems = processedTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTickets.slice(start, start + pageSize);
  }, [processedTickets, currentPage, pageSize]);

  const handleOpenReviewModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const exportToCSV = () => {
    const headers = [
      'Numero Registro',
      'Asunto',
      'Categoria',
      'Sector',
      'Estado',
      'Prioridad',
      'Reportante',
      'Cedula',
      'Fecha Creacion',
    ];
    const rows = processedTickets.map((t) => [
      `"${t.numeroRegistro}"`,
      `"${t.asunto.replace(/"/g, '""')}"`,
      `"${t.categoriaNombre}"`,
      `"${t.sectorNombre}"`,
      `"${t.estado}"`,
      `"${t.prioridad}"`,
      `"${t.reportante.nombre}"`,
      `"${t.reportante.cedula}"`,
      `"${t.fechaCreacion}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tickets_reporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Metrics
  const totalCount = tickets.length;
  const abiertosCount = tickets.filter((t) => t.estado === 'abierto').length;
  const progresoCount = tickets.filter((t) => t.estado === 'en_progreso').length;
  const resueltosCount = tickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
  const resueltosPercent = totalCount > 0 ? Math.round((resueltosCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top 4 KPI Metric Cards (Clean Utility / Minimal Design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Total Tickets
            </p>
            <h3 className="text-2xl font-bold text-slate-900">{totalCount}</h3>
          </div>
          <p className="text-emerald-500 text-xs mt-3 font-medium flex items-center gap-1">
            <span>↑</span> 12% este mes
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Abiertos
            </p>
            <h3 className="text-2xl font-bold text-slate-900">{abiertosCount}</h3>
          </div>
          <p className="text-rose-500 text-xs mt-3 font-medium">
            Requiere atención
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              En Progreso
            </p>
            <h3 className="text-2xl font-bold text-blue-600">{progresoCount}</h3>
          </div>
          <p className="text-slate-400 text-xs mt-3 font-medium">
            Promedio 2.4 días
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Resueltos
            </p>
            <h3 className="text-2xl font-bold text-slate-900">{resueltosCount}</h3>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${resueltosPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Listado de Tickets</h2>
            <p className="text-xs text-slate-400">Panel administrativo interno con datos y reportantes</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-export-csv"
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              id="btn-general-new-ticket"
              onClick={onOpenNewTicket}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-blue-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Ticket</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="filter-search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por # ticket, nombre, cédula o descripción..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Category Filter (The 6 official categories from Section 8) */}
          <div>
            <select
              id="filter-categoria-select"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="todas">Todas las Categorías</option>
              {CATEGORIAS_SISTEMA.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter (Sectores de Residencia from Section 9) */}
          <div>
            <select
              id="filter-sector-select"
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="todos">Todos los Sectores ({SECTORES_RESIDENCIA.length})</option>
              {SECTORES_RESIDENCIA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              id="filter-estado-select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierto">Abiertos</option>
              <option value="en_progreso">En Progreso</option>
              <option value="resuelto">Resueltos</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary & Reset */}
        {(searchTerm ||
          selectedCategory !== 'todas' ||
          selectedSector !== 'todos' ||
          selectedStatus !== 'todos' ||
          selectedPriority !== 'todas') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Mostrando <strong className="text-slate-800">{processedTickets.length}</strong> de{' '}
                {tickets.length} tickets encontrados con los filtros activos.
              </span>
            </div>
            <button
              type="button"
              id="btn-reset-filters"
              onClick={resetFilters}
              className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Administrative Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="table-general-tickets">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider select-none">
                {/* 1. Número de Registro */}
                <th
                  onClick={() => handleSort('numeroRegistro')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span># Registro</span>
                    {sortField === 'numeroRegistro' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 2. Nombre y Cédula de Quien lo Realizó */}
                <th
                  onClick={() => handleSort('reportanteNombre')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Reportante / Cédula</span>
                    {sortField === 'reportanteNombre' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 3. Información Detallada del Caso */}
                <th
                  onClick={() => handleSort('asunto')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Información Detallada del Caso</span>
                    {sortField === 'asunto' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 4. Categoría del Ticket */}
                <th
                  onClick={() => handleSort('categoriaNombre')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Categoría</span>
                    {sortField === 'categoriaNombre' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Sector */}
                <th
                  onClick={() => handleSort('sectorNombre')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Sector</span>
                    {sortField === 'sectorNombre' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Estado */}
                <th
                  onClick={() => handleSort('estado')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Estado</span>
                    {sortField === 'estado' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* 5. Botón "Revisar" (Acción) */}
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedTickets.length > 0 ? (
                paginatedTickets.map((ticket) => {
                  const isExpanded = !!expandedRowIds[ticket.id];

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      {/* 1. Número de Registro */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-900 block">
                          {ticket.numeroRegistro}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {ticket.fechaCreacion}
                        </span>
                      </td>

                      {/* 2. Nombre y Cédula de Quien lo Realizó */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {ticket.reportante.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <span>CIP: {ticket.reportante.cedula}</span>
                          <span className="text-slate-300">•</span>
                          <span className="capitalize font-sans">{ticket.reportante.genero}</span>
                        </div>
                      </td>

                      {/* 3. Información Detallada del Caso */}
                      <td className="py-4 px-4 max-w-xs md:max-w-sm">
                        <div className="font-semibold text-slate-800 mb-0.5 line-clamp-1">
                          {ticket.asunto}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {isExpanded ? (
                            <div className="space-y-1">
                              <p className="whitespace-pre-wrap">{ticket.descripcion}</p>
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(ticket.id)}
                                className="text-blue-600 font-semibold hover:underline cursor-pointer"
                              >
                                Ver menos
                              </button>
                            </div>
                          ) : (
                            <p className="line-clamp-2">
                              {ticket.descripcion}{' '}
                              {ticket.descripcion.length > 70 && (
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpand(ticket.id)}
                                  className="text-blue-600 font-semibold hover:underline ml-1 cursor-pointer"
                                >
                                  Ver más
                                </button>
                              )}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* 4. Categoría del Ticket */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                            ticket.categoriaId === 'alumbrado'
                              ? 'bg-orange-50 text-orange-600'
                              : ticket.categoriaId === 'agua'
                              ? 'bg-blue-50 text-blue-600'
                              : ticket.categoriaId === 'poda'
                              ? 'bg-emerald-50 text-emerald-600'
                              : ticket.categoriaId === 'ayuda'
                              ? 'bg-purple-50 text-purple-600'
                              : ticket.categoriaId === 'permisos'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-indigo-50 text-indigo-600'
                          }`}
                        >
                          {ticket.categoriaNombre}
                        </span>
                      </td>

                      {/* Sector de Residencia */}
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]" title={ticket.sectorNombre}>
                            {ticket.sectorNombre}
                          </span>
                        </div>
                      </td>

                      {/* Estado y Prioridad */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={ticket.estado} size="sm" />
                          <PriorityBadge priority={ticket.prioridad} size="sm" />
                        </div>
                      </td>

                      {/* 5. Botón "Revisar" */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          id={`btn-revisar-${ticket.id}`}
                          onClick={() => handleOpenReviewModal(ticket)}
                          className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-600 hover:text-white transition-all cursor-pointer uppercase tracking-wider shadow-2xs"
                        >
                          Revisar
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm text-slate-600">No se encontraron tickets</p>
                    <p className="text-xs mt-1">Pruebe ajustando los filtros o la búsqueda</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-slate-600">
            <span>Mostrar</span>
            <select
              id="pagination-limit-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-[#0066FF]"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
            <span className="text-slate-400">
              | Mostrando {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, totalItems)} de {totalItems} registros
            </span>
          </div>

          {/* Page navigation buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-pagination-prev"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              id="btn-pagination-next"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Modal Detail ("Revisar") */}
      <TicketModalDetail
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicket(null);
        }}
        onStatusChange={(newStatus) => {
          if (selectedTicket) {
            onUpdateTicketStatus(selectedTicket.id, newStatus);
            setSelectedTicket({ ...selectedTicket, estado: newStatus });
          }
        }}
        onAddTraceNote={(note, eventType, newStatus) => {
          if (selectedTicket) {
            onAddTraceNote(selectedTicket.id, note, eventType, newStatus);
          }
        }}
      />
    </div>
  );
};
