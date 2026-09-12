import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch,
  GitCommit,
  History,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  Download,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Sparkles,
  Tag,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { User } from '../../types';

export interface VersionChangeLog {
  id: string;
  version: string;
  fecha: string;
  tipo: 'major' | 'minor' | 'patch' | 'security';
  titulo: string;
  autor: string;
  descripcion: string;
  cambios: string[];
  modulosAfectados: string[];
  estado: 'produccion' | 'pruebas' | 'planificado' | 'revertido';
  hashCommit?: string;
}

const INITIAL_VERSION_LOGS: VersionChangeLog[] = [
  {
    id: 'ver-2-1-0',
    version: 'v2.1.0',
    fecha: '2026-09-12',
    tipo: 'minor',
    titulo: 'Portal Institucional Ciudadano, Banner Dinámico y Módulo Super Admin',
    autor: 'Ing. Carlos Mendoza (Super Admin)',
    descripcion:
      'Actualización mayor de la interfaz pública con banner configurable para video YouTube y foto slide, reorganización modular en pestañas con paginación optimizada (10, 25, 50 registros) y panel exclusivo de control de versiones.',
    cambios: [
      'Banner full-width en el Portal Ciudadano con altura regulable y conmutación entre Video YouTube y Galería Fotográfica institucional.',
      'Reorganización en pestañas: Desempeño y Atención Comunitaria por Sector, Estado Global (Gráficos) y Listado con paginación de 10, 25 y 50 muestras.',
      'Ventana exclusiva para Super Administrador de Control de Versiones y Registro de Cambios del Sitio.',
      'Integración del código de registro previo ENSA para alumbrado eléctrico con fiscalización comunal.',
      'Envío y selección de canal de notificación de copia digital (Email y WhatsApp).',
    ],
    modulosAfectados: ['Frontend Público', 'Super Admin', 'Paginación', 'Media Banner', 'Base de Datos MySQL'],
    estado: 'produccion',
    hashCommit: 'git-a4f91c2-deploy',
  },
  {
    id: 'ver-2-0-0',
    version: 'v2.0.0',
    fecha: '2026-09-11',
    tipo: 'major',
    titulo: 'Doble Backend Activo, Heatmap Cartográfico 850px y Respaldo Físico',
    autor: 'Equipo Técnico Junta Comunal',
    descripcion:
      'Lanzamiento de infraestructura híbrida de persistencia con base de datos remota MySQL en Hostinger y almacenamiento local en memoria con fallback automático.',
    cambios: [
      'Arquitectura de persistencia dual: MySQL remoto Hostinger + Store local con sincronización bidireccional cada 30 segundos.',
      'Módulo de Mapa de Calor (Heatmap) en alta resolución con altura exacta de 850px y full-width.',
      'Estructura de almacenamiento de evidencias jerárquica en uploads/evidencias/{YYYY}/{MM}/{DD}/{cedula}.',
      'Servicio cron nocturno a las 12:01 AM para respaldo automatizado de base de datos y trazabilidad.',
      'Ingesta y canalización de tickets generados vía WhatsApp de la Junta Comunal.',
    ],
    modulosAfectados: ['Backend Express', 'MySQL Hostinger', 'File Storage', 'Heatmap Leaflet', 'Cron Service'],
    estado: 'produccion',
    hashCommit: 'git-e8b2410-master',
  },
  {
    id: 'ver-1-2-0',
    version: 'v1.2.0',
    fecha: '2026-09-08',
    tipo: 'minor',
    titulo: 'Personalización Visual, Directorio Ciudadano y Alertas Email',
    autor: 'Super Administrador',
    descripcion:
      'Incorporación de motor de personalización para temas claro/oscuro, dimensiones de layouts, paleta de colores y enlaces directos a mensajería instantánea.',
    cambios: [
      'Vista de Personalización & Diseño con selectores de color primario, fondos y tipografías para Backend y Frontend.',
      'Directorio Ciudadano administrativo con enlace directo a chat de WhatsApp y auditoría de contactos.',
      'Servicio de notificación automática por correo con registro histórico de envíos.',
      'Búsqueda predictiva de sectores residenciales por autocompletado en tiempo real.',
    ],
    modulosAfectados: ['Theme Engine', 'Directorio Admin', 'Email Service', 'UI Components'],
    estado: 'produccion',
    hashCommit: 'git-99c011a-patch',
  },
  {
    id: 'ver-1-1-0',
    version: 'v1.1.0',
    fecha: '2026-09-01',
    tipo: 'minor',
    titulo: 'Trazabilidad y Línea de Tiempo de Eventos de Tickets',
    autor: 'Despacho de Sistemas',
    descripcion:
      'Implementación del sistema de trazabilidad de incidencias con registro de auditoría, tiempos de respuesta y cambio granular de estados.',
    cambios: [
      'Línea de tiempo interactiva de trazabilidad con firmas de funcionarios y minutos consumidos.',
      'Filtros multidimensionales por estado, prioridad y sector.',
      'Modal de creación rápida y detallada de incidencias con geolocalización manual.',
    ],
    modulosAfectados: ['Trazabilidad', 'Tickets API', 'Seguridad'],
    estado: 'produccion',
    hashCommit: 'git-55f412c-v1.1',
  },
  {
    id: 'ver-1-0-0',
    version: 'v1.0.0',
    fecha: '2026-08-15',
    tipo: 'major',
    titulo: 'Lanzamiento Inicial del Sistema de Gestión de Incidencias',
    autor: 'Junta Comunal',
    descripcion:
      'Puesta en marcha del sistema integral para recepción, seguimiento y resolución de reportes comunitarios en el corregimiento.',
    cambios: [
      'Módulo de gestión de incidencias ciudadanas.',
      'Clasificación por áreas de servicio (Alumbrado, Agua, Ornato, Vialidad, Obras, etc.).',
      'Panel de control con métricas e indicadores de gestión.',
    ],
    modulosAfectados: ['Core System', 'Auth', 'Dashboard', 'Configuración'],
    estado: 'produccion',
    hashCommit: 'git-001000a-init',
  },
];

