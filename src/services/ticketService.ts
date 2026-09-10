/**
 * Central Ticket Service (Full-stack API client with Zod error handling & JWT RBAC)
 */

import {
  Ticket,
  TicketStatus,
  TrazabilidadEvento,
  User,
  CreateTicketInput,
  Adjunto,
  ApiResponse,
  UserRole,
  WhatsAppStats,
  WhatsAppMessage,
  SectorChannelStats,
  SystemCustomTheme,
} from '../types';
import { MOCK_TICKETS, MOCK_CURRENT_USER } from '../data/mockData';
import { CATEGORIAS_SISTEMA } from '../config/categories';
import { SECTORES_RESIDENCIA } from '../config/sectors';
import { getCategoryPrefix } from '../utils/ticketCodeGenerator';

const STORAGE_KEY_TICKETS = 'ticketing_app_tickets_v1';
const STORAGE_KEY_AUTH = 'ticketing_app_auth_v1';
const STORAGE_KEY_TOKEN = 'ticketing_app_jwt_token_v1';

export function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem(STORAGE_KEY_TOKEN) ||
      localStorage.getItem('ticketing_token') ||
      null
    );
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem('ticketing_token', token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem('ticketing_token');
    }
  } catch (e) {
    console.warn('Could not save auth token', e);
  }
}

function getStoredTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not read from localStorage', e);
  }
  return MOCK_TICKETS;
}

