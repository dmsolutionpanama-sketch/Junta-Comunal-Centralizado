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
} from '../types';
import { MOCK_TICKETS, MOCK_CURRENT_USER } from '../data/mockData';
import { CATEGORIAS_SISTEMA } from '../config/categories';
import { SECTORES_RESIDENCIA } from '../config/sectors';

const STORAGE_KEY_TICKETS = 'ticketing_app_tickets_v1';
const STORAGE_KEY_AUTH = 'ticketing_app_auth_v1';
const STORAGE_KEY_TOKEN = 'ticketing_app_jwt_token_v1';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
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

  // Fetch all tickets directly
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const res = await fetch('/api/tickets?limit=100', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Fallback to local storage
    }
    return getStoredTickets();
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
      const nextNum = tickets.length + 1;
      const formattedNum = `TK-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      const now = new Date();
      const nowStr = now.toISOString().replace('T', ' ').substring(0, 19);

      const formattedAdjuntos: Adjunto[] = (ticketData.adjuntos || []).map((a: any, idx: number) => ({
        id: a.id || `att-${Date.now()}-${idx}`,
        ticketId: formattedNum,
        tipo: a.tipo || 'foto',
        nombre: a.nombre || `Adjunto ${idx + 1}`,
        url: a.url || '',
        fechaSubida: nowStr,
      }));

      const newTicket: Ticket = {
        id: formattedNum,
        numeroRegistro: formattedNum,
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
        fechaCreacion: now.toISOString().split('T')[0],
        horaCreacion: now.toTimeString().split(' ')[0],
        fechaActualizacion: nowStr,
        reportante: ticketData.reportante || {
          nombre: 'Ciudadano Solicitante',
          cedula: '8-000-000',
          genero: 'femenino',
          edad: 35,
          sector: ticketData.sectorNombre || 'Altos de Las Cumbres',
        },
        adjuntos: formattedAdjuntos,
        trazabilidad: [
          {
            id: `tr-${Date.now()}-1`,
            ticketId: formattedNum,
            tipoEvento: 'creacion',
            fechaHora: nowStr,
            responsable: 'Sistema Web (Ciudadano)',
            rolResponsable: 'Portal Ciudadano',
            nota: 'Ticket radicado en el sistema.',
            estadoNuevo: 'abierto',
          },
        ],
      };

      tickets.unshift(newTicket);
      saveStoredTickets(tickets);
      return { success: true, data: newTicket, message: 'Ticket generado exitosamente.' };
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
      const raw = localStorage.getItem('ticketing_system_users_v1');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    const { MOCK_SYSTEM_USERS } = await import('../data/mockData');
    try {
      localStorage.setItem('ticketing_system_users_v1', JSON.stringify(MOCK_SYSTEM_USERS));
    } catch {}
    return MOCK_SYSTEM_USERS;
  },

  async updateUserRole(userId: string, newRole: UserRole): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const users = await this.getAllUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        users[idx].rol = newRole;
        localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
        return { success: true, user: users[idx], message: 'Rol de usuario actualizado correctamente.' };
      }
      return { success: false, message: 'Usuario no encontrado.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al actualizar rol.' };
    }
  },

  async updateUserFull(userId: string, updatedData: Partial<User>): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const users = await this.getAllUsers();
      const idx = users.findIndex((u) => u.id === userId);
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          ...updatedData,
        };
        localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
        return { success: true, user: users[idx], message: 'Datos de usuario actualizados correctamente.' };
      }
      return { success: false, message: 'Usuario no encontrado.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al actualizar usuario.' };
    }
  },

  async createUserAdmin(input: Partial<User> & { password?: string }): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const users = await this.getAllUsers();
      if (input.email) {
        const existing = users.find((u) => u.email.toLowerCase() === input.email!.toLowerCase());
        if (existing) {
          return { success: false, message: 'El correo electrónico ya se encuentra registrado en el sistema.' };
        }
      }

      const now = new Date();
      const fechaStr = now.toISOString().split('T')[0];
      const horaStr = now.toTimeString().split(' ')[0].substring(0, 5);

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
        ultimoAcceso: `${fechaStr} ${horaStr}`,
        avatarUrl: input.avatarUrl || `https://images.unsplash.com/photo-${input.genero === 'masculino' ? '1507003211169-0a1dd7228f2d' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`,
      };

      users.unshift(newUser);
      localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
      return { success: true, user: newUser, message: `Usuario "${newUser.nombre}" registrado exitosamente desde cero.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al registrar usuario.' };
    }
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
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
      const users = await this.getAllUsers();
      const existing = users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
      if (existing) {
        return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
      }

      const now = new Date();
      const fechaStr = now.toISOString().split('T')[0];
      const horaStr = now.toTimeString().split(' ')[0].substring(0, 5);

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
        ultimoAcceso: `${fechaStr} ${horaStr}`,
        avatarUrl: `https://images.unsplash.com/photo-${input.genero === 'masculino' ? '1500648767791-00dcc994a43e' : '1534528741775-53994a69daeb'}?w=150&auto=format&fit=crop&q=80`,
      };

      users.unshift(newUser);
      localStorage.setItem('ticketing_system_users_v1', JSON.stringify(users));
      const token = `jwt-token-${Date.now()}`;
      return { success: true, user: newUser, token, message: 'Ciudadano registrado con éxito en la Junta Comunal.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error al registrar usuario.' };
    }
  },

  // Reset to original mock data
  resetMockData(): Ticket[] {
    saveStoredTickets(MOCK_TICKETS);
    return MOCK_TICKETS;
  },
};

