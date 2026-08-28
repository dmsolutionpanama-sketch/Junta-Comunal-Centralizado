import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plus,
  Send,
  Upload,
  User,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  Paperclip,
  Compass,
} from 'lucide-react';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { CreateTicketInput, TicketPriority } from '../../types';
import { GoogleMapLocationPicker } from '../common/GoogleMapLocationPicker';
import { getCategoryPrefix } from '../../utils/ticketCodeGenerator';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTicket: (ticketInput: CreateTicketInput) => Promise<boolean>;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmitTicket,
}) => {
  const [asunto, setAsunto] = useState('');
  const [categoriaId, setCategoriaId] = useState(CATEGORIAS_SISTEMA[0].id);
  const [sectorNombre, setSectorNombre] = useState(SECTORES_RESIDENCIA[0]);
  const [prioridad, setPrioridad] = useState<TicketPriority>('media');
  const [descripcion, setDescripcion] = useState('');
  const [direccionDetallada, setDireccionDetallada] = useState('');
  const [ubicacionLat, setUbicacionLat] = useState<number>(9.0834);
  const [ubicacionLng, setUbicacionLng] = useState<number>(-79.5312);

  // Reporter data
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [genero, setGenero] = useState<'masculino' | 'femenino' | 'otro'>('masculino');
  const [edad, setEdad] = useState<number>(35);

  // Attachments mock
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{ id: string; nombre: string; tipo: 'foto' | 'video' | 'documento'; url: string }>
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedCat = CATEGORIAS_SISTEMA.find((c) => c.id === categoriaId) || CATEGORIAS_SISTEMA[0];
  const suggestedPrefix = getCategoryPrefix(selectedCat.nombre, selectedCat.id, selectedCat.prefijo);

  const handleFileUploadMock = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments = Array.from(files).map((file: File, idx: number) => {
      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');
      const tipo: 'foto' | 'video' | 'documento' = isVideo ? 'video' : isImage ? 'foto' : 'documento';

      return {
        id: `att-new-${Date.now()}-${idx}`,
        nombre: file.name,
        tipo,
        url: isImage
          ? 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80'
          : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      };
    });

    setAttachedFiles((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend validation before submission
    if (!asunto.trim() || !descripcion.trim() || !nombre.trim() || !cedula.trim()) {
      setError('Por favor complete los campos obligatorios (Asunto, Descripción, Nombre y Cédula).');
      return;
    }

    if (descripcion.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres para mayor detalle técnico.');
      return;
    }

    setIsLoading(true);

    try {
      const ticketData: CreateTicketInput = {
        asunto: asunto.trim(),
        categoriaId,
        categoriaNombre: selectedCat.nombre,
        sectorNombre,
        prioridad,
        descripcion: descripcion.trim(),
        direccionDetallada: direccionDetallada.trim(),
        ubicacionLat,
        ubicacionLng,
        reportante: {
          nombre: nombre.trim(),
          cedula: cedula.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          genero,
          edad: Number(edad) || 30,
          sector: sectorNombre,
        },
        adjuntos: attachedFiles,
      };

      const ok = await onSubmitTicket(ticketData);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      }
    } catch {
      setError('Error al registrar el ticket. Verifique los datos de entrada.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Registrar Nuevo Ticket de Incidencia
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-mono text-[11px] font-bold">
                Prefijo: {suggestedPrefix}-2025-XXX
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              Ingrese los detalles del reporte ciudadano y ubique el pin en Google Maps
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>¡Ticket registrado exitosamente! Notificación de correo despachada.</span>
            </div>
          )}

          {/* 1. Case Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              1. Información del Incidente
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Asunto del Ticket *
              </label>
              <input
                type="text"
                required
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                placeholder="Ej: Luminaria apagada frente a la escuela primaria..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría del Caso *
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {CATEGORIAS_SISTEMA.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre} ({cat.prefijo || 'ALU'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sector de Residencia *
                </label>
                <select
                  value={sectorNombre}
                  onChange={(e) => setSectorNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                >
                  {SECTORES_RESIDENCIA.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nivel de Prioridad *
                </label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as TicketPriority)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descripción Detallada *
              </label>
              <textarea
                rows={3}
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explique claramente el problema para la cuadrilla de atención..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium resize-none"
              />
            </div>

            {/* Google Maps Location & Pin Picker */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Ubicación en Google Maps & Pin Georreferenciado
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-normal">
                  Búsqueda y coordenadas en vivo
                </span>
              </label>
              <GoogleMapLocationPicker
                initialLat={ubicacionLat}
                initialLng={ubicacionLng}
                initialAddress={direccionDetallada}
                onLocationChange={({ lat, lng, address }) => {
                  setUbicacionLat(lat);
                  setUbicacionLng(lng);
                  if (address) setDireccionDetallada(address);
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dirección Exacta o Punto de Referencia Adicional
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={direccionDetallada}
                  onChange={(e) => setDireccionDetallada(e.target.value)}
                  placeholder="Calle 3ra, casa 45B, diagonal al minisúper..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>
          </div>

          {/* 2. Citizen / Reporter Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              2. Datos del Solicitante / Reportante
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez González"
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
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  placeholder="8-123-4567"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono Móvil
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="6500-1234"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Género
                </label>
                <select
                  value={genero}
                  onChange={(e) => setGenero(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value="femenino">Femenino</option>
                  <option value="masculino">Masculino</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Edad
                </label>
                <input
                  type="number"
                  min="18"
                  max="110"
                  value={edad}
                  onChange={(e) => setEdad(parseInt(e.target.value) || 18)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico (Para confirmación y alertas de avance)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vecino@comunidad.gob.pa"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>
          </div>

          {/* 3. Attachments */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              3. Evidencias y Archivos Adjuntos (Fotos, Video, PDF)
            </h3>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Arrastre o seleccione archivos de evidencia
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Soporta fotografías (JPG/PNG), videos explicativos (MP4) o cartas/permisos (PDF)
              </p>
              <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-xs">
                <span>Examinar archivos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileUploadMock}
                  className="hidden"
                />
              </label>
            </div>

            {attachedFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.tipo === 'foto' && <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />}
                      {file.tipo === 'video' && <Video className="w-4 h-4 text-purple-500 shrink-0" />}
                      {file.tipo === 'documento' && <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />}
                      <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                        {file.nombre}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Radicar Incidencia ({suggestedPrefix})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

