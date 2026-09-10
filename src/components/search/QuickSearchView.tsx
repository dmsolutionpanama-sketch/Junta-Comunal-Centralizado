import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShieldCheck,
  Clock,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  GitCommit,
  CheckCircle2,
  Lock,
  User,
  Tag,
  Layers,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Ticket } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { matchesTicketSearch, getTicketMatchReason } from '../../utils/ticketSearch';

interface QuickSearchViewProps {
  tickets: Ticket[];
  initialQuery?: string;
  onNavigateToTrace?: (ticketId: string) => void;
}

export const QuickSearchView: React.FC<QuickSearchViewProps> = ({
  tickets,
  initialQuery,
  onNavigateToTrace,
}) => {
  const [searchCode, setSearchCode] = useState(initialQuery || 'TK-2025-001');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [searched, setSearched] = useState(true);

  // Sync with initialQuery if changed
  useEffect(() => {
    if (initialQuery) {
      setSearchCode(initialQuery);
      setSearched(true);
    }
  }, [initialQuery]);

  // Find all matching tickets based on Cédula, Nombre, Apellido, Tipo de reporte, Sector o Radicado
  const matchingTickets = useMemo(() => {
    if (!searchCode.trim()) return [];
    return tickets.filter((t) => matchesTicketSearch(t, searchCode));
  }, [tickets, searchCode]);

  // Selected ticket for detailed timeline view
  const selectedTicket = useMemo(() => {
    if (matchingTickets.length === 0) return null;
    if (activeTicketId) {
      const found = matchingTickets.find((t) => t.id === activeTicketId);
      if (found) return found;
    }
    return matchingTickets[0] || null;
  }, [matchingTickets, activeTicketId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setSearched(true);
    if (matchingTickets.length > 0) {
      setActiveTicketId(matchingTickets[0].id);
    }
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setActiveTicketId(ticket.id);
  };

  const setDemoQuery = (query: string) => {
    setSearchCode(query);
    setSearched(true);
    const matches = tickets.filter((t) => matchesTicketSearch(t, query));
    if (matches.length > 0) {
      setActiveTicketId(matches[0].id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] mb-3 shadow-xs">
            <Search className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Buscador Integral de Tickets
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-normal">
            Búsqueda universal de incidencias por <strong>cédula</strong>, <strong>nombre o apellido</strong>, <strong>tipo de reporte</strong>, <strong>sector residencial</strong> o <strong>número de radicado</strong>.
          </p>

          {/* Privacy Guarantee Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 rounded-full text-[11px] font-medium border border-slate-200 dark:border-slate-700">
            <Lock className="w-3 h-3 text-[#0066FF]" />
            <span>Búsqueda y Trazabilidad Multi-Criterio en Tiempo Real</span>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="public-ticket-search-input"
                type="text"
                required
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  setSearched(true);
                }}
                placeholder="Buscar por cédula (ej: 8-888-1234), nombre, tipo de reporte o sector..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              id="btn-public-search"
              className="py-3 px-6 bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Buscar Tickets</span>
            </button>
          </form>

          {/* Demo Quick Buttons for Instant Multi-criteria Testing */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Probar búsquedas rápidas:</span>
            <button
              type="button"
              onClick={() => setDemoQuery('8-888-1234')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0066FF] text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              🆔 Cédula: 8-888-1234
            </button>
            <button
              type="button"
              onClick={() => setDemoQuery('Carlos Mendoza')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0066FF] text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              👤 Nombre: Carlos Mendoza
            </button>
            <button
              type="button"
              onClick={() => setDemoQuery('Altos de Las Cumbres')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0066FF] text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              📍 Sector: Cumbres
            </button>
            <button
              type="button"
              onClick={() => setDemoQuery('Luminarias')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0066FF] text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              💡 Tipo: Luminarias
            </button>
            <button
              type="button"
              onClick={() => setDemoQuery('TK-2025-001')}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0066FF] text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700"
            >
              🎟️ Radicado: TK-2025-001
            </button>
            <button
              type="button"
              onClick={() => setDemoQuery('WhatsApp')}
              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
            >
              💬 Canal: WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Multiple Matches Grid / Carousel if search returned multiple tickets */}
      {matchingTickets.length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0066FF]" />
              Tickets Coincidentes con la Búsqueda ({matchingTickets.length} encontrados)
            </h3>
            <span className="text-[11px] text-slate-400">
              Haga clic en un ticket para ver su detalle completo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matchingTickets.map((t) => {
              const isSelected = selectedTicket?.id === t.id;
              const reason = getTicketMatchReason(t, searchCode);
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">
                      {t.numeroRegistro}
                    </span>
                    <StatusBadge status={t.estado} size="sm" />
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate mb-1">
                    {t.asunto}
                  </h4>

                  <div className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{t.reportante?.nombre || 'Ciudadano'}</span>
                      <span className="font-mono text-slate-400">({t.reportante?.cedula || 'N/A'})</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{t.sectorNombre}</span>
                    </div>
                  </div>

                  {/* Match Reason Tag */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100/70 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium">
                      {reason.label}: {reason.detail}
                    </span>
                    {isSelected && (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        Seleccionado ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ticket Status Result Card */}
      <AnimatePresence mode="wait">
        {selectedTicket && (
          <motion.div
            key={selectedTicket.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
          >
            {/* Card Top Strip */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-base font-bold text-[#0066FF] bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-900">
                    {selectedTicket.numeroRegistro}
                  </span>
                  <StatusBadge status={selectedTicket.estado} size="lg" />
                  <PriorityBadge priority={selectedTicket.prioridad} />
                  {selectedTicket.canalIntake && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedTicket.canalIntake}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">
                  {selectedTicket.asunto}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {onNavigateToTrace && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTrace(selectedTicket.id)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Ver Trazabilidad Completa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="text-right text-xs text-slate-500 dark:text-slate-400 space-y-0.5 hidden sm:block">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedTicket.fechaCreacion}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedTicket.horaCreacion}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Details Grid: Cédula, Nombre, Categoría y Sector */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Category, Citizen, Cedula & Sector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Tipo de Reporte
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    {selectedTicket.categoriaNombre}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Sector Residencial
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    {selectedTicket.sectorNombre}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Persona Reportante
                  </span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-emerald-500" />
                    {selectedTicket.reportante?.nombre || 'Ciudadano'}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cédula / Identificación
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    {selectedTicket.reportante?.cedula || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0066FF]" />
                  Detalle del Reporte Registrado
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.descripcion}
                </p>
                {selectedTicket.direccionDetallada && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dirección / Referencia: {selectedTicket.direccionDetallada}</span>
                  </p>
                )}
              </div>

              {/* Resumed Traceability (Últimas acciones) */}
              <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl p-5 bg-white dark:bg-slate-900 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-[#0066FF]" />
                  Bitácora de Avance ({selectedTicket.trazabilidad.length} Actualizaciones)
                </h3>

                <div className="space-y-3 pt-2">
                  {selectedTicket.trazabilidad.map((evento) => (
                    <div
                      key={evento.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#0066FF] dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {evento.tipoEvento === 'creacion'
                              ? 'Ticket Registrado en el Sistema'
                              : evento.tipoEvento === 'cambio_estado'
                              ? `Actualización: ${evento.estadoNuevo || 'En Proceso'}`
                              : 'Seguimiento Técnico'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {evento.fechaHora}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {evento.nota}
                        </p>
                        {evento.minutosConsumidos && (
                          <span className="inline-block mt-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            ⏱️ Tiempo registrado: {evento.minutosConsumidos} min
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy Compliance Footer */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Sistema Integrado de Gestión Comunal • Auditoría y Seguridad Activa
              </span>
              <span className="text-[11px] text-slate-400">Junta Comunal Ernesto Córdoba Campos</span>
            </div>
          </motion.div>
        )}

        {/* Not Found Screen */}
        {matchingTickets.length === 0 && searched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 text-center space-y-4 shadow-xs"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No se encontró ningún ticket para &quot;{searchCode}&quot;
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Puede buscar ingresando una <strong>cédula</strong> (ej: 8-888-1234), el <strong>nombre o apellido</strong> de la persona (ej: Carlos Mendoza), el <strong>tipo de reporte</strong> (ej: Luminarias, Agua, Basura), el <strong>sector residencial</strong> (ej: Altos de Las Cumbres) o el <strong>número de radicado</strong> (ej: TK-2025-001).
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDemoQuery('8-888-1234')}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
              >
                Buscar por Cédula Demo
              </button>
              <button
                type="button"
                onClick={() => setDemoQuery('TK-2025-001')}
                className="px-4 py-2 bg-[#0066FF] text-white text-xs font-semibold rounded-xl hover:bg-[#0052cc] transition-colors cursor-pointer"
              >
                Cargar Ticket de Demostración
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

