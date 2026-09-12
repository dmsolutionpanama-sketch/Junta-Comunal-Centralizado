import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Search,
  Plus,
  LogIn,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  FileText,
  AlertTriangle,
  ArrowRight,
  Filter,
  Eye,
  Check,
  Building2,
  Calendar,
  Sparkles,
  Zap,
  Droplets,
  TreePine,
  HeartHandshake,
  FileCheck,
  Trophy,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  Phone,
  HelpCircle,
  ExternalLink,
  Shield,
  LayoutDashboard,
  Copy,
  PieChart as PieChartIcon,
  BarChart3,
  X,
  User,
  Mail,
} from 'lucide-react';
import { Ticket, CreateTicketInput, TicketStatus } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { useTheme } from '../../context/ThemeContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { InstitutionalBanner } from './InstitutionalBanner';
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
  Legend,
} from 'recharts';

interface CitizenIndexViewProps {
  tickets: Ticket[];
  onGoToLogin: () => void;
  onOpenNewTicketModal: () => void;
  onCreateTicketDirect: (ticketInput: CreateTicketInput) => Promise<boolean>;
}

export type CitizenTab = 'desempeno-sector' | 'estado-global' | 'listado-tickets';

export const CitizenIndexView: React.FC<CitizenIndexViewProps> = ({
  tickets,
  onGoToLogin,
  onOpenNewTicketModal,
  onCreateTicketDirect,
}) => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Primary active tab requested by user:
  // 1) Desempeño por área de servicio y atención comunitaria por sector
  // 2) Estado global (los gráficos)
  // 3) Listado de tickets (con paginación 10, 25, 50)
  const [activeTab, setActiveTab] = useState<CitizenTab>('desempeno-sector');

  // Search & Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Pagination for Tickets List Tab (10, 25, 50 as requested)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listStatusFilter, setListStatusFilter] = useState<string>('todos');

  // Direct Public Report Form State
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [citizenName, setCitizenName] = useState('');
  const [citizenCedula, setCitizenCedula] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenSector, setCitizenSector] = useState(SECTORES_RESIDENCIA[0]);
  const [codigoRegistroEnsa, setCodigoRegistroEnsa] = useState('');
  const [canalNotificacionCopia, setCanalNotificacionCopia] = useState<'email' | 'whatsapp' | 'ambos' | 'ninguno'>('ambos');
  const [reportAsunto, setReportAsunto] = useState('');
  const [reportCategoriaId, setReportCategoriaId] = useState(CATEGORIAS_SISTEMA[0].id);
  const [reportDescripcion, setReportDescripcion] = useState('');
  const [reportDireccion, setReportDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = tickets.length;
    const resueltos = tickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
    const enProgreso = tickets.filter((t) => t.estado === 'en_progreso').length;
    const abiertos = tickets.filter((t) => t.estado === 'abierto').length;
    const porcentajeResueltos = total > 0 ? Math.round((resueltos / total) * 100) : 0;

    // By Category
    const porCategoria = CATEGORIAS_SISTEMA.map((cat) => {
      const catTickets = tickets.filter((t) => t.categoriaId === cat.id);
      const catResueltos = catTickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
      return {
        id: cat.id,
        nombre: cat.nombre,
        color: cat.color,
        icono: cat.icono,
        total: catTickets.length,
        resueltos: catResueltos,
        pendientes: catTickets.length - catResueltos,
        porcentaje: catTickets.length > 0 ? Math.round((catResueltos / catTickets.length) * 100) : 0,
      };
    });

    // By Sector
    const sectorCounts = SECTORES_RESIDENCIA.map((sec) => {
      const secTickets = tickets.filter((t) => t.sectorNombre === sec);
      const secResueltos = secTickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
      return {
        nombre: sec,
        total: secTickets.length,
        resueltos: secResueltos,
        enProgreso: secTickets.filter((t) => t.estado === 'en_progreso').length,
      };
    }).filter((s) => s.total > 0).sort((a, b) => b.total - a.total);

    // Status Pie Data
    const statusData = [
      { name: 'Resueltos / Cerrados', value: resueltos, color: '#10B981' },
      { name: 'En Progreso / Cuadrilla', value: enProgreso, color: '#F59E0B' },
      { name: 'Abiertos / Por Asignar', value: abiertos, color: '#3B82F6' },
    ].filter((item) => item.value > 0);

    // Category Bar Data
    const categoryBarData = porCategoria.map((cat) => ({
      name: cat.nombre.length > 14 ? cat.nombre.substring(0, 12) + '...' : cat.nombre,
      fullName: cat.nombre,
      total: cat.total,
      resueltos: cat.resueltos,
      color: cat.color,
    }));

    return {
      total,
      resueltos,
      enProgreso,
      abiertos,
      porcentajeResueltos,
      porCategoria,
      sectorCounts,
      statusData,
      categoryBarData,
    };
  }, [tickets]);

  // Filtered Tickets for List Tab
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.numeroRegistro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.asunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.sectorNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.categoriaNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ticket.codigoRegistroEnsa && ticket.codigoRegistroEnsa.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = !selectedCategory || ticket.categoriaId === selectedCategory;
      const matchesSector = !selectedSector || ticket.sectorNombre === selectedSector;
      const matchesStatus =
        listStatusFilter === 'todos' ||
        (listStatusFilter === 'resueltos' && (ticket.estado === 'resuelto' || ticket.estado === 'cerrado')) ||
        (listStatusFilter === 'en_progreso' && ticket.estado === 'en_progreso') ||
        (listStatusFilter === 'abiertos' && ticket.estado === 'abierto');

      return matchesSearch && matchesCategory && matchesSector && matchesStatus;
    });
  }, [tickets, searchQuery, selectedCategory, selectedSector, listStatusFilter]);

  // Pagination Math
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTickets.slice(startIndex, startIndex + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSector, listStatusFilter, pageSize]);

  // Copy Ticket Code helper
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Submit direct citizen report
  const handleDirectReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!citizenName.trim() || !citizenPhone.trim() || !reportAsunto.trim() || !reportDescripcion.trim()) {
      setFormError('Por favor complete todos los campos obligatorios (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoriaObj = CATEGORIAS_SISTEMA.find((c) => c.id === reportCategoriaId);
      const numeroRegistroGenerado = `TK-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;

      const newTicketInput: CreateTicketInput = {
        asunto: reportAsunto.trim(),
        descripcion: reportDescripcion.trim(),
        categoriaId: reportCategoriaId,
        categoriaNombre: categoriaObj?.nombre || 'General',
        prioridad: 'media',
        sectorNombre: citizenSector,
        direccionDetallada: reportDireccion.trim() || citizenSector,
        codigoRegistroEnsa: reportCategoriaId === 'cat-1' ? codigoRegistroEnsa.trim() : undefined,
        canalNotificacionCopia: canalNotificacionCopia,
        reportante: {
          nombre: citizenName.trim(),
          cedula: citizenCedula.trim() || 'N/A',
          telefono: citizenPhone.trim(),
          email: citizenEmail.trim() || undefined,
          genero: 'otro',
          edad: 35,
          sector: citizenSector,
        },
      };

      const success = await onCreateTicketDirect(newTicketInput);
      if (success) {
        setCreatedTicketCode(numeroRegistroGenerado);
        // Reset inputs
        setReportAsunto('');
        setReportDescripcion('');
        setReportDireccion('');
        setCodigoRegistroEnsa('');
      } else {
        setFormError('No se pudo radicar el ticket. Intente nuevamente.');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error inesperado al radicar el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (estado: TicketStatus) => {
    switch (estado) {
      case 'abierto':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Abierto
          </span>
        );
      case 'en_progreso':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            En Progreso
          </span>
        );
      case 'resuelto':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Resuelto
          </span>
        );
      case 'cerrado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Cerrado
          </span>
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 font-sans ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* 1. BANNER INSTITUCIONAL FULL-WIDTH Y AJUSTABLE EN ALTURA (VIDEO YOUTUBE O FOTO SLIDE) */}
      <InstitutionalBanner />

      {/* 2. ENCABEZADO INSTITUCIONAL CON NOMBRE */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between transition-colors ${
          isDarkMode
            ? 'bg-slate-900/95 border-slate-800 text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-blue-600 dark:text-blue-400">
                Junta Comunal
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                Atención Ciudadana
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gestión Comunitaria de Incidencias & Obras Comunitarias
            </p>
          </div>
        </div>

        {/* Right Actions: Dark Mode & Staff Login */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 border-slate-700 text-amber-400'
                : 'bg-white border-slate-200 text-slate-600'
            }`}
            title="Cambiar tema claro/oscuro"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            id="btn-public-login"
            onClick={onGoToLogin}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Acceso Funcionarios</span>
          </button>
        </div>
      </header>

      {/* 3. LUEGO DEL NOMBRE: SOLO EL SEARCH DE TICKETS Y EL FORM PARA CREAR REPORTE */}
      <section className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 pb-4 space-y-6">
        {/* A. SEARCH DE TICKETS PROMINENTE */}
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-lg shadow-blue-500/5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Consulta Rápida de Tickets de Incidencia</span>
            </label>
            <span className="text-[11px] text-slate-400">
              Seguimiento vecinal en tiempo real
            </span>
          </div>

          <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 p-1 focus-within:border-blue-600 transition-all">
            <Search className="w-4 h-4 text-blue-600 ml-2.5 shrink-0" />
            <input
              type="text"
              id="citizen-ticket-search-box"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Ingrese código (Ej: TK-2025-001), sector, alumbrado o palabra clave..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-transparent border-none outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 text-xs font-bold mr-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick matches alert if searched */}
          {searchQuery.trim() && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Coincidencias encontradas ({filteredTickets.length}):</span>
                {filteredTickets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('listado-tickets')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Ver en listado completo →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {filteredTickets.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center justify-between text-xs cursor-pointer transition-all shadow-xs"
                  >
                    <div className="truncate mr-2">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {t.numeroRegistro}
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {t.asunto}
                      </div>
                    </div>
                    {getStatusBadge(t.estado)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* B. FORMULARIO PARA CREAR UN REPORTE DE INCIDENCIA */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Formulario de Registro de Incidencias Ciudadanas
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Radique su reporte comunitario; las cuadrillas técnicas le darán seguimiento directo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {isFormOpen ? 'Ocultar Formulario ▲' : 'Mostrar Formulario ▼'}
            </button>
          </div>

          {/* Form Content */}
          {isFormOpen && (
            <div>
              {createdTicketCode ? (
                <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                    ¡Reporte Radicado Exitosamente!
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
                    Su incidencia ha sido registrada en el sistema de la Junta Comunal. Conserve el siguiente código de seguimiento:
                  </p>
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-xs">
                    <span className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {createdTicketCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(createdTicketCode)}
                      className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-200 cursor-pointer"
                    >
                      {copiedCode ? '¡Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div className="pt-2 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedTicketCode(null);
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-700"
                    >
                      Radicar Otro Reporte
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(createdTicketCode);
                        setActiveTab('listado-tickets');
                      }}
                      className="px-4 py-2 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-emerald-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Ver en Listado de Tickets
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDirectReportSubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Citizen Identity Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Juan Pérez"
                        value={citizenName}
                        onChange={(e) => setCitizenName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cédula de Identidad
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 8-765-4321"
                        value={citizenCedula}
                        onChange={(e) => setCitizenCedula(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej: 6123-4567"
                        value={citizenPhone}
                        onChange={(e) => setCitizenPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Correo Electrónico (Para copia)
                      </label>
                      <input
                        type="email"
                        placeholder="vecino@ejemplo.com"
                        value={citizenEmail}
                        onChange={(e) => setCitizenEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  {/* Sector, Category & ENSA */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Sector Residencial *
                      </label>
                      <select
                        value={citizenSector}
                        onChange={(e) => setCitizenSector(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      >
                        {SECTORES_RESIDENCIA.map((sec) => (
                          <option key={sec} value={sec}>
                            {sec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Área de Servicio / Incidencia *
                      </label>
                      <select
                        value={reportCategoriaId}
                        onChange={(e) => setReportCategoriaId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      >
                        {CATEGORIAS_SISTEMA.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Asunto de la Incidencia *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Luminaria apagada en calle 4ta"
                        value={reportAsunto}
                        onChange={(e) => setReportAsunto(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>
                  </div>

                  {/* If category is Alumbrado Eléctrico: ENSA Code */}
                  {reportCategoriaId === 'cat-1' && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Código de Registro Previo en ENSA (Opcional - Fiscalización Comunal)</span>
                      </label>
                      <input
                        type="text"
                        value={codigoRegistroEnsa}
                        onChange={(e) => setCodigoRegistroEnsa(e.target.value)}
                        placeholder="Ej: ENSA-2026-98124"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
                      />
                    </div>
                  )}

                  {/* Description & Direction */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Dirección Exacta o Puntos de Referencia
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Frente a la tienda o parque, casa #42"
                        value={reportDireccion}
                        onChange={(e) => setReportDireccion(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Canal para recibir la Copia Digital
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'ambos', label: 'Ambos' },
                          { id: 'whatsapp', label: 'WhatsApp' },
                          { id: 'email', label: 'Correo' },
                          { id: 'ninguno', label: 'Solo Web' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setCanalNotificacionCopia(opt.id as any)}
                            className={`py-2 text-[11px] font-bold rounded-lg border text-center transition-colors cursor-pointer ${
                              canalNotificacionCopia === opt.id
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Descripción Detallada del Inconveniente *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={reportDescripcion}
                      onChange={(e) => setReportDescripcion(e.target.value)}
                      placeholder="Describa el problema con claridad para agilizar la asignación de cuadrillas..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Radicar Incidencia Comunitaria</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. BOTONES TIPO PESTAÑA:
          Pestaña 1: Desempeño por Área de Servicio y Atención Comunitaria por Sector
          Pestaña 2: Estado Global (Gráficos)
          Pestaña 3: Listado de Tickets (con paginación 10, 25, 50) */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-start sm:justify-center border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto gap-2 scrollbar-thin">
          <button
            type="button"
            id="tab-desempeno-sector"
            onClick={() => setActiveTab('desempeno-sector')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'desempeno-sector'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Desempeño por Área y Sector</span>
          </button>

          <button
            type="button"
            id="tab-estado-global"
            onClick={() => setActiveTab('estado-global')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'estado-global'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <PieChartIcon className="w-4 h-4" />
            <span>Estado Global (Gráficos)</span>
          </button>

          <button
            type="button"
            id="tab-listado-tickets"
            onClick={() => setActiveTab('listado-tickets')}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'listado-tickets'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Listado de Tickets ({filteredTickets.length})</span>
          </button>
        </div>

        {/* ============================================================
            PESTAÑA 1: DESEMPEÑO POR ÁREA DE SERVICIO Y ATENCIÓN POR SECTOR
        ============================================================ */}
        {activeTab === 'desempeno-sector' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* 1. Desempeño por Área de Servicio */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Desempeño por Área de Servicio Comunal</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Efectividad de respuesta y resolución por especialidad de cuadrilla técnica
                  </p>
                </div>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Mostrar todas las áreas ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.porCategoria.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-blue-600 bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                          >
                            <CategoryIcon name={cat.icono} className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {cat.nombre}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {cat.total} casos reportados
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {cat.porcentaje}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.porcentaje}%`,
                            backgroundColor: cat.color || '#0066FF',
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2.5 font-medium">
                        <span className="text-emerald-600 font-semibold">{cat.resueltos} resueltos</span>
                        <span>{cat.pendientes} en gestión</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Atención Comunitaria por Sector Residencial */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                      Atención Comunitaria por Sector Residencial
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Balance de reportes atendidos vs radicados en cada comunidad del corregimiento
                    </p>
                  </div>
                </div>

                {selectedSector && (
                  <button
                    type="button"
                    onClick={() => setSelectedSector(null)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mostrar todos los sectores ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.sectorCounts.map((sec) => {
                  const isSecSelected = selectedSector === sec.nombre;
                  return (
                    <div
                      key={sec.nombre}
                      onClick={() => setSelectedSector(isSecSelected ? null : sec.nombre)}
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSecSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-semibold">{sec.nombre}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold">
                        <span className="text-emerald-600">{sec.resueltos} ok</span>
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="text-slate-600 dark:text-slate-300">{sec.total} total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            PESTAÑA 2: ESTADO GLOBAL (LOS GRÁFICOS)
        ============================================================ */}
        {activeTab === 'estado-global' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-xs font-semibold text-slate-400">Total Solicitudes</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {stats.total}
                </p>
                <p className="text-[11px] text-slate-400">Radicadas en la comunidad</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-xs font-semibold text-slate-400">Casos Resueltos</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats.resueltos}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {stats.porcentajeResueltos}% tasa de cumplimiento
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-xs font-semibold text-slate-400">En Atención Activa</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {stats.enProgreso}
                </p>
                <p className="text-[11px] text-slate-400">Cuadrillas operando en campo</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <span className="text-xs font-semibold text-slate-400">Tiempo de Atención</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                  24 - 48h
                </p>
                <p className="text-[11px] text-slate-400">SLA promedio de respuesta</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico 1: Estado Global de Solicitudes (Pie/Donut Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-blue-600" />
                    <span>Estado Global de Solicitudes</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Distribución porcentual de casos resueltos, en progreso y abiertos
                  </p>
                </div>

                <div className="h-64 my-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  {stats.statusData.map((item) => (
                    <div key={item.name} className="space-y-0.5">
                      <span className="text-[11px] text-slate-400 block truncate">{item.name}</span>
                      <span className="font-extrabold text-sm font-mono" style={{ color: item.color }}>
                        {item.value} ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico 2: Desempeño por Área de Servicio (Bar Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span>Volumen y Casos Resueltos por Área</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Comparativo entre reportes recibidos y casos concluidos satisfactoriamente
                  </p>
                </div>

                <div className="h-64 my-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis
                        dataKey="name"
                        stroke={isDarkMode ? '#64748b' : '#94a3b8'}
                        fontSize={10}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke={isDarkMode ? '#64748b' : '#94a3b8'} fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="total" name="Total Reportes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resueltos" name="Resueltos" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Total recibidos
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resueltos
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            PESTAÑA 3: LISTADO DE TICKETS (CON PAGINACIÓN 10, 25, 50)
        ============================================================ */}
        {activeTab === 'listado-tickets' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
            {/* Table Filter and Pagination Controls Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Listado de Tickets Comunitarios ({filteredTickets.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Datos de seguimiento público con información de privacidad protegida
                </p>
              </div>

              {/* Status filter chips & Page Size Selector (10, 25, 50 as requested) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'abiertos', label: 'Abiertos' },
                    { id: 'en_progreso', label: 'En Progreso' },
                    { id: 'resueltos', label: 'Resueltos' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setListStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        listStatusFilter === st.id
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Page Size Selector: 10, 25, 50 como máximo */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-bold">
                  <span className="text-slate-400 text-[11px]">Mostrar:</span>
                  {[10, 25, 50].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setPageSize(size)}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        pageSize === size
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Asunto / Incidencia</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {ticket.numeroRegistro}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {ticket.asunto}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {ticket.categoriaNombre}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {ticket.sectorNombre}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {ticket.fechaCreacion}
                      </td>
                      <td className="py-3 px-3">{getStatusBadge(ticket.estado)}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}

                  {paginatedTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron tickets con los filtros y búsqueda especificados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (Páginas, Anterior, Siguiente) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="text-slate-400 text-[11px]">
                Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredTickets.length)} -{' '}
                {Math.min(currentPage * pageSize, filteredTickets.length)} de {filteredTickets.length} registros
                (Página {currentPage} de {totalPages})
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="text-slate-400 px-1">...</span>}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. MODAL DE DETALLE DE TICKET CON TRAZABILIDAD */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900">
                    {selectedTicket.numeroRegistro}
                  </span>
                  {getStatusBadge(selectedTicket.estado)}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedTicket.asunto}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stages */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Etapa de Atención de la Junta Comunal
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '1. Radicado', done: true },
                  { label: '2. En Cuadrilla', done: selectedTicket.estado !== 'abierto' },
                  {
                    label: '3. En Ejecución',
                    done: selectedTicket.estado === 'en_progreso' || selectedTicket.estado === 'resuelto' || selectedTicket.estado === 'cerrado',
                  },
                  {
                    label: '4. Resuelto',
                    done: selectedTicket.estado === 'resuelto' || selectedTicket.estado === 'cerrado',
                  },
                ].map((st, i) => (
                  <div
                    key={i}
                    className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold ${
                      st.done
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {st.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Área:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTicket.categoriaNombre}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sector Residencial:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTicket.sectorNombre}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Fecha Radicación:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedTicket.fechaCreacion} ({selectedTicket.horaCreacion})
                </span>
              </div>
            </div>

            {/* ENSA Code if present */}
            {selectedTicket.codigoRegistroEnsa && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs flex items-center justify-between">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Código de Fiscalización Previa ENSA:
                </span>
                <span className="font-mono font-extrabold text-amber-900 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                  {selectedTicket.codigoRegistroEnsa}
                </span>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Descripción
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedTicket.descripcion}
              </p>
            </div>

            {/* Traceability Events Log */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Bitácora de Trazabilidad y Avances Comunitarios
              </span>

              {selectedTicket.historial && selectedTicket.historial.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedTicket.historial.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs flex items-start gap-2.5"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {ev.responsable}
                          </span>
                          <span className="text-slate-400">{ev.fecha} {ev.hora}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 text-[11px]">{ev.nota}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No hay notas de cuadrilla registradas aún.</p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => copyCode(selectedTicket.numeroRegistro)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PIE DE PÁGINA MUNICIPAL */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Junta Comunal — Portal de Transparencia e Incidencias Vecinales
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Atención Ciudadana: Lun - Vie 8:00 AM a 4:00 PM</span>
            <span>•</span>
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Portal Administrativo de Funcionarios
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
