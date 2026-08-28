import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShieldCheck,
  Clock,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  GitCommit,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Ticket } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';

interface QuickSearchViewProps {
  tickets: Ticket[];
}

export const QuickSearchView: React.FC<QuickSearchViewProps> = ({ tickets }) => {
  const [searchCode, setSearchCode] = useState('TK-2025-001');
  const [searchedTicket, setSearchedTicket] = useState<Ticket | null>(() => {
    return tickets.find((t) => t.numeroRegistro === 'TK-2025-001') || tickets[0] || null;
  });
  const [searched, setSearched] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;

    setSearched(true);
    const found = tickets.find(
      (t) =>
        t.numeroRegistro.toLowerCase() === searchCode.trim().toLowerCase() ||
        t.id.toLowerCase() === searchCode.trim().toLowerCase()
    );

    if (found) {
      setSearchedTicket(found);
      setHasError(false);
    } else {
      setSearchedTicket(null);
      setHasError(true);
    }
  };

  const setDemoCode = (code: string) => {
    setSearchCode(code);
    const found = tickets.find((t) => t.numeroRegistro === code);
    if (found) {
      setSearchedTicket(found);
      setHasError(false);
      setSearched(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] mb-3 shadow-xs">
            <Search className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Consulta y Estado de Ticket
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 font-normal">
            Consulte en tiempo real el avance y resolución de su reporte municipal mediante el número de radicación.
          </p>

          {/* Privacy Guarantee Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 text-slate-600 rounded-full text-[11px] font-medium border border-slate-200">
            <Lock className="w-3 h-3 text-[#0066FF]" />
            <span>Visualización con Protección de Datos Personales (Ley de Privacidad)</span>
          </div>

          {/* Search Input Form */}
          <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="public-ticket-search-input"
                type="text"
                required
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Ejemplo: TK-2025-001"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-blue-500/20 uppercase"
              />
            </div>
            <button
              type="submit"
              id="btn-public-search"
              className="py-3 px-6 bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold text-xs rounded-xl shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Consultar Ticket</span>
            </button>
          </form>

          {/* Demo Pills for Instant Testing */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Probar códigos de ejemplo:</span>
            {['TK-2025-001', 'TK-2025-002', 'TK-2025-003', 'TK-2025-005'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setDemoCode(code)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#0066FF] text-slate-700 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Status Result Card */}
      <AnimatePresence mode="wait">
        {searchedTicket && !hasError && (
          <motion.div
            key={searchedTicket.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden"
          >
            {/* Card Top Strip */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-base font-bold text-[#0066FF] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                    {searchedTicket.numeroRegistro}
                  </span>
                  <StatusBadge status={searchedTicket.estado} size="lg" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  {searchedTicket.asunto}
                </h2>
              </div>

              <div className="text-right text-xs text-slate-500 space-y-0.5">
                <div className="flex items-center gap-1.5 justify-end">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{searchedTicket.fechaCreacion}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{searchedTicket.horaCreacion}</span>
                </div>
              </div>
            </div>

            {/* Main Details (PRIVACY-COMPLIANT: NO PERSONAL DATA) */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Category & Sector Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Categoría de Incidencia
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {searchedTicket.categoriaNombre}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Sector del Reporte
                  </span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    {searchedTicket.sectorNombre}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="border border-slate-200/80 rounded-xl p-5 bg-white">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0066FF]" />
                  Detalle del Reporte Registrado
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {searchedTicket.descripcion}
                </p>
              </div>

              {/* Resumed Traceability (Últimas acciones) */}
              <div className="border border-slate-200/80 rounded-xl p-5 bg-white space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-[#0066FF]" />
                  Bitácora Pública de Avance ({searchedTicket.trazabilidad.length} Actualizaciones)
                </h3>

                <div className="space-y-3 pt-2">
                  {searchedTicket.trazabilidad.map((evento, index) => (
                    <div
                      key={evento.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900">
                            {evento.tipoEvento === 'creacion'
                              ? 'Ticket Registrado en el Sistema'
                              : evento.tipoEvento === 'cambio_estado'
                              ? `Actualización: ${evento.estadoNuevo || 'En Proceso'}`
                              : 'Seguimiento Técnico'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {evento.fechaHora}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {evento.nota}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Privacy Compliance Footer */}
            <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Los datos de contacto personales están protegidos contra consulta pública.
              </span>
              <span className="text-[11px] text-slate-400">Canal Ciudadano Oficial</span>
            </div>
          </motion.div>
        )}

        {/* Not Found Screen */}
        {hasError && searched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-4 shadow-xs"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              No se encontró ningún ticket con el código &quot;{searchCode}&quot;
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Verifique que el número de ticket esté escrito correctamente (ej: <strong>TK-2025-001</strong>). Si acaba de registrar la incidencia, espere unos segundos mientras se sincroniza en el servidor.
            </p>
            <button
              type="button"
              onClick={() => setDemoCode('TK-2025-001')}
              className="px-4 py-2 bg-[#0066FF] text-white text-xs font-semibold rounded-xl hover:bg-[#0052cc] transition-colors cursor-pointer"
            >
              Cargar Ticket de Demostración
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
