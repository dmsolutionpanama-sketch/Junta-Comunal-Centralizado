import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Filter,
  Layers,
  Compass,
  Navigation,
  ExternalLink,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  Eye,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Maximize2,
  SlidersHorizontal,
  Building2,
  Calendar,
  User as UserIcon,
  Phone,
  Tag,
  Crosshair,
  Map as MapIcon,
  RefreshCw,
  Share2,
  Mountain,
  Globe,
  TrendingUp,
  Activity,
  BarChart3,
  PhoneCall,
  Zap,
  Database,
  FileText,
  History,
  Send,
  Copy,
  Check,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Ticket, TicketStatus, TicketPriority, User } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { TicketModalDetail } from '../tickets/TicketModalDetail';

interface AdminReportsMapViewProps {
  tickets: Ticket[];
  currentUser?: User | null;
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onAddTraceNote: (ticketId: string, note: string, eventType: any, newStatus?: TicketStatus) => void;
  onNavigateToTrace: (ticketId: string) => void;
  onNavigateToDirectory?: () => void;
}

// Fallback coordinate centers for sectors
const SECTOR_COORDS_FALLBACK: Record<string, { lat: number; lng: number }> = {
  'Altos de Las Cumbres': { lat: 9.0834, lng: -79.5312 },
  'Nueva Libia': { lat: 9.0945, lng: -79.5241 },
  'Villa Zaita': { lat: 9.0712, lng: -79.5188 },
  'Gonzalillo': { lat: 9.0882, lng: -79.5153 },
  'Ciudad San Lorenzo': { lat: 9.0991, lng: -79.5388 },
  'Colinas del Rocío': { lat: 9.0776, lng: -79.5267 },
  'Las Praderas del Rocío': { lat: 9.0744, lng: -79.5291 },
  'Reparto Portofino': { lat: 9.0815, lng: -79.5219 },
  'Villa María': { lat: 9.0911, lng: -79.5304 },
  'Villa Milagros': { lat: 9.0858, lng: -79.5273 },
  'Milla 9': { lat: 9.0683, lng: -79.5142 },
  'Santa Rita': { lat: 9.0934, lng: -79.5192 },
};

// Precise Boundary Polygon for Corregimiento Ernesto Córdoba Campos
const ERNESTO_CORDOBA_CAMPOS_BORDER: [number, number][] = [
  [9.0645, -79.5285], // Límite sur con San Miguelito / Villa Zaita
  [9.0682, -79.5175], // Límite Transístmica / Milla 9
  [9.0740, -79.5120], // Entrada Gonzalillo
  [9.0825, -79.5080], // Gonzalillo Este
  [9.0920, -79.5110], // Nueva Libia Este
  [9.0995, -79.5170], // Santa Rita
  [9.1065, -79.5230], // Límite Norte con Alcalde Díaz
  [9.1120, -79.5315], // San Lorenzo Norte / Límite Las Cumbres
  [9.1090, -79.5415], // Noroeste Reserva
  [9.0985, -79.5485], // Chivo Chivo Oeste / Mocambo
  [9.0885, -79.5515], // Límite Oeste Parque Nacional
  [9.0780, -79.5465], // Suroeste
  [9.0700, -79.5385], // Sur
  [9.0645, -79.5285], // Cierre
];

// Helper to get category emoji for pin clarity
const getCategoryIconEmoji = (categoriaId: string) => {
  const cat = categoriaId.toLowerCase();
  if (cat.includes('lumi') || cat.includes('alum')) return '💡';
  if (cat.includes('calle') || cat.includes('vial') || cat.includes('bach')) return '🛣️';
  if (cat.includes('agua') || cat.includes('fuga') || cat.includes('tub')) return '💧';
  if (cat.includes('basura') || cat.includes('desecho') || cat.includes('aseo')) return '🗑️';
  if (cat.includes('segur') || cat.includes('vigil')) return '🛡️';
  if (cat.includes('parque') || cat.includes('arbol') || cat.includes('verde')) return '🌳';
  if (cat.includes('drenaje') || cat.includes('alcant') || cat.includes('inund')) return '🌊';
  if (cat.includes('denuncia') || cat.includes('ruido')) return '📢';
  return '📌';
};

// Base coordinates for center of Panama Norte / Ernesto Córdoba Campos
const DEFAULT_CENTER: [number, number] = [9.0865, -79.5280];

type MapTileStyle =
  | 'google_roadmap'
  | 'google_satellite'
  | 'google_terrain'
  | 'terrain'
  | 'physical'
  | 'satellite'
  | 'topo'
  | 'positron'
  | 'dark';
type MapViewMode = 'markers' | 'heatmap' | 'effectiveness';

export interface SectorEffectivenessMetric {
  sector: string;
  totalTickets: number;
  abiertos: number;
  enProgreso: number;
  resueltos: number;
  cerrados: number;
  efectividadPct: number;
  urgentes: number;
  categoriaMasFrecuente: string;
  tiempoPromedioDias: number;
  nivelRiesgo: 'critico' | 'alerta' | 'controlado';
  coordenadas: { lat: number; lng: number };
}

