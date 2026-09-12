import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  BannerConfig,
  BannerSlide,
  DEFAULT_BANNER_CONFIG,
  BANNER_STORAGE_KEY,
} from '../../types/banner';

export const InstitutionalBanner: React.FC = () => {
  const [config, setConfig] = useState<BannerConfig>(() => {
    try {
      const savedV2 = localStorage.getItem(BANNER_STORAGE_KEY);
      if (savedV2) return JSON.parse(savedV2);

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
      // fallback
    }
    return DEFAULT_BANNER_CONFIG;
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  // Listen to live updates from Super Admin in backend
  useEffect(() => {
    const handleConfigUpdate = () => {
      try {
        const savedV2 = localStorage.getItem(BANNER_STORAGE_KEY);
        if (savedV2) {
          setConfig(JSON.parse(savedV2));
          return;
        }
        const savedOld = localStorage.getItem('citizen_banner_config');
        if (savedOld) {
          setConfig(JSON.parse(savedOld));
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('banner_config_updated', handleConfigUpdate);
    window.addEventListener('storage', handleConfigUpdate);
    return () => {
      window.removeEventListener('banner_config_updated', handleConfigUpdate);
      window.removeEventListener('storage', handleConfigUpdate);
    };
  }, []);

  const activeSlides: BannerSlide[] =
    config.slides && config.slides.length > 0
      ? config.slides
      : DEFAULT_BANNER_CONFIG.slides;

  // Auto-slide effect
  useEffect(() => {
    if (config.tipo !== 'slide' || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, config.slideIntervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [config.tipo, config.slideIntervalSeconds, activeSlides.length]);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  return (
    <div className="w-full bg-slate-950 select-none">
      <div
        style={{ height: `${config.altura}px` }}
        className="relative w-full max-w-[1400px] mx-auto overflow-hidden transition-all duration-300"
      >
        {/* CASE A: YOUTUBE VIDEO BANNER */}
        {config.tipo === 'youtube' ? (
          <div className="absolute inset-0 w-full h-full bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${
                config.youtubeId
              }?autoplay=${config.youtubeAutoplay ? '1' : '0'}&mute=${
                config.youtubeMute ? '1' : '0'
              }&controls=1&loop=${config.youtubeLoop ? '1' : '0'}&playlist=${
                config.youtubeId
              }&rel=0&modestbranding=1&playsinline=1`}
              title="Banner Institucional Junta Comunal"
              className="w-full h-full border-none object-cover pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          /* CASE B: PHOTO SLIDESHOW BANNER */
          <div className="relative w-full h-full overflow-hidden">
            {activeSlides.map((slide, index) => {
              const isActive = index === currentSlide;
              return (
                <div
                  key={slide.id || index}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.url}
                    alt={slide.titulo}
                    className="w-full h-full object-cover object-center brightness-75 scale-100 animate-in fade-in"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />

                  {/* Dark Vignette Overlay for High Legibility */}
                  {config.mostrarGradiente !== false && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/20" />
                  )}

                  {/* Slide Content Caption */}
                  <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-10 lg:left-12 max-w-3xl text-white space-y-2.5 z-20 pr-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-md backdrop-blur-xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                      {slide.etiqueta}
                    </span>

                    <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                      {slide.titulo}
                    </h1>

                    <p className="text-xs sm:text-sm lg:text-base text-slate-200 line-clamp-2 max-w-2xl drop-shadow-xs font-normal">
                      {slide.subtitulo}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Navigation Arrows (Visible if more than 1 slide) */}
            {activeSlides.length > 1 && (
              <>
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
                <div className="absolute bottom-4 right-4 sm:right-12 z-20 flex items-center gap-1.5">
                  {activeSlides.map((_, dotIdx) => (
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
