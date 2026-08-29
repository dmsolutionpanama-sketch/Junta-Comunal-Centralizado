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

// Base coordinates for center of Panama Norte / Las Cumbres jurisdiction
const DEFAULT_CENTER: [number, number] = [9.0865, -79.5280];

type MapTileStyle = 'terrain' | 'physical' | 'satellite' | 'topo' | 'positron' | 'dark';

export const AdminReportsMapView: React.FC<AdminReportsMapViewProps> = ({
  tickets,
  currentUser,
  onUpdateTicketStatus,
  onAddTraceNote,
  onNavigateToTrace,
}) => {
  const isSuperiorAdmin = currentUser?.rol === 'administrador';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedPriority, setSelectedPriority] = useState<string>('todas');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Map & UI State
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('terrain');
  const [showDensityClusters, setShowDensityClusters] = useState(true);
  const [showCorregimientoBorder, setShowCorregimientoBorder] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [modalDetailTicket, setModalDetailTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Map container and Leaflet instances refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const corregimientoGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. RBAC Guard: If not admin, block rendering
  if (!isSuperiorAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Acceso Restringido para Administradores
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          La vista cartográfica satelital y el mapa georreferenciado de reportes en tiempo real están reservados para personal con rol de <strong>Administrador</strong>.
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

  // Top metric stats
  const metrics = useMemo(() => {
    const total = filteredTickets.length;
    const abiertos = filteredTickets.filter((t) => t.estado === 'abierto').length;
    const enProgreso = filteredTickets.filter((t) => t.estado === 'en_progreso').length;
    const resueltos = filteredTickets.filter((t) => t.estado === 'resuelto').length;
    const urgentes = filteredTickets.filter((t) => t.prioridad === 'urgente' || t.prioridad === 'alta').length;
    return { total, abiertos, enProgreso, resueltos, urgentes };
  }, [filteredTickets]);

  // 3. Tile Layer URL Resolver (100% Free Open Layers, No API Key Required)
  const getTileLayerConfig = (style: MapTileStyle) => {
    switch (style) {
      case 'terrain':
        // ESRI World Topographic Map - Relief, vegetation, elevation and soil colors
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Topografía y Relieve',
        };
      case 'physical':
        // ESRI World Physical Map - Natural land cover, biogeography and terrain elevations
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Capa Física y Cobertura Terrestre',
        };
      case 'satellite':
        // ESRI High-Resolution Satellite & Aerial Imagery
        return {
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          attribution: 'Tiles &copy; Esri &mdash; Satélite Aéreo Terreno',
        };
      case 'topo':
        // OpenTopoMap - Detailed topography and contours
        return {
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap, SRTM &copy; OpenTopoMap',
        };
      case 'dark':
        // Carto Dark Matter
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO &copy; OpenStreetMap',
        };
      case 'positron':
      default:
        // Carto Voyager
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          attribution: '&copy; CARTO &copy; OpenStreetMap',
        };
    }
  };

  // 4. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom positioned zoom controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const config = getTileLayerConfig(mapStyle);
    const tileLayer = L.tileLayer(config.url, {
      maxZoom: 19,
      attribution: config.attribution,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const corregimientoGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersGroupRef.current = markersGroup;
    corregimientoGroupRef.current = corregimientoGroup;

    // Trigger map invalidation on window resize
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

  // Invalidate map size when sidebar opens/closes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

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
      // Boundary Polygon
      const polygon = L.polygon(ERNESTO_CORDOBA_CAMPOS_BORDER, {
        color: '#4f46e5', // Indigo border
        weight: 3,
        opacity: 0.9,
        dashArray: '8, 6',
        fillColor: '#818cf8',
        fillOpacity: 0.1,
      });

      polygon.bindTooltip(
        '<div class="px-2.5 py-1 text-xs font-bold text-indigo-950 bg-white/95 rounded-md shadow-md border border-indigo-200">🏛️ Límite Territorial: Corregimiento Ernesto Córdoba Campos</div>',
        { sticky: true, direction: 'top' }
      );

      corregimientoGroupRef.current.addLayer(polygon);

      // Central Territorial Badge Marker
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

  // 6. Draw High-Clarity Markers on the Map whenever filteredTickets or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    const bounds: L.LatLngTuple[] = [];

    filteredTickets.forEach((ticket) => {
      // Determine valid lat/lng
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

      bounds.push([lat, lng]);

      const isSelected = selectedTicketId === ticket.id;

      // Color and Category Mapping
      const category = CATEGORIAS_SISTEMA.find((c) => c.id === ticket.categoriaId);
      const catEmoji = getCategoryIconEmoji(ticket.categoriaId);
      const catName = category?.nombre || ticket.categoriaId;

      let statusColor = '#2563eb';
      let statusLabel = 'Abierto';
      let statusBgLight = '#eff6ff';
      if (ticket.estado === 'abierto') {
        statusColor = '#dc2626'; // Red
        statusLabel = 'Abierto';
        statusBgLight = '#fee2e2';
      } else if (ticket.estado === 'en_progreso') {
        statusColor = '#d97706'; // Amber
        statusLabel = 'En Progreso';
        statusBgLight = '#fef3c7';
      } else if (ticket.estado === 'resuelto') {
        statusColor = '#059669'; // Emerald
        statusLabel = 'Resuelto';
        statusBgLight = '#d1fae5';
      } else if (ticket.estado === 'cerrado') {
        statusColor = '#475569'; // Slate
        statusLabel = 'Cerrado';
        statusBgLight = '#f1f5f9';
      }

      const isUrgente = ticket.prioridad === 'urgente' || ticket.prioridad === 'alta';

      // Ultra-Clear High-Contrast Map Pin Card
      const customHtml = `
        <div class="relative flex flex-col items-center cursor-pointer select-none group" style="transform: translate(-50%, -100%);">
          <!-- Main Pin Box -->
          <div class="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border-2 shadow-2xl transition-all duration-200 ${
            isSelected
              ? 'scale-115 ring-4 ring-blue-500 shadow-blue-500/50 z-50'
              : 'hover:scale-105'
          }" style="border-color: ${statusColor}; min-width: 126px; max-width: 175px;">
            
            <!-- Category Icon Glyph -->
            <div class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 shadow-xs font-bold"
                 style="background-color: ${statusBgLight}; border: 1.5px solid ${statusColor};">
              <span>${catEmoji}</span>
            </div>

            <!-- Text Data (High Contrast Crisp Bold) -->
            <div class="flex flex-col text-left leading-tight min-w-0 pr-0.5">
              <div class="flex items-center gap-1">
                <span class="font-mono font-black text-[12.5px] text-slate-950 tracking-tight">${ticket.numeroRegistro}</span>
                ${isUrgente ? '<span class="text-[8.5px] font-black px-1 py-0.5 rounded bg-red-600 text-white uppercase leading-none">Urgente</span>' : ''}
              </div>
              <span class="text-[10px] font-bold text-slate-600 truncate max-w-[110px]" title="${catName}">
                ${catName}
              </span>
            </div>
          </div>

          <!-- Pointer Beak Arrow -->
          <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px]"
               style="border-t-color: ${statusColor}; margin-top: -1px;"></div>

          <!-- Anchor Base Point -->
          <div class="w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm" style="background-color: ${statusColor}; margin-top: -3px;"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: customHtml,
        className: 'custom-clear-marker',
        iconSize: [140, 52],
        iconAnchor: [70, 52],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Click event
      marker.on('click', () => {
        setSelectedTicketId(ticket.id);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat!, lng!], 16, { duration: 0.8 });
        }
      });

      // Rich Tooltip
      marker.bindTooltip(
        `<div class="p-2 text-xs bg-white text-slate-900 rounded-xl shadow-xl max-w-[240px] border border-slate-200">
          <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1 mb-1.5">
            <span class="font-mono font-black text-sm text-slate-950">${ticket.numeroRegistro}</span>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style="background-color: ${statusColor};">${statusLabel}</span>
          </div>
          <p class="font-bold text-slate-800 leading-snug">${ticket.asunto}</p>
          <p class="text-[11px] text-slate-600 mt-1">📍 <strong class="text-slate-800">${ticket.sectorNombre}</strong></p>
          <p class="text-[10px] text-slate-400 mt-0.5 truncate">${ticket.direccionDetallada || 'Sin dirección específica'}</p>
          <div class="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-blue-600 font-semibold">
            <span>👤 ${ticket.reportante.nombre}</span>
            <span>Clic para detalles &rarr;</span>
          </div>
        </div>`,
        { direction: 'top', offset: [0, -48], opacity: 0.98 }
      );

      markersGroupRef.current!.addLayer(marker);
    });

    // Auto-fit bounds if we have points and not currently focusing a specific ticket
    if (bounds.length > 0 && !selectedTicketId) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filteredTickets, selectedTicketId]);

  // Center on specific ticket when selected
  const handleSelectTicket = (t: Ticket) => {
    setSelectedTicketId(t.id);
    const lat = t.ubicacionLat || SECTOR_COORDS_FALLBACK[t.sectorNombre]?.lat || DEFAULT_CENTER[0];
    const lng = t.ubicacionLng || SECTOR_COORDS_FALLBACK[t.sectorNombre]?.lng || DEFAULT_CENTER[1];
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.8 });
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('todas');
    setSelectedSector('todos');
    setSelectedStatus('todos');
    setSelectedPriority('todas');
    setSelectedTimeRange('all');
    setSelectedTicketId(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(DEFAULT_CENTER, 14, { duration: 0.8 });
    }
  };

  // Locate Current Admin GPS Location
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 16, { duration: 1.0 });

        // Add a temporary blue pulse circle
        const circle = L.circleMarker([latitude, longitude], {
          radius: 10,
          color: '#3B82F6',
          fillColor: '#60A5FA',
          fillOpacity: 0.8,
        }).addTo(mapInstanceRef.current!);

        circle.bindTooltip('Tu ubicación GPS actual', { permanent: true, direction: 'top' });
        setTimeout(() => {
          if (mapInstanceRef.current) mapInstanceRef.current.removeLayer(circle);
        }, 8000);
      },
      (err) => {
        console.warn('GPS location failed:', err.message);
      },
      { timeout: 7000 }
    );
  };

  // Fit all markers
  const handleFitAll = () => {
    if (!mapInstanceRef.current || filteredTickets.length === 0) return;
    const points: L.LatLngTuple[] = filteredTickets.map((t) => [
      t.ubicacionLat || SECTOR_COORDS_FALLBACK[t.sectorNombre]?.lat || DEFAULT_CENTER[0],
      t.ubicacionLng || SECTOR_COORDS_FALLBACK[t.sectorNombre]?.lng || DEFAULT_CENTER[1],
    ]);
    mapInstanceRef.current.fitBounds(points, { padding: [50, 50], maxZoom: 16 });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400">
              <MapIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Mapa Cartográfico de Incidencias
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Solo Administradores
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualización georreferenciada en tiempo real de todos los reportes comunitarios y puntos de atención
              </p>
            </div>
          </div>
        </div>

        {/* Quick Top Metrics Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold">{metrics.total}</span>
            <span>en mapa</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            <span className="font-bold">{metrics.abiertos}</span>
            <span>abiertos</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 shrink-0">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-bold">{metrics.enProgreso}</span>
            <span>en progreso</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold">{metrics.resueltos}</span>
            <span>resueltos</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ticket, ciudadano, calle..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filtrar por categoría de incidencia"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="todas">📁 Todas las Categorías</option>
              {CATEGORIAS_SISTEMA.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sector Filter */}
          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              aria-label="Filtrar por sector de residencia"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="todos">📍 Todos los Sectores</option>
              {SECTORES_RESIDENCIA.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filtrar por estado del reporte"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="todos">⚡ Todos los Estados</option>
              <option value="abierto">🔴 Abierto</option>
              <option value="en_progreso">🟡 En Progreso</option>
              <option value="resuelto">🟢 Resuelto</option>
              <option value="cerrado">⚪ Cerrado</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filtrar por prioridad"
              className="w-full py-1.5 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="todas">🔥 Todas las Prioridades</option>
              <option value="urgente">Urgente / Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        {/* Second Row: Time presets & Map style toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Time range pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] mr-1">Rango:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'today', label: 'Hoy' },
              { id: '7d', label: 'Últimos 7 días' },
              { id: '30d', label: 'Últimos 30 días' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedTimeRange(r.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedTimeRange === r.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r.label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer ml-2 text-xs"
              title="Restablecer filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>

          {/* Map Controls */}
          <div className="flex items-center gap-2">
            {/* Tile Layer Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setMapStyle('terrain')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  mapStyle === 'terrain'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Capa de Suelo, Relieve y Topografía"
              >
                <Mountain className="w-3 h-3 text-emerald-600" />
                <span>Suelo & Relieve</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('physical')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  mapStyle === 'physical'
                    ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Capa Física Terrestre"
              >
                <Layers className="w-3 h-3 text-amber-600" />
                <span>Físico</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  mapStyle === 'satellite'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Satélite Fotográfico Real"
              >
                <Globe className="w-3 h-3 text-blue-500" />
                <span>Satélite</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('topo')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  mapStyle === 'topo'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Curvas de Nivel Topográficas"
              >
                <span>Cotas</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('positron')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  mapStyle === 'positron'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Claro
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('dark')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all whitespace-nowrap ${
                  mapStyle === 'dark'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Oscuro
              </button>
            </div>

            {/* Corregimiento Ernesto Córdoba Campos Boundary Toggle */}
            <button
              type="button"
              onClick={() => setShowCorregimientoBorder(!showCorregimientoBorder)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-semibold cursor-pointer transition-all shrink-0 ${
                showCorregimientoBorder
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
              title="Mostrar u Ocultar Límite Territorial del Corregimiento"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Límite Ernesto Córdoba</span>
              <span className="sm:hidden">Límite</span>
            </button>

            {/* Fit All Button */}
            <button
              type="button"
              onClick={handleFitAll}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 cursor-pointer shadow-xs shrink-0"
              title="Ajustar mapa a todos los reportes"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Locate Me */}
            <button
              type="button"
              onClick={handleLocateMe}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-blue-600 cursor-pointer shadow-xs shrink-0"
              title="Centrar en mi ubicación actual"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>

            {/* Toggle List View Drawer */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                isSidebarOpen
                  ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isSidebarOpen ? 'Ocultar Lista' : 'Ver Lista'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Stage & Side Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Map Container Canvas - Square Proportions & Taller Scale */}
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:col-span-8 xl:col-span-8' : 'lg:col-span-12'}`}>
          <div className="relative w-full aspect-square min-h-[650px] max-h-[880px] h-[740px] xl:h-[800px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900">
            {/* The Actual Leaflet Map Div */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Map Legend Overlay */}
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-lg text-xs space-y-2 z-10 max-w-xs pointer-events-auto">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[11px] uppercase tracking-wider">
                  Leyenda de Estados
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {filteredTickets.length} puntos
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Abierto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">En Progreso</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Resuelto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">Cerrado</span>
                </div>
              </div>
            </div>

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

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setModalDetailTicket(selectedTicket);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalles & Historial</span>
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${
                      selectedTicket.ubicacionLat || 9.0834
                    },${selectedTicket.ubicacionLng || -79.5312}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
                    title="Navegar con Google Maps"
                  >
                    <Navigation className="w-3 h-3 text-blue-600" />
                    <span>Ruta</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => onNavigateToTrace(selectedTicket.id)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 cursor-pointer"
                    title="Ir a línea de tiempo de trazabilidad"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Incident List & Quick Inspection (Collapsible) */}
        {isSidebarOpen && (
          <div className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* Sector Cluster Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>Concentración por Sector</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {sectorCounts.length} sectores
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                {sectorCounts.slice(0, 8).map(([sectorName, count]) => (
                  <button
                    key={sectorName}
                    type="button"
                    onClick={() => {
                      setSelectedSector(sectorName);
                      const coords = SECTOR_COORDS_FALLBACK[sectorName];
                      if (coords && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([coords.lat, coords.lng], 15, { duration: 0.8 });
                      }
                    }}
                    className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                      selectedSector === sectorName
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{sectorName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      selectedSector === sectorName ? 'bg-purple-800 text-white' : 'bg-slate-200 dark:bg-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* List of Filtered Incidents Plotted */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Reportes Georreferenciados ({filteredTickets.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">Clic para enfocar en mapa</span>
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
                <div className="space-y-2.5 max-h-[560px] xl:max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
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
