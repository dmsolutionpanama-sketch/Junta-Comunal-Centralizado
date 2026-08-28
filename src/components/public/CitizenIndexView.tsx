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
  Phone,
  HelpCircle,
  ExternalLink,
  Shield,
  LayoutDashboard,
  Copy,
} from 'lucide-react';
import { Ticket, CreateTicketInput, TicketStatus, AppTheme } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { useTheme } from '../../context/ThemeContext';
import { CategoryIcon } from '../common/CategoryIcon';
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
} from 'recharts';

interface CitizenIndexViewProps {
  tickets: Ticket[];
  onGoToLogin: () => void;
  onOpenNewTicketModal: () => void;
  onCreateTicketDirect: (ticketInput: CreateTicketInput) => Promise<boolean>;
}

export const CitizenIndexView: React.FC<CitizenIndexViewProps> = ({
  tickets,
  onGoToLogin,
  onOpenNewTicketModal,
  onCreateTicketDirect,
}) => {
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'buscar' | 'reportar' | 'obras'>('dashboard');

  // Direct Public Report Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenCedula, setCitizenCedula] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenSector, setCitizenSector] = useState(SECTORES_RESIDENCIA[0]);
  const [reportAsunto, setReportAsunto] = useState('');
  const [reportCategoriaId, setReportCategoriaId] = useState(CATEGORIAS_SISTEMA[0].id);
  const [reportDescripcion, setReportDescripcion] = useState('');
  const [reportDireccion, setReportDireccion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

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
      { name: 'En Progreso', value: enProgreso, color: '#F59E0B' },
      { name: 'Abiertos / Por Asignar', value: abiertos, color: '#3B82F6' },
    ].filter((item) => item.value > 0);

    return {
      total,
      resueltos,
      enProgreso,
      abiertos,
      porcentajeResueltos,
      porCategoria,
      sectorCounts,
      statusData,
    };
  }, [tickets]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return tickets.filter(
      (t) =>
        t.numeroRegistro.toLowerCase().includes(q) ||
        t.asunto.toLowerCase().includes(q) ||
        t.categoriaNombre.toLowerCase().includes(q) ||
        t.sectorNombre.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  // Filtered Community Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedCategory && t.categoriaId !== selectedCategory) return false;
      if (selectedSector && t.sectorNombre !== selectedSector) return false;
      return true;
    });
  }, [tickets, selectedCategory, selectedSector]);

  // Handle direct report submit
  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!citizenName.trim() || !citizenCedula.trim() || !reportAsunto.trim() || !reportDescripcion.trim()) {
      setFormError('Por favor complete los campos obligatorios (*).');
      return;
    }

    if (reportDescripcion.trim().length < 10) {
      setFormError('Por favor brinde una descripción más detallada (mínimo 10 caracteres).');
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedCat = CATEGORIAS_SISTEMA.find((c) => c.id === reportCategoriaId);
      const ticketData: CreateTicketInput = {
        asunto: reportAsunto.trim(),
        categoriaId: reportCategoriaId,
        categoriaNombre: selectedCat?.nombre || 'General',
        sectorNombre: citizenSector,
        prioridad: 'media',
        descripcion: reportDescripcion.trim(),
        direccionDetallada: reportDireccion.trim(),
        reportante: {
          nombre: citizenName.trim(),
          cedula: citizenCedula.trim(),
          telefono: citizenPhone.trim(),
          email: '',
          genero: 'masculino',
          edad: 35,
          sector: citizenSector,
        },
      };

      const success = await onCreateTicketDirect(ticketData);
      if (success) {
        // Generate pseudo code for citizen reference
        const generatedCode = `TK-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
        setCreatedTicketCode(generatedCode);
        // Reset form
        setReportAsunto('');
        setReportDescripcion('');
        setReportDireccion('');
      } else {
        setFormError('Hubo un inconveniente al radicar la solicitud. Intente nuevamente.');
      }
    } catch {
      setFormError('Error de conexión al registrar el ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusBadge = (estado: TicketStatus) => {
    switch (estado) {
      case 'abierto':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            Abierto / En Cola
          </span>
        );
      case 'en_progreso':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            En Progreso / Cuadrilla Activa
          </span>
        );
      case 'resuelto':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            Resuelto / Completado
          </span>
        );
      case 'cerrado':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
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
      {/* 1. TOP CITIZEN NAVIGATION BAR */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white/90 border-slate-200 text-slate-900'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-blue-600 dark:text-blue-400">
                Junta Comunal
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                Portal Ciudadano
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Transparencia y Gestión Comunitaria de Incidencias
            </p>
          </div>
        </div>

        {/* Center Quick Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Dashboard Comunitario
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buscar')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'buscar'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Consultar Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reportar')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'reportar'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Reportar Incidencia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('obras')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'obras'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Bitácora de Obras
          </button>
        </nav>

        {/* Right Actions: Dark Mode & Staff Login Button */}
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

          {/* Primary Action: Go to Staff Backoffice Login */}
          <button
            type="button"
            id="btn-public-login"
            onClick={onGoToLogin}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Acceso Funcionarios</span>
          </button>
        </div>
      </header>

      {/* 2. HERO BANNER WITH INSTANT TICKET SEARCH BAR */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-600/10 via-transparent to-transparent dark:from-blue-950/30 dark:via-transparent pt-8 pb-10 px-4 sm:px-8 border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal de Consulta Pública y Transparencia de la Junta Comunal</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Junta Comunal al Servicio de la Comunidad
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 font-normal">
            Consulte en tiempo real el progreso de los reportes vecinales, obras de infraestructura y solicitudes ciudadanas en su sector sin necesidad de iniciar sesión.
          </p>

          {/* Live Search Input Box */}
          <div className="max-w-2xl mx-auto pt-2">
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/60 dark:shadow-none border-2 border-blue-500/30 dark:border-blue-500/40 p-1.5 focus-within:border-blue-600 transition-all">
              <Search className="w-5 h-5 text-blue-600 ml-3 shrink-0" />
              <input
                type="text"
                id="public-ticket-search-input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'buscar' && e.target.value.trim().length > 0) {
                    setActiveTab('buscar');
                  }
                }}
                placeholder="🔍 Ingrese código de ticket (Ej: TK-2025-001) o palabra clave..."
                className="w-full px-3 py-2.5 text-xs sm:text-sm bg-transparent border-none outline-hidden text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold mr-1"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('buscar')}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                Buscar Estado
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              Pruebe buscando: <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold cursor-pointer" onClick={() => { setSearchQuery('TK-2025-001'); setActiveTab('buscar'); }}>TK-2025-001</span>, <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold cursor-pointer" onClick={() => { setSearchQuery('TK-2025-002'); setActiveTab('buscar'); }}>TK-2025-002</span>, <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold cursor-pointer" onClick={() => { setSearchQuery('TK-2025-004'); setActiveTab('buscar'); }}>TK-2025-004</span>
            </p>
          </div>

          {/* Quick CTA Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('reportar')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Reportar Nueva Incidencia (Pre-registro)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Ver Estadísticas de la Comunidad</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. MAIN BODY VIEWS */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* MOBILE NAVIGATION TABS */}
        <div className="flex md:hidden border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-2 text-xs font-bold scrollbar-thin">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buscar')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'buscar' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Buscar Ticket
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reportar')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'reportar' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Reportar Incidencia
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('obras')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === 'obras' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Obras Comunitarias
          </button>
        </div>

        {/* -------------------------------------------------------------
            VIEW A: COMMUNITY DASHBOARD & TRANSPARENCY METRICS
        -------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top 4 Key Indicator Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Solicitudes</span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  {stats.total}
                </p>
                <p className="text-[11px] text-slate-400 font-normal">Radicadas por la comunidad</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Casos Resueltos</span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.resueltos}
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {stats.porcentajeResueltos}% de efectividad
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">En Atención Activa</span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {stats.enProgreso}
                </p>
                <p className="text-[11px] text-slate-400 font-normal">Cuadrillas operando en campo</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tiempo de Atención</span>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                  24 - 48h
                </p>
                <p className="text-[11px] text-slate-400 font-normal">SLA promedio de respuesta</p>
              </div>
            </div>

            {/* Categorías de Caso de la Junta Comunal */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Desempeño por Área de Servicio Comunal
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Haga clic en un área para filtrar los tickets de la comunidad
                  </p>
                </div>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Ver todas las áreas
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
                          ? 'ring-2 ring-blue-600 bg-blue-50/50 dark:bg-blue-950/30 border-blue-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                          >
                            <CategoryIcon name={cat.icono} className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{cat.nombre}</h3>
                            <span className="text-[11px] text-slate-400">{cat.total} casos reportados</span>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {cat.porcentaje}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.porcentaje}%`,
                            backgroundColor: cat.color || '#0066FF',
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-medium">
                        <span>{cat.resueltos} resueltos</span>
                        <span>{cat.pendientes} en gestión</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sector Breakdown & Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sector ranking */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Atención Comunitaria por Sector Residencial
                    </h3>
                  </div>
                  {selectedSector && (
                    <button
                      type="button"
                      onClick={() => setSelectedSector(null)}
                      className="text-xs text-blue-600 font-bold hover:underline"
                    >
                      Limpiar filtro
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.sectorCounts.map((sec) => {
                    const isSecSelected = selectedSector === sec.nombre;
                    return (
                      <div
                        key={sec.nombre}
                        onClick={() => setSelectedSector(isSecSelected ? null : sec.nombre)}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSecSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sec.nombre}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 font-semibold">
                          <span className="text-emerald-600">{sec.resueltos} ok</span>
                          <span className="text-slate-300 dark:text-slate-600">/</span>
                          <span>{sec.total} total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Distribution Pie Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Estado Global de Solicitudes
                  </h3>
                  <p className="text-xs text-slate-400">Distribución de casos activos vs resueltos</p>
                </div>

                <div className="h-44 my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
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
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1 text-xs">
                  {stats.statusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Community Tickets List (Public Overview) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    Incidencias Comunitarias en Seguimiento ({filteredTickets.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Datos públicos de gestión vecinal (información personal protegida por ley)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('buscar')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Búsqueda avanzada</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

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
                    {filteredTickets.slice(0, 8).map((ticket) => (
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
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
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
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setActiveTab('buscar');
                              setSearchQuery(ticket.numeroRegistro);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer"
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW B: PUBLIC TICKET SEARCH & TIMELINE TRACKING (SIN LOGIN)
        -------------------------------------------------------------- */}
        {activeTab === 'buscar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Búsqueda y Seguimiento Directo de Tickets
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ingrese el número de radicado para ver la bitácora de avances y tiempo estimado de resolución
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej: TK-2025-001 o Luminaria..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>
              </div>

              {/* Live Search Matches List */}
              {searchQuery.trim() && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-400">
                    Resultados coincidentes ({searchResults.length}):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {searchResults.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`p-4 rounded-xl border text-xs transition-all cursor-pointer ${
                          selectedTicket?.id === t.id
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {t.numeroRegistro}
                          </span>
                          {getStatusBadge(t.estado)}
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mb-1 truncate">
                          {t.asunto}
                        </h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{t.sectorNombre}</span>
                          <span>{t.fechaCreacion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Ticket Public Detail Card */}
            {selectedTicket ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-md space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                {/* Header of Detail */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900">
                        {selectedTicket.numeroRegistro}
                      </span>
                      {getStatusBadge(selectedTicket.estado)}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      {selectedTicket.asunto}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyCode(selectedTicket.numeroRegistro)}
                    className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                {/* 4-Step Resolution Progress Indicator */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Etapa de Atención del Caso
                  </h4>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[
                      { step: 1, label: '1. Radicado', done: true },
                      {
                        step: 2,
                        label: '2. En Cuadrilla',
                        done: selectedTicket.estado !== 'abierto',
                      },
                      {
                        step: 3,
                        label: '3. En Ejecución',
                        done: selectedTicket.estado === 'en_progreso' || selectedTicket.estado === 'resuelto' || selectedTicket.estado === 'cerrado',
                      },
                      {
                        step: 4,
                        label: '4. Resuelto',
                        done: selectedTicket.estado === 'resuelto' || selectedTicket.estado === 'cerrado',
                      },
                    ].map((step) => (
                      <div
                        key={step.step}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          step.done
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 font-medium'
                        }`}
                      >
                        <div className="text-xs">{step.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Overview Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Categoría de Servicio:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.categoriaNombre}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sector / Ubicación:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.sectorNombre}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Fecha de Radicación:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTicket.fechaCreacion} ({selectedTicket.horaCreacion})
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Descripción del Problema Reportado
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/60 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {selectedTicket.descripcion}
                  </p>
                </div>

                {/* Public Traceability Timeline Log */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Bitácora Pública de Avances y Respuestas de la Junta Comunal
                  </h4>

                  {selectedTicket.historial && selectedTicket.historial.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedTicket.historial.map((event) => (
                        <div
                          key={event.id}
                          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-start gap-3"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {event.responsable} <span className="text-slate-400 font-normal">({event.rolResponsable || 'Junta Comunal'})</span>
                              </span>
                              <span className="text-slate-400 font-mono">
                                {event.fecha} {event.hora}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300">{event.nota}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No hay notas de cuadrilla adicionales aún.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Consulte un Ticket para ver su Línea de Tiempo
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Ingrese el código asignado a su solicitud en la barra superior o seleccione uno de los casos públicos listados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW C: DIRECT CITIZEN PRE-REGISTRATION / NEW INCIDENT FORM
        -------------------------------------------------------------- */}
        {activeTab === 'reportar' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              {/* Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold mb-2">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Pre-Registro y Radicación Ciudadana</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Reportar una Incidencia o Solicitud a la Junta Comunal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Complete este formulario para que la cuadrilla correspondiente sea despachada a su sector. Recibirá un código de seguimiento inmediato.
                </p>
              </div>

              {/* Confirmation screen upon successful submission */}
              {createdTicketCode ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                      ¡Solicitud Radicada Exitosamente!
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Su reporte ha sido recibido por el equipo técnico de la Junta Comunal.
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 inline-flex flex-col items-center">
                    <span className="text-xs text-slate-400 font-semibold mb-1">Su Código de Seguimiento:</span>
                    <span className="font-mono text-xl font-extrabold text-blue-600 dark:text-blue-400">
                      {createdTicketCode}
                    </span>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => copyCode(createdTicketCode)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(createdTicketCode);
                        setActiveTab('buscar');
                        setCreatedTicketCode(null);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Rastrear Estado Ahora
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDirectSubmit} className="space-y-6">
                  {formError && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Section 1: Citizen info */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>1. Datos del Solicitante / Residente</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Nombre Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={citizenName}
                          onChange={(e) => setCitizenName(e.target.value)}
                          placeholder="Ej: Ana María Morales"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Cédula / Documento de Identidad *
                        </label>
                        <input
                          type="text"
                          required
                          value={citizenCedula}
                          onChange={(e) => setCitizenCedula(e.target.value)}
                          placeholder="Ej: 8-765-4321"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Teléfono de Contacto
                        </label>
                        <input
                          type="tel"
                          value={citizenPhone}
                          onChange={(e) => setCitizenPhone(e.target.value)}
                          placeholder="6789-0000"
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Sector de Residencia *
                        </label>
                        <select
                          value={citizenSector}
                          onChange={(e) => setCitizenSector(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          {SECTORES_RESIDENCIA.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Case Details */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span>2. Detalle de la Solicitud / Incidencia</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Asunto Principal *
                      </label>
                      <input
                        type="text"
                        required
                        value={reportAsunto}
                        onChange={(e) => setReportAsunto(e.target.value)}
                        placeholder="Ej: Fuga de agua potable en calle principal..."
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Área / Categoría de la Incidencia *
                        </label>
                        <select
                          value={reportCategoriaId}
                          onChange={(e) => setReportCategoriaId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                        >
                          {CATEGORIAS_SISTEMA.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.nombre} (SLA: {cat.slaHoras}h)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Punto de Referencia / Dirección Exacta
                        </label>
                        <input
                          type="text"
                          value={reportDireccion}
                          onChange={(e) => setReportDireccion(e.target.value)}
                          placeholder="Frente a la tienda, poste #42..."
                          className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Descripción Detallada *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reportDescripcion}
                        onChange={(e) => setReportDescripcion(e.target.value)}
                        placeholder="Describa el inconveniente con claridad para el personal de la Junta Comunal..."
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Radicar Solicitud a la Junta Comunal</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            VIEW D: TRANSPARENCY & COMMUNITY WORKS FEED ("BITÁCORA DE OBRAS")
        -------------------------------------------------------------- */}
        {activeTab === 'obras' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Bitácora Pública de Obras e Intervenciones Comunitarias
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registro fotográfico y bitácora de cuadrillas activas en los diferentes sectores
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                  {stats.resueltos} Obras Culminadas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {ticket.adjuntos && ticket.adjuntos.length > 0 ? (
                      <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                        <img
                          src={ticket.adjuntos[0].url}
                          alt={ticket.asunto}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5">
                          {getStatusBadge(ticket.estado)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4 flex items-start justify-between">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-blue-600 shadow-xs">
                          <Building2 className="w-5 h-5" />
                        </div>
                        {getStatusBadge(ticket.estado)}
                      </div>
                    )}

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                          {ticket.numeroRegistro}
                        </span>
                        <span>{ticket.fechaCreacion}</span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {ticket.asunto}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {ticket.descripcion}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          {ticket.sectorNombre}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">{ticket.categoriaNombre}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setSearchQuery(ticket.numeroRegistro);
                        setActiveTab('buscar');
                      }}
                      className="w-full py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-blue-50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-center"
                    >
                      Ver Trazabilidad Completa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 4. MUNICIPAL FOOTER */}
      <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Junta Comunal — Gestión Ciudadana y Transparencia
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Atención: Lun a Vie 8:00 AM - 4:00 PM</span>
            <span>•</span>
            <button
              type="button"
              onClick={onGoToLogin}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Acceso a Intranet / Funcionarios
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
