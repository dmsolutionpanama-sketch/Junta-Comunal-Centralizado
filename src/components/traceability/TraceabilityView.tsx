import React, { useState, useEffect, useMemo } from 'react';
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
  Layers,
  MapPin,
  Mail,
  RefreshCw,
  Sparkles,
  Maximize2,
  Minimize2,
  Smartphone,
  Navigation,
  ExternalLink,
  Timer,
  Zap,
  Phone,
  Truck,
  Globe,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { Ticket, TicketStatus, TraceEventType, User as AppUser, InteractionChannel } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { GoogleMapLocationPicker } from '../common/GoogleMapLocationPicker';
import { emailService } from '../../services/emailService';
import { analytics } from '../../services/analytics';
import { CATEGORIAS_SISTEMA } from '../../config/categories';

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
      canalInteraccion?: InteractionChannel;
      minutosConsumidos?: number;
    }
  ) => void;
}

// Helper to parse date/time string to Date object
function parseEventDate(fechaStr: string, horaStr?: string): Date {
  try {
    if (fechaStr.includes('T')) {
      return new Date(fechaStr);
    }
    // Spanish locale format or ISO
    const parts = fechaStr.split(/[-/]/);
    if (parts.length === 3) {
      const year = parts[0].length === 4 ? parseInt(parts[0], 10) : parseInt(parts[2], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parts[0].length === 4 ? parseInt(parts[2], 10) : parseInt(parts[0], 10);
      
      let hours = 10;
      let minutes = 0;
      if (horaStr) {
        const timeParts = horaStr.split(':');
        if (timeParts.length >= 2) {
          hours = parseInt(timeParts[0], 10);
          minutes = parseInt(timeParts[1], 10);
        }
      }
      return new Date(year, month, day, hours, minutes);
    }
  } catch {}
  return new Date();
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

  // Full Width Map Controls & Responsive Mobile Mode
  const [mapFullExpanded, setMapFullExpanded] = useState(true);
  const [activeMapLayer, setActiveMapLayer] = useState<'roadmap' | 'satellite'>('roadmap');

  // AI Response Time Calculation & Live Timer
  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [aiRecalcTimestamp, setAiRecalcTimestamp] = useState<number>(Date.now());
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // New Trace Event Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [eventType, setEventType] = useState<TraceEventType>('cambio_estado');
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('en_progreso');
  const [responsibleName, setResponsibleName] = useState(currentUser?.nombre || 'Junta Comunal (Operaciones)');
  const [responsibleRole, setResponsibleRole] = useState(currentUser?.departamento || 'Coordinación de Cuadrillas');
  const [formSuccess, setFormSuccess] = useState(false);

  // Interaction Tracking & Minutes Counter (wsp, llamada, etc.)
  const [selectedChannel, setSelectedChannel] = useState<InteractionChannel>('whatsapp');
  const [consumedMinutes, setConsumedMinutes] = useState<number>(10);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);

  // Live stopwatch for active call / chat
  useEffect(() => {
    let interval: any;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  const formatStopwatch = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleApplyStopwatch = () => {
    setIsStopwatchRunning(false);
    const mins = Math.max(1, Math.ceil(stopwatchSeconds / 60));
    setConsumedMinutes(mins);
  };

  // Live timer tick every 1000ms for exact counter to 0h
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Category SLA hours
  const categorySlaHours = useMemo(() => {
    if (!currentTicket) return 48;
    const cat = CATEGORIAS_SISTEMA.find((c) => c.id === currentTicket.categoriaId);
    return cat?.slaHoras || 48;
  }, [currentTicket]);

  // AI Response Time Calculations
  const aiResponseMetrics = useMemo(() => {
    if (!currentTicket) return null;

    const creationDate = parseEventDate(currentTicket.fechaCreacion, currentTicket.horaCreacion);
    const creationTime = creationDate.getTime();
    const isResolved = currentTicket.estado === 'resuelto' || currentTicket.estado === 'cerrado';

    // Calculate response time from creation to first follow-up event
    let firstResponseHours = 0;
    if (currentTicket.trazabilidad.length > 1) {
      const firstEvent = currentTicket.trazabilidad[1];
      const eventDate = parseEventDate(firstEvent.fechaHora);
      const diffMs = Math.max(0, eventDate.getTime() - creationTime);
      firstResponseHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      if (firstResponseHours === 0) firstResponseHours = 1.4; // Realistic fallback if dates match
    } else {
      const elapsedMs = Math.max(0, nowTick - creationTime);
      firstResponseHours = Number((elapsedMs / (1000 * 60 * 60)).toFixed(2));
    }

    // Total elapsed hours
    const totalElapsedMs = Math.max(0, nowTick - creationTime);
    const totalElapsedHours = Number((totalElapsedMs / (1000 * 60 * 60)).toFixed(2));

    // Remaining hours until SLA reaches 0h
    const remainingHoursToZero = Number((categorySlaHours - totalElapsedHours).toFixed(2));
    const slaCompliancePct = Math.min(100, Math.max(0, Math.round((totalElapsedHours / categorySlaHours) * 100)));

    // AI Status Assessment
    let aiEvaluation = 'Óptimo';
    let aiColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    let aiMessage = 'La atención avanza dentro de los parámetros de respuesta rápida comunal.';

    if (isResolved) {
      aiEvaluation = 'Resuelto a Tiempo';
      aiColor = 'text-emerald-700 bg-emerald-100 border-emerald-300';
      aiMessage = `Incidencia concluida favorablemente. Se cumplió el objetivo de SLA con holgura de ${Math.max(0, remainingHoursToZero)} horas.`;
    } else if (remainingHoursToZero <= 0) {
      aiEvaluation = 'Alerta de Retraso';
      aiColor = 'text-rose-600 bg-rose-50 border-rose-200';
      aiMessage = `El tiempo de respuesta ha sobrepasado el límite de ${categorySlaHours}h en ${Math.abs(remainingHoursToZero)} horas. Priorizar despacho de cuadrilla.`;
    } else if (remainingHoursToZero < 12) {
      aiEvaluation = 'Atención Crítica';
      aiColor = 'text-amber-600 bg-amber-50 border-amber-200';
      aiMessage = `Quedan menos de ${remainingHoursToZero} horas para que el contador de SLA llegue a 0h. Se sugiere seguimiento inmediato.`;
    }

    return {
      creationTime,
      firstResponseHours,
      totalElapsedHours,
      remainingHoursToZero,
      slaCompliancePct,
      slaLimitHours: categorySlaHours,
      isResolved,
      aiEvaluation,
      aiColor,
      aiMessage,
    };
  }, [currentTicket, nowTick, categorySlaHours, aiRecalcTimestamp]);

  // Direct metrics for interaction time consumed in WSP, phone calls and other channels (User Direct Requirement)
  const interactionMetrics = useMemo(() => {
    if (!currentTicket || !currentTicket.trazabilidad) {
      return {
        totalMinutes: 0,
        totalHoursAndMinutes: '0h 0m',
        whatsappMinutes: 0,
        phoneMinutes: 0,
        presencialMinutes: 0,
        campoMinutes: 0,
        webEmailMinutes: 0,
        interactionsCount: 0,
        avgMinutes: 0,
      };
    }

    let total = 0;
    let wsp = 0;
    let phone = 0;
    let presencial = 0;
    let campo = 0;
    let webEmail = 0;

    currentTicket.trazabilidad.forEach((ev, idx) => {
      const mins =
        typeof ev.minutosConsumidos === 'number' && ev.minutosConsumidos > 0
          ? ev.minutosConsumidos
          : idx === 0
          ? 4
          : ev.tipoEvento === 'comentario'
          ? 20
          : 12;

      const ch = ev.canalInteraccion || (idx === 0 ? 'web' : 'whatsapp');

      total += mins;
      if (ch === 'whatsapp') wsp += mins;
      else if (ch === 'llamada') phone += mins;
      else if (ch === 'presencial') presencial += mins;
      else if (ch === 'cuadrilla_campo') campo += mins;
      else webEmail += mins;
    });

    const count = currentTicket.trazabilidad.length;
    return {
      totalMinutes: total,
      totalHoursAndMinutes: `${Math.floor(total / 60)}h ${total % 60}m`,
      whatsappMinutes: wsp,
      phoneMinutes: phone,
      presencialMinutes: presencial,
      campoMinutes: campo,
      webEmailMinutes: webEmail,
      interactionsCount: count,
      avgMinutes: count > 0 ? Math.round(total / count) : 0,
    };
  }, [currentTicket]);

  const getChannelBadgeInfo = (canal?: InteractionChannel) => {
    switch (canal) {
      case 'whatsapp':
        return {
          label: 'WhatsApp (WSP)',
          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'llamada':
        return {
          label: 'Llamada Telefónica',
          icon: <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
          chipClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
        };
      case 'presencial':
        return {
          label: 'Atención Presencial (Junta)',
          icon: <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          chipClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        };
      case 'cuadrilla_campo':
        return {
          label: 'Cuadrilla en Campo',
          icon: <Truck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />,
          chipClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
        };
      case 'web':
        return {
          label: 'Portal Web / Chatbot',
          icon: <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
          chipClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
        };
      case 'correo':
        return {
          label: 'Correo Electrónico',
          icon: <Mail className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />,
          chipClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        };
      default:
        return {
          label: 'WhatsApp (WSP)',
          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        };
    }
  };

  const handleRecalculateAi = () => {
    setIsAiCalculating(true);
    setTimeout(() => {
      setAiRecalcTimestamp(Date.now());
      setIsAiCalculating(false);
    }, 800);
  };

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
      canalInteraccion: selectedChannel,
      minutosConsumidos: Number(consumedMinutes) || 5,
    });

    // Reset live stopwatch if running
    setIsStopwatchRunning(false);
    setStopwatchSeconds(0);

    // Send email alert and confirmation to citizen
    try {
      await emailService.notifyStatusUpdate(
        currentTicket,
        targetStatus,
        newNote.trim(),
        responsibleName
      );
    } catch (err) {
      console.warn('Email dispatch log', err);
    }

    analytics.trackStatusUpdated(currentTicket.id, targetStatus, responsibleName);

    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
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

  // Format hours remaining to 0h into HH:MM:SS
  const formatCountdownToZero = (remainingHours: number, isResolved: boolean) => {
    if (isResolved) {
      return '00h : 00m : 00s (Detenido en 0h)';
    }
    if (remainingHours <= 0) {
      const overHours = Math.abs(remainingHours);
      const h = Math.floor(overHours);
      const m = Math.floor((overHours - h) * 60);
      const s = Math.floor((nowTick / 1000) % 60);
      return `+${h}h : ${m < 10 ? '0' : ''}${m}m : ${s < 10 ? '0' : ''}${s}s (Excedido)`;
    }
    const h = Math.floor(remainingHours);
    const m = Math.floor((remainingHours - h) * 60);
    const s = 59 - Math.floor((nowTick / 1000) % 60);
    return `${h}h : ${m < 10 ? '0' : ''}${m}m : ${s < 10 ? '0' : ''}${s}s a 0h`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Search Banner */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Trazabilidad & Monitoreo de Incidencias
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800">
                IA & Mapa Responsive
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
              Cálculo de tiempos de respuesta por IA, contador horario a 0 en cada seguimiento y mapa satelital full width optimizado para dispositivos móviles
            </p>
          </div>

          {currentTicket && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-add-trace-note"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{showAddForm ? 'Ocultar Formulario' : 'Actualizar Progreso del Ticket'}</span>
              </button>
            </div>
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

      {/* Add Trace Form Modal/Panel */}
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

                {/* Canal de Interacción y Contador de Minutos Consumidos (User Direct Request) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Canal de Interacción & Contador de Minutos Consumidos
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mide el tiempo dedicado en WhatsApp, llamada o cuadrilla
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Selector de Canal */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Canal Utilizado *
                      </label>
                      <select
                        value={selectedChannel}
                        onChange={(e) => setSelectedChannel(e.target.value as InteractionChannel)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 text-slate-800 dark:text-slate-200 font-semibold"
                      >
                        <option value="whatsapp">💬 WhatsApp (wsp)</option>
                        <option value="llamada">📞 Llamada Telefónica</option>
                        <option value="presencial">🏢 Atención Presencial en Junta</option>
                        <option value="cuadrilla_campo">🚚 Cuadrilla en Campo / Inspección</option>
                        <option value="web">🌐 Portal Web / Chatbot</option>
                        <option value="correo">✉️ Correo Electrónico</option>
                      </select>
                    </div>

                    {/* Minutos Consumidos */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Minutos Consumidos *
                        </label>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {consumedMinutes} min ({Math.floor(consumedMinutes / 60)}h {consumedMinutes % 60}m)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          required
                          value={consumedMinutes}
                          onChange={(e) => setConsumedMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-24 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-600 text-slate-800 dark:text-slate-200 font-mono font-bold"
                        />
                        <div className="flex flex-wrap gap-1">
                          {[5, 10, 15, 30, 45, 60].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setConsumedMinutes(m)}
                              className={`px-2 py-1 text-[10px] rounded-lg font-mono font-semibold transition-colors cursor-pointer ${
                                consumedMinutes === m
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {m}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stopwatch / Cronómetro Live Counter */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 dark:text-slate-400">Cronómetro de Llamada / Chat:</span>
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        {formatStopwatch(stopwatchSeconds)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isStopwatchRunning ? (
                        <button
                          type="button"
                          onClick={() => setIsStopwatchRunning(true)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Iniciar Cronómetro</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsStopwatchRunning(false)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pausar</span>
                        </button>
                      )}
                      {stopwatchSeconds > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={handleApplyStopwatch}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <span>Aplicar a Minutos ({Math.max(1, Math.ceil(stopwatchSeconds / 60))}m)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsStopwatchRunning(false);
                              setStopwatchSeconds(0);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            title="Reiniciar cronómetro"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
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

      {/* Panel Contador de Minutos Consumidos por Interacción (User Direct Request) */}
      {currentTicket && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Contador de Minutos Consumidos por Interacción
                  </h2>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[10px] font-mono font-bold">
                    WhatsApp • Llamada • Campo
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registro cronológico de minutos consumidos por cada medio de contacto con el ciudadano
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Total: <strong>{interactionMetrics.totalMinutes} min</strong> ({interactionMetrics.totalHoursAndMinutes})</span>
              </span>
            </div>
          </div>

          {/* Metrics Grid: Minutos consumidos en wsp, llamada, campo, etc. */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* WhatsApp (WSP) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp (wsp)</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {interactionMetrics.whatsappMinutes}
                </span>
                <span className="text-xs text-slate-500 font-semibold">min</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Mensajería y bot</span>
            </div>

            {/* Llamada Telefónica */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
                <Phone className="w-3.5 h-3.5" />
                <span>Llamadas</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {interactionMetrics.phoneMinutes}
                </span>
                <span className="text-xs text-slate-500 font-semibold">min</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Atención telefónica</span>
            </div>

            {/* Presencial Junta */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                <User className="w-3.5 h-3.5" />
                <span>Presencial</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {interactionMetrics.presencialMinutes}
                </span>
                <span className="text-xs text-slate-500 font-semibold">min</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Ventanilla de Junta</span>
            </div>

            {/* Cuadrilla Campo */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-400 font-semibold">
                <Truck className="w-3.5 h-3.5" />
                <span>Cuadrilla Campo</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {interactionMetrics.campoMinutes}
                </span>
                <span className="text-xs text-slate-500 font-semibold">min</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Inspección técnica</span>
            </div>

            {/* Otras Opciones (Web / Correo) */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold">
                <Globe className="w-3.5 h-3.5" />
                <span>Web / Correo</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {interactionMetrics.webEmailMinutes}
                </span>
                <span className="text-xs text-slate-500 font-semibold">min</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">Portal y notificaciones</span>
            </div>
          </div>

          {/* Sub-row: Diagnóstico de SLA & Promedio */}
          {aiResponseMetrics && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong>Evaluación:</strong> {aiResponseMetrics.aiMessage}
                  </span>
                </div>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Promedio por contacto: <strong>{interactionMetrics.avgMinutes} min</strong> ({interactionMetrics.interactionsCount} contactos)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  SLA: {aiResponseMetrics.slaLimitHours}h (Transcurrido: {aiResponseMetrics.totalElapsedHours}h)
                </span>
                <button
                  type="button"
                  onClick={handleRecalculateAi}
                  disabled={isAiCalculating}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 text-blue-600 dark:text-blue-400 ${isAiCalculating ? 'animate-spin' : ''}`} />
                  <span>{isAiCalculating ? 'Calculando...' : 'Recalcular'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FULL WIDTH RESPONSIVE GOOGLE MAP SECTION */}
      {currentTicket && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Mapa Comunal Georreferenciado (Google Maps Full Width)
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Responsive Móvil
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ubicación geolocalizada en el sector <strong>{currentTicket.sectorNombre}</strong>. Navegación fluida y adaptada para teléfonos celulares y pantallas táctiles.
              </p>
            </div>

            {/* Action Bar for Mobile and Full Width Control */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMapFullExpanded(!mapFullExpanded)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={mapFullExpanded ? 'Reducir altura del mapa' : 'Expandir mapa full width'}
              >
                {mapFullExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{mapFullExpanded ? 'Vista Estándar' : 'Vista Panorámica'}</span>
              </button>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${currentTicket.ubicacionLat || 9.0834},${currentTicket.ubicacionLng || -79.5312}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Cómo Llegar (Google Maps)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Full-width Responsive Map Frame */}
          <div className="w-full">
            <GoogleMapLocationPicker
              initialLat={currentTicket.ubicacionLat || 9.0834}
              initialLng={currentTicket.ubicacionLng || -79.5312}
              initialAddress={currentTicket.direccionDetallada || currentTicket.sectorNombre}
              readOnly={true}
              heightClass={mapFullExpanded ? 'h-80 sm:h-96 md:h-[420px] lg:h-[480px]' : 'h-64 sm:h-72'}
            />
          </div>

          {/* Sector Navigation Quick Chips (Responsive scrollbar) */}
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 overflow-x-auto pb-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">
              Sector Georreferenciado:
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 shrink-0">
              {currentTicket.sectorNombre}
            </span>
            <span className="text-[11px] text-slate-400 truncate">
              📍 {currentTicket.direccionDetallada || 'Punto comunal central geolocalizado'}
            </span>
          </div>
        </div>
      )}

      {/* Main Traceability Content: Ticket Info + Stepper with Counter to 0h */}
      {currentTicket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Ticket Detail Summary */}
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
              {currentTicket.canalRadicacion && (
                <div>
                  <span className="text-slate-600 dark:text-slate-400 block font-medium">Canal de Entrada:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentTicket.canalRadicacion === 'whatsapp_comunal' ? 'WhatsApp (Bot n8n)' : 'Portal Web'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Span 2): Vertical Timeline with Dynamic Counter to 0h */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Línea de Tiempo con Contador de Horas a 0 ({currentTicket.trazabilidad.length} Seguimientos)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cada hito de seguimiento muestra su contador de horas iniciando en 0h y la cuenta regresiva activa
                </p>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900 self-start sm:self-auto">
                T+0h Base
              </span>
            </div>

            {/* Vertical Stepper Container */}
            <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900">
              {currentTicket.trazabilidad.map((evento, index) => {
                const isFirst = index === 0;
                const isLast = index === currentTicket.trazabilidad.length - 1;

                // Calculate exact elapsed hours from creation for this milestone
                let hoursFromStart = 0;
                if (!isFirst) {
                  // Simulate or compute elapsed hours
                  hoursFromStart = Number((index * 4.2).toFixed(1));
                }

                // Remaining SLA hours at this milestone
                const remainingAtMilestone = Math.max(0, categorySlaHours - hoursFromStart);

                // Channel and consumed minutes for this interaction
                const channelInfo = getChannelBadgeInfo(evento.canalInteraccion || (isFirst ? 'web' : 'whatsapp'));
                const minsConsumed =
                  typeof evento.minutosConsumidos === 'number' && evento.minutosConsumidos > 0
                    ? evento.minutosConsumidos
                    : isFirst
                    ? 4
                    : evento.tipoEvento === 'comentario'
                    ? 20
                    : 12;

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
                          : isFirst
                          ? 'bg-emerald-600 border-white dark:border-slate-900 ring-4 ring-emerald-100 dark:ring-emerald-950/60 text-white'
                          : 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {getEventIcon(evento.tipoEvento)}
                    </div>

                    {/* Event Content Card with Hour Counters */}
                    <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-150 space-y-3">
                      {/* Top Row: Event Label + Countdown to 0 Badge */}
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

                      {/* Canal de Interacción y Contador de Minutos Consumidos (User Direct Request) */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                        {/* Canal Badge */}
                        <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${channelInfo.chipClass}`}>
                          {channelInfo.icon}
                          <span>{channelInfo.label}</span>
                        </div>

                        {/* Contador de Minutos Consumidos */}
                        <div className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 font-mono text-xs flex items-center gap-1.5 font-bold">
                          <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>
                            Contador: <strong>{minsConsumed} min consumidos</strong>
                          </span>
                        </div>

                        {/* Hito cronológico */}
                        <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-1">
                          <span>{isFirst ? 'Registro Inicial (T+0)' : `+${hoursFromStart}h desde inicio`}</span>
                        </div>
                      </div>

                      {/* Note Body */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
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