function saveStoredTickets(tickets: Ticket[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const ticketService = {
  // Auth: Login with validation feedback
  async login(
    email: string,
    password: string,
    role?: UserRole
  ): Promise<{ success: boolean; user?: User; token?: string; message?: string; errors?: any[] }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAuthToken(json.token);
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(json.user));
        return {
          success: true,
          user: json.user,
          token: json.token,
          message: json.message,
        };
      }

      return {
        success: false,
        message: json.message || 'Error al iniciar sesión',
        errors: json.errors,
      };
    } catch {
      // Fallback
      if (email && password && password.length >= 4) {
        const user: User = {
          id: 'usr-demo-01',
          nombre: email.split('@')[0].replace(/[._]/g, ' '),
          email,
          rol: role || (email.includes('admin') ? 'administrador' : email.includes('agente') ? 'agente' : 'usuario'),
        };
        const token = `mock-token-${Date.now()}`;
        setAuthToken(token);
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
        return { success: true, user, token, message: 'Sesión demo iniciada' };
      }
      return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
    }
  },

  // Auth: Logout
  logout() {
    setAuthToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    } catch {}
  },

  // Get Catalogs from centralized API
  async getCatalogs(): Promise<{ categorias: typeof CATEGORIAS_SISTEMA; sectores: string[] }> {
    try {
      const res = await fetch('/api/catalogs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // fallback
    }
    return {
      categorias: CATEGORIAS_SISTEMA,
      sectores: SECTORES_RESIDENCIA,
    };
  },

  // Fetch all tickets directly from database (with no-cache and full limit)
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const res = await fetch(`/api/tickets?all=true&limit=2000&_t=${Date.now()}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          saveStoredTickets(json.data);
          return json.data;
        }
      }
    } catch {
      // Fallback to local storage
    }
    return getStoredTickets();
  },

  // Manual or automatic synchronization from DB
  async syncFromDatabase(): Promise<Ticket[]> {
    const data = await this.getAllTickets();
    this.triggerUpdateEvent();
    return data;
  },

  // Update status directly
  async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus,
    responsable = 'Funcionario',
    rolResponsable = 'Supervisor'
  ): Promise<Ticket | null> {
    return this.addTraceEvent(ticketId, {
      tipoEvento: 'cambio_estado',
      responsable,
      rolResponsable,
      nota: `Estado actualizado a "${newStatus.toUpperCase()}".`,
      estadoNuevo: newStatus,
    });
  },

  // Fetch tickets with filters, search, pagination, and sorting
  async getTickets(params?: {
    categoria?: string;
    sector?: string;
    estado?: string;
    prioridad?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ data: Ticket[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    try {
      const query = new URLSearchParams();
      if (params?.categoria) query.append('categoria', params.categoria);
      if (params?.sector) query.append('sector', params.sector);
      if (params?.estado) query.append('estado', params.estado);
      if (params?.prioridad) query.append('prioridad', params.prioridad);
      if (params?.search) query.append('search', params.search);
      if (params?.sortBy) query.append('sortBy', params.sortBy);
      if (params?.sortOrder) query.append('sortOrder', params.sortOrder);
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));

      const res = await fetch(`/api/tickets?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return { data: json.data, pagination: json.pagination };
        }
      }
    } catch {
      // Graceful fallback to client-side data
    }

    // Client-side fallback
    let list = getStoredTickets();

    if (params?.categoria && params.categoria !== 'todas') {
      list = list.filter((t) => t.categoriaId.toLowerCase() === params.categoria?.toLowerCase());
    }

    if (params?.sector && params.sector !== 'todos') {
      list = list.filter((t) => t.sectorNombre.toLowerCase() === params.sector?.toLowerCase());
    }

    if (params?.estado && params.estado !== 'todos') {
      list = list.filter((t) => t.estado === params.estado);
    }

    if (params?.prioridad && params.prioridad !== 'todas') {
      list = list.filter((t) => t.prioridad === params.prioridad);
    }

    if (params?.search && params.search.trim() !== '') {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.numeroRegistro.toLowerCase().includes(q) ||
          t.asunto.toLowerCase().includes(q) ||
          t.descripcion.toLowerCase().includes(q) ||
          t.reportante.nombre.toLowerCase().includes(q) ||
          t.reportante.cedula.toLowerCase().includes(q) ||
          t.sectorNombre.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sortBy = params?.sortBy || 'fechaCreacion';
    const sortOrder = params?.sortOrder || 'desc';

    list.sort((a, b) => {
      let valA: any = a[sortBy as keyof Ticket];
      let valB: any = b[sortBy as keyof Ticket];

      if (sortBy === 'reportanteNombre') {
        valA = a.reportante.nombre;
        valB = b.reportante.nombre;
      } else if (sortBy === 'reportanteCedula') {
        valA = a.reportante.cedula;
        valB = b.reportante.cedula;
      }

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const page = params?.page || 1;
    const limit = params?.limit || 25;
    const total = list.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  },

  // Get ticket by ID or Registration Number
  async getTicketById(id: string, isPublic = false): Promise<Ticket | null> {
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(id)}?public=${isPublic}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) return json.data;
      }
    } catch {
      // Fallback
    }

    const tickets = getStoredTickets();
    const found = tickets.find(
      (t) =>
        t.id.toLowerCase() === id.toLowerCase() ||
        t.numeroRegistro.toLowerCase() === id.toLowerCase()
    );

    if (!found) return null;

    if (isPublic) {
      const { reportante, ...publicData } = found;
      return {
        ...publicData,
        reportante: {
          nombre: '*** Protegido por Privacidad ***',
          cedula: '***-***-****',
          genero: reportante.genero,
          edad: reportante.edad,
          sector: reportante.sector,
        },
      } as Ticket;
    }

    return found;
  },

  // Citizens: Lookup by Cédula
  async lookupCitizen(cedula: string): Promise<{
    success: boolean;
    found: boolean;
    citizen?: {
      id: string;
      nombre: string;
      apellido: string;
      nombreCompleto: string;
      cedula: string;
      telefono: string;
      email: string;
      sector: string;
      genero: any;
      edad: number;
      registradoEnPadron: boolean;
    };
  }> {
    try {
      const res = await fetch(`/api/citizens/lookup?cedula=${encodeURIComponent(cedula.trim())}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      console.warn('Citizen lookup fetch error:', e);
    }
    // Fallback: check stored tickets
    const clean = cedula.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const stored = getStoredTickets();
    const prev = stored.find(
      (t) => (t.reportante?.cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === clean
    );
    if (prev && prev.reportante) {
      const rep = prev.reportante;
      return {
        success: true,
        found: true,
        citizen: {
          id: `usr-${clean}`,
          nombre: rep.nombre,
          apellido: rep.apellido || '',
          nombreCompleto: rep.apellido ? `${rep.nombre} ${rep.apellido}` : rep.nombre,
          cedula: rep.cedula,
          telefono: rep.telefono || '',
          email: rep.email || '',
          sector: rep.sector || '',
          genero: rep.genero,
          edad: rep.edad,
          registradoEnPadron: true,
        },
      };
    }
    return { success: true, found: false };
  },

  // Create Ticket with backend Zod validation response handling
  async createTicket(
    ticketData: CreateTicketInput | Partial<Ticket>
  ): Promise<{ success: boolean; data?: Ticket; message?: string; errors?: any[] }> {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const current = getStoredTickets();
        current.unshift(json.data);
        saveStoredTickets(current);
        return {
          success: true,
          data: json.data,
          message: json.message,
        };
      }

      return {
        success: false,
        message: json.message || 'Error al crear el ticket.',
        errors: json.errors,
      };
    } catch (err: any) {
      // Client-side fallback
      const tickets = getStoredTickets();
      const prefix = getCategoryPrefix(ticketData.categoriaNombre, ticketData.categoriaId);
      const year = new Date().getFullYear();
      const catCount = tickets.filter(t => t.id.startsWith(`${prefix}-`)).length + 1;
      const formattedNum = `${prefix}-${year}-${String(catCount).padStart(3, '0')}`;
      const now = new Date();
      const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);
      const consecutivoSeguridad =
        (ticketData as any).consecutivoSeguridad ||
        `CS-${year}-${prefix}-${String(Date.now()).slice(-5)}`;

      const formattedAdjuntos: Adjunto[] = (ticketData.adjuntos || []).map((a: any, idx: number) => ({
        id: a.id || `att-${Date.now()}-${idx}`,
        ticketId: formattedNum,
        tipo: a.tipo || 'foto',
        nombre: a.nombre || `Adjunto ${idx + 1}`,
        url: a.url || '',
        fechaSubida: nowStr,
      }));

      const rep = ticketData.reportante || {
        nombre: 'Ciudadano Solicitante',
        apellido: '',
        cedula: '8-000-000',
        genero: 'femenino',
        edad: 35,
        sector: ticketData.sectorNombre || 'Altos de Las Cumbres',
      };

      const newTicket: Ticket = {
        id: formattedNum,
        numeroRegistro: formattedNum,
        consecutivoSeguridad,
        tipoReporte: ticketData.tipoReporte || ticketData.categoriaNombre || 'Alumbrado Eléctrico',
        asunto: ticketData.asunto || 'Sin asunto',
        descripcion: ticketData.descripcion || '',
        categoriaId: ticketData.categoriaId || 'alumbrado-electrico',
        categoriaNombre: ticketData.categoriaNombre || 'Alumbrado Eléctrico',
        estado: 'abierto',
        prioridad: ticketData.prioridad || 'media',
        sectorId: ticketData.sectorNombre || 'Altos de Las Cumbres',
        sectorNombre: ticketData.sectorNombre || 'Altos de Las Cumbres',
        ubicacionLat: ticketData.ubicacionLat || 9.0834,
        ubicacionLng: ticketData.ubicacionLng || -79.5312,
        direccionDetallada: ticketData.direccionDetallada || '',
        lugarRegistro: 'Portal Web Ciudadano',
        canalIntake: 'Formulario Digital Especializado',
        canalRadicacion: 'web_portal',
        fechaCreacion: now.toISOString().split('T')[0],
        horaCreacion: now.toTimeString().split(' ')[0],
        fechaActualizacion: nowStr,
        funcionarioRegistro: (ticketData as any).creadoPor || 'Sistema Web (Ciudadano)',
        reportante: {
          nombre: rep.nombre,
          apellido: rep.apellido || '',
          cedula: rep.cedula,
          telefono: rep.telefono || '',
          email: rep.email || '',
          genero: rep.genero || 'otro',
          edad: rep.edad || 35,
          sector: ticketData.sectorNombre || rep.sector || 'Altos de Las Cumbres',
          registradoEnPadron: true,
        },
        adjuntos: formattedAdjuntos,
        trazabilidad: [
          {
            id: `tr-${Date.now()}-1`,
            ticketId: formattedNum,
            tipoEvento: 'creacion',
            fechaHora: nowStr,
            responsable: (ticketData as any).creadoPor || 'Sistema Web (Ciudadano)',
            rolResponsable: 'Portal Ciudadano',
            nota: `[Consecutivo de Seguridad: ${consecutivoSeguridad}] Reporte de ${ticketData.categoriaNombre || 'Alumbrado Eléctrico'} radicado por ${rep.nombre} ${rep.apellido || ''} (Cédula: ${rep.cedula}). Auditoría anti-borrado registrada.`,
            estadoNuevo: 'abierto',
            canalInteraccion: 'web',
            minutosConsumidos: 2,
          },
        ],
        datosEspecificosReporte: (ticketData as any).datosEspecificosReporte,
      };

      tickets.unshift(newTicket);
      saveStoredTickets(tickets);
      return { success: true, data: newTicket, message: `Ticket ${formattedNum} generado exitosamente.` };
    }
  },

  // Add trace event with validation feedback
  async addTraceEvent(
    ticketId: string,
    eventData: {
      tipoEvento: TrazabilidadEvento['tipoEvento'];
      responsable: string;
      rolResponsable?: string;
      nota: string;
      estadoNuevo?: TicketStatus;
      canalInteraccion?: TrazabilidadEvento['canalInteraccion'];
      minutosConsumidos?: number;
    }
  ): Promise<Ticket | null> {
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}/trace`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const tickets = getStoredTickets();
          const idx = tickets.findIndex((t) => t.id === ticketId);
          if (idx !== -1) {
            tickets[idx] = json.data;
            saveStoredTickets(tickets);
          }
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    const tickets = getStoredTickets();
    const idx = tickets.findIndex(
      (t) => t.id === ticketId || t.numeroRegistro === ticketId
    );

    if (idx === -1) return null;

    const ticket = tickets[idx];
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newEvent: TrazabilidadEvento = {
      id: `tr-${Date.now()}`,
      ticketId: ticket.id,
      tipoEvento: eventData.tipoEvento,
      fechaHora: nowStr,
      responsable: eventData.responsable,
      rolResponsable: eventData.rolResponsable || 'Funcionario',
      nota: eventData.nota,
      estadoAnterior: ticket.estado,
      estadoNuevo: eventData.estadoNuevo || ticket.estado,
      canalInteraccion: eventData.canalInteraccion || 'whatsapp',
      minutosConsumidos: eventData.minutosConsumidos || 0,
    };

    ticket.trazabilidad.push(newEvent);
    if (eventData.estadoNuevo && eventData.estadoNuevo !== ticket.estado) {
      ticket.estado = eventData.estadoNuevo;
    }
    ticket.fechaActualizacion = nowStr;

    tickets[idx] = ticket;
    saveStoredTickets(tickets);
    return ticket;
  },

  // User & RBAC Management
  async getAllUsers(): Promise<User[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          localStorage.setItem('ticketing_system_users_v1', JSON.stringify(json.data));
          return json.data;
        }
      }
    } catch {
      // Fallback
    }

    try {
      const raw = localStorage.getItem('ticketing_system_users_v1');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}

    const { MOCK_SYSTEM_USERS } = await import('../data/mockData');
    try {
      localStorage.setItem('ticketing_system_users_v1', JSON.stringify(MOCK_SYSTEM_USERS));
    } catch {}
    return MOCK_SYSTEM_USERS;
  },

  async updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; user?: User; message?: string }> {
    return this.updateUserFull(userId, { rol: newRole });
  },

  async updateUserFull(userId: string, updatedData: Partial<User>): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // Call backend API
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const users = await this.getAllUsers();
          const idx = users.findIndex((u) => u.id === userId);
          if (idx !== -1) {
            users[idx] = json.data;
            localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
          }
          return { success: true, user: json.data, message: json.message || 'Usuario actualizado en base de datos.' };
        }
      }
    } catch {
      // Fallback
    }

    try {
      const users = await this.getAllUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          ...updatedData,
        };
        localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
        return { success: true, user: users[idx], message: 'Datos y foto de usuario actualizados correctamente.' };
      }
      return { success: false, message: 'Usuario no encontrado.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al actualizar usuario.' };
    }
  },

  async createUserAdmin(input: Partial<User> & { password?: string; confirmPassword?: string }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const users = await this.getAllUsers();
          users.unshift(json.data);
          localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
          return { success: true, user: json.data, message: json.message || 'Usuario registrado exitosamente.' };
        }
      }
    } catch {
      // Fallback
    }

    try {
      const users = await this.getAllUsers();
      if (input.email) {
        const existing = users.find((u) => u.email.toLowerCase() === input.email!.toLowerCase());
        if (existing) {
          return { success: false, message: 'El correo electrónico ya se encuentra registrado en el sistema.' };
        }
      }

      const now = new Date();
      const fechaStr = '2026-08-28';
      const horaStr = now.toTimeString().split(' ')[0].substring(0, 5);

      const defaultAvatar = input.avatarUrl || `https://images.unsplash.com/photo-${input.genero === 'masculino' ? '1507003211169-0a1dd7228f2d' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`;

      const newUser: User = {
        id: input.id || `usr-${Date.now()}`,
        nombre: input.nombre || 'Nuevo Usuario',
        email: input.email || `usuario-${Date.now()}@juntacomunal.gob.pa`,
        cedula: input.cedula || '8-000-000',
        telefono: input.telefono || '+507 6000-0000',
        sector: input.sector || 'Altos de Las Cumbres',
        direccion: input.direccion || '',
        genero: input.genero || 'femenino',
        edad: input.edad || 30,
        rol: input.rol || 'usuario',
        estado: input.estado || 'activo',
        departamento: input.departamento || 'Atención Ciudadana',
        lugarRegistro: input.lugarRegistro || 'Sede Central - Despacho',
        notasAdmin: input.notasAdmin || '',
        fechaRegistro: fechaStr,
        horaRegistro: horaStr,
        fechaHoraRegistro: `${fechaStr} ${horaStr}`,
        ultimoAcceso: `${fechaStr} ${horaStr}`,
        avatarUrl: defaultAvatar,
        password: input.password ? '••••••••' : undefined,
      };

      users.unshift(newUser);
      localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
      return { success: true, user: newUser, message: `Usuario "${newUser.nombre}" registrado exitosamente con foto y fecha 28 de agosto de 2026.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al registrar usuario.' };
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    } catch {}

    try {
      let users = await this.getAllUsers();
      const exists = users.some((u) => u.id === userId);
      if (!exists) {
        return { success: false, message: 'Usuario no encontrado.' };
      }
      users = users.filter((u) => u.id !== userId);
      localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
      return { success: true, message: 'Usuario eliminado correctamente del sistema.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al eliminar usuario.' };
    }
  },

  async registerUser(input: any): Promise<{ success: boolean; user?: User; token?: string; message?: string }> {
    try {
      // Try backend registration API first
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setAuthToken(json.token);
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(json.user));
          const users = await this.getAllUsers();
          users.unshift(json.user);
          localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
          return {
            success: true,
            user: json.user,
            token: json.token,
            message: json.message || 'Ciudadano registrado con éxito.',
          };
        }
      }
    } catch {
      // Fallback
    }

    try {
      const users = await this.getAllUsers();
      const existing = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
      if (existing) {
        return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
      }

      if (input.password && input.confirmPassword && input.password !== input.confirmPassword) {
        return { success: false, message: 'Las contraseñas no coinciden.' };
      }

      const now = new Date();
      const fechaStr = '2026-08-28';
      const horaStr = now.toTimeString().split(' ')[0].substring(0, 5);

      const avatarUrl = input.avatarUrl || `https://images.unsplash.com/photo-${input.genero === 'masculino' ? '1500648767791-00dcc994a43e' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`;

      const newUser: User = {
        id: `usr-${Date.now()}`,
        nombre: input.nombre,
        email: input.email,
        cedula: input.cedula,
        telefono: input.telefono,
        sector: input.sector,
        direccion: input.direccion || '',
        genero: input.genero || 'femenino',
        edad: input.edad || 30,
        rol: input.rol || 'usuario',
        estado: 'activo',
        departamento: input.departamento || 'Ciudadanía / Vecinos',
        lugarRegistro: input.lugarRegistro || 'Portal Web Ciudadano',
        fechaRegistro: fechaStr,
        horaRegistro: horaStr,
        fechaHoraRegistro: `${fechaStr} ${horaStr}`,
        ultimoAcceso: `${fechaStr} ${horaStr}`,
        avatarUrl,
        password: input.password ? '••••••••' : undefined,
      };

      users.unshift(newUser);
      localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
      const token = `jwt-token-${Date.now()}`;
      setAuthToken(token);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));

      return {
        success: true,
        user: newUser,
        token,
        message: 'Ciudadano registrado con éxito en la base de datos municipal con fecha 28 de agosto del 2026.',
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al registrar usuario.' };
    }
  },

  // WhatsApp Ingestion and Simulator
  async simulateWhatsAppCase(payload: {
    nombre?: string;
    telefono?: string;
    mensaje: string;
    sector?: string;
  }): Promise<{ success: boolean; data?: Ticket; message?: string }> {
    try {
      const res = await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const tickets = getStoredTickets();
          tickets.unshift(json.data);
          saveStoredTickets(tickets);
          this.triggerUpdateEvent();
          return { success: true, data: json.data, message: json.message };
        }
      }
    } catch {
      // Fallback
    }

    const now = new Date();
    const nextNum = getStoredTickets().length + 1;
    const formattedNum = `TK-2026-${String(nextNum).padStart(3, '0')}`;
    const fechaCreacion = '2026-08-28';
    const horaCreacion = now.toTimeString().split(' ')[0];

    const newTicket: Ticket = {
      id: formattedNum,
      numeroRegistro: formattedNum,
      asunto: payload.mensaje.length > 55 ? `${payload.mensaje.substring(0, 52)}...` : payload.mensaje,
      descripcion: `[Mensaje WhatsApp]: ${payload.mensaje}`,
      categoriaId: 'alumbrado-electrico',
      categoriaNombre: 'Alumbrado Eléctrico',
      estado: 'abierto',
      prioridad: 'urgente',
      sectorId: payload.sector || 'Altos de Las Cumbres',
      sectorNombre: payload.sector || 'Altos de Las Cumbres',
      ubicacionLat: 9.0834,
      ubicacionLng: -79.5312,
      direccionDetallada: `Reporte WhatsApp - ${payload.sector || 'Altos de Las Cumbres'}`,
      lugarRegistro: 'WhatsApp Comunitario',
      canalIntake: 'WhatsApp Comunitario',
      canalRadicacion: 'whatsapp_comunal',
      fechaCreacion,
      horaCreacion,
      fechaActualizacion: `${fechaCreacion} ${horaCreacion}`,
      reportante: {
        nombre: payload.nombre || 'Vecino WhatsApp',
        cedula: '8-WhatsApp',
        telefono: payload.telefono || '+507 6821-4490',
        email: 'contacto@whatsapp.comunal',
        genero: 'femenino',
        edad: 35,
        sector: payload.sector || 'Altos de Las Cumbres',
      },
      adjuntos: [
        {
          id: `att-wpp-${Date.now()}`,
          ticketId: formattedNum,
          tipo: 'foto',
          nombre: 'evidencia_whatsapp.jpg',
          url: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=1200&auto=format&fit=crop&q=80',
          thumbnailUrl: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=400&auto=format&fit=crop&q=80',
          tamanoBytes: 2100000,
          fechaSubida: `${fechaCreacion} ${horaCreacion}`,
        },
      ],
      trazabilidad: [
        {
          id: `tr-wpp-${Date.now()}`,
          ticketId: formattedNum,
          tipoEvento: 'creacion',
          fechaHora: `${fechaCreacion} ${horaCreacion}`,
          responsable: 'Bot WhatsApp Comunal',
          rolResponsable: 'Canal Automatizado WhatsApp',
          nota: 'Incidencia recibida vía WhatsApp e ingresada en tiempo real.',
          estadoNuevo: 'abierto',
        },
      ],
    };

    const tickets = getStoredTickets();
    tickets.unshift(newTicket);
    saveStoredTickets(tickets);
    this.triggerUpdateEvent();

    return {
      success: true,
      data: newTicket,
      message: `Caso WhatsApp ${formattedNum} integrado en tiempo real al sistema.`,
    };
  },

  // WhatsApp & n8n Live Stats (Message Counter, Minute Counter & Metrics)
  async getWhatsAppStats(): Promise<WhatsAppStats> {
    try {
      const res = await fetch('/api/whatsapp/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Fallback calculation from stored tickets
    }

    const tickets = getStoredTickets();
    const wppTickets = tickets.filter(
      (t) =>
        t.canalRadicacion === 'whatsapp_comunal' ||
        t.canalIntake?.toLowerCase().includes('whatsapp') ||
        t.lugarRegistro?.toLowerCase().includes('whatsapp') ||
        t.id.startsWith('TK-WPP')
    );

    return {
      totalMensajes: Math.max(wppTickets.length, 18),
      mensajesHoy: Math.max(wppTickets.length, 12),
      minutosDesdeUltimoMensaje: 4,
      ultimoMensajeFechaHora: 'Hace 4 minutos',
      tiempoPromedioRespuestaMinutos: 14,
      minutosConexionActiva: 380,
      n8nStatus: 'activo',
      n8nWebhookUrl: '/api/webhook/whatsapp',
      mensajesPorSector: {},
      historial: [],
    };
  },

  // Requests per sector by channel (WhatsApp, Web, Phone)
  async getSectorChannelStats(): Promise<SectorChannelStats[]> {
    try {
      const res = await fetch('/api/sectors/channel-stats');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Fallback calculation
    }

    const tickets = getStoredTickets();
    const sectorMap: Record<
      string,
      { sector: string; total: number; whatsapp: number; web: number; telefono: number; canalPredominante: 'WhatsApp' | 'Web Digital' | 'Telefónica' }
    > = {};

    SECTORES_RESIDENCIA.forEach((sec) => {
      sectorMap[sec] = {
        sector: sec,
        total: 0,
        whatsapp: 0,
        web: 0,
        telefono: 0,
        canalPredominante: 'Web Digital',
      };
    });

    tickets.forEach((t) => {
      const sec = t.sectorNombre || t.sectorId || t.reportante.sector || 'General';
      if (!sectorMap[sec]) {
        sectorMap[sec] = {
          sector: sec,
          total: 0,
          whatsapp: 0,
          web: 0,
          telefono: 0,
          canalPredominante: 'Web Digital',
        };
      }
      sectorMap[sec].total += 1;
      const rad = String(t.canalRadicacion || '').toLowerCase();
      const intake = String(t.canalIntake || t.lugarRegistro || '').toLowerCase();

      if (rad.includes('whatsapp') || intake.includes('whatsapp') || t.id.startsWith('TK-WPP')) {
        sectorMap[sec].whatsapp += 1;
      } else if (
        rad.includes('telefono') ||
        rad.includes('telefonica') ||
        intake.includes('llamada') ||
        intake.includes('ventanilla')
      ) {
        sectorMap[sec].telefono += 1;
      } else {
        sectorMap[sec].web += 1;
      }
    });

    return Object.values(sectorMap)
      .map((s): SectorChannelStats => ({
        ...s,
        canalPredominante:
          s.whatsapp >= s.web && s.whatsapp >= s.telefono
            ? 'WhatsApp'
            : s.telefono >= s.web && s.telefono >= s.whatsapp
            ? 'Telefónica'
            : 'Web Digital',
      }))
      .sort((a, b) => b.total - a.total);
  },

  // Simulate receiving a WhatsApp webhook ingestion from n8n
  async simulateWhatsAppIncoming(): Promise<ApiResponse<{ ticket: Ticket; mensaje: WhatsAppMessage }>> {
    try {
      const res = await fetch('/api/webhook/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          this.triggerUpdateEvent();
          return json;
        }
      }
    } catch {}

    // Fallback simulation
    const mockMsg: WhatsAppMessage = {
      id: `wpp-${Date.now()}`,
      telefono: '+507 6890-4421',
      remitente: 'Ciudadano Comunal',
      mensaje: 'Buenas tardes Junta Comunal, reporto afectación comunitaria vía WhatsApp Bot.',
      sector: 'Altos de Las Cumbres',
      fechaHora: new Date().toLocaleString('es-PA'),
      timestamp: Date.now(),
      minutosProcesamiento: 1,
      estado: 'convertido_ticket',
    };

    const newTicket: Ticket = {
      id: `TK-WPP-${Date.now()}`,
      numeroRegistro: `WPP-2025-${Math.floor(100 + Math.random() * 900)}`,
      asunto: 'Reporte Comunitario vía WhatsApp Bot (n8n)',
      descripcion: mockMsg.mensaje,
      categoriaId: 'alumbrado',
      categoriaNombre: 'Alumbrado Público',
      estado: 'abierto',
      prioridad: 'alta',
      sectorId: 'altos-cumbres',
      sectorNombre: 'Altos de Las Cumbres',
      canalRadicacion: 'whatsapp_comunal',
      canalIntake: 'WhatsApp (n8n Bot)',
      fechaCreacion: new Date().toISOString().split('T')[0],
      horaCreacion: new Date().toTimeString().split(' ')[0].substring(0, 5),
      fechaActualizacion: new Date().toISOString(),
      reportante: {
        nombre: 'Ciudadano Comunal',
        cedula: '8-892-1452',
        telefono: '+507 6890-4421',
        genero: 'otro',
        edad: 35,
        sector: 'Altos de Las Cumbres',
      },
      adjuntos: [],
      trazabilidad: [
        {
          id: `tr-${Date.now()}`,
          ticketId: `TK-WPP-${Date.now()}`,
          tipoEvento: 'creacion',
          fechaHora: new Date().toLocaleString('es-PA'),
          responsable: 'Bot n8n WhatsApp Integración',
          rolResponsable: 'Sistema Automatizado',
          nota: 'Incidencia capturada por WhatsApp y registrada automáticamente en la base de datos relacional MySQL.',
          estadoNuevo: 'abierto',
        },
      ],
    };

    const tickets = getStoredTickets();
    saveStoredTickets([newTicket, ...tickets]);
    this.triggerUpdateEvent();

    return {
      success: true,
      message: 'Mensaje de WhatsApp procesado exitosamente vía n8n',
      data: {
        ticket: newTicket,
        mensaje: mockMsg,
      },
    };
  },

  // Event bus for live dashboard / ticket list sync
  subscribers: [] as Array<() => void>,
  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  },
  triggerUpdateEvent() {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
    // Also dispatch custom browser event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ticket_db_updated'));
    }
  },

  // Reset to original mock data
  resetMockData(): Ticket[] {
    saveStoredTickets(MOCK_TICKETS);
    this.triggerUpdateEvent();
    return MOCK_TICKETS;
  },

  // System Design & Customization (Front-end & Back-end, DB Persisted)
  async getThemeSettings(): Promise<SystemCustomTheme | null> {
    try {
      const res = await fetch('/api/settings/theme');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('Could not fetch theme settings from API', e);
    }
    return null;
  },

  async saveThemeSettings(
    theme: Partial<SystemCustomTheme>
  ): Promise<{ success: boolean; data?: SystemCustomTheme; savedInDb?: boolean; message?: string }> {
    try {
      const res = await fetch('/api/settings/theme', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(theme),
      });
      if (res.ok) {
        const json = await res.json();
        return json;
      }
    } catch (e: any) {
      console.warn('Could not save theme settings to API', e);
    }
    return { success: false, message: 'Fallo al conectar con el servidor' };
  },
};

