export interface BannerSlide {
  id: string;
  url: string;
  titulo: string;
  subtitulo: string;
  etiqueta: string;
}

export interface BannerConfig {
  tipo: 'slide' | 'youtube';
  altura: number; // in px: 260, 340, 380, 420, 500, etc.
  youtubeId: string;
  youtubeAutoplay: boolean;
  youtubeMute: boolean;
  youtubeLoop: boolean;
  slideIntervalSeconds: number;
  mostrarGradiente: boolean;
  slides: BannerSlide[];
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Junta Comunal al Servicio de la Comunidad',
    subtitulo: 'Compromiso, transparencia y respuesta inmediata a las necesidades del corregimiento',
    etiqueta: 'Gestión Municipal y Comunitaria',
  },
  {
    id: 'slide-2',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Mantenimiento y Obras de Infraestructura Vial',
    subtitulo: 'Cuadrillas operando activamente en bacheo, aceras y canalizaciones pluviales',
    etiqueta: 'Cuadrillas en Terreno',
  },
  {
    id: 'slide-3',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Modernización del Alumbrado Público & ENSA',
    subtitulo: 'Fiscalización y reparación continua de luminarias en todos los sectores residenciales',
    etiqueta: 'Energía & Seguridad Vecinal',
  },
  {
    id: 'slide-4',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80',
    titulo: 'Atención Ciudadana y Participación Vecinal',
    subtitulo: 'Canal abierto para la recepción y trazabilidad de reportes las 24 horas',
    etiqueta: 'Gobierno Abierto & Transparencia',
  },
];

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  tipo: 'slide',
  altura: 380,
  youtubeId: 'L_LUpnjgPso', // Institutional footage
  youtubeAutoplay: true,
  youtubeMute: true,
  youtubeLoop: true,
  slideIntervalSeconds: 5,
  mostrarGradiente: true,
  slides: DEFAULT_BANNER_SLIDES,
  updatedAt: new Date().toISOString(),
};

export const BANNER_STORAGE_KEY = 'citizen_banner_config_v2';
