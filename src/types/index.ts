/**
 * TypeScript Interfaces and Types for Ticketing System
 */

export type TicketStatus = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
export type TicketPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type AttachmentType = 'foto' | 'video' | 'documento';
export type TraceEventType = 'creacion' | 'cambio_estado' | 'comentario' | 'reasignacion' | 'cierre';
export type UserGender = 'femenino' | 'masculino' | 'otro';

export interface Category {
  id: string;
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
  slaHoras: number;
  prefijo?: string; // e.g. "ALU", "AGU", "POD", "SOC", "CER", "DEP", "OBR"
  activa?: boolean;
}

export interface Reportante {
  nombre: string;
  cedula: string;
  telefono?: string;
  email?: string;
  genero: UserGender;
  edad: number;
  sector: string;
}

export interface Adjunto {
  id: string;
  ticketId: string;
  tipo: AttachmentType;
  nombre: string;
  url: string;
  thumbnailUrl?: string;
  tamanoBytes?: number;
  fechaSubida: string;
}

export type InteractionChannel = 'whatsapp' | 'llamada' | 'presencial' | 'web' | 'correo' | 'cuadrilla_campo';

export interface TrazabilidadEvento {
  id: string;
  ticketId: string;
  tipoEvento: TraceEventType;
  fechaHora: string;
  responsable: string;
  rolResponsable?: string;
  nota: string;
  estadoAnterior?: TicketStatus;
  estadoNuevo?: TicketStatus;
  canalInteraccion?: InteractionChannel;
  minutosConsumidos?: number;
}

export interface Ticket {
  id: string; // e.g. "TK-2026-001"
  numeroRegistro: string;
  asunto: string;
  descripcion: string;
  categoriaId: string;
  categoriaNombre: string;
  estado: TicketStatus;
  prioridad: TicketPriority;
  sectorId: string;
  sectorNombre: string;
  ubicacionLat?: number;
  ubicacionLng?: number;
  direccionDetallada?: string;
  lugarRegistro?: string;
  canalIntake?: string;
  canalRadicacion?: 'web_portal' | 'ventanilla_presencial' | 'inspeccion_campo' | 'whatsapp_comunal' | 'llamada_telefonica';
  fechaCreacion: string;
  horaCreacion: string;
  fechaActualizacion: string;
  reportante: Reportante;
  adjuntos: Adjunto[];
  trazabilidad: TrazabilidadEvento[];
  asignadoA?: string;
  departamento?: string;
}

export type UserRole =
  | 'administrador'
  | 'agente'
  | 'usuario'
  | 'supervisor'
  | 'ciudadano'
  | 'usuario_reportante';

export type AppTheme = 'high-density' | 'clean-minimal' | 'professional-polish' | 'sleek-interface';

export interface SystemCustomTheme {
  // Front-end Colors (Portal Ciudadano / Vista Pública)
  frontendPrimaryColor: string;
  frontendAccentColor: string;
  frontendBgColor: string;
  frontendCardBg: string;
  frontendTextColor: string;
  frontendHeaderBg: string;

  // Back-end Colors (Portal Administrativo / Junta Comunal)
  backendSidebarBg: string;
  backendHeaderBg: string;
  backendBgColor: string;
  backendPrimaryColor: string;
  backendCardBg: string;
  backendBorderColor: string;
  backendTextColor: string;

  // Dimensiones del Back End (Ancho y Alto)
  sidebarWidth: number; // px (e.g. 260)
  mainMaxWidth: string; // 'full' | '1400px' | '1600px' | '1800px'
  navbarHeight: number; // px (e.g. 64)
  cardPadding: 'compact' | 'normal' | 'relaxed';
  tableRowHeight: number; // px (e.g. 44)
  mapHeight: number; // px (e.g. 420)

  // Tamaño de las Tipografías (Escala Tipográfica)
  baseFontSize: number; // px (e.g. 14)
  h1Size: number; // px (e.g. 24)
  h2Size: number; // px (e.g. 18)
  labelSize: number; // px (e.g. 12)
  lineHeightScale: number; // e.g. 1.5
  fontFamily: 'sans' | 'serif' | 'mono';

  // Metadatos de persistencia
  updatedAt?: string;
  savedInDb?: boolean;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  password?: string;
  passwordHash?: string;
  avatarUrl?: string;
  cedula?: string;
  telefono?: string;
  sector?: string;
  direccion?: string;
  genero?: UserGender;
  edad?: number;
  estado?: 'activo' | 'inactivo';
  fechaRegistro?: string;
  horaRegistro?: string;
  fechaHoraRegistro?: string;
  lugarRegistro?: string;
  ultimoAcceso?: string;
  departamento?: string;
  notasAdmin?: string;
}

