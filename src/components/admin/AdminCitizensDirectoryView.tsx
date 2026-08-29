import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  MessageSquare,
  MapPin,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ExternalLink,
  Shield,
  Download,
  Filter,
  UserCheck,
  Send,
  Sparkles,
  PhoneCall,
  User as UserIcon,
  ChevronRight,
  ChevronDown,
  Building2,
  Calendar,
  X,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Ticket, User, TicketStatus } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';

interface AdminCitizensDirectoryViewProps {
  tickets: Ticket[];
  currentUser?: User | null;
  onNavigateToTrace?: (ticketId: string) => void;
  onAddTraceNote?: (ticketId: string, note: string, eventType?: any, newStatus?: TicketStatus) => void;
}

interface CitizenAggregate {
  nombre: string;
  cedula: string;
  telefono?: string;
  email?: string;
  genero: string;
  edad: number;
  sectorPrincipal: string;
  direccionPrincipal: string;
  tickets: Ticket[];
  totalTickets: number;
  ticketsAbiertos: number;
  ticketsEnProgreso: number;
  ticketsResueltos: number;
  ultimoTicket: Ticket;
  fechaUltimoReporte: string;
  tieneTelefonoValido: boolean;
}

export const AdminCitizensDirectoryView: React.FC<AdminCitizensDirectoryViewProps> = ({
  tickets,
  currentUser,
  onNavigateToTrace,
  onAddTraceNote,
}) => {
  const isSuperiorAdmin = currentUser?.rol === 'administrador' || currentUser?.rol === 'supervisor';

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'todos' | 'con_abiertos' | 'con_en_progreso' | 'solo_resueltos'>('todos');
  const [phoneFilterOnly, setPhoneFilterOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recientes' | 'nombre' | 'mas_reportes' | 'sector'>('recientes');
  const [expandedCitizenId, setExpandedCitizenId] = useState<string | null>(null);

  // Quick WhatsApp Composer Modal State
  const [whatsappModalData, setWhatsappModalData] = useState<{
    citizen: CitizenAggregate;
    selectedTicket: Ticket;
    customMessage: string;
    templateType: 'inspeccion' | 'en_progreso' | 'resuelto' | 'general' | 'personalizado';
  } | null>(null);

  // Quick Note Log Modal State
  const [noteModalData, setNoteModalData] = useState<{
    ticket: Ticket;
    citizenName: string;
    noteText: string;
    contactChannel: 'whatsapp' | 'llamada' | 'presencial';
  } | null>(null);

  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // 1. Group tickets into unique citizens
  const citizensList = useMemo<CitizenAggregate[]>(() => {
    const map = new Map<string, CitizenAggregate>();

    // Process all tickets
    tickets.forEach((t) => {
      const rep = t.reportante;
      const key = (rep.cedula && rep.cedula.trim().length > 3)
        ? rep.cedula.trim().toLowerCase()
        : rep.nombre.trim().toLowerCase();

      const phoneRaw = rep.telefono || '';
      const cleanPhone = phoneRaw.replace(/[^0-9+]/g, '');
      const hasValidPhone = cleanPhone.length >= 7;

      if (!map.has(key)) {
        map.set(key, {
          nombre: rep.nombre,
          cedula: rep.cedula || 'No registrada',
          telefono: rep.telefono,
          email: rep.email,
          genero: rep.genero || 'otro',
          edad: rep.edad || 0,
          sectorPrincipal: t.sectorNombre || rep.sector || 'Ernesto Córdoba Campos',
          direccionPrincipal: t.direccionDetallada || 'Sector comunal',
          tickets: [t],
          totalTickets: 1,
          ticketsAbiertos: t.estado === 'abierto' ? 1 : 0,
          ticketsEnProgreso: t.estado === 'en_progreso' ? 1 : 0,
          ticketsResueltos: (t.estado === 'resuelto' || t.estado === 'cerrado') ? 1 : 0,
          ultimoTicket: t,
          fechaUltimoReporte: `${t.fechaCreacion} ${t.horaCreacion}`,
          tieneTelefonoValido: hasValidPhone,
        });
      } else {
        const item = map.get(key)!;
        item.tickets.push(t);
        item.totalTickets += 1;
        if (t.estado === 'abierto') item.ticketsAbiertos += 1;
        if (t.estado === 'en_progreso') item.ticketsEnProgreso += 1;
        if (t.estado === 'resuelto' || t.estado === 'cerrado') item.ticketsResueltos += 1;

        // Keep most recent phone or address if available
        if (!item.telefono && rep.telefono) item.telefono = rep.telefono;
        if (hasValidPhone) item.tieneTelefonoValido = true;
        if (!item.email && rep.email) item.email = rep.email;

        // Compare dates to set latest ticket
        const currentDate = new Date(`${t.fechaCreacion}T${t.horaCreacion || '00:00'}`);
        const prevDate = new Date(`${item.ultimoTicket.fechaCreacion}T${item.ultimoTicket.horaCreacion || '00:00'}`);
        if (currentDate >= prevDate) {
          item.ultimoTicket = t;
          item.fechaUltimoReporte = `${t.fechaCreacion} ${t.horaCreacion}`;
          item.sectorPrincipal = t.sectorNombre;
          if (t.direccionDetallada) item.direccionPrincipal = t.direccionDetallada;
        }
      }
    });

    return Array.from(map.values());
  }, [tickets]);

  // 2. Filter & Sort Citizens
  const filteredCitizens = useMemo(() => {
    return citizensList.filter((c) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = c.nombre.toLowerCase().includes(q);
        const matchPhone = (c.telefono || '').toLowerCase().includes(q);
        const matchCedula = c.cedula.toLowerCase().includes(q);
        const matchSector = c.sectorPrincipal.toLowerCase().includes(q);
        const matchAddress = c.direccionPrincipal.toLowerCase().includes(q);
        const matchAnyTicket = c.tickets.some(
          (t) =>
            t.numeroRegistro.toLowerCase().includes(q) ||
            t.asunto.toLowerCase().includes(q) ||
            t.categoriaNombre.toLowerCase().includes(q)
        );

        if (!matchName && !matchPhone && !matchCedula && !matchSector && !matchAddress && !matchAnyTicket) {
          return false;
        }
      }

      // Sector filter
      if (selectedSector !== 'todos' && c.sectorPrincipal !== selectedSector) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === 'con_abiertos' && c.ticketsAbiertos === 0) return false;
      if (selectedStatusFilter === 'con_en_progreso' && c.ticketsEnProgreso === 0) return false;
      if (selectedStatusFilter === 'solo_resueltos' && (c.ticketsAbiertos > 0 || c.ticketsEnProgreso > 0)) return false;

      // Phone only filter
      if (phoneFilterOnly && !c.tieneTelefonoValido) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'recientes') {
        return new Date(b.fechaUltimoReporte).getTime() - new Date(a.fechaUltimoReporte).getTime();
      }
      if (sortBy === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      }
      if (sortBy === 'mas_reportes') {
        return b.totalTickets - a.totalTickets;
      }
      if (sortBy === 'sector') {
        return a.sectorPrincipal.localeCompare(b.sectorPrincipal);
      }
      return 0;
    });
  }, [citizensList, searchTerm, selectedSector, selectedStatusFilter, phoneFilterOnly, sortBy]);

  // Overall Directory Statistics
  const stats = useMemo(() => {
    const totalCitizens = citizensList.length;
    const withValidPhone = citizensList.filter((c) => c.tieneTelefonoValido).length;
    const withPendingIssues = citizensList.filter((c) => c.ticketsAbiertos > 0).length;
    const totalReports = tickets.length;
    return {
      totalCitizens,
      withValidPhone,
      withPendingIssues,
      totalReports,
      phoneCoveragePct: totalCitizens ? Math.round((withValidPhone / totalCitizens) * 100) : 0,
    };
  }, [citizensList, tickets]);

  // Helper to normalize phone number for Panama / International WhatsApp
  const formatWhatsAppUrl = (phoneRaw: string | undefined, message: string) => {
    if (!phoneRaw) return '';
    // Strip all non-numeric characters
    let clean = phoneRaw.replace(/[^0-9]/g, '');
    // If it is an 8-digit Panamanian phone (e.g. 68214490), add country code 507
    if (clean.length === 8) {
      clean = '507' + clean;
    }
    const encoded = encodeURIComponent(message);
    return `https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  };

  // Helper to normalize phone for direct calling
  const formatTelUrl = (phoneRaw: string | undefined) => {
    if (!phoneRaw) return '';
    const clean = phoneRaw.replace(/[^0-9+]/g, '');
    return `tel:${clean}`;
  };

  // Build message templates based on ticket and citizen
  const getTemplateMessage = (
    template: 'inspeccion' | 'en_progreso' | 'resuelto' | 'general' | 'personalizado',
    citizen: CitizenAggregate,
    ticket: Ticket
  ) => {
    const catName = ticket.categoriaNombre || 'su incidencia';
    const sector = ticket.sectorNombre || citizen.sectorPrincipal;

    switch (template) {
      case 'inspeccion':
        return `Hola ${citizen.nombre}, le saludamos de la Junta Comunal de Ernesto Córdoba Campos en seguimiento a su reporte ${ticket.numeroRegistro} sobre ${catName} en ${sector}.\n\nUna cuadrilla técnica está programando una visita de inspección en su área. ¿Podría confirmarnos si estará disponible o si requiere darnos alguna referencia adicional del lugar? Muchas gracias.`;
      case 'en_progreso':
        return `Estimado/a ${citizen.nombre}, le informamos que su reporte ${ticket.numeroRegistro} (${catName}) en ${sector} ya se encuentra en fase de atención activa por el equipo correspondiente. Le mantendremos informado/a de los avances. Atentamente, Junta Comunal.`;
      case 'resuelto':
        return `Buenas tardes ${citizen.nombre}, le escribimos de la Junta Comunal de Ernesto Córdoba Campos para notificarle que los trabajos correspondientes a su reporte ${ticket.numeroRegistro} (${catName}) han sido completados con éxito.\n\nAgradecemos su reporte ciudadano para la mejora continua de nuestra comunidad. ¡Que tenga un excelente día!`;
      case 'general':
      default:
        return `Hola ${citizen.nombre}, le contactamos desde la administración municipal respecto a su reporte registrado con el código ${ticket.numeroRegistro} (${ticket.asunto}). ¿En qué más podemos asistirle o brindarle apoyo?`;
    }
  };

  // Open WhatsApp Composer
  const handleOpenWhatsAppModal = (citizen: CitizenAggregate, ticket?: Ticket) => {
    const targetTicket = ticket || citizen.ultimoTicket;
    const initialTemplate = 'inspeccion';
    const message = getTemplateMessage(initialTemplate, citizen, targetTicket);

    setWhatsappModalData({
      citizen,
      selectedTicket: targetTicket,
      customMessage: message,
      templateType: initialTemplate,
    });
  };

  // Update Template in modal
  const handleSelectTemplate = (template: 'inspeccion' | 'en_progreso' | 'resuelto' | 'general' | 'personalizado') => {
    if (!whatsappModalData) return;
    const msg = getTemplateMessage(template, whatsappModalData.citizen, whatsappModalData.selectedTicket);
    setWhatsappModalData({
      ...whatsappModalData,
      templateType: template,
      customMessage: msg,
    });
  };

  // Trigger WhatsApp and log trace note
  const handleLaunchWhatsApp = () => {
    if (!whatsappModalData || !whatsappModalData.citizen.telefono) return;
    const url = formatWhatsAppUrl(whatsappModalData.citizen.telefono, whatsappModalData.customMessage);

    // Open WhatsApp in new tab
    window.open(url, '_blank', 'noopener,noreferrer');

    // Auto log note to ticket if handler provided
    if (onAddTraceNote) {
      const note = `[Contacto WhatsApp] Se envió mensaje al ciudadano ${whatsappModalData.citizen.nombre} (${whatsappModalData.citizen.telefono}). Plantilla: ${whatsappModalData.templateType.toUpperCase()}.`;
      onAddTraceNote(whatsappModalData.selectedTicket.id, note, 'comentario');
    }

    setNotificationBanner(`Enlace de WhatsApp abierto para ${whatsappModalData.citizen.nombre}. Se registró la gestión en la trazabilidad del ticket ${whatsappModalData.selectedTicket.numeroRegistro}.`);
    setWhatsappModalData(null);
    setTimeout(() => setNotificationBanner(null), 6000);
  };

  // Export Directory to CSV
  const handleExportCSV = () => {
    const headers = [
      'Nombre Ciudadano',
      'Cédula',
      'Teléfono',
      'Email',
      'Sector Principal',
      'Dirección Principal',
      'Total Reportes',
      'Reportes Abiertos',
      'Reportes En Progreso',
      'Reportes Resueltos',
      'Último Ticket',
      'Fecha Último Reporte',
    ];

    const rows = filteredCitizens.map((c) => [
      `"${c.nombre.replace(/"/g, '""')}"`,
      `"${c.cedula}"`,
      `"${c.telefono || 'Sin teléfono'}"`,
      `"${c.email || ''}"`,
      `"${c.sectorPrincipal}"`,
      `"${c.direccionPrincipal.replace(/"/g, '""')}"`,
      c.totalTickets,
      c.ticketsAbiertos,
      c.ticketsEnProgreso,
      c.ticketsResueltos,
      `"${c.ultimoTicket.numeroRegistro}"`,
      `"${c.fechaUltimoReporte}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Directorio_Ciudadanos_Ernesto_Cordoba_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save manual contact note
  const handleSaveContactNote = () => {
    if (!noteModalData || !noteModalData.noteText.trim() || !onAddTraceNote) return;

    const channelLabel =
      noteModalData.contactChannel === 'whatsapp'
        ? 'WhatsApp'
        : noteModalData.contactChannel === 'llamada'
        ? 'Llamada Telefónica'
        : 'Atención Presencial';

    const fullNote = `[Contacto Directo - ${channelLabel}] Administrador contactó a ${noteModalData.citizenName}: ${noteModalData.noteText.trim()}`;

    onAddTraceNote(noteModalData.ticket.id, fullNote, 'comentario');

    setNotificationBanner(`Nota de contacto registrada con éxito en el ticket ${noteModalData.ticket.numeroRegistro}.`);
    setNoteModalData(null);
    setTimeout(() => setNotificationBanner(null), 5000);
  };

  return (
    <div id="admin-citizens-directory-view" className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Banner Notice if any */}
      {notificationBanner && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl shadow-sm text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{notificationBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationBanner(null)}
            className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Directorio Ciudadano & Enlace Directo
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  WhatsApp & Llamadas
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Padrón administrativo de ciudadanos reportantes con ubicación en Ernesto Córdoba Campos y acceso a contacto directo.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="btn-export-citizens-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 shadow-xs cursor-pointer transition-all"
            title="Exportar listado a Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar Directorio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Card 1: Total Citizens */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ciudadanos Registrados</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stats.totalCitizens}</p>
          </div>
        </div>

        {/* Card 2: WhatsApp Ready */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Con Teléfono / WhatsApp</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.withValidPhone}</span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">({stats.phoneCoveragePct}%)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Citizen Inquiries */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60">
            <Clock3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Con Casos Pendientes</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stats.withPendingIssues}</p>
          </div>
        </div>

        {/* Card 4: Total Incidents Linked */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/60">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Incidencias Vinculadas</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{stats.totalReports}</p>
          </div>
        </div>
      </div>

      {/* Search & Control Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Main Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="input-search-citizens"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nombre, Teléfono, Ubicación, Cédula o Ticket..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Sector Selector */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">📍 Todos los Sectores</option>
              {SECTORES_RESIDENCIA.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            {/* Status of citizen's tickets */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="todos">Todos los Estados</option>
              <option value="con_abiertos">🔴 Con Casos Abiertos</option>
              <option value="con_en_progreso">🟡 Con Casos En Progreso</option>
              <option value="solo_resueltos">🟢 Solo Casos Resueltos</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="recientes">📅 Más Recientes</option>
              <option value="nombre">🔤 Nombre (A - Z)</option>
              <option value="mas_reportes">🔥 Mayor N° Reportes</option>
              <option value="sector">📍 Por Sector</option>
            </select>

            {/* Toggle Only Valid Phone */}
            <button
              type="button"
              onClick={() => setPhoneFilterOnly(!phoneFilterOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                phoneFilterOnly
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Solo con Teléfono</span>
            </button>
          </div>
        </div>

        {/* Filter Results Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Mostrando <strong>{filteredCitizens.length}</strong> ciudadanos de {stats.totalCitizens} registrados
          </span>
          {(searchTerm || selectedSector !== 'todos' || selectedStatusFilter !== 'todos' || phoneFilterOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSector('todos');
                setSelectedStatusFilter('todos');
                setPhoneFilterOnly(false);
              }}
              className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Citizens Directory Main Cards/List */}
      {filteredCitizens.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No se encontraron ciudadanos</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            No hay registros que coincidan con los criterios de búsqueda o filtros seleccionados. Intenta restablecer los filtros.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredCitizens.map((citizen, idx) => {
            const isExpanded = expandedCitizenId === citizen.cedula;
            const hasPhone = citizen.tieneTelefonoValido;
            const latestTicket = citizen.ultimoTicket;
            const category = CATEGORIAS_SISTEMA.find((c) => c.id === latestTicket.categoriaId);

            return (
              <div
                key={citizen.cedula + '-' + idx}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 ${
                  isExpanded
                    ? 'border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                {/* Main Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Citizen Identity & Demographics */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Avatar Circle */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {citizen.nombre
                        .split(' ')
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>

                    {/* Name, Cedula, Sector & Phone */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-base text-slate-950 dark:text-slate-50 truncate">
                          {citizen.nombre}
                        </h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                          {citizen.cedula}
                        </span>
                        {citizen.edad > 0 && (
                          <span className="text-[11px] text-slate-400 font-medium">
                            {citizen.edad} años ({citizen.genero})
                          </span>
                        )}
                      </div>

                      {/* Location & Address */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{citizen.sectorPrincipal}</span>
                        </span>
                        <span className="text-slate-400 hidden sm:inline">&bull;</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                          {citizen.direccionPrincipal}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phone & Contact Badges */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                    {/* Phone Display Box */}
                    <div className="flex items-center gap-2">
                      {hasPhone ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs font-bold">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{citizen.telefono}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Sin teléfono registrado</span>
                        </div>
                      )}
                    </div>

                    {/* Direct Contact Buttons (WhatsApp + Call) */}
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Direct */}
                      <button
                        type="button"
                        id={`btn-whatsapp-${idx}`}
                        disabled={!hasPhone}
                        onClick={() => handleOpenWhatsAppModal(citizen, latestTicket)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs ${
                          hasPhone
                            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                        title={hasPhone ? `Enviar mensaje de WhatsApp a ${citizen.nombre}` : 'No tiene teléfono registrado'}
                      >
                        <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      {/* Direct Tel: Call */}
                      {hasPhone && (
                        <a
                          id={`btn-call-${idx}`}
                          href={formatTelUrl(citizen.telefono)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer transition-all shadow-xs active:scale-95"
                          title={`Llamar a ${citizen.telefono}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Llamar</span>
                        </a>
                      )}

                      {/* Expand / Collapse Ticket History */}
                      <button
                        type="button"
                        onClick={() => setExpandedCitizenId(isExpanded ? null : citizen.cedula)}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isExpanded
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50'
                        }`}
                        title={isExpanded ? 'Ocultar historial de reportes' : 'Ver reportes e incidencias'}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-bar: Summary of incident status */}
                <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Latest Ticket Glance */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Último Reporte:</span>
                    <button
                      type="button"
                      onClick={() => onNavigateToTrace && onNavigateToTrace(latestTicket.id)}
                      className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>{latestTicket.numeroRegistro}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px] sm:max-w-xs font-medium">
                      {latestTicket.asunto}
                    </span>
                  </div>

                  {/* Badges Counts */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Total: <strong>{citizen.totalTickets}</strong>
                    </span>
                    {citizen.ticketsAbiertos > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                        {citizen.ticketsAbiertos} Abierto{citizen.ticketsAbiertos > 1 ? 's' : ''}
                      </span>
                    )}
                    {citizen.ticketsEnProgreso > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {citizen.ticketsEnProgreso} En Progreso
                      </span>
                    )}
                    {citizen.ticketsResueltos > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {citizen.ticketsResueltos} Resuelto{citizen.ticketsResueltos > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details: All Tickets registered by this Citizen */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Historial Completo de Incidencias Radicadas ({citizen.tickets.length})</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Haga clic en un ticket para abrir trazabilidad o redactar WhatsApp contextual
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {citizen.tickets.map((t) => {
                        const cat = CATEGORIAS_SISTEMA.find((c) => c.id === t.categoriaId);
                        let statusBadgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                        if (t.estado === 'abierto') statusBadgeColor = 'bg-red-100 text-red-800 border-red-200';
                        if (t.estado === 'en_progreso') statusBadgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
                        if (t.estado === 'resuelto') statusBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                        if (t.estado === 'cerrado') statusBadgeColor = 'bg-slate-100 text-slate-800 border-slate-200';

                        return (
                          <div
                            key={t.id}
                            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                                  {t.numeroRegistro}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${statusBadgeColor}`}>
                                  {t.estado.replace('_', ' ')}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {t.fechaCreacion} {t.horaCreacion}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                              {t.asunto}
                            </p>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {t.descripcion}
                            </p>

                            {/* Ticket Footer with Quick Actions */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[140px]">
                                📍 {t.sectorNombre}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {hasPhone && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenWhatsAppModal(citizen, t)}
                                    className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 text-[11px] cursor-pointer flex items-center gap-1"
                                  >
                                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                                    <span>WhatsApp</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    setNoteModalData({
                                      ticket: t,
                                      citizenName: citizen.nombre,
                                      noteText: '',
                                      contactChannel: 'whatsapp',
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 text-[11px] cursor-pointer"
                                  title="Registrar nota de llamada/contacto"
                                >
                                  + Bitácora
                                </button>

                                {onNavigateToTrace && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToTrace(t.id)}
                                    className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 text-[11px] cursor-pointer flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>Trazabilidad</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Quick WhatsApp Message Composer with Templates */}
      {whatsappModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
                  <MessageSquare className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Contacto WhatsApp Directo</h3>
                  <p className="text-xs text-emerald-100">
                    Mensaje oficial para {whatsappModalData.citizen.nombre} ({whatsappModalData.citizen.telefono})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappModalData(null)}
                className="p-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Ticket Context Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Reporte Referenciado:</span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{whatsappModalData.selectedTicket.numeroRegistro}</span>
                    <span>&bull;</span>
                    <span className="truncate max-w-xs">{whatsappModalData.selectedTicket.asunto}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  {whatsappModalData.selectedTicket.sectorNombre}
                </span>
              </div>

              {/* Template Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seleccionar Plantilla de Comunicación:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('inspeccion')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      whatsappModalData.templateType === 'inspeccion'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🛠️ Inspección
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('en_progreso')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      whatsappModalData.templateType === 'en_progreso'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ⏳ En Progreso
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('resuelto')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      whatsappModalData.templateType === 'resuelto'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ✅ Concluido
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate('general')}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      whatsappModalData.templateType === 'general'
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-400 text-emerald-800 dark:text-emerald-200 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    💬 General
                  </button>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mensaje a enviar (Puedes editarlo libremente antes de enviar):
                </label>
                <textarea
                  rows={5}
                  value={whatsappModalData.customMessage}
                  onChange={(e) =>
                    setWhatsappModalData({
                      ...whatsappModalData,
                      customMessage: e.target.value,
                      templateType: 'personalizado',
                    })
                  }
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWhatsappModalData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Abrir WhatsApp & Registrar Bitácora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Note Log in Ticket Traceability */}
      {noteModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Registrar Bitácora de Contacto</h3>
              </div>
              <button
                type="button"
                onClick={() => setNoteModalData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-500">
                Ticket: <strong className="text-slate-900 dark:text-slate-100">{noteModalData.ticket.numeroRegistro}</strong> -{' '}
                {noteModalData.ticket.asunto}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canal de Contacto:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNoteModalData({ ...noteModalData, contactChannel: 'whatsapp' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      noteModalData.contactChannel === 'whatsapp'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteModalData({ ...noteModalData, contactChannel: 'llamada' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      noteModalData.contactChannel === 'llamada'
                        ? 'bg-blue-50 border-blue-400 text-blue-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Llamada Telefónica
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteModalData({ ...noteModalData, contactChannel: 'presencial' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                      noteModalData.contactChannel === 'presencial'
                        ? 'bg-purple-50 border-purple-400 text-purple-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    Presencial
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Resumen de la conversación / acuerdo:
                </label>
                <textarea
                  rows={4}
                  value={noteModalData.noteText}
                  onChange={(e) => setNoteModalData({ ...noteModalData, noteText: e.target.value })}
                  placeholder="Ej: Se acordó visita de inspección para mañana a las 10:00 AM con cuadrilla de alumbrado..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveContactNote}
                disabled={!noteModalData.noteText.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                Guardar en Trazabilidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
