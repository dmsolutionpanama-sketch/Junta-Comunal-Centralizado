import { SystemCustomTheme } from '../types';

export const DEFAULT_SYSTEM_THEME: SystemCustomTheme = {
  // Front-end Colors (Portal Ciudadano / Vista Pública)
  frontendPrimaryColor: '#1e3a8a', // Azul Institucional Sobrio
  frontendAccentColor: '#2563eb', // Acento Azul Clásico
  frontendBgColor: '#f8fafc', // Fondo Gris Neutro Suave
  frontendCardBg: '#ffffff', // Tarjetas Blancas
  frontendTextColor: '#0f172a', // Texto Nítido
  frontendHeaderBg: '#ffffff', // Barra Superior Front-end

  // Back-end Colors (Portal Administrativo / Junta Comunal)
  backendSidebarBg: '#0f172a', // Sidebar Slate Oscuro
  backendHeaderBg: '#ffffff', // Header Blanco
  backendBgColor: '#f8fafc', // Canvas Slate-50
  backendPrimaryColor: '#2563eb', // Botones de Acción Primarios
  backendCardBg: '#ffffff', // Paneles y Tarjetas
  backendBorderColor: '#e2e8f0', // Bordes y Divisores
  backendTextColor: '#0f172a', // Texto Principal

  // Dimensiones del Back End (Ancho y Alto)
  sidebarWidth: 260, // Ancho estándar del menú lateral (px)
  mainMaxWidth: '1400px', // Ancho máximo del contenedor fijado a 1400px full width responsive
  navbarHeight: 64, // Alto de la barra superior (px)
  cardPadding: 'normal', // Espaciado de tarjetas: 'compact' | 'normal' | 'relaxed'
  tableRowHeight: 44, // Altura estándar de filas en tablas (px)
  mapHeight: 400, // Altura de paneles de mapas cartográficos (px)

  // Tamaño de las Tipografías
  baseFontSize: 14, // Tamaño texto base (px)
  h1Size: 24, // Títulos principales H1 (px)
  h2Size: 18, // Subtítulos H2 / H3 (px)
  labelSize: 12, // Etiquetas y badges (px)
  lineHeightScale: 1.5, // Interlineado
  fontFamily: 'sans', // Tipografía del sistema

  updatedAt: new Date().toISOString(),
  savedInDb: true,
};
