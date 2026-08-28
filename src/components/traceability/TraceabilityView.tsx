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
  MapPin,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { Ticket, TicketStatus, TraceEventType, TrazabilidadEvento, User as AppUser } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { GoogleMapLocationPicker } from '../common/GoogleMapLocationPicker';
import { emailService } from '../../services/emailService';
import { analytics } from '../../services/analytics';

interface TraceabilityViewProps {
  tickets: Ticket[];
  initialTicketId?: string | null;
  currentUser?: AppUser | null;
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
  currentUser,
  onAddTraceEvent,
}) => {
  const [searchQuery, setSearchQuery] = useState(
    initialTicketId || (tickets[0]?.numeroRegistro || 'ALU-2025-001')
  );
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New Trace Event Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [eventType, setEventType] = useState<TraceEventType>('cambio_estado');
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('en_progreso');
  const [responsibleName, setResponsibleName] = useState(currentUser?.nombre || 'Junta Comunal (Operaciones)');
  const [responsibleRole, setResponsibleRole] = useState(currentUser?.departamento || 'Coordinación de Cuadrillas');
  const [formSuccess, setFormSuccess] = useState(false);
  const [notificationDispatched, setNotificationDispatched] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setResponsibleName(currentUser.nombre);
      setResponsibleRole(currentUser.departamento || (currentUser.rol === 'administrador' ? 'Administrador Superior' : 'Personal Junta Comunal'));
    }
  }, [currentUser]);

  // Load ticket
  useEffect(() => {
    if (initialTicketId) {
      setSearchQuery(initialTicketId);
    }
  }, [initialTicketId]);

  useEffect(() => {
    if (!searchQuery) return;
    const cleanQ = searchQuery.trim().toLowerCase();
    const found = tickets.find(
      (t) =>
        t.numeroRegistro.toLowerCase() === cleanQ ||
        t.id.toLowerCase() === cleanQ ||
        t.asunto.toLowerCase().includes(cleanQ)
    );
    if (found) {
      setCurrentTicket(found);
      setErrorMessage(null);
      analytics.trackTicketSearched(searchQuery, true);
    } else {
      setCurrentTicket(null);
      setErrorMessage(`No se encontró ningún ticket con el número de radicado "${searchQuery}".`);
      analytics.trackTicketSearched(searchQuery, false);
    }
  }, [searchQuery, tickets]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const cleanQ = searchQuery.trim().toLowerCase();
    const found = tickets.find(
      (t) =>
        t.numeroRegistro.toLowerCase() === cleanQ ||
        t.id.toLowerCase() === cleanQ ||
        t.asunto.toLowerCase().includes(cleanQ)
    );
    if (found) {
      setCurrentTicket(found);
      setErrorMessage(null);
    } else {
      setCurrentTicket(null);
      setErrorMessage(`No se encontró ningún ticket con el número de radicado "${searchQuery}".`);
    }
  };

  const handleAddEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTicket || !newNote.trim() || !responsibleName.trim()) return;

    const targetStatus = newStatus ? (newStatus as TicketStatus) : currentTicket.estado;

    onAddTraceEvent(currentTicket.id, {
      tipoEvento: eventType,
      responsable: responsibleName,
      rolResponsable: responsibleRole,
      nota: newNote.trim(),
      estadoNuevo: newStatus ? (newStatus as TicketStatus) : undefined,
    });

    // Send email alert and confirmation to citizen
    try {
      await emailService.notifyStatusUpdate(
        currentTicket,
        targetStatus,
        newNote.trim(),
        responsibleName
      );
      setNotificationDispatched(true);
    } catch (err) {
      console.warn('Email dispatch log', err);
    }

    // Google Analytics
    analytics.trackStatusUpdated(currentTicket.id, targetStatus, responsibleName);

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setNotificationDispatched(false);
      setNewNote('');
      setShowAddForm(false);
    }, 2200);
  };

  const getEventIcon = (type: TraceEventType) => {
    switch (type) {
      case 'creacion':
        return <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'cambio_estado':
        return <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'comentario':
        return <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'reasignacion':
        return <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'cierre':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <GitCommit className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getEventLabel = (type: TraceEventType) => {
    switch (type) {
      case 'creacion':
        return 'Radicación Inicial del Caso';
      case 'cambio_estado':
        return 'Avance de Progreso en Campo';
      case 'comentario':
        return 'Bitácora / Inspección Cuadrilla';
      case 'reasignacion':
        return 'Reasignación de Cuadrilla';
      case 'cierre':
        return 'Resolución & Cierre Oficial';
      default:
        return 'Evento de Trazabilidad';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Search Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Trazabilidad & Avance de Incidencias
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800">
                Bitácora de la Junta Comunal
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
              Historial cronológico completo, actualización de progreso por la Junta y alertas automáticas por correo
            </p>
          </div>

          {currentTicket && (
            <button
              type="button"
              id="btn-add-trace-note"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{showAddForm ? 'Ocultar Formulario' : 'Actualizar Progreso del Ticket'}</span>
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
              placeholder="Buscar por radicado (ej: ALU-2025-001, AGU-2025-002, POD-2025-003)..."
              className="w-full pl-10 pr-24 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 font-medium"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Consultar
            </button>
          </form>

          {/* Fast dropdown selector of active tickets */}
          <div className="sm:w-72">
            <select
              value={currentTicket?.numeroRegistro || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="">Seleccionar ticket activo...</option>
              {tickets.map((t) => (
                <option key={t.id} value={t.numeroRegistro}>
                  {t.numeroRegistro} ({t.categoriaNombre}) - {t.sectorNombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error if not found */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Trace Form Modal/Panel (Available to Junta and Admin) */}
      <AnimatePresence>
        {showAddForm && currentTicket && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Actualizar Progreso & Despachar Alerta de Correo: {currentTicket.numeroRegistro}
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                Control Operativo de la Junta
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Al guardar, se registrará el avance en la línea de tiempo y se enviará una notificación automática por correo al ciudadano ({currentTicket.reportante.email || 'correo del reportante'}).
            </p>

            {formSuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  ¡Progreso guardado con éxito y alerta de confirmación enviada a {currentTicket.reportante.email || 'ciudadano'}!
                </span>
              </div>
            ) : (
              <form onSubmit={handleAddEventSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nuevo Progreso / Estado *
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 text-slate-800 dark:text-slate-200 font-semibold"
                    >
                      <option value="abierto">Abierto / En Recepción</option>
                      <option value="en_progreso">En Progreso / Cuadrilla Asignada</option>
                      <option value="resuelto">Resuelto / Obra Completada</option>
                      <option value="cerrado">Cerrado & Archivado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Hito
                    </label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value as TraceEventType)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 text-slate-800 dark:text-slate-200"
                    >
                      <option value="cambio_estado">Cambio de Estado / Progreso</option>
                      <option value="comentario">Bitácora de Inspección en Campo</option>
                      <option value="reasignacion">Reasignación de Cuadrilla</option>
                      <option value="cierre">Cierre Oficial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Funcionario / Cuadrilla Responsable
                    </label>
                    <input
                      type="text"
                      required
                      value={responsibleName}
                      onChange={(e) => setResponsibleName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nota de Avance Técnico y Detalle para el Ciudadano *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Detalle la labor realizada por la cuadrilla (ej: Se sustituyeron 2 luminarias y se reparó la acometida)..."
                    className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    Se enviará copia al correo: <strong>{currentTicket.reportante.email || 'registrado'}</strong>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Guardar Avance & Notificar</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Traceability Content */}
      {currentTicket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Ticket Quick Summary & Map Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs h-fit space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900">
                {currentTicket.numeroRegistro}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2.5 leading-snug">
                {currentTicket.asunto}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={currentTicket.estado} size="sm" />
                <PriorityBadge priority={currentTicket.prioridad} size="sm" />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-600 dark:text-slate-400 block font-medium">Categoría:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentTicket.categoriaNombre}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 block font-medium">Sector:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentTicket.sectorNombre}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 block font-medium">Ciudadano Reportante:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentTicket.reportante.nombre} (Cédula: {currentTicket.reportante.cedula})
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 block font-medium">Asignado a:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentTicket.asignadoA || 'Coordinación Comunal'}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400 block font-medium">Fecha de Radicación:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {currentTicket.fechaCreacion} ({currentTicket.horaCreacion})
                </span>
              </div>
            </div>

            {/* Google Map Georeferencing Card */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                Ubicación Georreferenciada en Google Maps
              </span>
              <GoogleMapLocationPicker
                initialLat={currentTicket.ubicacionLat || 9.0834}
                initialLng={currentTicket.ubicacionLng || -79.5312}
                initialAddress={currentTicket.direccionDetallada || currentTicket.sectorNombre}
                readOnly={true}
              />
            </div>
          </div>

          {/* Right Column (Span 2): Vertical Timeline (Stepper) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Línea de Tiempo de Bitácora ({currentTicket.trazabilidad.length} Hitos)
              </h3>
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Progreso y seguimiento oficial
              </span>
            </div>

            {/* Vertical Stepper Container */}
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900">
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
                          ? 'bg-blue-600 border-white dark:border-slate-900 ring-4 ring-blue-100 dark:ring-blue-950/60 text-white'
                          : 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {getEventIcon(evento.tipoEvento)}
                    </div>

                    {/* Event Content Card */}
                    <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-150 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {getEventLabel(evento.tipoEvento)}
                          </span>
                          {evento.estadoNuevo && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
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
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
                        {evento.nota}
                      </p>

                      {/* Responsible User Footer */}
                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          {evento.responsable}
                        </span>
                        {evento.rolResponsable && (
                          <span className="text-slate-600 dark:text-slate-400 italic">
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
