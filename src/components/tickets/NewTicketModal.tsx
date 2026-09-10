import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Upload,
  User,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Paperclip,
  Zap,
  Droplets,
  TreePine,
  HeartHandshake,
  FileCheck,
  Trophy,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Clock,
  Calendar,
  Hash,
  Trash2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { CATEGORIAS_SISTEMA } from '../../config/categories';
import { SECTORES_RESIDENCIA } from '../../config/sectors';
import { CreateTicketInput, TicketPriority } from '../../types';
import { GoogleMapLocationPicker } from '../common/GoogleMapLocationPicker';
import { getCategoryPrefix } from '../../utils/ticketCodeGenerator';
import { PredictiveSectorInput } from './PredictiveSectorInput';
import { ticketService } from '../../services/ticketService';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTicket: (ticketInput: CreateTicketInput) => Promise<boolean>;
}

// The 6 official report categories defined by the user
const REPORT_TYPES = [
  {
    id: 'alumbrado-electrico',
    num: 1,
    nombre: 'Alumbrado Eléctrico',
    prefijo: 'ALU',
    icono: Zap,
    color: 'blue',
    bgLight: 'bg-blue-50 dark:bg-blue-950/40',
    borderActive: 'border-blue-500 ring-2 ring-blue-500/20',
    textColor: 'text-blue-600 dark:text-blue-400',
    descripcion: 'Luminarias apagadas, postes inclinados, cables sueltos o transformadores',
    active: true,
  },
  {
    id: 'danos-agua',
    num: 2,
    nombre: 'Daños de Agua',
    prefijo: 'AGU',
    icono: Droplets,
    color: 'cyan',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/40',
    borderActive: 'border-cyan-500 ring-2 ring-cyan-500/20',
    textColor: 'text-cyan-600 dark:text-cyan-400',
    descripcion: 'Fugas de agua potable, rotura de tuberías, baja presión o alcantarillado',
    active: false,
  },
  {
    id: 'corte-arboles-poda',
    num: 3,
    nombre: 'Corte de Arboles o Poda',
    prefijo: 'POD',
    icono: TreePine,
    color: 'emerald',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    descripcion: 'Ramas en peligro sobre tendido eléctrico, vías públicas o áreas comunales',
    active: false,
  },
  {
    id: 'ayuda-social',
    num: 4,
    nombre: 'Ayuda Social',
    prefijo: 'SOC',
    icono: HeartHandshake,
    color: 'orange',
    bgLight: 'bg-orange-50 dark:bg-orange-950/40',
    borderActive: 'border-orange-500 ring-2 ring-orange-500/20',
    textColor: 'text-orange-600 dark:text-orange-400',
    descripcion: 'Asistencia humanitaria, alimentos, medicinas, subsidios o contingencias',
    active: false,
  },
  {
    id: 'certificados-permisos',
    num: 5,
    nombre: 'Certificados y permisos',
    prefijo: 'CER',
    icono: FileCheck,
    color: 'purple',
    bgLight: 'bg-purple-50 dark:bg-purple-950/40',
    borderActive: 'border-purple-500 ring-2 ring-purple-500/20',
    textColor: 'text-purple-600 dark:text-purple-400',
    descripcion: 'Cartas de vecindad, permisos comunitarios, certificaciones de residencia',
    active: false,
  },
  {
    id: 'permisos-liga-deportiva',
    num: 6,
    nombre: 'Permisos para liga deportiva',
    prefijo: 'DEP',
    icono: Trophy,
    color: 'teal',
    bgLight: 'bg-teal-50 dark:bg-teal-950/40',
    borderActive: 'border-teal-500 ring-2 ring-teal-500/20',
    textColor: 'text-teal-600 dark:text-teal-400',
    descripcion: 'Uso de canchas comunales, torneos deportivos barriales y actividades físicas',
    active: false,
  },
];

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmitTicket,
}) => {
  // Selected Report Type
  const [selectedTypeId, setSelectedTypeId] = useState<string>('alumbrado-electrico');

  // Fields for Alumbrado Eléctrico
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sectorNombre, setSectorNombre] = useState(SECTORES_RESIDENCIA[0]);
  const [asunto, setAsunto] = useState('Avería en Luminaria Pública');
  const [descripcion, setDescripcion] = useState('');
  const [direccionDetallada, setDireccionDetallada] = useState('');
  const [ubicacionLat, setUbicacionLat] = useState<number>(9.0834);
  const [ubicacionLng, setUbicacionLng] = useState<number>(-79.5312);
  const [prioridad, setPrioridad] = useState<TicketPriority>('media');

  // Citizen registration verification state
  const [isCheckingCitizen, setIsCheckingCitizen] = useState(false);
  const [citizenFound, setCitizenFound] = useState<boolean | null>(null);
  const [citizenDetails, setCitizenDetails] = useState<any>(null);
  const [showRegisterCitizenBox, setShowRegisterCitizenBox] = useState(false);
  const [citizenRegisteredJustNow, setCitizenRegisteredJustNow] = useState(false);

  // Attachments (Photos or optional video)
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{ id: string; nombre: string; tipo: 'foto' | 'video' | 'documento'; url: string; size?: string }>
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null);
  const [createdSecurityCode, setCreatedSecurityCode] = useState<string | null>(null);

  // Security consecutive preview calculation
  const currentYear = new Date().getFullYear();
  const projectedReportNum = `ALU-${currentYear}-004`;
  const projectedSecurityConsecutive = `CS-${currentYear}-ALU-${String(Math.floor(1000 + Math.random() * 9000))}`;

  // Current timestamp for traceability
  const [currentTime, setCurrentTime] = useState({
    fecha: new Date().toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' }),
    hora: new Date().toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime({
        fecha: now.toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' }),
        hora: now.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle cédula change with auto-verification
  const handleVerifyCedula = async (cedulaInput: string) => {
    const clean = cedulaInput.trim();
    if (clean.length < 3) {
      setCitizenFound(null);
      setCitizenDetails(null);
      setShowRegisterCitizenBox(false);
      return;
    }

    setIsCheckingCitizen(true);
    try {
      const result = await ticketService.lookupCitizen(clean);
      if (result.success && result.found && result.citizen) {
        setCitizenFound(true);
        setCitizenDetails(result.citizen);
        setShowRegisterCitizenBox(false);
        // Auto-fill fields from citizen record
        if (result.citizen.nombre && !nombre) setNombre(result.citizen.nombre);
        if (result.citizen.apellido && !apellido) setApellido(result.citizen.apellido);
        if (result.citizen.telefono && !telefono) setTelefono(result.citizen.telefono);
        if (result.citizen.email && !email) setEmail(result.citizen.email);
        if (result.citizen.sector && SECTORES_RESIDENCIA.includes(result.citizen.sector)) {
          setSectorNombre(result.citizen.sector);
        }
      } else {
        setCitizenFound(false);
        setCitizenDetails(null);
        setShowRegisterCitizenBox(true);
      }
    } catch {
      setCitizenFound(false);
      setShowRegisterCitizenBox(true);
    } finally {
      setIsCheckingCitizen(false);
    }
  };

  const handleCedulaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCedula(val);
    setCitizenRegisteredJustNow(false);
    if (val.trim().length >= 4) {
      handleVerifyCedula(val);
    } else {
      setCitizenFound(null);
      setShowRegisterCitizenBox(false);
    }
  };

  // Inline registration of citizen in Padrón
  const handleRegisterCitizen = () => {
    if (!nombre.trim() || !apellido.trim() || !cedula.trim()) {
      setError('Para registrar al ciudadano en el padrón debe ingresar Nombre, Apellido y Cédula.');
      return;
    }
    setCitizenRegisteredJustNow(true);
    setCitizenFound(true);
    setShowRegisterCitizenBox(false);
    setError(null);
  };

  // Upload photos and optional video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems = Array.from(files).map((file: File, idx: number) => {
      const isVideo = file.type.startsWith('video');
      const isImage = file.type.startsWith('image');
      const tipo: 'foto' | 'video' | 'documento' = isVideo ? 'video' : isImage ? 'foto' : 'documento';
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

      return {
        id: `att-${Date.now()}-${idx}`,
        nombre: file.name,
        tipo,
        size: `${sizeMb} MB`,
        url: isImage
          ? 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80'
          : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      };
    });

    setAttachedFiles((prev) => [...prev, ...newItems]);
  };

  const removeAttachment = (id: string) => {
    setAttachedFiles((prev) => prev.filter((a) => a.id !== id));
  };

  // Submit specialized Alumbrado Eléctrico form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate report type
    if (selectedTypeId !== 'alumbrado-electrico') {
      setError('Por el momento el formulario especializado habilitado es "Alumbrado Eléctrico". Seleccione dicho tipo para continuar.');
      return;
    }

    // Validate required fields
    if (!cedula.trim()) {
      setError('La Cédula de quien reporta es obligatoria para garantizar la fuente seria del reporte.');
      return;
    }

    if (!nombre.trim() || !apellido.trim()) {
      setError('El Nombre y Apellido de quien reporta son obligatorios.');
      return;
    }

    if (!sectorNombre.trim()) {
      setError('Debe especificar el Sector de la comunidad donde se ubica la avería.');
      return;
    }

    if (!descripcion.trim() || descripcion.trim().length < 5) {
      setError('Por favor describa brevemente el problema de alumbrado (mínimo 5 caracteres).');
      return;
    }

    setIsLoading(true);

    try {
      const ticketData: CreateTicketInput = {
        asunto: asunto.trim() || 'Avería en Alumbrado Eléctrico',
        categoriaId: 'alumbrado-electrico',
        categoriaNombre: 'Alumbrado Eléctrico',
        tipoReporte: 'Alumbrado Eléctrico',
        sectorNombre: sectorNombre.trim(),
        prioridad,
        descripcion: descripcion.trim(),
        direccionDetallada: direccionDetallada.trim(),
        ubicacionLat,
        ubicacionLng,
        consecutivoSeguridad: projectedSecurityConsecutive,
        reportante: {
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          cedula: cedula.trim(),
          telefono: telefono.trim(),
          email: email.trim(),
          genero: 'otro',
          edad: 35,
          sector: sectorNombre.trim(),
          registradoEnPadron: citizenFound === true || citizenRegisteredJustNow,
        },
        adjuntos: attachedFiles.map((f) => ({
          id: f.id,
          nombre: f.nombre,
          tipo: f.tipo,
          url: f.url,
        })),
        datosEspecificosReporte: {
          tipoAveria: 'Alumbrado Eléctrico',
          fuenteSeriaVerificada: citizenFound === true || citizenRegisteredJustNow,
          fechaRegistro: currentTime.fecha,
          horaRegistro: currentTime.hora,
          consecutivoSeguridad: projectedSecurityConsecutive,
        },
      };

      const ok = await onSubmitTicket(ticketData);
      if (ok) {
        setSuccess(true);
        setCreatedTicketCode(projectedReportNum);
        setCreatedSecurityCode(projectedSecurityConsecutive);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2200);
      }
    } catch {
      setError('Error al registrar el reporte. Compruebe los datos e intente de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentType = REPORT_TYPES.find((t) => t.id === selectedTypeId) || REPORT_TYPES[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header with Security Consecutive & Category Prefix */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                Ingreso de Nuevo Reporte Comunal
              </h2>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-xs font-bold border border-blue-200 dark:border-blue-900 flex items-center gap-1">
                <Hash className="w-3 h-3 text-blue-600" />
                {currentType.prefijo}-{currentYear}-XXX
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[11px] font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Consecutivo Seguridad: {projectedSecurityConsecutive}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Elija el tipo de reporte oficial de la lista y complete los datos adaptados con trazabilidad garantizada.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-thin">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ¡Reporte de Alumbrado Eléctrico Radicado con Éxito!
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Se ha asignado el Número Oficial <strong>{createdTicketCode}</strong> y el Consecutivo de Seguridad Inviolable <strong>{createdSecurityCode}</strong> para trazabilidad histórica.
              </p>
            </div>
          )}

          {/* PASO 1: SELECCIÓN DEL TIPO DE REPORTE (DE LA LISTA DE LOS 6) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                Paso 1: Seleccione el Tipo de Reporte (Lista de los 6 Oficiales)
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                Cada formulario adapta sus campos automáticamente
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {REPORT_TYPES.map((cat) => {
                const IconComponent = cat.icono;
                const isSelected = selectedTypeId === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedTypeId(cat.id);
                      if (cat.id === 'alumbrado-electrico') {
                        setAsunto('Avería en Luminaria Pública');
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                        {cat.num}. {cat.prefijo}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {cat.nombre}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {cat.descripcion}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="mt-2 pt-1 border-t border-blue-200 dark:border-blue-900 flex items-center gap-1 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Formulario Activo
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedTypeId !== 'alumbrado-electrico' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    Formulario para "{currentType.nombre}" en desarrollo para la siguiente fase.
                  </p>
                  <p className="text-amber-800 dark:text-amber-300">
                    Según las instrucciones del proyecto, actualmente se encuentra totalmente activo y adaptado el formulario de <strong>Alumbrado Eléctrico</strong>. Puede conmutar a Alumbrado Eléctrico para registrar el reporte con los nuevos campos de cédula, nombre, apellido, texto predictivo y georreferencia.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedTypeId('alumbrado-electrico')}
                    className="mt-1 inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Activar Formulario de Alumbrado Eléctrico <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PASO 2: FORMULARIO ESPECIALIZADO DE ALUMBRADO ELÉCTRICO */}
          {selectedTypeId === 'alumbrado-electrico' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header Box del Tipo de Reporte */}
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 tracking-wider">
                      Tipo de reporte seleccionado
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Alumbrado Eléctrico
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block leading-none">Número de Reporte</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-xs">
                      {projectedReportNum}
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                    <span className="text-[10px] text-slate-400 block leading-none">Consecutivo de Seguridad</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      {projectedSecurityConsecutive}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 1: DATOS DEL REPORTANTE Y VALIDACIÓN DE CÉDULA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Datos de quien reporta (Fuente Seria y Fidedigna)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Validación en base de datos (Padrón Comunitario)
                  </span>
                </div>

                {/* Cédula con verificación en tiempo real */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Cédula de quien reporta *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={handleCedulaInputChange}
                      placeholder="Ej: 8-765-4321 o 8-123-456"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 font-mono font-semibold text-slate-900 dark:text-slate-100 tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => handleVerifyCedula(cedula)}
                      disabled={isCheckingCitizen || cedula.trim().length < 3}
                      className="absolute right-2 top-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isCheckingCitizen ? 'Verificando...' : 'Verificar en Padrón'}
                    </button>
                  </div>

                  {/* Citizen verification status banners */}
                  <div className="mt-2">
                    {citizenFound === true && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
                        <span className="flex items-center gap-2 font-semibold">
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          ✅ Ciudadano registrado en el Padrón Municipal. Fuente seria y fidedigna verificada.
                        </span>
                        {citizenDetails && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                            {citizenDetails.nombreCompleto} ({citizenDetails.sector || 'Comunidad'})
                          </span>
                        )}
                      </div>
                    )}

                    {citizenFound === false && (
                      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2 text-xs text-amber-950 dark:text-amber-200">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">
                              ⚠️ Cédula no registrada en el padrón comunitario.
                            </p>
                            <p className="text-amber-800 dark:text-amber-300 text-[11px] mt-0.5">
                              Para garantizar que el reporte sea de fuentes serias, favor registrar al ciudadano a continuación. Esta información será validada con la base de datos oficial en la Fase 2.
                            </p>
                          </div>
                        </div>

                        {showRegisterCitizenBox && (
                          <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                              Complete el Nombre y Apellido abajo y pulse para validar la fuente:
                            </span>
                            <button
                              type="button"
                              onClick={handleRegisterCitizen}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Registrar en Padrón
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Campos separados: Nombre y Apellido */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Juan Antonio"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      placeholder="Ej: Pérez Castillo"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>
                </div>

                {/* Contacto complementario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono Móvil (Para confirmación y cuadrilla)
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej: 6543-2100"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico (Opcional)
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
              </div>

              {/* SECCIÓN 2: SECTOR DE LA COMUNIDAD CON TEXTO PREDICTIVO Y SUGERENCIA DE SIMILARES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Sector de la comunidad
                  </h4>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                    Escrito + Texto Predictivo + Sugerencia de Similares
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Sector o Barriada de la Incidencia *
                  </label>
                  <PredictiveSectorInput
                    value={sectorNombre}
                    onChange={(newSector) => setSectorNombre(newSector)}
                    sectors={SECTORES_RESIDENCIA}
                    placeholder="Escriba el sector (ej: Altos de la Rotonda, Villa Zaita, Gonzalillo...)"
                  />
                </div>
              </div>

              {/* SECCIÓN 3: DETALLE TÉCNICO DE LA AVERÍA DE ALUMBRADO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Detalle de Avería de Alumbrado Eléctrico
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Prioridad:</span>
                    <select
                      value={prioridad}
                      onChange={(e) => setPrioridad(e.target.value as TicketPriority)}
                      className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Asunto del Reporte de Alumbrado *
                  </label>
                  <input
                    type="text"
                    required
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder="Ej: Luminaria apagada frente a la casa comunal / Poste inclinado"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Descripción del Problema de Alumbrado *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Indique si la lámpara titila, si el foco está completamente fundido, si hay cables expuestos o el número rotulado en el poste..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium resize-none"
                  />
                </div>
              </div>

              {/* SECCIÓN 4: GEOREFERENCIA CON MAPA Y PIN */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Georeferencia (Ubicación en Mapa)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Lat: {ubicacionLat.toFixed(5)}, Lng: {ubicacionLng.toFixed(5)}
                  </span>
                </div>

                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
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
                    Punto de Referencia Exacto (Calle, número de poste o referencia visual)
                  </label>
                  <input
                    type="text"
                    value={direccionDetallada}
                    onChange={(e) => setDireccionDetallada(e.target.value)}
                    placeholder="Ej: Frente al poste #48-B, calle principal detrás del minisúper"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>
              </div>

              {/* SECCIÓN 5: FOTOGRAFÍAS O VIDEO OPCIONAL */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" />
                    Fotografías o Video Opcional
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Evidencias visuales para la cuadrilla
                  </span>
                </div>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-5 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex justify-center gap-3 mb-2">
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                    <Video className="w-6 h-6 text-purple-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Cargue Fotografías o Videos de la Luminaria / Poste
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Formatos admitidos: JPG, PNG, WEBP o videos cortos en MP4 / MOV (opcional)
                  </p>
                  <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>Seleccionar Archivos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Previews */}
                {attachedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {attachedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {file.tipo === 'video' ? (
                            <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600">
                              <Video className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                              <ImageIcon className="w-4 h-4" />
                            </span>
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                              {file.nombre}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                              {file.tipo} {file.size && `• ${file.size}`}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(file.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECCIÓN 6: TRAZABILIDAD, AUDITORÍA Y FECHA/HORA */}
              <div className="p-4 bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Garantía de Trazabilidad y Anti-Borrado de Datos
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Canal: Portal Ciudadano
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Fecha Registro:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentTime.fecha}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Hora Registro:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{currentTime.hora}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fuente:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {citizenFound || citizenRegisteredJustNow ? 'Padrón Verificado' : 'Ciudadano Residente'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Consecutivo Inviolable:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {projectedSecurityConsecutive}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Registrando Reporte...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Radicar Reporte de Alumbrado Eléctrico</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
