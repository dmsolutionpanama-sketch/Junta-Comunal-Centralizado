import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  User,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  FileText,
  Image as ImageIcon,
  Video,
  Download,
  ExternalLink,
  ShieldAlert,
  Edit3,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  MessageSquare,
  Send,
  Building,
  Zap,
  Share2,
} from 'lucide-react';
import { Ticket, TicketStatus, TrazabilidadEvento } from '../../types';
import { StatusBadge, PriorityBadge } from '../common/Badge';

interface TicketModalDetailProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (newStatus: TicketStatus) => void;
  onAddTraceNote?: (note: string, eventType: TrazabilidadEvento['tipoEvento'], newStatus?: TicketStatus) => void;
}

export const TicketModalDetail: React.FC<TicketModalDetailProps> = ({
  ticket,
  isOpen,
  onClose,
  onStatusChange,
  onAddTraceNote,
}) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'fotos' | 'video' | 'documentos'>('fotos');
  const [selectedPhotoZoom, setSelectedPhotoZoom] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<TicketStatus | ''>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const photoAdjuntos = ticket.adjuntos.filter((a) => a.tipo === 'foto');
  const videoAdjuntos = ticket.adjuntos.filter((a) => a.tipo === 'video');
  const docAdjuntos = ticket.adjuntos.filter((a) => a.tipo === 'documento');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() && !selectedNewStatus) return;

    setIsSubmittingNote(true);
    if (onAddTraceNote) {
      onAddTraceNote(
        noteText.trim() || `Estado actualizado a ${selectedNewStatus}`,
        selectedNewStatus ? 'cambio_estado' : 'comentario',
        selectedNewStatus || undefined
      );
    }

    setFeedbackMsg('Actualización guardada correctamente en la bitácora.');
    setTimeout(() => {
      setFeedbackMsg(null);
      setNoteText('');
      setSelectedNewStatus('');
      setIsSubmittingNote(false);
    }, 2000);
  };

  const mapOsmUrl = ticket.ubicacionLat && ticket.ubicacionLng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${ticket.ubicacionLng - 0.008}%2C${ticket.ubicacionLat - 0.006}%2C${ticket.ubicacionLng + 0.008}%2C${ticket.ubicacionLat + 0.006}&layer=mapnik&marker=${ticket.ubicacionLat}%2C${ticket.ubicacionLng}`
    : null;

  const googleMapsLink = ticket.ubicacionLat && ticket.ubicacionLng
    ? `https://www.google.com/maps?q=${ticket.ubicacionLat},${ticket.ubicacionLng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${ticket.sectorNombre}, Panama`
      )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/60 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-[#0066FF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {ticket.numeroRegistro}
              </span>
              <StatusBadge status={ticket.estado} size="md" />
              <PriorityBadge priority={ticket.prioridad} size="md" />
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                {ticket.categoriaNombre}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight pt-1">
              {ticket.asunto}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Registrado: {ticket.fechaCreacion} a las {ticket.horaCreacion}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {ticket.sectorNombre}
              </span>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-ticket-modal"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Section 1: Reporter Information (Datos Completos de Quien Registró) */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#0066FF]" />
              Datos de Quien Registró el Reporte
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Nombre Completo:</span>
                <span className="font-semibold text-slate-800 text-sm">{ticket.reportante.nombre}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Cédula de Identidad:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 font-mono">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  {ticket.reportante.cedula}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Teléfono de Contacto:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {ticket.reportante.telefono || 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Correo Electrónico:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {ticket.reportante.email || 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Género y Edad:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {ticket.reportante.genero} • {ticket.reportante.edad} años
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Sector Residencial:</span>
                <span className="font-semibold text-[#0066FF]">{ticket.sectorNombre}</span>
              </div>
              {ticket.canalNotificacionCopia && (
                <div>
                  <span className="text-slate-400 block font-medium">Canal de Notificación / Copia:</span>
                  <span className="font-semibold text-slate-800 uppercase text-[11px] bg-slate-100 px-2 py-0.5 rounded border">
                    {ticket.canalNotificacionCopia}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Special ENSA Tracking Section if present */}
          {ticket.codigoRegistroEnsa && (
            <div className="border border-amber-300 bg-amber-50/80 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-amber-900 block">
                    Código de Registro Previo en ENSA
                  </span>
                  <span className="font-mono text-base font-extrabold text-amber-950">
                    {ticket.codigoRegistroEnsa}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-amber-200/70 text-amber-900 rounded-lg border border-amber-300">
                Seguimiento Institucional Junta Comunal
              </span>
            </div>
          )}

          {/* Section 2: Detailed Description */}
          <div className="border border-slate-200/80 rounded-xl p-5 bg-white">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0066FF]" />
              Descripción e Incidencia Reportada
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {ticket.descripcion}
            </p>
            {ticket.direccionDetallada && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Dirección y Referencia: </span>
                  {ticket.direccionDetallada}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Location / Map */}
          <div className="border border-slate-200/80 rounded-xl p-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                Ubicación Geográfica y Coordenadas
              </h3>
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir en Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block font-medium">Sector:</span>
                  <span className="font-bold text-slate-800">{ticket.sectorNombre}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-400 block font-medium">Coordenadas GPS:</span>
                  <span className="font-mono text-slate-700 font-medium">
                    {ticket.ubicacionLat ? `${ticket.ubicacionLat}, ${ticket.ubicacionLng}` : '9.083400, -79.531200'}
                  </span>
                </div>
              </div>

              {/* Map embed / Interactive View */}
              <div className="md:col-span-2 h-44 rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
                {mapOsmUrl ? (
                  <iframe
                    title="Ubicación del Ticket"
                    src={mapOsmUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <MapPin className="w-8 h-8 text-rose-500 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">{ticket.sectorNombre}, Panamá</span>
                    <span className="text-[11px]">Coordenadas aproximadas por sector</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Multimedia & Attached Documents */}
          <div className="border border-slate-200/80 rounded-xl p-5 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#0066FF]" />
                Galería de Evidencias y Documentos Adjuntos
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('fotos')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    activeMediaTab === 'fotos'
                      ? 'bg-blue-50 text-[#0066FF] font-semibold'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Fotos ({photoAdjuntos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    activeMediaTab === 'video'
                      ? 'bg-blue-50 text-[#0066FF] font-semibold'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Video ({videoAdjuntos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('documentos')}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    activeMediaTab === 'documentos'
                      ? 'bg-blue-50 text-[#0066FF] font-semibold'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Documentos PDF ({docAdjuntos.length})
                </button>
              </div>
            </div>

            {/* Photos Tab */}
            {activeMediaTab === 'fotos' && (
              <div>
                {photoAdjuntos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoAdjuntos.map((foto) => (
                      <div
                        key={foto.id}
                        onClick={() => setSelectedPhotoZoom(foto.url)}
                        className="group relative h-36 rounded-xl overflow-hidden border border-slate-200 cursor-pointer bg-slate-100"
                      >
                        <img
                          src={foto.url}
                          alt={foto.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn className="w-6 h-6" />
                        </div>
                        <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent text-[10px] text-white truncate">
                          {foto.nombre}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No se adjuntaron fotografías para este registro.
                  </div>
                )}
              </div>
            )}

            {/* Video Tab */}
            {activeMediaTab === 'video' && (
              <div>
                {videoAdjuntos.length > 0 ? (
                  <div className="space-y-4">
                    {videoAdjuntos.map((vid) => (
                      <div key={vid.id} className="rounded-xl overflow-hidden border border-slate-200 bg-black">
                        <video
                          controls
                          className="w-full max-h-72 object-contain"
                          poster={vid.thumbnailUrl}
                        >
                          <source src={vid.url} type="video/mp4" />
                          Tu navegador no soporta reproducción de video HTML5.
                        </video>
                        <div className="p-2.5 bg-slate-900 text-white text-xs flex justify-between items-center">
                          <span className="font-mono text-[11px] truncate">{vid.nombre}</span>
                          <a
                            href={vid.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir fuente
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No hay videos adjuntos para este caso.
                  </div>
                )}
              </div>
            )}

            {/* Documents PDF Tab */}
            {activeMediaTab === 'documentos' && (
              <div>
                {docAdjuntos.length > 0 ? (
                  <div className="space-y-2.5">
                    {docAdjuntos.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:bg-blue-50/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-800 truncate">{doc.nombre}</p>
                            <span className="text-[11px] text-slate-400">Documento PDF Oficial</span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.nombre}
                          className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar / Ver</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No se adjuntaron documentos PDF para este ticket.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Fast Status Changer and Trace Note */}
          <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#0066FF]" />
              Gestión Interna y Bitácora Rápida
            </h3>

            {feedbackMsg && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Escriba una nota interna de seguimiento para las cuadrillas..."
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>
                <div>
                  <select
                    value={selectedNewStatus}
                    onChange={(e) => setSelectedNewStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF]"
                  >
                    <option value="">Mantener estado ({ticket.estado})</option>
                    <option value="abierto">Cambiar a: Abierto</option>
                    <option value="en_progreso">Cambiar a: En Progreso</option>
                    <option value="resuelto">Cambiar a: Resuelto</option>
                    <option value="cerrado">Cambiar a: Cerrado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote || (!noteText.trim() && !selectedNewStatus)}
                  className="py-2 px-4 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Guardar en Trazabilidad</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Asignado a: <span className="font-semibold text-slate-800">{ticket.asignadoA || 'Sin asignar'}</span>
          </div>
          <button
            type="button"
            id="btn-close-modal-bottom"
            onClick={onClose}
            className="py-2 px-5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

        {/* Lightbox Photo Zoom Modal */}
        <AnimatePresence>
          {selectedPhotoZoom && (
            <div
              onClick={() => setSelectedPhotoZoom(null)}
              className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
            >
              <div className="relative max-w-4xl max-h-full">
                <img
                  src={selectedPhotoZoom}
                  alt="Zoom"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPhotoZoom(null)}
                  className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black p-2 rounded-full cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
