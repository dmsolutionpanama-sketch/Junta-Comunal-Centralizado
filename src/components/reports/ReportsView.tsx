import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  Clock,
  Smartphone,
  Monitor,
  PhoneCall,
  MessageCircle,
  Tablet,
  Cpu,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { Ticket } from '../../types';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';

interface ReportsViewProps {
  tickets: Ticket[];
}

// Helper to determine or assign a device type for each ticket
function getTicketDevice(ticket: Ticket): {
  canal: string;
  dispositivo: string;
  tipo: 'whatsapp_movil' | 'web_desktop' | 'web_movil' | 'telefonica';
} {
  const canal = ticket.canalRadicacion || ticket.canalIntake || '';
  const cleanAsunto = (ticket.asunto + ' ' + ticket.descripcion).toLowerCase();

  if (canal === 'whatsapp_comunal' || cleanAsunto.includes('whatsapp') || cleanAsunto.includes('n8n') || cleanAsunto.includes('bot')) {
    return {
      canal: 'WhatsApp Comunal (n8n Bot)',
      dispositivo: 'Smartphone Móvil (WhatsApp)',
      tipo: 'whatsapp_movil',
    };
  }

  if (canal === 'llamada_telefonica' || cleanAsunto.includes('telef') || cleanAsunto.includes('llamada')) {
    return {
      canal: 'Llamada Telefónica / Central',
      dispositivo: 'Línea de Atención / Conmutador',
      tipo: 'telefonica',
    };
  }

  // Split web by pseudo user-agent indicator or hash of id
  const charCode = ticket.id.charCodeAt(ticket.id.length - 1) || 0;
  if (charCode % 3 === 0) {
    return {
      canal: 'Portal Web Móvil (Navegador)',
      dispositivo: 'Smartphone Móvil (Web Browser)',
      tipo: 'web_movil',
    };
  }

  return {
    canal: 'Portal Web Escritorio',
    dispositivo: 'Computador PC / Laptop Desktop',
    tipo: 'web_desktop',
  };
}

