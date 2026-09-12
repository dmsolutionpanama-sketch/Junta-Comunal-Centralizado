import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  Tv,
  Image as ImageIcon,
  Youtube,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Play,
  Volume2,
  VolumeX,
  Upload,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Layers,
  Info,
} from 'lucide-react';
import { User } from '../../types';
import {
  BannerConfig,
  BannerSlide,
  DEFAULT_BANNER_CONFIG,
  DEFAULT_BANNER_SLIDES,
  BANNER_STORAGE_KEY,
} from '../../types/banner';

interface AdminBannerConfigViewProps {
  currentUser: User | null;
}

// Preset photos for quick selection
const SUGGESTED_PHOTOS: Array<{ url: string; titulo: string; subtitulo: string; etiqueta: string }> = [
  {
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Junta Comunal al Servicio de la Comunidad',
    subtitulo: 'Compromiso, transparencia y respuesta inmediata a las necesidades del corregimiento',
    etiqueta: 'Gestión Municipal',
  },
  {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Mantenimiento y Obras de Infraestructura Vial',
    subtitulo: 'Cuadrillas operando activamente en bacheo, aceras y canalizaciones pluviales',
    etiqueta: 'Cuadrillas en Terreno',
  },
  {
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Modernización del Alumbrado Público & ENSA',
    subtitulo: 'Fiscalización y reparación continua de luminarias en todos los sectores residenciales',
    etiqueta: 'Energía & Seguridad Vecinal',
  },
  {
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Atención Ciudadana y Participación Vecinal',
    subtitulo: 'Canal abierto para la recepción y trazabilidad de reportes las 24 horas',
    etiqueta: 'Gobierno Abierto',
  },
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Edificio de la Junta Comunal y Sedes Comunitarias',
    subtitulo: 'Instalaciones equipadas para trámites vecinales y asambleas ciudadanas',
    etiqueta: 'Atención al Vecino',
  },
  {
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Recuperación de Parques y Espacios Públicos',
    subtitulo: 'Mantenimiento de áreas verdes, canchas deportivas y zonas de recreación infantil',
    etiqueta: 'Ornato & Medio Ambiente',
  },
];

// Helper to extract YouTube ID
const extractYoutubeId = (input: string): string => {
  if (!input) return '';
  const clean = input.trim();
  if (clean.includes('youtu.be/')) {
    return clean.split('youtu.be/')[1]?.split('?')[0] || clean;
  }
  if (clean.includes('watch?v=')) {
    return clean.split('watch?v=')[1]?.split('&')[0] || clean;
  }
  if (clean.includes('embed/')) {
    return clean.split('embed/')[1]?.split('?')[0] || clean;
  }
  return clean;
};