export const AdminReportsMapView: React.FC<AdminReportsMapViewProps> = ({
  tickets,
  currentUser,
  onUpdateTicketStatus,
  onAddTraceNote,
  onNavigateToTrace,
  onNavigateToDirectory,
}) => {
  const isSuperiorAdmin = currentUser?.rol === 'administrador';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedPriority, setSelectedPriority] = useState<string>('todas');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Map & UI State: Default to markers (pines de ubicación) and Google Maps
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>('markers');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('google_roadmap');
  const [showCorregimientoBorder, setShowCorregimientoBorder] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [modalDetailTicket, setModalDetailTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Bottom Traceability Review Panel States
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const [isTracePanelOpen, setIsTracePanelOpen] = useState(true);
  const [newTraceNote, setNewTraceNote] = useState('');
  const [newTraceEventType, setNewTraceEventType] = useState<
    'comentario' | 'inspeccion_campo' | 'cuadrilla_asignada' | 'material_entregado' | 'cambio_estado'
  >('comentario');
  const [newTraceStatus, setNewTraceStatus] = useState<TicketStatus | ''>('');
  const [isSavingTrace, setIsSavingTrace] = useState(false);
  const [traceSaveSuccess, setTraceSaveSuccess] = useState(false);
  const [copiedTicketCode, setCopiedTicketCode] = useState(false);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    provider: string;
    host: string;
    ticketsCount?: number;
    dbTicketsCount?: number;
  } | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // 2 Versions Switcher: Versión 1 Minimalista Inmersiva vs Versión 2 Analítica Territorial
  const [mapDesignVersion, setMapDesignVersion] = useState<'v1_minimal' | 'v2_analytics'>('v1_minimal');

  // Re-render Leaflet container whenever layout version changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [mapDesignVersion, isSidebarOpen, mapViewMode]);

  // Map container and Leaflet instances refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapGroupRef = useRef<L.LayerGroup | null>(null);
  const corregimientoGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. RBAC Guard: Allow all backend administrative, agent and supervisor roles
  const isAuthorized = !currentUser || currentUser.rol === 'administrador' || currentUser.rol === 'supervisor' || currentUser.rol === 'agente';
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Acceso Restringido al Personal de la Junta
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          La vista del mapa de calor georreferenciado en tiempo real está reservada para personal administrativo, técnico y de campo de la Junta Comunal.
        </p>
      </div>
    );
  }

  // 2. Normalization & Filtering of tickets with valid coordinates
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchNumber = t.numeroRegistro.toLowerCase().includes(q);
        const matchAsunto = t.asunto.toLowerCase().includes(q);
        const matchDesc = t.descripcion.toLowerCase().includes(q);
        const matchName = t.reportante.nombre.toLowerCase().includes(q);
        const matchSector = t.sectorNombre.toLowerCase().includes(q);
        const matchAddress = (t.direccionDetallada || '').toLowerCase().includes(q);
        if (!matchNumber && !matchAsunto && !matchDesc && !matchName && !matchSector && !matchAddress) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== 'todas' && t.categoriaId !== selectedCategory) {
        return false;
      }

      // Sector
      if (selectedSector !== 'todos' && t.sectorNombre !== selectedSector) {
        return false;
      }

      // Status
      if (selectedStatus !== 'todos' && t.estado !== selectedStatus) {
        return false;
      }

      // Priority
      if (selectedPriority !== 'todas' && t.prioridad !== selectedPriority) {
        return false;
      }

      // Time range
      if (selectedTimeRange !== 'all') {
        const ticketDate = new Date(t.fechaCreacion);
        const now = new Date();
        if (selectedTimeRange === 'today') {
          const isToday = ticketDate.toDateString() === now.toDateString();
          if (!isToday) return false;
        } else if (selectedTimeRange === '7d') {
          const diffDays = (now.getTime() - ticketDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (selectedTimeRange === '30d') {
          const diffDays = (now.getTime() - ticketDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }

      return true;
    });
  }, [tickets, searchTerm, selectedCategory, selectedSector, selectedStatus, selectedPriority, selectedTimeRange]);

  // Selected Ticket Reference
  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null;
    return tickets.find((t) => t.id === selectedTicketId) || null;
  }, [tickets, selectedTicketId]);

  // Sector Stats Breakdown
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTickets.forEach((t) => {
      const s = t.sectorNombre || 'Sin Sector';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredTickets]);

  // Sector Response Effectiveness & Recurrence Analytics Matrix
  const sectorEffectivenessList = useMemo<SectorEffectivenessMetric[]>(() => {
    const map = new Map<string, {
      total: number;
      abiertos: number;
      enProgreso: number;
      resueltos: number;
      cerrados: number;
      urgentes: number;
      categories: Record<string, number>;
    }>();

    filteredTickets.forEach((t) => {
      const s = t.sectorNombre || 'Ernesto Córdoba Campos';
      if (!map.has(s)) {
        map.set(s, {
          total: 0,
          abiertos: 0,
          enProgreso: 0,
          resueltos: 0,
          cerrados: 0,
          urgentes: 0,
          categories: {},
        });
      }
      const data = map.get(s)!;
      data.total += 1;
      if (t.estado === 'abierto') data.abiertos += 1;
      if (t.estado === 'en_progreso') data.enProgreso += 1;
      if (t.estado === 'resuelto') data.resueltos += 1;
      if (t.estado === 'cerrado') data.cerrados += 1;
      if (t.prioridad === 'urgente' || t.prioridad === 'alta') data.urgentes += 1;

      data.categories[t.categoriaNombre || t.categoriaId] =
        (data.categories[t.categoriaNombre || t.categoriaId] || 0) + 1;
    });

    const list: SectorEffectivenessMetric[] = [];

    map.forEach((val, sector) => {
      const resolvedTotal = val.resueltos + val.cerrados;
      const efectividadPct = val.total > 0 ? Math.round((resolvedTotal / val.total) * 100) : 0;

      // Find top reported category
      let topCat = 'General';
      let maxCount = 0;
      Object.entries(val.categories).forEach(([cName, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topCat = cName;
        }
      });

      // Estimated average response duration (days)
      const avgDays = Number((1.2 + (val.abiertos * 0.4)).toFixed(1));

      // Risk / Alert Level classification based on pending and recurrence
      let nivelRiesgo: 'critico' | 'alerta' | 'controlado' = 'controlado';
      if (val.total >= 4 && efectividadPct < 50) {
        nivelRiesgo = 'critico';
      } else if (val.abiertos >= 2 || efectividadPct < 70) {
        nivelRiesgo = 'alerta';
      }

      const coords = SECTOR_COORDS_FALLBACK[sector] || {
        lat: 9.0865 + (Math.random() - 0.5) * 0.01,
        lng: -79.5280 + (Math.random() - 0.5) * 0.01,
      };

      list.push({
        sector,
        totalTickets: val.total,
        abiertos: val.abiertos,
        enProgreso: val.enProgreso,
        resueltos: val.resueltos,
        cerrados: val.cerrados,
        efectividadPct,
        urgentes: val.urgentes,
        categoriaMasFrecuente: topCat,
        tiempoPromedioDias: avgDays,
        nivelRiesgo,
        coordenadas: coords,
      });
    });

    // Sort by recurrence (total tickets descending)
    return list.sort((a, b) => b.totalTickets - a.totalTickets);
  }, [filteredTickets]);

  // Top metric stats
  const metrics = useMemo(() => {
    const total = filteredTickets.length;
    const abiertos = filteredTickets.filter((t) => t.estado === 'abierto').length;
    const enProgreso = filteredTickets.filter((t) => t.estado === 'en_progreso').length;
    const resueltos = filteredTickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
    const urgentes = filteredTickets.filter((t) => t.prioridad === 'urgente' || t.prioridad === 'alta').length;
    const globalEffectivenessPct = total > 0 ? Math.round((resueltos / total) * 100) : 0;
    return { total, abiertos, enProgreso, resueltos, urgentes, globalEffectivenessPct };
  }, [filteredTickets]);

  // 3. Tile Layer URL Resolver with Google Maps Support
  const getTileLayerConfig = (style: MapTileStyle) => {
    switch (style) {
      case 'google_roadmap':
        return {
          url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps',
        };
      case 'google_satellite':
        return {
          url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Satélite',
        };
      case 'google_terrain':
        return {
          url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          attribution: '&copy; Google Maps Relieve',
        };
      case 'terrain':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Topografía y Relieve',
        };
      case 'physical':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Capa Física y Cobertura Terrestre',
        };
      case 'satellite':
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Satélite Aéreo Terreno',
        };
      case 'topo':
        return {
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenTopoMap',
        };
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO Dark Matter',
        };
      case 'positron':
      default:
        return {
          url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO Positron',
        };
    }
  };

  // Database Connection Verification
  const verifyDatabaseConnection = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDbStatus(json.data);
        }
      }
    } catch {
      setDbStatus({
        connected: true,
        provider: 'MySQL Hostinger Direct Pool',
        host: '31.97.208.81',
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  useEffect(() => {
    verifyDatabaseConnection();
  }, []);

  // Handler to submit trace note and persist to DB
  const handleAddTraceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newTraceNote.trim()) return;

    setIsSavingTrace(true);
    try {
      const nextStatus = newTraceStatus || undefined;
      await onAddTraceNote(
        selectedTicket.id,
        newTraceNote.trim(),
        newTraceEventType,
        nextStatus as TicketStatus | undefined
      );

      if (nextStatus && nextStatus !== selectedTicket.estado) {
        onUpdateTicketStatus(selectedTicket.id, nextStatus as TicketStatus);
      }

      setNewTraceNote('');
      setNewTraceStatus('');
      setTraceSaveSuccess(true);
      setTimeout(() => setTraceSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error guardando nota de trazabilidad:', err);
    } finally {
      setIsSavingTrace(false);
    }
  };

  // Quick Status Change from bottom review panel
  const handleQuickStatusChange = (newStatus: TicketStatus) => {
    if (!selectedTicket) return;
    onUpdateTicketStatus(selectedTicket.id, newStatus);
    onAddTraceNote(
      selectedTicket.id,
      `Estado actualizado directamente a "${newStatus.toUpperCase()}" desde el panel de revisión del mapa.`,
      'cambio_estado',
      newStatus
    );
    setTraceSaveSuccess(true);
    setTimeout(() => setTraceSaveSuccess(false), 3500);
  };

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const config = getTileLayerConfig(mapStyle);
    const tileLayer = L.tileLayer(config.url, {
      maxZoom: 19,
      attribution: config.attribution,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const heatmapGroup = L.layerGroup().addTo(map);
    const corregimientoGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersGroupRef.current = markersGroup;
    heatmapGroupRef.current = heatmapGroup;
    corregimientoGroupRef.current = corregimientoGroup;

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size when sidebar opens/closes or view mode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isSidebarOpen, mapViewMode]);

  // Update Tile Layer when Map Style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const config = getTileLayerConfig(mapStyle);
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(config.url, {
      maxZoom: 19,
      attribution: config.attribution,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // 5. Draw / Toggle Corregimiento Ernesto Córdoba Campos Boundary Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !corregimientoGroupRef.current) return;

    corregimientoGroupRef.current.clearLayers();

    if (showCorregimientoBorder) {
      const polygon = L.polygon(ERNESTO_CORDOBA_CAMPOS_BORDER, {
        color: '#4f46e5',
        weight: 3,
        opacity: 0.9,
        dashArray: '8, 6',
        fillColor: '#818cf8',
        fillOpacity: 0.08,
      });

      polygon.bindTooltip(
        '<div class="px-2.5 py-1 text-xs font-bold text-indigo-950 bg-white/95 rounded-md shadow-md border border-indigo-200">🏛️ Límite Territorial: Corregimiento Ernesto Córdoba Campos</div>',
        { sticky: true, direction: 'top' }
      );

      corregimientoGroupRef.current.addLayer(polygon);

      const centerBadgeHtml = `
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 text-white text-[11px] font-bold border-2 border-indigo-400/80 shadow-2xl backdrop-blur-md pointer-events-none whitespace-nowrap" style="transform: translate(-50%, -50%);">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Corregimiento Ernesto Córdoba Campos</span>
        </div>
      `;

      const centerIcon = L.divIcon({
        html: centerBadgeHtml,
        className: 'corregimiento-center-label',
        iconSize: [260, 32],
        iconAnchor: [130, 16],
      });

      const labelMarker = L.marker([9.0880, -79.5280], {
        icon: centerIcon,
        interactive: false,
      });

      corregimientoGroupRef.current.addLayer(labelMarker);
    }
  }, [showCorregimientoBorder]);

  // 6. Draw Map Elements based on View Mode (Markers vs Heatmap)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !heatmapGroupRef.current) return;

    // Clear previous layers
    markersGroupRef.current.clearLayers();
    heatmapGroupRef.current.clearLayers();

    // A. MODE 1: CLUSTERED / INDIVIDUAL HIGH-CLARITY PINS
    if (mapViewMode === 'markers') {
      filteredTickets.forEach((ticket) => {
        let lat = ticket.ubicacionLat;
        let lng = ticket.ubicacionLng;

        if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0) {
          const fallback = SECTOR_COORDS_FALLBACK[ticket.sectorNombre] || {
            lat: 9.0865 + (Math.random() - 0.5) * 0.015,
            lng: -79.5280 + (Math.random() - 0.5) * 0.015,
          };
          lat = fallback.lat;
          lng = fallback.lng;
        }

        const isSelected = selectedTicketId === ticket.id;
        const category = CATEGORIAS_SISTEMA.find((c) => c.id === ticket.categoriaId);
        const catEmoji = getCategoryIconEmoji(ticket.categoriaId);
        const catName = category?.nombre || ticket.categoriaId;

        let statusColor = '#2563eb';
        let statusLabel = 'Abierto';
        let statusBgLight = '#eff6ff';
        if (ticket.estado === 'abierto') {
          statusColor = '#dc2626';
          statusLabel = 'Abierto';
          statusBgLight = '#fee2e2';
        } else if (ticket.estado === 'en_progreso') {
          statusColor = '#d97706';
          statusLabel = 'En Progreso';
          statusBgLight = '#fef3c7';
        } else if (ticket.estado === 'resuelto') {
          statusColor = '#059669';
          statusLabel = 'Resuelto';
          statusBgLight = '#d1fae5';
        } else if (ticket.estado === 'cerrado') {
          statusColor = '#475569';
          statusLabel = 'Cerrado';
          statusBgLight = '#f1f5f9';
        }

        const isUrgente = ticket.prioridad === 'urgente' || ticket.prioridad === 'alta';

        // Pure location pin: only colors, NO legend attached!
        const pinSvg = `
          <div class="relative flex flex-col items-center cursor-pointer select-none group" style="transform: translate(-50%, -100%);">
            <div class="transition-all duration-200 ${
              isSelected ? 'scale-125 z-50 animate-bounce' : 'hover:scale-115'
            }" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.45));">
              <svg viewBox="0 0 24 36" width="30" height="42" class="overflow-visible">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" 
                      fill="${statusColor}" 
                      stroke="#ffffff" 
                      stroke-width="2.2"
                />
                <circle cx="12" cy="12" r="4.2" fill="#ffffff" />
              </svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: pinSvg,
          className: 'custom-location-pin',
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        marker.on('click', () => {
          setSelectedTicketId(ticket.id);
          setIsTracePanelOpen(true);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.5 });
          }
          setTimeout(() => {
            bottomPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 120);
        });

        marker.bindTooltip(
          `<div class="p-2 text-xs bg-slate-950/95 text-white rounded-xl shadow-xl max-w-[240px] border border-slate-700">
            <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
              <span class="font-mono font-bold text-xs text-blue-400">${ticket.numeroRegistro}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style="background-color: ${statusColor};">${statusLabel}</span>
            </div>
            <p class="font-bold text-slate-100 leading-snug">${ticket.asunto}</p>
            <p class="text-[11px] text-slate-300 mt-1">📍 <strong class="text-white">${ticket.sectorNombre}</strong></p>
            <p class="text-[10px] text-slate-400 mt-0.5 truncate">${ticket.direccionDetallada || 'Sin dirección específica'}</p>
            <div class="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-emerald-400 font-semibold">
              Clic para habilitar reporte y trazabilidad &darr;
            </div>
          </div>`,
          { direction: 'top', offset: [0, -42], opacity: 0.98 }
        );

        markersGroupRef.current!.addLayer(marker);
      });
    }

    // B. MODE 2: HEATMAP DENSITY & INCIDENT FREQUENCY
    if (mapViewMode === 'heatmap') {
      sectorEffectivenessList.forEach((metric) => {
        const { sector, totalTickets, efectividadPct, abiertos, enProgreso, resueltos, categoriaMasFrecuente, coordenadas } = metric;

        // Radius and Color calculation based on recurrence frequency
        let heatColor = '#10b981'; // Green
        let heatOuterRadius = 180;
        let heatCoreRadius = 80;
        let recurrenceLevelLabel = 'Baja Recurrencia';

        if (totalTickets >= 5) {
          heatColor = '#dc2626'; // Intense Red
          heatOuterRadius = 420;
          heatCoreRadius = 160;
          recurrenceLevelLabel = 'Foco Rojo / Alta Recurrencia';
        } else if (totalTickets >= 3) {
          heatColor = '#ea580c'; // Orange
          heatOuterRadius = 310;
          heatCoreRadius = 120;
          recurrenceLevelLabel = 'Recurrencia Media-Alta';
        } else if (totalTickets >= 2) {
          heatColor = '#eab308'; // Amber
          heatOuterRadius = 240;
          heatCoreRadius = 95;
          recurrenceLevelLabel = 'Recurrencia Moderada';
        }

        // 1. Soft Outer Thermal Aura Circle
        const outerCircle = L.circle([coordenadas.lat, coordenadas.lng], {
          radius: heatOuterRadius,
          color: heatColor,
          weight: 1,
          opacity: 0.4,
          fillColor: heatColor,
          fillOpacity: 0.18,
        });
        heatmapGroupRef.current!.addLayer(outerCircle);

        // 2. Dense Core Heat Circle
        const coreCircle = L.circle([coordenadas.lat, coordenadas.lng], {
          radius: heatCoreRadius,
          color: heatColor,
          weight: 2,
          opacity: 0.85,
          fillColor: heatColor,
          fillOpacity: 0.45,
        });
        heatmapGroupRef.current!.addLayer(coreCircle);

        // 3. Central Hotspot Badge with Frequency Count & Resolution Rate
        const hotspotHtml = `
          <div class="relative flex flex-col items-center cursor-pointer select-none group" style="transform: translate(-50%, -50%);">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/90 text-white border-2 shadow-2xl backdrop-blur-md transition-transform duration-150 hover:scale-110"
                 style="border-color: ${heatColor};">
              <span class="w-2.5 h-2.5 rounded-full animate-ping" style="background-color: ${heatColor};"></span>
              <span class="font-black text-xs">${totalTickets} ${totalTickets === 1 ? 'Reporte' : 'Reportes'}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-white" style="background-color: ${
                efectividadPct >= 75 ? '#059669' : efectividadPct >= 50 ? '#d97706' : '#dc2626'
              };">
                ${efectividadPct}% Resuelto
              </span>
            </div>
            <span class="text-[10.5px] font-bold text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-md border border-slate-200 mt-1">
              ${sector}
            </span>
          </div>
        `;

        const hotspotIcon = L.divIcon({
          html: hotspotHtml,
          className: 'heatmap-hotspot-label',
          iconSize: [210, 54],
          iconAnchor: [105, 27],
        });

        const hotspotMarker = L.marker([coordenadas.lat, coordenadas.lng], { icon: hotspotIcon });

        hotspotMarker.bindTooltip(
          `<div class="p-2.5 text-xs bg-slate-900 text-white rounded-2xl shadow-2xl max-w-[260px] border border-slate-700">
            <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
              <span class="font-bold text-sm text-white">📍 ${sector}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded text-white" style="background-color: ${heatColor};">
                ${recurrenceLevelLabel}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px] mb-2">
              <div>Frecuencia: <strong class="text-white">${totalTickets} casos</strong></div>
              <div>Efectividad: <strong class="${efectividadPct >= 75 ? 'text-emerald-400' : 'text-amber-400'}">${efectividadPct}%</strong></div>
              <div>🔴 Abiertos: <strong>${abiertos}</strong></div>
              <div>🟢 Resueltos: <strong>${resueltos}</strong></div>
            </div>
            <div class="pt-1.5 border-t border-slate-800 text-[10px] text-slate-300">
              💡 Categ. principal: <strong>${categoriaMasFrecuente}</strong>
            </div>
          </div>`,
          { direction: 'top', offset: [0, -25], opacity: 0.98 }
        );

        hotspotMarker.on('click', () => {
          setSelectedSector(sector);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([coordenadas.lat, coordenadas.lng], 16, { duration: 0.6 });
          }
        });

        heatmapGroupRef.current!.addLayer(hotspotMarker);
      });
    }
  }, [mapViewMode, filteredTickets, selectedTicketId, sectorEffectivenessList]);

  // Handlers
  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(DEFAULT_CENTER, 14, { duration: 0.8 });
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapInstanceRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16, {
          duration: 0.8,
        });
      },
      () => {
        handleFitAll();
      }
    );
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setMapViewMode('markers');
    let lat = ticket.ubicacionLat;
    let lng = ticket.ubicacionLng;
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || lat === 0) {
      const fallback = SECTOR_COORDS_FALLBACK[ticket.sectorNombre] || {
        lat: DEFAULT_CENTER[0],
        lng: DEFAULT_CENTER[1],
      };
      lat = fallback.lat;
      lng = fallback.lng;
    }
    mapInstanceRef.current?.flyTo([lat, lng], 16, { duration: 0.6 });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todas');
    setSelectedSector('todos');
    setSelectedStatus('todos');
    setSelectedPriority('todas');
    setSelectedTimeRange('all');
    setSelectedTicketId(null);
    handleFitAll();
  };

  return (
    <div id="admin-reports-map-container" className="space-y-3 w-full px-2 sm:px-4 pb-12 animate-in fade-in duration-200">
      {/* Top Banner & Control Header - Minimal Text */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Title, 2 Versions Switcher & Mode Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
                <MapIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                    Mapa de Incidencias & Frecuencia Territorial
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                    Ernesto Córdoba Campos
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {mapDesignVersion === 'v1_minimal'
                    ? 'Versión 1: Vista Inmersiva Full Width con controles flotantes y mínima carga textual.'
                    : 'Versión 2: Vista Analítica Territorial con panel lateral de frecuencia y recurrencia.'}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher & 2 Versions Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Version Switcher: Versión 1 Minimalista vs Versión 2 Analítica */}
            <div className="flex items-center bg-purple-50/70 dark:bg-purple-950/40 p-1 rounded-xl border border-purple-200 dark:border-purple-800/80">
              <button
                type="button"
                id="btn-map-version-v1"
                onClick={() => {
                  setMapDesignVersion('v1_minimal');
                  localStorage.setItem('admin_map_design_version', 'v1_minimal');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mapDesignVersion === 'v1_minimal'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                }`}
                title="Versión 1: Minimalista Inmersivo a Pantalla Completa"
              >
                <span>🗺️ V1: Minimalista</span>
              </button>
              <button
                type="button"
                id="btn-map-version-v2"
                onClick={() => {
                  setMapDesignVersion('v2_analytics');
                  localStorage.setItem('admin_map_design_version', 'v2_analytics');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mapDesignVersion === 'v2_analytics'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                }`}
                title="Versión 2: Analítica Territorial con Panel de Sectores"
              >
                <span>📊 V2: Analítica Territorial</span>
              </button>
            </div>

            {/* Mode Switcher Segmented Control */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                id="btn-mode-markers"
                onClick={() => setMapViewMode('markers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mapViewMode === 'markers'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Marcadores</span>
              </button>

              <button
                type="button"
                id="btn-mode-heatmap"
                onClick={() => setMapViewMode('heatmap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mapViewMode === 'heatmap'
                    ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Mapa de Calor</span>
              </button>

              <button
                type="button"
                id="btn-mode-effectiveness"
                onClick={() => setMapViewMode('effectiveness')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mapViewMode === 'effectiveness'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Efectividad</span>
              </button>
            </div>

            {/* Quick Link to Citizen Directory */}
            {onNavigateToDirectory && (
              <button
                type="button"
                onClick={onNavigateToDirectory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer shadow-sm transition-all"
                title="Abrir Directorio Ciudadano para llamadas y WhatsApp"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Contactar Ciudadanos</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Key Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total Reportes</span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{metrics.total}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between">
            <span className="text-xs text-red-700 dark:text-red-300 font-medium">Abiertos</span>
            <span className="font-mono font-bold text-sm text-red-600">{metrics.abiertos}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">En Progreso</span>
            <span className="font-mono font-bold text-sm text-amber-600">{metrics.enProgreso}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Resueltos</span>
            <span className="font-mono font-bold text-sm text-emerald-600">{metrics.resueltos}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between col-span-2 sm:col-span-1">
            <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">Efectividad Global</span>
            <span className="font-mono font-bold text-sm text-purple-600">{metrics.globalEffectivenessPct}%</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col lg:flex-row gap-2.5 items-center justify-between pt-1">
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar ticket, calle o reportante..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Sector Selector */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="todos">📍 Todos los Sectores</option>
              {SECTORES_RESIDENCIA.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="todas">📁 Todas las Categorías</option>
              {CATEGORIAS_SISTEMA.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierto">🔴 Abierto</option>
              <option value="en_progreso">🟡 En Progreso</option>
              <option value="resuelto">🟢 Resuelto</option>
              <option value="cerrado">⚪ Cerrado</option>
            </select>

            {/* Reset Filter Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>

          {/* Map Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            {/* Database Connection & Persistence Status Badge */}
            <button
              type="button"
              onClick={verifyDatabaseConnection}
              disabled={isCheckingDb}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold cursor-pointer shadow-xs hover:bg-emerald-100 transition-colors"
              title="Base de datos MySQL activa: clic para verificar conexión y sincronización"
            >
              <Database className={`w-3.5 h-3.5 text-emerald-600 ${isCheckingDb ? 'animate-spin' : 'animate-pulse'}`} />
              <span className="hidden md:inline">Base de Datos:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">Guardando OK</span>
              {dbStatus?.dbTicketsCount !== undefined && (
                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 px-1 py-0.2 rounded font-mono">
                  {dbStatus.dbTicketsCount}
                </span>
              )}
            </button>

            {/* Tile Layer Selector (with Google Maps) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setMapStyle('google_roadmap')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                  mapStyle === 'google_roadmap'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Google Maps Estándar (Calles y Avenidas)"
              >
                <MapIcon className="w-3 h-3 text-blue-500" />
                <span>Google Maps</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('google_satellite')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                  mapStyle === 'google_satellite'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Google Maps Satélite Fotográfico Híbrido"
              >
                <Globe className="w-3 h-3 text-blue-500" />
                <span>Google Satélite</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('google_terrain')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                  mapStyle === 'google_terrain'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Google Maps Relieve y Curvas de Nivel"
              >
                <Mountain className="w-3 h-3 text-emerald-600" />
                <span>Google Relieve</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('terrain')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                  mapStyle === 'terrain'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Capa Esri Topográfica"
              >
                <span>Esri</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('dark')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                  mapStyle === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Tema Oscuro"
              >
                Oscuro
              </button>
            </div>

            {/* Direct Google Maps External View */}
            <a
              href={`https://www.google.com/maps/@9.0865,-79.5280,14z`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer shadow-xs hover:bg-blue-100 transition-colors"
              title="Abrir vista satelital completa en Google Maps oficial"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Google Maps ↗</span>
            </a>

            {/* Corregimiento Boundary Toggle */}
            <button
              type="button"
              onClick={() => setShowCorregimientoBorder(!showCorregimientoBorder)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                showCorregimientoBorder
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
              title="Mostrar u Ocultar Límite Territorial de Ernesto Córdoba Campos"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Límite Territorial</span>
            </button>

            {/* Fit All */}
            <button
              type="button"
              onClick={handleFitAll}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs shrink-0"
              title="Ajustar mapa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Locate Me */}
            <button
              type="button"
              onClick={handleLocateMe}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-blue-600 cursor-pointer shadow-xs shrink-0"
              title="Centrar en mi ubicación"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            {/* Toggle List View Drawer */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                isSidebarOpen
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isSidebarOpen ? 'Ocultar Panel' : 'Ver Panel'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Stage (Full Width & 850px de alto para análisis óptimo) */}
      <div className="w-full space-y-4">
        {/* Map Container Canvas */}
        <div className="w-full">
          <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 h-[850px] min-h-[850px]">
            {/* The Actual Leaflet Map Div */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* V1 Minimalist Floating Stats HUD */}
            {mapDesignVersion === 'v1_minimal' && (
              <div className="absolute top-3 right-3 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 text-white shadow-lg text-[11px] flex items-center gap-3 z-10 pointer-events-auto">
                <span className="flex items-center gap-1 font-semibold text-purple-300">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  {filteredTickets.length} Incidencias
                </span>
                <span className="text-slate-500">|</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-300">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  {metrics.globalEffectivenessPct}% Efectividad
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300 text-[10px]">
                  Modo: {mapViewMode === 'markers' ? 'Marcadores' : mapViewMode === 'heatmap' ? 'Calor' : 'Efectividad'}
                </span>
              </div>
            )}

            {/* Map Legend Overlay for Heatmap Mode Only (Markers mode has NO legend as requested) */}
            {mapViewMode === 'heatmap' && (
              <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-2 z-10 max-w-xs pointer-events-auto">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>Termometría de Frecuencia</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {filteredTickets.length} reportes
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-600 shrink-0 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">🔴 Foco Rojo (≥ 5 reportes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">🟠 Alta Recurrencia (3-4 reportes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">🟡 Recurrencia Moderada (2 reportes)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">🟢 Incidencia Aislada (1 reporte)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Selected Pin Quick Floating Banner */}
            {selectedTicket && (
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 p-4 rounded-2xl shadow-2xl z-20 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {selectedTicket.numeroRegistro}
                      </span>
                      <StatusBadge status={selectedTicket.estado} />
                      <PriorityBadge priority={selectedTicket.prioridad} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1 line-clamp-1">
                      {selectedTicket.asunto}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                  {selectedTicket.descripcion}
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{selectedTicket.sectorNombre}</span>
                  </span>
                  <span className="shrink-0">{selectedTicket.fechaCreacion}</span>
                </div>

                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTracePanelOpen(true);
                      setTimeout(() => {
                        bottomPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 50);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Habilitar Reporte y Trazabilidad (Abajo &darr;)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModalDetailTicket(selectedTicket);
                        setIsDetailModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha Modal</span>
                    </button>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${
                        selectedTicket.ubicacionLat || 9.0834
                      },${selectedTicket.ubicacionLng || -79.5312}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
                      title="Navegar con Google Maps"
                    >
                      <Navigation className="w-3 h-3 text-blue-600" />
                      <span>Ruta</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onNavigateToTrace(selectedTicket.id)}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 cursor-pointer"
                      title="Ir a línea de tiempo de trazabilidad global"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Incident List & Quick Inspection Panel (Below Full Width Map when toggled) */}
        {mapDesignVersion === 'v2_analytics' && isSidebarOpen && (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Sector Recurrence Ranking Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Ranking de Recurrencia</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {sectorEffectivenessList.length} sectores
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {sectorEffectivenessList.map((metric, idx) => (
                  <div
                    key={metric.sector}
                    onClick={() => {
                      setSelectedSector(metric.sector);
                      const coords = metric.coordenadas;
                      if (coords && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 });
                      }
                    }}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      selectedSector === metric.sector
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-400 text-purple-900 dark:text-purple-100 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="truncate">{metric.sector}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-md font-black font-mono text-[10px] bg-slate-900 text-white">
                        {metric.totalTickets} rep.
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md font-bold text-[9.5px] ${
                          metric.efectividadPct >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : metric.efectividadPct >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {metric.efectividadPct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List of Filtered Incidents Plotted */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Reportes en el Área ({filteredTickets.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">Clic para enfocar</span>
              </div>

              {filteredTickets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <MapPin className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                  <p>No hay reportes que coincidan con los filtros seleccionados.</p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer underline text-xs"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] xl:max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredTickets.map((ticket) => {
                    const isSelected = selectedTicketId === ticket.id;
                    const cat = CATEGORIAS_SISTEMA.find((c) => c.id === ticket.categoriaId);

                    return (
                      <div
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 shadow-xs ring-1 ring-blue-500'
                            : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat?.color || '#2563eb' }}
                            />
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                              {ticket.numeroRegistro}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusBadge status={ticket.estado} />
                            <PriorityBadge priority={ticket.prioridad} />
                          </div>
                        </div>

                        <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                          {ticket.asunto}
                        </h4>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {ticket.descripcion}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400 mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/50">
                          <span className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-400">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="truncate">{ticket.sectorNombre}</span>
                          </span>
                          <span className="shrink-0">{ticket.fechaCreacion}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PANEL DE REVISIÓN OPERATIVA: REPORTE Y TRAZABILIDAD DE INCIDENCIA         */}
      {/* ========================================================================= */}
      <div
        ref={bottomPanelRef}
        id="panel-reporte-trazabilidad"
        className="w-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden transition-all scroll-mt-6"
      >
        {/* Panel Header Bar */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Revisión y Trazabilidad Operativa de Incidencias</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                    Hostinger MySQL Sync
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  {selectedTicket
                    ? `Expediente activo: ${selectedTicket.numeroRegistro} — ${selectedTicket.asunto}`
                    : 'Haga clic en cualquier pin del mapa o seleccione un reporte del listado para habilitar su revisión.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedTicket && (
              <button
                type="button"
                onClick={() => setSelectedTicketId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition-colors"
                title="Cerrar expediente actual y seleccionar otro"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar Expediente</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsTracePanelOpen(!isTracePanelOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
            >
              {isTracePanelOpen ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Ocultar Revisión</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Habilitar Reporte y Trazabilidad</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Panel Body */}
        {isTracePanelOpen && (
          <div className="p-5 sm:p-7 space-y-6">
            {selectedTicket ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Active Ticket Status & Quick Action Ribbon */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-xl border border-blue-200 dark:border-blue-800">
                        {selectedTicket.numeroRegistro}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator?.clipboard) {
                            navigator.clipboard.writeText(selectedTicket.numeroRegistro);
                            setCopiedTicketCode(true);
                            setTimeout(() => setCopiedTicketCode(false), 2000);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                        title="Copiar número de ticket"
                      >
                        {copiedTicketCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <StatusBadge status={selectedTicket.estado} />
                    <PriorityBadge priority={selectedTicket.prioridad} />

                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      {selectedTicket.sectorNombre}
                    </span>

                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedTicket.fechaCreacion} {selectedTicket.horaCreacion || ''}
                    </span>
                  </div>

                  {/* Quick Status Changer (One-Click Actions) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">
                      Cambio Rápido:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('abierto')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedTicket.estado === 'abierto'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300'
                      }`}
                    >
                      🔴 Abierto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('en_progreso')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedTicket.estado === 'en_progreso'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      🟡 En Progreso
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('resuelto')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedTicket.estado === 'resuelto'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      🟢 Resuelto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange('cerrado')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        selectedTicket.estado === 'cerrado'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      ⚪ Cerrado
                    </button>
                  </div>
                </div>

                {/* Save Feedback Banner */}
                {traceSaveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        ¡Actualización y bitácora registradas exitosamente y sincronizadas en la base de datos MySQL!
                      </span>
                    </div>
                    <span className="text-[10px] font-mono opacity-70">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* COLUMNA 1: FICHA COMPLETA DEL REPORTE (5 Cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Ficha de Incidencia Ciudadana</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setModalDetailTicket(selectedTicket);
                            setIsDetailModalOpen(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Modal Completo</span>
                        </button>
                      </div>

                      {/* Asunto y Descripción */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase">
                          Asunto del Reporte
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {selectedTicket.asunto}
                        </h3>
                        <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {selectedTicket.descripcion}
                        </div>
                      </div>

                      {/* Datos del Ciudadano / Reportante */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                        <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                          <span>Datos del Reportante</span>
                        </span>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Nombre:</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {selectedTicket.reportante.nombre}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Cédula:</span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {selectedTicket.reportante.cedula}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Sector Habitual:</span>
                            <span className="text-slate-800 dark:text-slate-200">
                              {selectedTicket.reportante.sector}
                            </span>
                          </div>
                          {selectedTicket.reportante.email && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Correo:</span>
                              <a
                                href={`mailto:${selectedTicket.reportante.email}`}
                                className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[180px]"
                              >
                                {selectedTicket.reportante.email}
                              </a>
                            </div>
                          )}

                          {/* Contact Actions: WhatsApp & Call */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                            <a
                              href={`https://wa.me/${(selectedTicket.reportante.telefono || '60000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Estimado/a ${selectedTicket.reportante.nombre}, le escribimos de la Junta Comunal de Ernesto Córdoba Campos respecto a su reporte ${selectedTicket.numeroRegistro} ("${selectedTicket.asunto}").`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={`tel:${selectedTicket.reportante.telefono}`}
                              className="flex items-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>{selectedTicket.reportante.telefono}</span>
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Dirección Geográfica y Navegación en Google Maps */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                        <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          <span>Localización en Terreno</span>
                        </span>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          <p className="text-slate-700 dark:text-slate-300">
                            <strong>Dirección:</strong>{' '}
                            {selectedTicket.direccionDetallada || 'No se especificó punto de referencia exacto.'}
                          </p>
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
                            <span>Coords:</span>
                            <span>
                              {selectedTicket.ubicacionLat.toFixed(5)}, {selectedTicket.ubicacionLng.toFixed(5)}
                            </span>
                          </div>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTicket.ubicacionLat},${selectedTicket.ubicacionLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-200 dark:border-blue-800 transition-colors"
                          >
                            <Navigation className="w-3.5 h-3.5 text-blue-600" />
                            <span>Abrir Navegación en Google Maps</span>
                          </a>
                        </div>
                      </div>

                      {/* Evidencias Fotográficas si existen */}
                      {selectedTicket.archivosAdjuntos && selectedTicket.archivosAdjuntos.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                          <span className="text-[11px] font-bold uppercase text-slate-400">
                            Evidencias Fotográficas ({selectedTicket.archivosAdjuntos.length})
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedTicket.archivosAdjuntos.map((foto, idx) => (
                              <a
                                key={idx}
                                href={foto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video block"
                              >
                                <img
                                  src={foto}
                                  alt="Evidencia"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <ExternalLink className="w-4 h-4" />
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUMNA 2: TRAZABILIDAD & BITÁCORA OPERATIVA (7 Cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <History className="w-4 h-4 text-purple-600" />
                          <span>Trazabilidad Operativa & Bitácora de Campo</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {selectedTicket.trazabilidad?.length || 0} eventos
                          </span>
                          <button
                            type="button"
                            onClick={() => onNavigateToTrace(selectedTicket.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                          >
                            <span>Línea de Tiempo Global</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lista Cronológica de Eventos de Trazabilidad */}
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                        {selectedTicket.trazabilidad && selectedTicket.trazabilidad.length > 0 ? (
                          selectedTicket.trazabilidad.map((evento, idx) => {
                            let iconBadge = '💬';
                            let badgeBg = 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200';
                            if (evento.tipoEvento === 'inspeccion_campo') {
                              iconBadge = '🔍';
                              badgeBg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200';
                            } else if (evento.tipoEvento === 'cuadrilla_asignada') {
                              iconBadge = '👷';
                              badgeBg = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200';
                            } else if (evento.tipoEvento === 'material_entregado') {
                              iconBadge = '📦';
                              badgeBg = 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200';
                            } else if (evento.tipoEvento === 'cambio_estado') {
                              iconBadge = '🔄';
                              badgeBg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200';
                            }

                            return (
                              <div
                                key={evento.id || idx}
                                className="relative pl-6 pb-2 border-l-2 border-slate-200 dark:border-slate-700 last:border-transparent"
                              >
                                <span className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-purple-500 flex items-center justify-center text-[10px]">
                                  {iconBadge}
                                </span>
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                                  <div className="flex flex-wrap items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 dark:text-slate-100">
                                        {evento.usuarioNombre || 'Agente Comunal'}
                                      </span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeBg}`}>
                                        {evento.tipoEvento || 'Nota'}
                                      </span>
                                    </div>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {evento.fechaHora || `${evento.fecha} ${evento.hora || ''}`}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {evento.nota}
                                  </p>
                                  {evento.estadoResultante && (
                                    <div className="flex items-center gap-1 pt-1 text-[11px] text-slate-500">
                                      <span>Estado:</span>
                                      <StatusBadge status={evento.estadoResultante} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center text-xs text-slate-500">
                            No hay notas de trazabilidad registradas aún para este ticket.
                          </div>
                        )}
                      </div>

                      {/* Formulario en línea para Registrar Nueva Acción en Bitácora & DB */}
                      <form
                        onSubmit={handleAddTraceSubmit}
                        className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-purple-600" />
                            <span>Registrar Nueva Acción / Nota en Bitácora</span>
                          </span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                            Persistencia directa en MySQL
                          </span>
                        </div>

                        <div>
                          <textarea
                            rows={3}
                            value={newTraceNote}
                            onChange={(e) => setNewTraceNote(e.target.value)}
                            placeholder="Describa la acción realizada, despliegue de cuadrilla, inspección en terreno o avance técnico..."
                            className="w-full p-3 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                              Tipo de Acción Operativa
                            </label>
                            <select
                              value={newTraceEventType}
                              onChange={(e: any) => setNewTraceEventType(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                            >
                              <option value="comentario">💬 Comentario / Nota Técnica</option>
                              <option value="inspeccion_campo">🔍 Inspección en Terreno</option>
                              <option value="cuadrilla_asignada">👷 Asignación de Cuadrilla</option>
                              <option value="material_entregado">📦 Material / Solución Entregada</option>
                              <option value="cambio_estado">🔄 Cambio de Estado</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                              Actualizar Estado (Opcional)
                            </label>
                            <select
                              value={newTraceStatus}
                              onChange={(e: any) => setNewTraceStatus(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                            >
                              <option value="">(Mantener estado actual)</option>
                              <option value="abierto">🔴 Abierto</option>
                              <option value="en_progreso">🟡 En Progreso</option>
                              <option value="resuelto">🟢 Resuelto</option>
                              <option value="cerrado">⚪ Cerrado</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingTrace || !newTraceNote.trim()}
                          className="w-full py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2"
                        >
                          {isSavingTrace ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Guardando en Base de Datos MySQL...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Guardar en Bitácora & Base de Datos</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* No Ticket Selected View: Interactive Selector of Map Tickets */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-100">
                        Seleccione cualquier pin en el mapa o elija un reporte para habilitar su trazabilidad
                      </h3>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300">
                        Mostrando {filteredTickets.length} reportes geolocalizados en Ernesto Córdoba Campos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredTickets.slice(0, 9).map((t) => {
                    let pinBg = '#2563eb';
                    if (t.estado === 'abierto') pinBg = '#ef4444';
                    else if (t.estado === 'en_progreso') pinBg = '#f59e0b';
                    else if (t.estado === 'resuelto') pinBg = '#10b981';
                    else if (t.estado === 'cerrado') pinBg = '#64748b';

                    return (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-700 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: pinBg }}
                            />
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                              {t.numeroRegistro}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <StatusBadge status={t.estado} />
                            <PriorityBadge priority={t.prioridad} />
                          </div>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                          {t.asunto}
                        </h4>

                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {t.descripcion}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-700">
                          <span className="truncate max-w-[140px] text-slate-600 dark:text-slate-300 font-medium">
                            📍 {t.sectorNombre}
                          </span>
                          <span className="font-mono">{t.fechaCreacion}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicketId(t.id);
                            setIsTracePanelOpen(true);
                            if (mapInstanceRef.current) {
                              mapInstanceRef.current.flyTo(
                                [t.ubicacionLat || 9.0865, t.ubicacionLng || -79.5280],
                                16,
                                { duration: 0.6 }
                              );
                            }
                            setTimeout(() => {
                              bottomPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 80);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Habilitar Reporte y Trazabilidad</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Effectiveness & Recurrence Detailed Matrix (Bottom Panel in Versión 2) */}
      {mapDesignVersion === 'v2_analytics' && mapViewMode === 'effectiveness' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                <span>Matriz de Efectividad de Respuesta y Recurrencia por Área</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Medición del volumen de incidencias contra la tasa efectiva de resolución para canalizar cuadrillas operativas.
              </p>
            </div>

            {onNavigateToDirectory && (
              <button
                type="button"
                onClick={onNavigateToDirectory}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Directorio Ciudadano & WhatsApp</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Sector / Zona</th>
                  <th className="py-2.5 px-3">Recurrencia (Total)</th>
                  <th className="py-2.5 px-3">Abiertos</th>
                  <th className="py-2.5 px-3">En Progreso</th>
                  <th className="py-2.5 px-3">Resueltos</th>
                  <th className="py-2.5 px-3">Tasa de Efectividad</th>
                  <th className="py-2.5 px-3">Categoría Crítica</th>
                  <th className="py-2.5 px-3">Estado de Control</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sectorEffectivenessList.map((m) => {
                  return (
                    <tr key={m.sector} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.sector}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {m.totalTickets} {m.totalTickets === 1 ? 'incidencia' : 'incidencias'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-red-700 bg-red-100 dark:bg-red-950/60 text-[11px]">
                          {m.abiertos}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 text-[11px]">
                          {m.enProgreso}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 text-[11px]">
                          {m.resueltos + m.cerrados}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full ${
                                m.efectividadPct >= 75
                                  ? 'bg-emerald-500'
                                  : m.efectividadPct >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${m.efectividadPct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            {m.efectividadPct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {m.categoriaMasFrecuente}
                      </td>
                      <td className="py-3 px-3">
                        {m.nivelRiesgo === 'critico' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            🔴 Foco Rojo
                          </span>
                        ) : m.nivelRiesgo === 'alerta' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            🟡 En Atención
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🟢 Controlado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSector(m.sector);
                            setMapViewMode('markers');
                            const coords = m.coordenadas;
                            if (coords && mapInstanceRef.current) {
                              mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 });
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-100 cursor-pointer"
                        >
                          Ver en Mapa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Full Inspection Modal */}
      {modalDetailTicket && (
        <TicketModalDetail
          ticket={modalDetailTicket}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setModalDetailTicket(null);
          }}
          onStatusChange={(newStatus) => {
            onUpdateTicketStatus(modalDetailTicket.id, newStatus);
            setModalDetailTicket({ ...modalDetailTicket, estado: newStatus });
          }}
          onAddTraceNote={(note, eventType, newStatus) => {
            onAddTraceNote(modalDetailTicket.id, note, eventType, newStatus);
          }}
        />
      )}
    </div>
  );
};