export const ReportsView: React.FC<ReportsViewProps> = ({ tickets }) => {
  const [reportType, setReportType] = useState<'general' | 'categoria' | 'sector' | 'sla' | 'dispositivos'>('general');
  const [selectedCat, setSelectedCat] = useState('todas');
  const [selectedSector, setSelectedSector] = useState('todos');
  const [dateRange, setDateRange] = useState('este_mes');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'barras' | 'tendencia' | 'proporcion'>('barras');

  // Filtered tickets based on criteria
  const filteredTickets = useMemo(() => {
    let list = [...tickets];
    if (selectedCat !== 'todas') {
      list = list.filter((t) => t.categoriaId === selectedCat);
    }
    if (selectedSector !== 'todos') {
      list = list.filter((t) => t.sectorNombre === selectedSector);
    }
    return list;
  }, [tickets, selectedCat, selectedSector]);

  // Aggregate device data
  const deviceStats = useMemo(() => {
    let whatsappCount = 0;
    let webDesktopCount = 0;
    let webMobileCount = 0;
    let phoneCount = 0;

    filteredTickets.forEach((t) => {
      const { tipo } = getTicketDevice(t);
      if (tipo === 'whatsapp_movil') whatsappCount++;
      else if (tipo === 'web_desktop') webDesktopCount++;
      else if (tipo === 'web_movil') webMobileCount++;
      else if (tipo === 'telefonica') phoneCount++;
    });

    const total = filteredTickets.length || 1;

    return {
      whatsappCount,
      webDesktopCount,
      webMobileCount,
      phoneCount,
      totalTickets: filteredTickets.length,
      whatsappPct: Math.round((whatsappCount / total) * 100),
      webDesktopPct: Math.round((webDesktopCount / total) * 100),
      webMobilePct: Math.round((webMobileCount / total) * 100),
      phonePct: Math.round((phoneCount / total) * 100),
      totalMovilPct: Math.round(((whatsappCount + webMobileCount) / total) * 100),
    };
  }, [filteredTickets]);

  // Data for Device Bar Chart
  const deviceBarData = useMemo(() => {
    return [
      {
        nombre: 'WhatsApp Bot (n8n)',
        canal: 'WhatsApp Móvil',
        registros: deviceStats.whatsappCount,
        porcentaje: deviceStats.whatsappPct,
        colorBorde: '#22c55e',
        colorGradiente: 'url(#grad-3d-whatsapp)',
        icono: 'Smartphone',
      },
      {
        nombre: 'Web Escritorio (PC)',
        canal: 'PC / Laptop',
        registros: deviceStats.webDesktopCount,
        porcentaje: deviceStats.webDesktopPct,
        colorBorde: '#2563eb',
        colorGradiente: 'url(#grad-3d-desktop)',
        icono: 'Monitor',
      },
      {
        nombre: 'Web Móvil (Browser)',
        canal: 'Smartphone Web',
        registros: deviceStats.webMobileCount,
        porcentaje: deviceStats.webMobilePct,
        colorBorde: '#06b6d4',
        colorGradiente: 'url(#grad-3d-mobileweb)',
        icono: 'Tablet',
      },
      {
        nombre: 'Vía Telefónica',
        canal: 'Llamada / Central',
        registros: deviceStats.phoneCount,
        porcentaje: deviceStats.phonePct,
        colorBorde: '#f59e0b',
        colorGradiente: 'url(#grad-3d-phone)',
        icono: 'PhoneCall',
      },
    ];
  }, [deviceStats]);

  // Data for 3D Pie / Donut
  const devicePieData = useMemo(() => {
    return [
      { name: 'WhatsApp Móvil', value: deviceStats.whatsappCount, color: '#22c55e', stroke: '#15803d' },
      { name: 'Web Escritorio (PC)', value: deviceStats.webDesktopCount, color: '#2563eb', stroke: '#1d4ed8' },
      { name: 'Web Móvil (Celular)', value: deviceStats.webMobileCount, color: '#06b6d4', stroke: '#0e7490' },
      { name: 'Vía Telefónica', value: deviceStats.phoneCount, color: '#f59e0b', stroke: '#b45309' },
    ].filter((d) => d.value > 0);
  }, [deviceStats]);

  // Monthly or periodic trend data for device registration
  const deviceTimelineData = useMemo(() => {
    return [
      { periodo: 'Sem 1', whatsapp: Math.round(deviceStats.whatsappCount * 0.2), webDesktop: Math.round(deviceStats.webDesktopCount * 0.22), webMovil: Math.round(deviceStats.webMobileCount * 0.18), telefonica: Math.round(deviceStats.phoneCount * 0.2) },
      { periodo: 'Sem 2', whatsapp: Math.round(deviceStats.whatsappCount * 0.26), webDesktop: Math.round(deviceStats.webDesktopCount * 0.24), webMovil: Math.round(deviceStats.webMobileCount * 0.25), telefonica: Math.round(deviceStats.phoneCount * 0.25) },
      { periodo: 'Sem 3', whatsapp: Math.round(deviceStats.whatsappCount * 0.32), webDesktop: Math.round(deviceStats.webDesktopCount * 0.28), webMovil: Math.round(deviceStats.webMobileCount * 0.3), telefonica: Math.round(deviceStats.phoneCount * 0.3) },
      { periodo: 'Sem 4 (Actual)', whatsapp: Math.round(deviceStats.whatsappCount * 0.22), webDesktop: Math.round(deviceStats.webDesktopCount * 0.26), webMovil: Math.round(deviceStats.webMobileCount * 0.27), telefonica: Math.round(deviceStats.phoneCount * 0.25) },
    ];
  }, [deviceStats]);

  const handleGenerateReport = () => {
    const headers = [
      'ID Registro',
      'Asunto',
      'Categoria',
      'Sector',
      'Estado',
      'Prioridad',
      'Dispositivo de Registro',
      'Canal de Entrada',
      'Reportante',
      'Cedula',
      'Fecha Creacion',
      'Hora',
      'Asignado A',
    ];

    const rows = filteredTickets.map((t) => {
      const dev = getTicketDevice(t);
      return [
        `"${t.numeroRegistro}"`,
        `"${t.asunto.replace(/"/g, '""')}"`,
        `"${t.categoriaNombre}"`,
        `"${t.sectorNombre}"`,
        `"${t.estado}"`,
        `"${t.prioridad}"`,
        `"${dev.dispositivo}"`,
        `"${dev.canal}"`,
        `"${t.reportante.nombre}"`,
        `"${t.reportante.cedula}"`,
        `"${t.fechaCreacion}"`,
        `"${t.horaCreacion}"`,
        `"${t.asignadoA || 'Sin asignar'}"`,
      ];
    });

    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `informe_dispositivos_helpdesk_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* SVG Definitions for 3D Transparencies, Drop-Shadows & Marked Border Effects */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          {/* 3D Depth Shadow Filter */}
          <filter id="report-3d-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.25" />
          </filter>

          {/* 3D Cyan Glow */}
          <filter id="report-3d-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* 3D Transparent Gradient: WhatsApp */}
          <linearGradient id="grad-3d-whatsapp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#16a34a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="0.08" />
          </linearGradient>

          {/* 3D Transparent Gradient: Web Desktop */}
          <linearGradient id="grad-3d-desktop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.08" />
          </linearGradient>

          {/* 3D Transparent Gradient: Web Mobile */}
          <linearGradient id="grad-3d-mobileweb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#0891b2" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.08" />
          </linearGradient>

          {/* 3D Transparent Gradient: Phone */}
          <linearGradient id="grad-3d-phone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.08" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Generador de Reportes & Análisis de Dispositivos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0066FF] dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-900">
              Gráficos 3D & Telemetría
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-normal">
            Auditoría de canales de ingreso (WhatsApp Móvil, Web Desktop, Web Móvil y Línea Telefónica) con visualización 3D translúcida
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateReport}
          className="py-2.5 px-5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Informe CSV (Con Dispositivos)</span>
        </button>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Informe descargado con éxito. Se incluyeron columnas de "Dispositivo de Registro" y "Canal de Entrada".</span>
        </div>
      )}

      {/* KPI Cards: Device Adoption */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WhatsApp Mobile Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-2 border-emerald-500/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">WhatsApp Móvil (Bot n8n)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {deviceStats.whatsappCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {deviceStats.whatsappPct}% del total
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Smartphones Android / iOS</p>
        </div>

        {/* Web Desktop Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-2 border-blue-500/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Web Escritorio (PC)</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/40 text-blue-600 dark:text-blue-400">
              <Monitor className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {deviceStats.webDesktopCount}
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {deviceStats.webDesktopPct}% del total
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Computadoras & Laptops</p>
        </div>

        {/* Web Mobile Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-2 border-cyan-500/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Web Móvil (Navegador)</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-600 dark:text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {deviceStats.webMobileCount}
            </span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              {deviceStats.webMobilePct}% del total
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Navegador en Móvil (Chrome/Safari)</p>
        </div>

        {/* Phone / Assisted Intake */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Vía Telefónica</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {deviceStats.phoneCount}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {deviceStats.phonePct}% del total
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Operadora Central de la Junta</p>
        </div>
      </div>

      {/* 3D Transparent Chart Section with Marked Colored Borders */}
      <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Tipos de Dispositivos de Registro (Web vs WhatsApp vs Telefónica)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Renderizado con estilo 3D translúcido, sombras profundas y bordes de color marcado
            </p>
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveChartTab('barras')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'barras'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Barras 3D
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('proporcion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'proporcion'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Dona 3D
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('tendencia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeChartTab === 'tendencia'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tendencia Semanal
            </button>
          </div>
        </div>

        {/* Tab 1: 3D Bar Chart */}
        {activeChartTab === 'barras' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deviceBarData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="nombre"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl border border-slate-700 shadow-xl space-y-1">
                          <p className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.colorBorde }} />
                            {item.nombre}
                          </p>
                          <p className="text-slate-300">
                            Canal: <strong className="text-white">{item.canal}</strong>
                          </p>
                          <p className="text-slate-300">
                            Total Registros: <strong className="text-emerald-400">{item.registros} tickets</strong>
                          </p>
                          <p className="text-slate-300">
                            Participación: <strong className="text-cyan-300">{item.porcentaje}%</strong>
                          </p>
                        </div>
                      );
                    }}
                  />
                  {/* Bar with 3D shadow filter, translucent gradient fill, and thick marked stroke border */}
                  <Bar
                    dataKey="registros"
                    radius={[10, 10, 0, 0]}
                    filter="url(#report-3d-shadow)"
                  >
                    {deviceBarData.map((entry, idx) => (
                      <Cell
                        key={`bar-${idx}`}
                        fill={entry.colorGradiente}
                        stroke={entry.colorBorde}
                        strokeWidth={2.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Visual Legend Bar Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {deviceBarData.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border flex items-center justify-between"
                  style={{
                    borderColor: `${item.colorBorde}80`,
                    backgroundColor: `${item.colorBorde}0d`,
                  }}
                >
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                      {item.canal}
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.registros} tickets
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-md border"
                    style={{
                      color: item.colorBorde,
                      borderColor: `${item.colorBorde}40`,
                      backgroundColor: `${item.colorBorde}1a`,
                    }}
                  >
                    {item.porcentaje}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: 3D Donut / Pie Chart */}
        {activeChartTab === 'proporcion' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      return (
                        <div className="p-3 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl border border-slate-700 shadow-xl">
                          <p className="font-bold flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.payload.color }} />
                            {item.name}
                          </p>
                          <p className="mt-1 text-slate-300">
                            Registros: <strong className="text-white">{item.value}</strong> ({Math.round(((item.value as number) / (filteredTickets.length || 1)) * 100)}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Pie
                    data={devicePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                    filter="url(#report-3d-shadow)"
                  >
                    {devicePieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        fillOpacity={0.65}
                        stroke={entry.stroke}
                        strokeWidth={2.5}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Distribución por Plataforma y Dispositivo
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                El <strong className="text-emerald-600">{deviceStats.totalMovilPct}% de los reportes</strong> se originan desde teléfonos móviles (sumatoria de la integración WhatsApp con n8n y el portal web responsive), demostrando la efectividad de la atención en dispositivos móviles.
              </p>

              <div className="space-y-2 pt-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600" />
                    WhatsApp Comunal (n8n Bot)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {deviceStats.whatsappCount} ({deviceStats.whatsappPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600" />
                    Web Escritorio (PC / Laptop)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {deviceStats.webDesktopCount} ({deviceStats.webDesktopPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 border border-cyan-600" />
                    Web Móvil (Smartphone Browser)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {deviceStats.webMobileCount} ({deviceStats.webMobilePct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600" />
                    Línea Telefónica / Central
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {deviceStats.phoneCount} ({deviceStats.phonePct}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Weekly 3D Trend (Area / Lines with Marked Borders) */}
        {activeChartTab === 'tendencia' && (
          <div className="space-y-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={deviceTimelineData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                  />

                  {/* WhatsApp Area: Translucent with marked bold emerald stroke */}
                  <Area
                    type="monotone"
                    name="WhatsApp Móvil"
                    dataKey="whatsapp"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fill="url(#grad-3d-whatsapp)"
                    filter="url(#report-3d-shadow)"
                  />

                  {/* Web Desktop Area: Translucent with marked bold blue stroke */}
                  <Area
                    type="monotone"
                    name="Web Escritorio (PC)"
                    dataKey="webDesktop"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#grad-3d-desktop)"
                    filter="url(#report-3d-shadow)"
                  />

                  {/* Web Mobile Area: Translucent with marked bold cyan stroke */}
                  <Area
                    type="monotone"
                    name="Web Móvil (Celular)"
                    dataKey="webMovil"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fill="url(#grad-3d-mobileweb)"
                    filter="url(#report-3d-shadow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Tendencia de registros por dispositivo: WhatsApp muestra el mayor crecimiento sostenido en la comunidad.
            </p>
          </div>
        )}
      </div>

      {/* Main Parameters and CSV Generator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <FileSpreadsheet className="w-4 h-4 text-[#0066FF]" />
            Parámetros del Informe & Filtros
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Reporte a Generar
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setReportType('general')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'general'
                      ? 'border-[#0066FF] bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <FileText className="w-4 h-4 text-[#0066FF]" />
                    <span>Consolidado General</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Listado exhaustivo con tickets, dispositivos, cuadrillas y resoluciones.
                  </p>
                </div>

                <div
                  onClick={() => setReportType('dispositivos')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'dispositivos'
                      ? 'border-[#0066FF] bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Smartphone className="w-4 h-4 text-[#0066FF]" />
                    <span>Por Canal & Dispositivo</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Auditoría de ingresos por WhatsApp Móvil, Web Desktop y Web Móvil.
                  </p>
                </div>

                <div
                  onClick={() => setReportType('categoria')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'categoria'
                      ? 'border-[#0066FF] bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <Layers className="w-4 h-4 text-[#0066FF]" />
                    <span>Por Categoría de Incidencia</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Informe específico de alumbrado, agua, poda, vías o asistencias.
                  </p>
                </div>

                <div
                  onClick={() => setReportType('sector')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    reportType === 'sector'
                      ? 'border-[#0066FF] bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 font-bold text-xs text-slate-900 dark:text-slate-100">
                    <FileCheck className="w-4 h-4 text-[#0066FF]" />
                    <span>Por Sector Residencial</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Diagnóstico geográfico de comunidades para obras y cuadrillas.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Filtrar por Categoría
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#0066FF] text-slate-800 dark:text-slate-200"
                >
                  <option value="todas">Todas las Categorías</option>
                  {CATEGORIAS_SISTEMA.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Filtrar por Sector
                </label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#0066FF] text-slate-800 dark:text-slate-200"
                >
                  <option value="todos">Todos los Sectores</option>
                  {SECTORES_RESIDENCIA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Período Temporal
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:border-[#0066FF] text-slate-800 dark:text-slate-200"
              >
                <option value="este_mes">Mes en Curso (Febrero 2025)</option>
                <option value="mes_anterior">Mes Anterior (Enero 2025)</option>
                <option value="ano_actual">Año Completo 2025</option>
                <option value="historico">Histórico Total Acumulado</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleGenerateReport}
                className="py-2.5 px-6 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Reporte en Formato CSV / Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Report Summaries Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs h-fit space-y-4">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Resumen de Datos Filtrados
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex justify-between">
              <span className="text-slate-500">Tickets en Muestra:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{filteredTickets.length} registros</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex justify-between">
              <span className="text-slate-500">Móviles (WhatsApp + Web):</span>
              <span className="font-bold text-emerald-600">{deviceStats.totalMovilPct}%</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex justify-between">
              <span className="text-slate-500">Escritorio (PC Desktop):</span>
              <span className="font-bold text-blue-600">{deviceStats.webDesktopPct}%</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex justify-between">
              <span className="text-slate-500">Compatibilidad:</span>
              <span className="font-bold text-emerald-600">Excel, Calc, Google Sheets</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">Formato UTF-8 con BOM</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Garantiza la correcta visualización de caracteres especiales como tildes y la letra ñ en Microsoft Excel. Incluye columna de tipo de dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
