import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Image as ImageIcon,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
  Settings2,
  Check,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface BannerConfig {
  tipo: 'slide' | 'youtube';
  altura: number; // in px: 260, 340, 420, 500
  youtubeId: string;
  youtubeAutoplay: boolean;
  slideIntervalSeconds: number;
}

const DEFAULT_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Junta Comunal al Servicio de la Comunidad',
    subtitulo: 'Compromiso, transparencia y respuesta inmediata a las necesidades del corregimiento',
    etiqueta: 'Gestión Municipal y Comunitaria',
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
    etiqueta: 'Gobierno Abierto & Transparencia',
  },
];

export const InstitutionalBanner: React.FC = () => {
  const [config, setConfig] = useState<BannerConfig>(() => {
    const saved = localStorage.getItem('citizen_banner_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // default
      }
    }
    return {
      tipo: 'slide',
      altura: 380,
      youtubeId: 'L_LUpnjgPso', // Institutional Panama / infrastructure footage
      youtubeAutoplay: true,
      slideIntervalSeconds: 5,
    };
  });

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempYoutubeInput, setTempYoutubeInput] = useState(config.youtubeId);

  // Auto-slide effect
  useEffect(() => {
    if (config.tipo !== 'slide') return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % DEFAULT_SLIDES.length);
    }, config.slideIntervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [config.tipo, config.slideIntervalSeconds]);

  // Persist config
  useEffect(() => {
    localStorage.setItem('citizen_banner_config', JSON.stringify(config));
  }, [config]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % DEFAULT_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + DEFAULT_SLIDES.length) % DEFAULT_SLIDES.length);
  };

  // Helper to extract YouTube ID from full URL or ID
  const extractYoutubeId = (input: string) => {
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

  const handleSaveConfig = () => {
    const finalId = extractYoutubeId(tempYoutubeInput);
    setConfig((prev) => ({
      ...prev,
      youtubeId: finalId || prev.youtubeId,
    }));
    setIsConfigOpen(false);
  };

  return (
    <div className="relative w-full overflow-hidden bg-slate-950 select-none shadow-md">
      {/* Container with dynamic user-configured height */}
      <div
        style={{ height: `${config.altura}px` }}
        className="relative w-full overflow-hidden transition-all duration-300"
      >
        {/* OPTION A: YOUTUBE VIDEO EMBED */}
        {config.tipo === 'youtube' && (
          <div className="absolute inset-0 w-full h-full pointer-events-auto bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${config.youtubeId}?autoplay=${
                config.youtubeAutoplay ? '1' : '0'
              }&mute=1&controls=1&loop=1&playlist=${config.youtubeId}&rel=0&modestbranding=1`}
              title="Video Institucional Junta Comunal"
              className="w-full h-full border-none object-cover"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {/* Subtle overlay header */}
            <div className="absolute top-3 left-4 sm:left-8 z-10 pointer-events-none">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 shadow-md">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                Video Institucional
              </span>
            </div>
          </div>
        )}

        {/* OPTION B: INSTITUTIONAL PHOTO SLIDESHOW */}
        {config.tipo === 'slide' && (
          <div className="relative w-full h-full overflow-hidden">
            {DEFAULT_SLIDES.map((slide, idx) => {
              const isActive = idx === currentSlide;
              return (
                <div
                  key={idx}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.url}
                    alt={slide.titulo}
                    className="w-full h-full object-cover brightness-75 transition-transform duration-7000 scale-105"
                  />
                  {/* Gradient Dark Overlay for Maximum Typography Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20" />

                  {/* Institutional Text Overlay */}
                  <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-12 max-w-2xl text-white space-y-2 z-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/80 backdrop-blur-md border border-blue-400/30 text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{slide.etiqueta}</span>
                    </div>

                    <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                      {slide.titulo}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-200 font-normal line-clamp-2 max-w-xl drop-shadow-xs">
                      {slide.subtitulo}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Slider Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20"
              title="Foto anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md transition-all cursor-pointer border border-white/20"
              title="Siguiente foto"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicators Dots */}
            <div className="absolute bottom-3 right-4 sm:right-12 z-20 flex items-center gap-1.5">
              {DEFAULT_SLIDES.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentSlide(dotIdx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === dotIdx ? 'w-6 bg-blue-500 shadow-sm' : 'w-2 bg-white/50 hover:bg-white/80'
                  }`}
                  title={`Diapositiva ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* FLOATING BANNER CUSTOMIZER BUTTON (TOP RIGHT) */}
        <div className="absolute top-3 right-4 z-30 flex items-center gap-2">
          {/* Quick height badge indicator */}
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white/80 text-[10px] font-mono border border-white/10">
            {config.altura}px • {config.tipo === 'youtube' ? 'Video YouTube' : 'Foto Slide'}
          </span>

          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-md transition-all cursor-pointer"
            title="Ajustar altura y tipo de banner (Video o Fotos)"
          >
            <Settings2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Configurar Banner</span>
          </button>
        </div>
      </div>

      {/* POPUP CONFIGURATION MODAL / DRAWER */}
      {isConfigOpen && (
        <div className="absolute top-14 right-4 z-40 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Ajustes del Banner Institucional</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* 1. Select Media Type: YouTube Video vs Photo Slide */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              Tipo de Contenido del Banner
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, tipo: 'slide' }))}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  config.tipo === 'slide'
                    ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-600 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Foto Slide</span>
              </button>

              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, tipo: 'youtube' }))}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  config.tipo === 'youtube'
                    ? 'bg-red-50 dark:bg-red-950/70 border-red-600 text-red-700 dark:text-red-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Youtube className="w-4 h-4" />
                <span>Video YouTube</span>
              </button>
            </div>
          </div>

          {/* 2. Select Height */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
              <span className="uppercase tracking-wide">Altura del Banner</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">{config.altura} px</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[260, 340, 420, 500].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, altura: h }))}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    config.altura === h
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {h}px
                </button>
              ))}
            </div>
          </div>

          {/* 3. YouTube ID/URL Configuration */}
          {config.tipo === 'youtube' && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                URL o ID de YouTube
              </label>
              <input
                type="text"
                value={tempYoutubeInput}
                onChange={(e) => setTempYoutubeInput(e.target.value)}
                placeholder="Ej: https://youtube.com/watch?v=L_LUpnjgPso"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono"
              />
              <p className="text-[10px] text-slate-400">
                Inserte el enlace directo o ID de cualquier video institucional de YouTube.
              </p>
            </div>
          )}

          {/* 4. Slide speed configuration */}
          {config.tipo === 'slide' && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <span className="uppercase tracking-wide">Intervalo de Transición</span>
                <span className="font-mono text-blue-600">{config.slideIntervalSeconds} seg</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[3, 5, 8].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, slideIntervalSeconds: s }))}
                    className={`py-1 text-xs font-bold rounded-lg border transition-colors ${
                      config.slideIntervalSeconds === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Aplicar Cambios
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
