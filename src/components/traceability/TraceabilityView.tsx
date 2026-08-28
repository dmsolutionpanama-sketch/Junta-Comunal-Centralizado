import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  GitCommit,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  MessageSquare,
  ArrowRight,
  Shield,
  Layers,
  Calendar,
  FileText,
} from 'lucide-react';
import { Ticket, TicketStatus, TraceEventType, TrazabilidadEvento } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';

interface TraceabilityViewProps {
  tickets: Ticket[];
  initialTicketId?: string | null;
  onAddTraceEvent: (
    ticketId: string,
    event: {
      tipoEvento: TraceEventType;
      responsable: string;
      rolResponsable?: string;
      nota: string;
      estadoNuevo?: TicketStatus;
    }
  ) => void;
}

export const TraceabilityView: React.FC<TraceabilityViewProps> = ({
  tickets,
  initialTicketId,
  onAddTraceEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialTicketId || (tickets[0]?.numeroRegistro || 'TK-2025-001'));
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Trace Event Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [eventType, setEventType] = useState<TraceEventType>('comentario');
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');
  const [responsibleName, setResponsibleName] = useState('Ing. Carlos Mendoza');
  const [responsibleRole, setResponsibleRole] = useState('Supervisor General');
  const [formSuccess, setFormSuccess] = useState(false);

  // Load ticket
  useEffect(() => {
    if (initialTicketId) {
      setSearchQuery(initialTicketId);
    }
  }, [initialTicketId]);

  useEffect(() => {
    if (!searchQuery) return;
    const found = tickets.find(
      (t) =>
        t.numeroRegistro.toLowerCase() === searchQuery.trim().toLowerCase() ||
        t.id.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (found) {
      setCurrentTicket(found);
      setErrorMessage(null);
    } else {
      setCurrentTicket(null);
      setErrorMessage(`No se encontró ningún ticket con el número "${searchQuery}".`);
    }
  }, [searchQuery, tickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const found = tickets.find(
      (t) =>
        t.numeroRegistro.toLowerCase() === searchQuery.trim().toLowerCase() ||
        t.id.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (found) {
      setCurrentTicket(found);
      setErrorMessage(null);
    } else {
      setCurrentTicket(null);
      setErrorMessage(`No se encontró ningún ticket con el identificador "${searchQuery}".`);
    }
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTicket || !newNote.trim() || !responsibleName.trim()) return;

    onAddTraceEvent(currentTicket.id, {
      tipoEvento: eventType,
      responsable: responsibleName,
      rolResponsable: responsibleRole,
      nota: newNote.trim(),
      estadoNuevo: newStatus ? (newStatus as TicketStatus) : undefined,
    });

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setNewNote('');
      setShowAddForm(false);
      setNewStatus('');
    }, 2000);
  };

  const getEventIcon = (type: TraceEventType) => {
    switch (type) {
      case 'creacion':
        return <Plus className="w-4 h-4 text-emerald-600" />;
      case 'cambio_estado':
        return <ArrowRight className="w-4 h-4 text-[#0066FF]" />;
      case 'comentario':
        return <MessageSquare className="w-4 h-4 text-amber-600" />;
      case 'reasignacion':
        return <Layers className="w-4 h-4 text-purple-600" />;
      case 'cierre':
        return <CheckCircle2 className="w-4 h-4 text-slate-700" />;
      default:
        return <GitCommit className="w-4 h-4 text-[#0066FF]" />;
    }
  };

  const getEventLabel = (type: TraceEventType) => {
    switch (type) {
      case 'creacion':
        return 'Creación del Ticket';
      case 'cambio_estado':
        return 'Cambio de Estado';
      case 'comentario':
        return 'Comentario / Nota Interna';
      case 'reasignacion':
        return 'Reasignación de Cuadrilla';
      case 'cierre':
        return 'Cierre Oficial';
      default:
        return 'Evento de Bitácora';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Search Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Trazabilidad del Ticket
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0066FF] text-xs font-bold border border-blue-100">
                Línea de Tiempo y Bitácora
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-normal">
              Historial cronológico completo de cambios, notas internas, inspecciones y asignaciones
            </p>
          </div>

          {currentTicket && (
            <button
              type="button"
              id="btn-add-trace-note"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Nota a Bitácora</span>
            </button>
          )}
        </div>

        {/* Search & Quick Selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="traceability-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número de ticket (ej: TK-2025-001)..."
              className="w-full pl-10 pr-24 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#0066FF] focus:ring-1 focus:ring-blue-500/20 font-medium"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0066FF] text-white text-xs font-semibold rounded-lg hover:bg-[#0052cc] transition-colors cursor-pointer"
            >
              Cargar
            </button>
          </form>

          {/* Fast dropdown selector of active tickets */}
          <div className="sm:w-72">
            <select
              value={currentTicket?.numeroRegistro || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#0066FF] font-medium"
            >
              <option value="">Seleccionar de la lista...</option>
              {tickets.map((t) => (
                <option key={t.id} value={t.numeroRegistro}>
                  {t.numeroRegistro} - {t.asunto.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error if not found */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Trace Form Modal/Panel */}
      <AnimatePresence>
        {showAddForm && currentTicket && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50/50 border border-blue-200 rounded-2xl p-6 shadow-xs overflow-hidden"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#0066FF]" />
              Registrar Nuevo Hito en {currentTicket.numeroRegistro}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Esta nota quedará fijada en la línea de tiempo oficial para auditoría y seguimiento.
            </p>

            {formSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Evento registrado con éxito en la trazabilidad.</span>
              </div>
            ) : (
              <form onSubmit={handleAddEventSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Evento
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as TraceEventType)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#0066FF]"
                    >
                      <option value="comentario">Comentario / Nota Interna</option>
                      <option value="cambio_estado">Cambio de Estado</option>
                      <option value="reasignacion">Reasignación de Responsable</option>
                      <option value="cierre">Cierre Definitivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cambiar Estado (Opcional)
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#0066FF]"
                    >
                      <option value="">Mantener estado actual ({currentTicket.estado})</option>
                      <option value="abierto">Abierto</option>
                      <option value="en_progreso">En Progreso</option>
                      <option value="resuelto">Resuelto</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Funcionario Responsable
                    </label>
                    <input
                      type="text"
                      value={responsibleName}
                      onChange={(e) => setResponsibleName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#0066FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descripción / Bitácora de la Acción
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Detalle la inspección realizada, coordinación con cuadrilla o motivo del cambio..."
                    className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-[#0066FF]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Guardar en Línea de Tiempo</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Traceability Content */}
      {currentTicket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Ticket Quick Summary Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs h-fit space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-mono font-bold text-[#0066FF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {currentTicket.numeroRegistro}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-2.5 leading-snug">
                {currentTicket.asunto}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={currentTicket.estado} size="sm" />
                <PriorityBadge priority={currentTicket.prioridad} size="sm" />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Categoría:</span>
                <span className="font-semibold text-slate-800">{currentTicket.categoriaNombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Sector:</span>
                <span className="font-semibold text-slate-800">{currentTicket.sectorNombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Reportante (Interno):</span>
                <span className="font-semibold text-slate-800">
                  {currentTicket.reportante.nombre} ({currentTicket.reportante.cedula})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Asignado a:</span>
                <span className="font-semibold text-slate-800">{currentTicket.asignadoA || 'Sin asignar'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Fecha de Radicación:</span>
                <span className="font-semibold text-slate-800">
                  {currentTicket.fechaCreacion} a las {currentTicket.horaCreacion}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Descripción Inicial
              </span>
              <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {currentTicket.descripcion}
              </p>
            </div>
          </div>

          {/* Right Column (Span 2): Vertical Timeline (Stepper) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#0066FF]" />
                Línea de Tiempo Vertical ({currentTicket.trazabilidad.length} Hitos)
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Orden cronológico ascendente
              </span>
            </div>

            {/* Vertical Stepper Container */}
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200">
              {currentTicket.trazabilidad.map((evento, index) => {
                const isLast = index === currentTicket.trazabilidad.length - 1;

                return (
                  <motion.div
                    key={evento.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="relative group"
                  >
                    {/* Node Icon on Timeline */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-1.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${
                        isLast
                          ? 'bg-[#0066FF] border-white ring-4 ring-blue-100 text-white'
                          : 'bg-white border-blue-500 text-[#0066FF]'
                      }`}
                    >
                      {getEventIcon(evento.tipoEvento)}
                    </div>

                    {/* Event Content Card */}
                    <div className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-150 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {getEventLabel(evento.tipoEvento)}
                          </span>
                          {evento.estadoNuevo && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#0066FF] border border-blue-100">
                              {evento.estadoAnterior ? `${evento.estadoAnterior} → ` : ''}
                              {evento.estadoNuevo}
                            </span>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{evento.fechaHora}</span>
                        </div>
                      </div>

                      {/* Note Body */}
                      <p className="text-xs text-slate-700 leading-relaxed pt-1">
                        {evento.nota}
                      </p>

                      {/* Responsible User Footer */}
                      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-[#0066FF]" />
                          {evento.responsable}
                        </span>
                        {evento.rolResponsable && (
                          <span className="text-slate-400 italic">
                            {evento.rolResponsable}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