interface AdminVersionControlViewProps {
  currentUser: User | null;
}

export const AdminVersionControlView: React.FC<AdminVersionControlViewProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.rol === 'administrador';

  const [versionLogs, setVersionLogs] = useState<VersionChangeLog[]>(() => {
    const saved = localStorage.getItem('site_version_control_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_VERSION_LOGS;
      }
    }
    return INITIAL_VERSION_LOGS;
  });

  const [filterType, setFilterType] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>('ver-2-1-0');

  // New Version Form State
  const [newVersionNum, setNewVersionNum] = useState('');
  const [newTipo, setNewTipo] = useState<'major' | 'minor' | 'patch' | 'security'>('minor');
  const [newTitulo, setNewTitulo] = useState('');
  const [newAutor, setNewAutor] = useState(currentUser?.nombre || 'Super Administrador');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newCambiosText, setNewCambiosText] = useState('');
  const [newModulosText, setNewModulosText] = useState('Frontend Público, Backend');
  const [newEstado, setNewEstado] = useState<'produccion' | 'pruebas' | 'planificado'>('produccion');

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('site_version_control_records', JSON.stringify(versionLogs));
  }, [versionLogs]);

  // If not super admin, restrict view
  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Acceso Restringido - Solo Super Administrador
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta ventana está estrictamente reservada para el Despacho del Super Administrador para el control de versiones, auditoría de despliegues y trazabilidad de cambios del sitio.
        </p>
      </div>
    );
  }

  const handleCreateVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionNum.trim() || !newTitulo.trim()) return;

    const formattedChanges = newCambiosText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const formattedModules = newModulosText
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const newRecord: VersionChangeLog = {
      id: `ver-${Date.now()}`,
      version: newVersionNum.trim().startsWith('v') ? newVersionNum.trim() : `v${newVersionNum.trim()}`,
      fecha: new Date().toISOString().split('T')[0],
      tipo: newTipo,
      titulo: newTitulo.trim(),
      autor: newAutor.trim(),
      descripcion: newDescripcion.trim() || 'Actualización registrada en el sistema.',
      cambios: formattedChanges.length > 0 ? formattedChanges : ['Ajustes generales y optimización de rendimiento.'],
      modulosAfectados: formattedModules.length > 0 ? formattedModules : ['General'],
      estado: newEstado,
      hashCommit: `git-${Math.random().toString(36).substring(2, 9)}-deploy`,
    };

    setVersionLogs([newRecord, ...versionLogs]);
    setIsNewModalOpen(false);

    // Reset Form
    setNewVersionNum('');
    setNewTitulo('');
    setNewDescripcion('');
    setNewCambiosText('');
  };

  const handleDeleteVersion = (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro de versión del historial?')) {
      setVersionLogs(versionLogs.filter((v) => v.id !== id));
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('¿Desea restaurar el registro oficial de versiones predeterminado?')) {
      setVersionLogs(INITIAL_VERSION_LOGS);
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(versionLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `changelog-junta-comunal-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = versionLogs.filter((log) => {
    const matchesFilter = filterType === 'todos' || log.tipo === filterType;
    const matchesSearch =
      log.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.cambios.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getTipoBadge = (tipo: VersionChangeLog['tipo']) => {
    switch (tipo) {
      case 'major':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Major Release
          </span>
        );
      case 'minor':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Minor Release
          </span>
        );
      case 'patch':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Patch / Hotfix
          </span>
        );
      case 'security':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Seguridad
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Super Admin Badge & Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Control de Versiones y Registro de Cambios
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase border border-purple-200 dark:border-purple-800">
                Super Administrador
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registro auditable de modificaciones, actualizaciones de esquemas, mejoras de interfaz y versiones desplegadas en el sitio.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Exportar Registro de Cambios a JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Changelog</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nueva Versión</span>
          </button>
        </div>
      </div>

      {/* System Status Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Versión Activa</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
            {versionLogs[0]?.version || 'v2.1.0'}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            En Producción
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Base de Datos</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
            MySQL Hostinger
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            Dual Store + Memoria
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Total Versiones</span>
            <History className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
            {versionLogs.length}
          </p>
          <p className="text-[11px] text-slate-400">
            Historial consolidado
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Entorno Runtime</span>
            <Server className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
            Vite + Express Node
          </p>
          <p className="text-[11px] text-slate-400">
            Auto-sync cada 30s
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar versión, mejora, módulo o palabra clave..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-purple-600 outline-hidden font-medium"
          />
        </div>

        {/* Filter by type */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'major', label: 'Major' },
            { id: 'minor', label: 'Minor' },
            { id: 'patch', label: 'Patch' },
            { id: 'security', label: 'Seguridad' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilterType(btn.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === btn.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {btn.label}
            </button>
          ))}

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Restaurar versiones de fábrica"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline of Versions */}
      <div className="space-y-4">
        {filteredLogs.map((log, index) => {
          const isExpanded = expandedVersionId === log.id;
          const isCurrent = index === 0 && filterType === 'todos';

          return (
            <div
              key={log.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all ${
                isCurrent
                  ? 'border-purple-500/80 shadow-md shadow-purple-500/10 dark:border-purple-600'
                  : 'border-slate-200/90 dark:border-slate-800 shadow-xs'
              }`}
            >
              {/* Header Row */}
              <div
                onClick={() => setExpandedVersionId(isExpanded ? null : log.id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono font-bold text-sm shrink-0 border border-purple-200 dark:border-purple-800">
                    <GitCommit className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {log.version}
                      </span>
                      {getTipoBadge(log.tipo)}
                      {isCurrent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 uppercase">
                          Activa Actual
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {log.titulo}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{log.fecha}</span>
                  </div>

                  <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {log.hashCommit}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVersion(log.id);
                    }}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                    title="Eliminar del registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {log.descripcion}
                  </p>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Detalle de Mejoras y Modificaciones</span>
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {log.cambios.map((cambio, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                          <span>{cambio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Modules Affected */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">Módulos Afectados:</span>
                    {log.modulosAfectados.map((mod, mIdx) => (
                      <span
                        key={mIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {mod}
                      </span>
                    ))}
                    <span className="text-[11px] font-medium text-slate-400 ml-auto">
                      Registrado por: <strong className="text-slate-700 dark:text-slate-300">{log.autor}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">No se encontraron versiones con los filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Modal to Register New Version */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                <GitBranch className="w-5 h-5" />
                <span>Registrar Nueva Versión del Sitio</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Versión *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: v2.2.0"
                    value={newVersionNum}
                    onChange={(e) => setNewVersionNum(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Release *
                  </label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="major">Major (Cambio de Gran Impacto)</option>
                    <option value="minor">Minor (Nueva Funcionalidad)</option>
                    <option value="patch">Patch (Corrección / Mantenimiento)</option>
                    <option value="security">Seguridad (Auditoría / Parche)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Despliegue *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Módulo de Estadísticas Avanzadas..."
                  value={newTitulo}
                  onChange={(e) => setNewTitulo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción General
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve resumen del objetivo de la versión..."
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lista de Cambios (Uno por línea)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ej:&#10;Se agregó banner ajustable de YouTube&#10;Se incluyó paginación 10, 25, 50"
                  value={newCambiosText}
                  onChange={(e) => setNewCambiosText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Módulos Afectados (Separados por coma)
                  </label>
                  <input
                    type="text"
                    placeholder="Frontend, Base de datos, etc."
                    value={newModulosText}
                    onChange={(e) => setNewModulosText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Autor / Despacho
                  </label>
                  <input
                    type="text"
                    value={newAutor}
                    onChange={(e) => setNewAutor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20"
                >
                  Guardar Versión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