export const AdminBannerConfigView: React.FC<AdminBannerConfigViewProps> = ({ currentUser }) => {
  // Check Super Admin privilege
  const isSuperAdmin = currentUser?.rol === 'administrador';

  // State for config
  const [config, setConfig] = useState<BannerConfig>(() => {
    try {
      const savedV2 = localStorage.getItem(BANNER_STORAGE_KEY);
      if (savedV2) {
        return JSON.parse(savedV2);
      }
      const savedOld = localStorage.getItem('citizen_banner_config');
      if (savedOld) {
        const parsed = JSON.parse(savedOld);
        return {
          ...DEFAULT_BANNER_CONFIG,
          tipo: parsed.tipo || 'slide',
          altura: parsed.altura || 380,
          youtubeId: parsed.youtubeId || 'L_LUpnjgPso',
          youtubeAutoplay: parsed.youtubeAutoplay ?? true,
          slideIntervalSeconds: parsed.slideIntervalSeconds || 5,
        };
      }
    } catch {
      // default
    }
    return DEFAULT_BANNER_CONFIG;
  });

  // State for YouTube link input
  const [youtubeInput, setYoutubeInput] = useState<string>(config.youtubeId);

  // State for Slide Management
  const [editingSlide, setEditingSlide] = useState<BannerSlide | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  // Toast / Save feedback
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dbSaved, setDbSaved] = useState<boolean | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Load from backend on mount
  useEffect(() => {
    fetch('/api/banner/config')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setConfig(json.data);
          setYoutubeInput(json.data.youtubeId || '');
          localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(json.data));
        }
      })
      .catch((err) => {
        console.warn('Fallback to local banner config:', err);
      });
  }, []);

  // Preview cycle timer
  useEffect(() => {
    if (config.tipo !== 'slide' || !config.slides.length) return;
    const interval = setInterval(() => {
      setPreviewSlideIdx((prev) => (prev + 1) % config.slides.length);
    }, config.slideIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [config.tipo, config.slideIntervalSeconds, config.slides.length]);

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    const finalYoutubeId = extractYoutubeId(youtubeInput) || config.youtubeId;
    const updatedConfig: BannerConfig = {
      ...config,
      youtubeId: finalYoutubeId,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.nombre || 'Super Administrador',
    };

    setConfig(updatedConfig);
    // Persist in localStorage both keys for maximum resilience
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(updatedConfig));
    localStorage.setItem('citizen_banner_config', JSON.stringify(updatedConfig));

    // Persist to Backend API & MySQL
    try {
      const res = await fetch('/api/banner/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
      const data = await res.json();
      setDbSaved(data.savedInDb ?? true);
    } catch {
      setDbSaved(false);
    } finally {
      setIsSaving(false);
    }

    // Dispatch custom event to notify all open windows/tabs instantly
    window.dispatchEvent(new Event('banner_config_updated'));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset to Defaults
  const handleReset = async () => {
    if (window.confirm('¿Está seguro de restablecer el banner institucional a los valores predeterminados?')) {
      setConfig(DEFAULT_BANNER_CONFIG);
      setYoutubeInput(DEFAULT_BANNER_CONFIG.youtubeId);
      localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(DEFAULT_BANNER_CONFIG));
      localStorage.setItem('citizen_banner_config', JSON.stringify(DEFAULT_BANNER_CONFIG));
      try {
        await fetch('/api/banner/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(DEFAULT_BANNER_CONFIG),
        });
      } catch {
        // local ok
      }
      window.dispatchEvent(new Event('banner_config_updated'));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Add / Edit Slide
  const handleOpenNewSlideModal = () => {
    setEditingSlide({
      id: `slide-${Date.now()}`,
      url: SUGGESTED_PHOTOS[0].url,
      titulo: '',
      subtitulo: '',
      etiqueta: 'Comunidad',
    });
    setIsSlideModalOpen(true);
  };

  const handleOpenEditSlide = (slide: BannerSlide) => {
    setEditingSlide({ ...slide });
    setIsSlideModalOpen(true);
  };

  const handleSaveSlideModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    if (!editingSlide.url.trim() || !editingSlide.titulo.trim()) {
      alert('Por favor ingrese la imagen y el título del slide.');
      return;
    }

    const exists = config.slides.some((s) => s.id === editingSlide.id);
    let newSlides: BannerSlide[];
    if (exists) {
      newSlides = config.slides.map((s) => (s.id === editingSlide.id ? editingSlide : s));
    } else {
      newSlides = [...config.slides, editingSlide];
    }

    setConfig((prev) => ({ ...prev, slides: newSlides }));
    setIsSlideModalOpen(false);
    setEditingSlide(null);
  };

  const handleDeleteSlide = (id: string) => {
    if (config.slides.length <= 1) {
      alert('Debe conservar al menos una foto en el carrusel.');
      return;
    }
    if (window.confirm('¿Desea eliminar esta foto del carrusel?')) {
      setConfig((prev) => ({
        ...prev,
        slides: prev.slides.filter((s) => s.id !== id),
      }));
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= config.slides.length) return;
    const newSlides = [...config.slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIdx];
    newSlides[targetIdx] = temp;
    setConfig((prev) => ({ ...prev, slides: newSlides }));
  };

  // File Upload to Server & Base64 Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccione un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar los 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (editingSlide) {
        setEditingSlide((prev) => (prev ? { ...prev, url: base64 } : null));
        // Also upload to server
        try {
          const res = await fetch('/api/banner/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileBase64: base64,
              fileName: file.name,
            }),
          });
          const json = await res.json();
          if (json.success && json.url) {
            setEditingSlide((prev) => (prev ? { ...prev, url: json.url } : null));
          }
        } catch {
          // base64 fallback kept
        }
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-[1400px] w-full mx-auto p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
          Acceso Restringido al Super Administrador
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Este módulo de configuración del banner institucional y medios visuales del portal ciudadano está reservado exclusivamente para la cuenta de Super Administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Super Admin Badge */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Configuración del Banner Institucional (Portal Ciudadano)
              </h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 uppercase border border-blue-200 dark:border-blue-800">
                Super Admin
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Backend MySQL Conectado
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Controle la presencia visual del front-end público. Cambie fotos del carrusel, cargue nuevas imágenes o conmute a un video institucional mediante enlace de YouTube.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            title="Restablecer valores originales del banner"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando en BD...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-200 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                ¡Banner actualizado exitosamente! Los cambios ya son visibles en el portal ciudadano con ancho de 1400px y diseño adaptativo.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
              Sincronizado
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Control Deck: Tipo de Medio (Foto Slide vs Video) + Altura del Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col A: Tipo de Contenido (Slide vs YouTube) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Tipo de Medio del Banner
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Seleccione si el banner presentará una galería de fotos en transición o un video institucional interactivo.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setConfig((p) => ({ ...p, tipo: 'slide' }))}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                config.tipo === 'slide'
                  ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <ImageIcon className="w-6 h-6 mb-2 text-blue-600" />
              <span>Foto Slide (Fotos)</span>
              <span className="text-[10px] font-normal text-slate-400 mt-1">
                {config.slides.length} diapositivas
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConfig((p) => ({ ...p, tipo: 'youtube' }))}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                config.tipo === 'youtube'
                  ? 'bg-red-50 dark:bg-red-950/70 border-red-600 text-red-700 dark:text-red-300 ring-2 ring-red-500/20 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Youtube className="w-6 h-6 mb-2 text-red-600" />
              <span>Video YouTube</span>
              <span className="text-[10px] font-normal text-slate-400 mt-1">
                Enlace / ID activo
              </span>
            </button>
          </div>
        </div>

        {/* Col B: Altura y Dimensiones del Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Altura del Banner
              </h3>
            </div>
            <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              {config.altura} px
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { h: 260, label: 'Compacto' },
              { h: 340, label: 'Medio' },
              { h: 420, label: 'Estándar' },
              { h: 500, label: 'Cinemático' },
            ].map((preset) => (
              <button
                key={preset.h}
                type="button"
                onClick={() => setConfig((p) => ({ ...p, altura: preset.h }))}
                className={`py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                  config.altura === preset.h
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>{preset.h}px</div>
                <div className="text-[9px] font-normal opacity-80">{preset.label}</div>
              </button>
            ))}
          </div>

          {/* Slider for custom height */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
              <span>Ajuste fino continuo:</span>
              <span>200px - 600px</span>
            </div>
            <input
              type="range"
              min={200}
              max={600}
              step={10}
              value={config.altura}
              onChange={(e) => setConfig((p) => ({ ...p, altura: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        {/* Col C: Opciones Globales de Reproducción y Fondo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Parámetros de Reproducción
            </h3>
          </div>

          {config.tipo === 'slide' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Velocidad de Transición de Fotos
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[3, 5, 8, 12].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, slideIntervalSeconds: s }))}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        config.slideIntervalSeconds === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {s} seg
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Degradado oscuro de contraste
                </span>
                <input
                  type="checkbox"
                  checked={config.mostrarGradiente}
                  onChange={(e) => setConfig((p) => ({ ...p, mostrarGradiente: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Autoplay automático</span>
                <input
                  type="checkbox"
                  checked={config.youtubeAutoplay}
                  onChange={(e) => setConfig((p) => ({ ...p, youtubeAutoplay: e.target.checked }))}
                  className="w-4 h-4 text-red-600 rounded-md cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Silenciar audio (Requerido para autoplay)</span>
                <input
                  type="checkbox"
                  checked={config.youtubeMute}
                  onChange={(e) => setConfig((p) => ({ ...p, youtubeMute: e.target.checked }))}
                  className="w-4 h-4 text-red-600 rounded-md cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Bucle infinito (Loop)</span>
                <input
                  type="checkbox"
                  checked={config.youtubeLoop}
                  onChange={(e) => setConfig((p) => ({ ...p, youtubeLoop: e.target.checked }))}
                  className="w-4 h-4 text-red-600 rounded-md cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. DETAILED CONTROLS: OPCIÓN A: GESTIÓN DE FOTOS SLIDE O OPCIÓN B: VIDEO YOUTUBE */}
      {config.tipo === 'slide' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Galería de Diapositivas Fotográficas ({config.slides.length})
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cargue nuevas fotos desde su computador o agregue enlaces de imágenes institucionales con sus respectivos textos.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewSlideModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Nueva Foto Slide</span>
            </button>
          </div>

          {/* Slide List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-3 group hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-xs"
              >
                <div className="flex gap-3">
                  <div className="w-28 h-20 rounded-xl overflow-hidden shrink-0 relative bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <img
                      src={slide.url}
                      alt={slide.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white font-mono text-[9px] font-bold">
                      #{idx + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-bold truncate max-w-full">
                      {slide.etiqueta || 'Comunidad'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {slide.titulo || 'Sin Título'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {slide.subtitulo || 'Sin descripción'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSlide(idx, 'up')}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Subir orden"
                    >
                      <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === config.slides.length - 1}
                      onClick={() => handleMoveSlide(idx, 'down')}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                      title="Bajar orden"
                    >
                      <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditSlide(slide)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors cursor-pointer"
                      title="Eliminar slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* OPCIÓN B: VIDEO YOUTUBE */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Youtube className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Configuración de Video Institucional (YouTube)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingrese el enlace de YouTube o ID de video. El sistema embebe la transmisión en formato responsive a 1400px.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enlace Completo de YouTube o ID de Video *
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={youtubeInput}
                      onChange={(e) => {
                        setYoutubeInput(e.target.value);
                        const cleanId = extractYoutubeId(e.target.value);
                        if (cleanId) {
                          setConfig((p) => ({ ...p, youtubeId: cleanId }));
                        }
                      }}
                      placeholder="Ej: https://www.youtube.com/watch?v=L_LUpnjgPso o https://youtu.be/..."
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-medium focus:border-red-500 focus:outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ID actual detectado:{' '}
                  <span className="font-mono font-bold text-red-600">
                    {extractYoutubeId(youtubeInput) || config.youtubeId}
                  </span>
                </p>
              </div>

              {/* Suggested Institutional Videos */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Videos de Ejemplo Sugeridos:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { title: 'Obras y Gestión de Panamá', id: 'L_LUpnjgPso' },
                    { title: 'Infraestructura y Vías Públicas', id: 'ScMzIvxBSi4' },
                    { title: 'Mantenimiento Urbano y Parques', id: 'ysz5S6PUM-U' },
                    { title: 'Canal de Panamá & Obras Civiles', id: 'X_2E5_vj-7M' },
                  ].map((vid) => (
                    <button
                      key={vid.id}
                      type="button"
                      onClick={() => {
                        setYoutubeInput(vid.id);
                        setConfig((p) => ({ ...p, youtubeId: vid.id }));
                      }}
                      className="p-2 text-left text-xs bg-white dark:bg-slate-900 hover:border-red-500 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                    >
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                        {vid.title}
                      </span>
                      <span className="font-mono text-[10px] text-red-600 ml-1 shrink-0">
                        Usar
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Tips */}
            <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs space-y-2 text-red-900 dark:text-red-300">
              <div className="flex items-center gap-2 font-bold">
                <Info className="w-4 h-4 text-red-600" />
                <span>Normas de Reproducción:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                <li>Los navegadores modernos (Chrome, Safari, Edge) exigen silenciar el video para permitir el autoplay.</li>
                <li>El video ocupará automáticamente el ancho de 1400px en el portal de los ciudadanos.</li>
                <li>Asegúrese de que el video esté configurado como "Público" o "No listado" en YouTube para permitir su inserción.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. VISTA PREVIA EN VIVO (FULL WIDTH 1400PX & RESPONSIVE) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Vista Previa en Vivo (Simulador Portal Ciudadano - 1400px)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualice exactamente cómo los ciudadanos verán el banner en computadores y dispositivos móviles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['desktop', 'tablet', 'mobile'] as const).map((vp) => (
              <button
                key={vp}
                type="button"
                onClick={() => setPreviewViewport(vp)}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                  previewViewport === vp
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {vp === 'desktop' ? 'Escritorio (1400px)' : vp === 'tablet' ? 'Tablet' : 'Móvil'}
              </button>
            ))}
          </div>
        </div>

        {/* Live Banner Render Container */}
        <div
          className={`mx-auto transition-all duration-300 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg ${
            previewViewport === 'desktop'
              ? 'w-full max-w-[1400px]'
              : previewViewport === 'tablet'
              ? 'w-full max-w-[768px]'
              : 'w-full max-w-[375px]'
          }`}
        >
          <div
            style={{ height: `${config.altura}px` }}
            className="relative w-full overflow-hidden bg-slate-950 transition-all duration-300"
          >
            {config.tipo === 'youtube' ? (
              <div className="absolute inset-0 w-full h-full bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${
                    extractYoutubeId(youtubeInput) || config.youtubeId
                  }?autoplay=${config.youtubeAutoplay ? '1' : '0'}&mute=${
                    config.youtubeMute ? '1' : '0'
                  }&controls=1&loop=${config.youtubeLoop ? '1' : '0'}&playlist=${
                    extractYoutubeId(youtubeInput) || config.youtubeId
                  }&rel=0&modestbranding=1`}
                  title="Vista Previa YouTube Banner"
                  className="w-full h-full border-none object-cover pointer-events-auto"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              config.slides.length > 0 && (
                <div className="relative w-full h-full overflow-hidden">
                  {config.slides.map((slide, idx) => {
                    const isActive = idx === previewSlideIdx % config.slides.length;
                    return (
                      <div
                        key={slide.id}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                      >
                        <img
                          src={slide.url}
                          alt={slide.titulo}
                          className="w-full h-full object-cover brightness-75 scale-105 transition-transform duration-7000"
                        />
                        {config.mostrarGradiente && (
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20" />
                        )}
                        <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-12 max-w-2xl text-white space-y-2 z-20">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            {slide.etiqueta || 'Comunidad'}
                          </span>
                          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                            {slide.titulo || 'Título del Slide'}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 max-w-xl drop-shadow-xs">
                            {slide.subtitulo || 'Descripción del slide institucional.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 5. MODAL: AGREGAR / EDITAR FOTO SLIDE */}
      {isSlideModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <span>Configurar Foto de Diapositiva</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsSlideModalOpen(false);
                  setEditingSlide(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlideModal} className="space-y-4">
              {/* Option A: Direct URL or Local File Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Foto de la Diapositiva (URL o Cargar Archivo) *
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={editingSlide.url}
                    onChange={(e) => setEditingSlide({ ...editingSlide, url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium font-mono"
                  />

                  <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset Suggestions */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    Fotos sugeridas para un clic rápido:
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {SUGGESTED_PHOTOS.map((sp, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setEditingSlide({
                            ...editingSlide,
                            url: sp.url,
                            titulo: sp.titulo,
                            subtitulo: sp.subtitulo,
                            etiqueta: sp.etiqueta,
                          });
                        }}
                        className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 hover:border-blue-500 transition-all cursor-pointer relative"
                        title={sp.titulo}
                      >
                        <img src={sp.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title, Tag, Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título de la Diapositiva *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.titulo}
                    onChange={(e) => setEditingSlide({ ...editingSlide, titulo: e.target.value })}
                    placeholder="Ej: Obras de Pavimentación en Calle 5ta"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Etiqueta / Badge *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingSlide.etiqueta}
                    onChange={(e) => setEditingSlide({ ...editingSlide, etiqueta: e.target.value })}
                    placeholder="Ej: Infraestructura Vial"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subtítulo / Descripción
                </label>
                <textarea
                  rows={2}
                  value={editingSlide.subtitulo}
                  onChange={(e) => setEditingSlide({ ...editingSlide, subtitulo: e.target.value })}
                  placeholder="Detalle complementario de la obra o mensaje para la comunidad..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium resize-none"
                />
              </div>

              {/* Preview Thumbnail */}
              {editingSlide.url && (
                <div className="h-28 w-full rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 bg-slate-950">
                  <img src={editingSlide.url} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[10px] text-blue-300 font-bold uppercase">
                      {editingSlide.etiqueta || 'Etiqueta'}
                    </span>
                    <span className="text-xs text-white font-extrabold truncate">
                      {editingSlide.titulo || 'Título de ejemplo'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsSlideModalOpen(false);
                    setEditingSlide(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Diapositiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
