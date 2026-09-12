import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Flame,
  MapPin,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Maximize2,
  Navigation,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Droplets,
  TreePine,
  HeartHandshake,
  FileCheck,
  Trophy,
} from 'lucide-react';
import { Ticket, TicketStatus } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import {
  SECTOR_COORDINATES,
  DEFAULT_CORREGIMIENTO_CENTER,
  ERNESTO_CORDOBA_CAMPOS_POLYGON,
  getSectorCoordinates,
} from '../../utils/geoCoordinates';

interface PublicHeatmapMapViewProps {
  tickets: Ticket[];
  onSelectTicket?: (ticket: Ticket) => void;
}

type MapMode = 'heatmap' | 'markers';
type TileProvider = 'google-streets' | 'google-satellite' | 'google-terrain' | 'carto-light';

export const PublicHeatmapMapView: React.FC<PublicHeatmapMapViewProps> = ({
  tickets,
  onSelectTicket,
}) => {
  const [mapMode, setMapMode] = useState<MapMode>('heatmap');
  const [tileProvider, setTileProvider] = useState<TileProvider>('google-streets');
  const [selectedSector, setSelectedSector] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<Ticket | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // 1. Filter Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (selectedSector !== 'todos' && t.sectorNombre !== selectedSector) return false;
      if (selectedCategory !== 'todos' && t.categoriaId !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = t.numeroRegistro.toLowerCase().includes(q);
        const matchAsunto = t.asunto.toLowerCase().includes(q);
        const matchSec = t.sectorNombre.toLowerCase().includes(q);
        const matchCat = t.categoriaNombre.toLowerCase().includes(q);
        if (!matchNum && !matchAsunto && !matchSec && !matchCat) return false;
      }
      return true;
    });
  }, [tickets, selectedSector, selectedCategory, searchQuery]);

  // 2. Sector Metrics for Heatmap Density
  const sectorMetrics = useMemo(() => {
    const map = new Map<
      string,
      {
        sector: string;
        total: number;
        abiertos: number;
        enProgreso: number;
        resueltos: number;
        coords: { lat: number; lng: number };
        categoriaFrecuente: string;
      }
    >();

    // Initialize all standard sectors
    SECTORES_RESIDENCIA.forEach((sec) => {
      map.set(sec, {
        sector: sec,
        total: 0,
        abiertos: 0,
        enProgreso: 0,
        resueltos: 0,
        coords: getSectorCoordinates(sec),
        categoriaFrecuente: 'Sin reportes',
      });
    });

    // Populate with filtered tickets
    const catCounter: Record<string, Record<string, number>> = {};

    filteredTickets.forEach((t) => {
      const sec = t.sectorNombre || 'Altos de Las Cumbres';
      let entry = map.get(sec);
      if (!entry) {
        entry = {
          sector: sec,
          total: 0,
          abiertos: 0,
          enProgreso: 0,
          resueltos: 0,
          coords: getSectorCoordinates(sec),
          categoriaFrecuente: 'General',
        };
        map.set(sec, entry);
      }

      entry.total += 1;
      if (t.estado === 'abierto') entry.abiertos += 1;
      else if (t.estado === 'en_progreso') entry.enProgreso += 1;
      else if (t.estado === 'resuelto' || t.estado === 'cerrado') entry.resueltos += 1;

      if (!catCounter[sec]) catCounter[sec] = {};
      catCounter[sec][t.categoriaNombre] = (catCounter[sec][t.categoriaNombre] || 0) + 1;
    });

    // Determine most frequent category
    map.forEach((entry, sec) => {
      if (catCounter[sec]) {
        let maxCount = 0;
        let topCat = 'General';
        Object.entries(catCounter[sec]).forEach(([cat, cnt]) => {
          if (cnt > maxCount) {
            maxCount = cnt;
            topCat = cat;
          }
        });
        entry.categoriaFrecuente = topCat;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const resueltos = filteredTickets.filter((t) => t.estado === 'resuelto' || t.estado === 'cerrado').length;
    const tasa = total > 0 ? Math.round((resueltos / total) * 100) : 100;
    const focosActivos = sectorMetrics.filter((s) => s.total >= 2).length;
    const topSector = sectorMetrics.find((s) => s.total > 0)?.sector || 'Sin reportes';

    return { total, resueltos, tasa, focosActivos, topSector };
  }, [filteredTickets, sectorMetrics]);

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CORREGIMIENTO_CENTER,
      zoom: 14,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false,
    });

    // Custom zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add Tile Layer
    const baseTile = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps & Corregimiento Ernesto Córdoba Campos',
      maxZoom: 20,
    }).addTo(map);
    tileLayerRef.current = baseTile;

    // Layer Groups
    const polygonGroup = L.layerGroup().addTo(map);
    const heatmapGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    polygonLayerGroupRef.current = polygonGroup;
    heatmapLayerGroupRef.current = heatmapGroup;
    markersLayerGroupRef.current = markersGroup;

    // Draw Ernesto Córdoba Campos boundary polygon
    const polygon = L.polygon(ERNESTO_CORDOBA_CAMPOS_POLYGON, {
      color: '#2563eb',
      weight: 2.5,
      dashArray: '5, 5',
      fillColor: '#3b82f6',
      fillOpacity: 0.04,
    });
    polygonGroup.addLayer(polygon);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 4. Update Tile Provider
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Streets
    let attr = '&copy; Google Maps';

    if (tileProvider === 'google-satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Hybrid
    } else if (tileProvider === 'google-terrain') {
      url = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Terrain
    } else if (tileProvider === 'carto-light') {
      url = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      attr = '&copy; CartoDB & OpenStreetMap';
    }

    const newLayer = L.tileLayer(url, { attribution: attr, maxZoom: 20 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [tileProvider]);

  // 5. Draw Heatmap or Markers
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !heatmapLayerGroupRef.current ||
      !markersLayerGroupRef.current
    )
      return;

    heatmapLayerGroupRef.current.clearLayers();
    markersLayerGroupRef.current.clearLayers();

    // A. HEATMAP MODE
    if (mapMode === 'heatmap') {
      sectorMetrics.forEach((metric) => {
        const { sector, total, resueltos, abiertos, enProgreso, coords, categoriaFrecuente } = metric;
        if (total === 0) return; // Only draw hotspots for active sectors

        const efectividad = total > 0 ? Math.round((resueltos / total) * 100) : 100;

        let color = '#10b981'; // Green (1 report)
        let outerRadius = 220;
        let coreRadius = 90;
        let recurrenceLabel = 'Baja Incidencia';

        if (total >= 5) {
          color = '#dc2626'; // Intense Red
          outerRadius = 450;
          coreRadius = 180;
          recurrenceLabel = 'Foco Rojo / Alta Recurrencia';
        } else if (total >= 3) {
          color = '#ea580c'; // Orange
          outerRadius = 350;
          coreRadius = 135;
          recurrenceLabel = 'Recurrencia Media-Alta';
        } else if (total >= 2) {
          color = '#eab308'; // Amber
          outerRadius = 280;
          coreRadius = 110;
          recurrenceLabel = 'Recurrencia Moderada';
        }

        // Soft Outer Thermal Aura
        const outerCircle = L.circle([coords.lat, coords.lng], {
          radius: outerRadius,
          color,
          weight: 1,
          opacity: 0.35,
          fillColor: color,
          fillOpacity: 0.16,
        });
        heatmapLayerGroupRef.current!.addLayer(outerCircle);

        // Dense Core Circle
        const coreCircle = L.circle([coords.lat, coords.lng], {
          radius: coreRadius,
          color,
          weight: 2,
          opacity: 0.85,
          fillColor: color,
          fillOpacity: 0.45,
        });
        heatmapLayerGroupRef.current!.addLayer(coreCircle);

        // Interactive Hotspot Badge
        const hotspotHtml = `
          <div class="flex flex-col items-center cursor-pointer select-none group" style="transform: translate(-50%, -50%);">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-950/90 text-white border-2 shadow-2xl backdrop-blur-md transition-transform duration-150 group-hover:scale-110"
                 style="border-color: ${color};">
              <span class="w-2.5 h-2.5 rounded-full animate-ping" style="background-color: ${color};"></span>
              <span class="font-extrabold text-xs">${total} ${total === 1 ? 'Reporte' : 'Reportes'}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded-md font-bold text-white" style="background-color: ${
                efectividad >= 75 ? '#059669' : efectividad >= 50 ? '#d97706' : '#dc2626'
              };">
                ${efectividad}% Resuelto
              </span>
            </div>
            <span class="text-[10.5px] font-bold text-slate-900 bg-white/95 px-2 py-0.5 rounded-md shadow-md border border-slate-200 mt-1">
              ${sector}
            </span>
          </div>
        `;

        const hotspotIcon = L.divIcon({
          html: hotspotHtml,
          className: 'public-heatmap-hotspot',
          iconSize: [200, 54],
          iconAnchor: [100, 27],
        });

        const hotspotMarker = L.marker([coords.lat, coords.lng], { icon: hotspotIcon });

        hotspotMarker.bindTooltip(
          `<div class="p-3 text-xs bg-slate-900 text-white rounded-2xl shadow-xl max-w-[260px] border border-slate-700">
            <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
              <span class="font-bold text-sm text-white">📍 ${sector}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded text-white" style="background-color: ${color};">
                ${recurrenceLabel}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px] mb-2">
              <div>Total: <strong class="text-white">${total} casos</strong></div>
              <div>Efectividad: <strong class="${efectividad >= 75 ? 'text-emerald-400' : 'text-amber-400'}">${efectividad}%</strong></div>
              <div>🔴 Abiertos: <strong>${abiertos}</strong></div>
              <div>🟢 Resueltos: <strong>${resueltos}</strong></div>
            </div>
            <div class="pt-1.5 border-t border-slate-800 text-[10px] text-slate-300">
              ⚡ Foco: <strong>${categoriaFrecuente}</strong>
            </div>
          </div>`,
          { direction: 'top', offset: [0, -25], opacity: 0.98 }
        );

        hotspotMarker.on('click', () => {
          setSelectedSector(sector);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([coords.lat, coords.lng], 16, { duration: 0.7 });
          }
        });

        heatmapLayerGroupRef.current!.addLayer(hotspotMarker);
      });
    }

    // B. MARKERS MODE
    if (mapMode === 'markers') {
      filteredTickets.forEach((ticket) => {
        const lat = ticket.ubicacionLat || 9.0834;
        const lng = ticket.ubicacionLng || -79.5312;

        let markerColor = '#2563eb'; // Blue for Abierto
        if (ticket.estado === 'en_progreso') markerColor = '#d97706'; // Amber
        else if (ticket.estado === 'resuelto' || ticket.estado === 'cerrado') markerColor = '#059669'; // Emerald

        const pinHtml = `
          <div class="flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -100%);">
            <div class="w-7 h-7 rounded-full text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform duration-150 group-hover:scale-125"
                 style="background-color: ${markerColor};">
              <span class="text-[10px] font-black">${ticket.numeroRegistro.split('-')[0]}</span>
            </div>
            <div class="w-2 h-2 rotate-45 -mt-1 shadow-xs" style="background-color: ${markerColor};"></div>
          </div>
        `;

        const pinIcon = L.divIcon({
          html: pinHtml,
          className: 'public-pin-marker',
          iconSize: [30, 36],
          iconAnchor: [15, 36],
        });

        const marker = L.marker([lat, lng], { icon: pinIcon });

        marker.bindTooltip(
          `<div class="p-2 text-xs bg-slate-900 text-white rounded-xl shadow-lg border border-slate-700">
            <div class="font-bold text-white text-xs">${ticket.numeroRegistro}</div>
            <div class="text-[11px] text-slate-300 truncate max-w-[200px]">${ticket.asunto}</div>
            <div class="text-[10px] text-slate-400 mt-1">📍 ${ticket.sectorNombre}</div>
          </div>`,
          { direction: 'top', offset: [0, -32] }
        );

        marker.on('click', () => {
          setSelectedTicketDetail(ticket);
          if (onSelectTicket) onSelectTicket(ticket);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 0.6 });
          }
        });

        markersLayerGroupRef.current!.addLayer(marker);
      });
    }
  }, [mapMode, sectorMetrics, filteredTickets, onSelectTicket]);

  // Center Map on Corregimiento
  const handleCenterMap = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(DEFAULT_CORREGIMIENTO_CENTER, 14, { duration: 0.8 });
  };

  // Geolocate User
  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapInstanceRef.current?.flyTo([latitude, longitude], 16, { duration: 0.8 });
      },
      () => {
        alert('No se pudo obtener su ubicación actual.');
      }
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header & Live Synchronization Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                <span>En Vivo: ERP / CRM Comunal</span>
              </span>
              <span className="text-xs text-slate-400">Actualización en tiempo real</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span>Mapa Territorial y Focos Térmicos Comunitarios</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoreo cartográfico georreferenciado de Corregimiento Ernesto Córdoba Campos. Cada nuevo reporte se refleja instantáneamente en el mapa de calor.
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setMapMode('heatmap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mapMode === 'heatmap'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Mapa de Calor</span>
              </button>
              <button
                type="button"
                onClick={() => setMapMode('markers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mapMode === 'markers'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Pines de Ubicación</span>
              </button>
            </div>

            {/* Tile Layer Dropdown */}
            <select
              value={tileProvider}
              onChange={(e) => setTileProvider(e.target.value as TileProvider)}
              className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="google-streets">🗺️ Google Carreteras</option>
              <option value="google-satellite">🛰️ Google Satélite</option>
              <option value="google-terrain">⛰️ Google Relieve</option>
              <option value="carto-light">📄 Carto Minimal</option>
            </select>

            {/* Recenter button */}
            <button
              type="button"
              onClick={handleCenterMap}
              title="Centrar mapa"
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 cursor-pointer shadow-xs"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Top Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Casos en Mapa</span>
            <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {stats.total}
            </div>
            <span className="text-[10px] text-slate-400">Total georreferenciado</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-red-500 uppercase">Focos Térmicos</span>
            <div className="text-xl font-extrabold text-red-600 dark:text-red-400 font-mono mt-0.5">
              {stats.focosActivos}
            </div>
            <span className="text-[10px] text-slate-400">Sectores con &ge;2 incidencias</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Efectividad Global</span>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {stats.tasa}%
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">{stats.resueltos} resueltos</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <span className="text-[10px] font-bold text-amber-500 uppercase">Sector Crítico</span>
            <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate mt-1">
              {stats.topSector}
            </div>
            <span className="text-[10px] text-slate-400">Mayor densidad acumulada</span>
          </div>
        </div>

        {/* 3. Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, asunto, sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
          </div>

          {/* Sector Filter */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="todos">📍 Todos los Sectores ({SECTORES_RESIDENCIA.length})</option>
            {SECTORES_RESIDENCIA.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="todos">⚡ Todas las Categorías</option>
            {CATEGORIAS_SISTEMA.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          {(selectedSector !== 'todos' || selectedCategory !== 'todos' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSector('todos');
                setSelectedCategory('todos');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 px-2 py-1 hover:underline cursor-pointer"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* 4. Interactive Map Container */}
      <div className="relative w-full h-[540px] sm:h-[620px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Legend */}
        <div className="absolute top-3 left-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-lg text-[11px] max-w-[240px]">
          <div className="font-extrabold text-slate-900 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Escala Térmica de Focos</span>
          </div>
          <div className="space-y-1 text-[10.5px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">5+ Reportes (Alta Densidad)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">3-4 Reportes (Media-Alta)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">2 Reportes (Moderada)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">1 Reporte (Controlado)</span>
            </div>
          </div>
        </div>

        {/* Selected Ticket Popover Modal */}
        {selectedTicketDetail && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[400] max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400">
                  {selectedTicketDetail.numeroRegistro}
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    selectedTicketDetail.estado === 'resuelto'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : selectedTicketDetail.estado === 'en_progreso'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}
                >
                  {selectedTicketDetail.estado}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
              {selectedTicketDetail.asunto}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
              {selectedTicketDetail.descripcion}
            </p>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>📍 {selectedTicketDetail.sectorNombre}</span>
              <span>📅 {selectedTicketDetail.fechaCreacion}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Sector Breakdown Cards below Map */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectorMetrics.slice(0, 8).map((sec) => (
          <div
            key={sec.sector}
            onClick={() => {
              setSelectedSector(sec.sector);
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([sec.coords.lat, sec.coords.lng], 16, { duration: 0.7 });
              }
            }}
            className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
              selectedSector === sec.sector
                ? 'bg-red-50 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">{sec.sector}</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                  sec.total >= 5
                    ? 'bg-red-600 text-white'
                    : sec.total >= 3
                    ? 'bg-orange-500 text-white'
                    : sec.total >= 2
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {sec.total} casos
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>{sec.abiertos} pendientes</span>
              <span className="text-emerald-600 font-bold">{sec.resueltos} resueltos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
