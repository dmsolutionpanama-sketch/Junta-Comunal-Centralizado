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
}

export interface Ticket {
  id: string; // e.g. "TK-2025-001"
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

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
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
  password?: string;
  confirmPassword?: string;
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