export interface UserRegistrationInput {
  nombre: string;
  cedula: string;
  email: string;
  telefono?: string;
  sector: string;
  direccion?: string;
  genero: UserGender;
  edad: number;
  rol?: UserRole;
  departamento?: string;
  lugarRegistro?: string;
  avatarUrl?: string;
  password?: string;
  confirmPassword?: string;
  fechaRegistro?: string;
  horaRegistro?: string;
}

export type DashboardWidgetId =
  | 'kpis-primary'
  | 'chart-category-volume'
  | 'chart-sector-distribution'
  | 'chart-status-donut'
  | 'chart-time-trend'
  | 'chart-demographics-gender'
  | 'chart-demographics-age'
  | 'chart-channels-intake'
  | 'chart-priority-matrix'
  | 'chart-sla-performance'
  | 'table-active-incidents';

export type DashboardPresetId =
  | 'executive'
  | 'operations'
  | 'citizen-care'
  | 'sla-audit'
  | 'custom';

export interface DashboardWidgetMeta {
  id: DashboardWidgetId;
  title: string;
  category: 'kpi' | 'distribucion' | 'demografia' | 'operativo' | 'tendencia';
  description: string;
  iconName: string;
  defaultColSpan?: 1 | 2 | 3;
}

export interface DashboardCustomConfig {
  activePreset: DashboardPresetId;
  selectedWidgets: DashboardWidgetId[];
  columns: 1 | 2 | 3;
  compactMode: boolean;
  autoRefresh: boolean;
}

export type ComparisonDimension = 'sector' | 'categoria' | 'canal' | 'periodo';

export interface ComparisonConfig {
  dimension: ComparisonDimension;
  entityA: string;
  entityB: string;
}

export interface EmailNotificationLog {
  id: string;
  destinatario: string;
  asunto: string;
  tipo: 'nuevo_ticket' | 'cambio_estado' | 'caso_resuelto' | 'bienvenida';
  ticketId?: string;
  fechaHora: string;
  estadoEnvio: 'enviado' | 'simulado' | 'error';
  cuerpoHtml: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export interface WhatsAppMessage {
  id: string;
  ticketId?: string;
  telefono: string;
  remitente: string;
  mensaje: string;
  sector: string;
  fechaHora: string;
  timestamp: number;
  n8nExecutionId?: string;
  minutosProcesamiento?: number;
  estado: 'recibido' | 'procesado' | 'convertido_ticket' | 'error';
}

export interface WhatsAppStats {
  totalMensajes: number;
  mensajesHoy: number;
  minutosDesdeUltimoMensaje: number;
  ultimoMensajeFechaHora: string;
  tiempoPromedioRespuestaMinutos: number;
  minutosConexionActiva: number;
  n8nStatus: 'activo' | 'conectado' | 'esperando';
  n8nWebhookUrl?: string;
  mensajesPorSector: Record<string, number>;
  historial: WhatsAppMessage[];
}

export interface SectorChannelStats {
  sector: string;
  total: number;
  whatsapp: number;
  web: number;
  telefono: number;
  canalPredominante: 'WhatsApp' | 'Web Digital' | 'Telefónica';
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationErrorItem[];
}

export interface DashboardFilters {
  categoriaId?: string | null;
  sector?: string | null;
  genero?: UserGender | null;
  rangoEdad?: string | null; // '18-29' | '30-49' | '50-64' | '65+'
  estado?: TicketStatus | null;
  prioridad?: TicketPriority | null;
  rangoFecha?: 'hoy' | '7dias' | '30dias' | 'ano' | 'todo';
}

export interface CreateTicketInput {
  asunto: string;
  descripcion: string;
  categoriaId: string;
  categoriaNombre: string;
  sectorNombre: string;
  prioridad: TicketPriority;
  direccionDetallada?: string;
  ubicacionLat?: number;
  ubicacionLng?: number;
  reportante: {
    nombre: string;
    cedula: string;
    telefono?: string;
    email?: string;
    genero: UserGender;
    edad: number;
    sector: string;
  };
  adjuntos?: Array<{
    id: string;
    nombre: string;
    tipo: AttachmentType;
    url: string;
  }>;
}
