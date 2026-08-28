import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MOCK_TICKETS } from './src/data/mockData';
import catalogsData from './src/config/catalogs.json';
import { Ticket, TrazabilidadEvento, UserRole } from './src/types';
import {
  loginSchema,
  createTicketSchema,
  addTraceEventSchema,
  updateTicketSchema,
  formatZodErrors,
} from './src/server/validations';
import {
  generateToken,
  authenticateToken,
  requireRole,
  optionalAuth,
  AuthenticatedRequest,
} from './src/server/auth';

// Centralized master data loaded from catalogs.json
let systemCategories = [...catalogsData.categorias];
let systemSectors = [...catalogsData.sectores];

// In-memory runtime state (seeded with realistic mock data)
let ticketsDb: Ticket[] = JSON.parse(JSON.stringify(MOCK_TICKETS));

// Pre-configured system demo users with realistic roles
const SYSTEM_USERS = [
  {
    id: 'usr-admin-01',
    nombre: 'Ing. Carlos Mendoza',
    email: 'carlos.mendoza@alcaldia.gob.pa',
    rol: 'administrador' as UserRole,
    departamento: 'Dirección General de Servicios',
  },
  {
    id: 'usr-agent-01',
    nombre: 'Téc. Javier Castillo',
    email: 'javier.castillo@alcaldia.gob.pa',
    rol: 'agente' as UserRole,
    departamento: 'Cuadrilla Eléctrica y Mantenimiento',
  },
  {
    id: 'usr-user-01',
    nombre: 'Ciudadano María Valdés',
    email: 'maria.valdes@gmail.com',
    rol: 'usuario' as UserRole,
    departamento: 'Portal Ciudadano',
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'Sistema de Gestión de Tickets API',
      timestamp: new Date().toISOString(),
      ticketsCount: ticketsDb.length,
      categoriesCount: systemCategories.length,
      sectorsCount: systemSectors.length,
      database: 'MySQL Ready (Centralized Catalog & In-Memory Store)',
    });
  });

  // Master Catalogs (Centralized Categories & Sectores)
  app.get('/api/catalogs', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        categorias: systemCategories,
        sectores: systemSectors,
      },
    });
  });

  app.get('/api/catalogs/categories', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: systemCategories,
    });
  });

  app.get('/api/catalogs/sectors', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: systemSectors,
    });
  });

  // Auth: Login Endpoint with Zod Validation and JWT Generation
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación en las credenciales proporcionadas.',
        errors: formatZodErrors(validation.error),
      });
    }

    const { email, password, role: requestedRole } = validation.data;

    // Password length verification
    if (password.length < 4) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. La contraseña debe tener al menos 4 caracteres.',
      });
    }

    // Determine user role and profile
    const existingUser = SYSTEM_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    let userProfile;
    if (existingUser) {
      userProfile = existingUser;
    } else {
      // Determine role from email keywords or default to requestedRole or 'administrador'
      let determinedRole: UserRole = requestedRole || 'administrador';
      if (email.includes('agente') || email.includes('tecnico') || email.includes('cuadrilla')) {
        determinedRole = 'agente';
      } else if (email.includes('ciudadano') || email.includes('usuario')) {
        determinedRole = 'usuario';
      }

      userProfile = {
        id: `usr-${Date.now()}`,
        email,
        nombre: email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        rol: determinedRole,
        departamento:
          determinedRole === 'administrador'
            ? 'Supervisión General'
            : determinedRole === 'agente'
            ? 'Operaciones y Cuadrilla'
            : 'Comunidad',
      };
    }

    // Generate real JWT token
    const token = generateToken({
      id: userProfile.id,
      email: userProfile.email,
      nombre: userProfile.nombre,
      rol: userProfile.rol,
    });

    return res.json({
      success: true,
      token,
      user: userProfile,
      message: `Inicio de sesión exitoso como ${userProfile.rol.toUpperCase()}.`,
    });
  });

  // Auth: Verify Current Token (Me)
  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    return res.json({
      success: true,
      user: req.user,
    });
  });

  // Tickets: List with Filters, Pagination, and RBAC Sensitive Field Masking
  app.get('/api/tickets', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        categoria,
        sector,
        estado,
        prioridad,
        search,
        sortBy = 'fechaCreacion',
        sortOrder = 'desc',
        page = '1',
        limit = '25',
      } = req.query;

      const userRole = req.user?.rol;
      const isInternalStaff = userRole === 'administrador' || userRole === 'agente' || userRole === 'supervisor';

      let filtered = [...ticketsDb];

      // Filters
      if (categoria && categoria !== 'todas') {
        filtered = filtered.filter(
          (t) => t.categoriaId.toLowerCase() === String(categoria).toLowerCase()
        );
      }

      if (sector && sector !== 'todos') {
        filtered = filtered.filter(
          (t) => t.sectorNombre.toLowerCase() === String(sector).toLowerCase()
        );
      }

      if (estado && estado !== 'todos') {
        filtered = filtered.filter((t) => t.estado === estado);
      }

      if (prioridad && prioridad !== 'todas') {
        filtered = filtered.filter((t) => t.prioridad === prioridad);
      }

      if (search && typeof search === 'string' && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        filtered = filtered.filter(
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
      filtered.sort((a, b) => {
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

      // Pagination
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit as string, 10) || 25);
      const total = filtered.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = filtered.slice(startIndex, startIndex + limitNum);

      // Privacy: If request is from unauthenticated user or plain 'usuario', mask sensitive citizen PII
      const sanitizedData = paginated.map((ticket) => {
        if (!isInternalStaff) {
          return {
            ...ticket,
            reportante: {
              ...ticket.reportante,
              nombre: ticket.reportante.nombre.substring(0, 3) + '*** (Protegido)',
              cedula: '***-***-****',
              telefono: '***-****',
              email: '***@***.***',
            },
          };
        }
        return ticket;
      });

      return res.json({
        success: true,
        data: sanitizedData,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Tickets: Get single ticket by ID or Registration Number (With public privacy check)
  app.get('/api/tickets/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const isExplicitPublic = req.query.public === 'true';
    const userRole = req.user?.rol;
    const isInternalStaff = userRole === 'administrador' || userRole === 'agente' || userRole === 'supervisor';

    const ticket = ticketsDb.find(
      (t) =>
        t.id.toLowerCase() === id.toLowerCase() ||
        t.numeroRegistro.toLowerCase() === id.toLowerCase()
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No se encontró ningún ticket con el identificador "${id}".`,
      });
    }

    if (isExplicitPublic || !isInternalStaff) {
      // STRICT PRIVACY: Strip private reporter personal info for public search
      const { reportante, ...restTicket } = ticket;
      return res.json({
        success: true,
        data: {
          ...restTicket,
          reportante: {
            nombre: 'Ciudadano Residente',
            cedula: '***-***-****',
            genero: reportante.genero,
            edad: reportante.edad,
            sector: reportante.sector,
          },
        },
      });
    }

    return res.json({
      success: true,
      data: ticket,
    });
  });

  // Tickets: Create New Ticket with Zod Validation
  app.post('/api/tickets', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      // Validate request body with Zod schema
      const validation = createTicketSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos para registrar el ticket.',
          errors: formatZodErrors(validation.error),
        });
      }

      const body = validation.data;

      // Verify category existence from centralized catalog
      const catObj = systemCategories.find(
        (c) => c.id.toLowerCase() === body.categoriaId.toLowerCase()
      );
      const categoriaNombre = catObj ? catObj.nombre : (body.categoriaNombre || 'General');

      // Verify sector
      const sectorMatched = systemSectors.find(
        (s) => s.toLowerCase() === body.sectorNombre.toLowerCase()
      ) || body.sectorNombre;

      const nextNum = ticketsDb.length + 1;
      const formattedNum = `TK-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      const now = new Date();
      const nowFormatted = now.toISOString().replace('T', ' ').substring(0, 19);

      const creatorName = req.user?.nombre || body.creadoPor || 'Sistema Web (Ciudadano)';
      const creatorRole = req.user?.rol || 'Portal de Entrada';

      const newTicket: Ticket = {
        id: formattedNum,
        numeroRegistro: formattedNum,
        asunto: body.asunto.trim(),
        descripcion: body.descripcion.trim(),
        categoriaId: body.categoriaId,
        categoriaNombre,
        estado: 'abierto',
        prioridad: body.prioridad || 'media',
        sectorId: sectorMatched,
        sectorNombre: sectorMatched,
        ubicacionLat: body.ubicacionLat || 9.082,
        ubicacionLng: body.ubicacionLng || -79.528,
        direccionDetallada: body.direccionDetallada || '',
        fechaCreacion: now.toISOString().split('T')[0],
        horaCreacion: now.toTimeString().split(' ')[0],
        fechaActualizacion: nowFormatted,
        reportante: {
          nombre: body.reportante.nombre.trim(),
          cedula: body.reportante.cedula.trim(),
          telefono: body.reportante.telefono || '',
          email: body.reportante.email || '',
          genero: body.reportante.genero,
          edad: body.reportante.edad,
          sector: sectorMatched,
        },
        adjuntos: (body.adjuntos || []).map((a, idx) => ({
          id: a.id || `att-${Date.now()}-${idx}`,
          ticketId: formattedNum,
          tipo: a.tipo,
          nombre: a.nombre,
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
          tamanoBytes: a.tamanoBytes || 1024000,
          fechaSubida: nowFormatted,
        })),
        trazabilidad: [
          {
            id: `tr-${Date.now()}-1`,
            ticketId: formattedNum,
            tipoEvento: 'creacion',
            fechaHora: nowFormatted,
            responsable: creatorName,
            rolResponsable: creatorRole,
            nota: 'Ticket radicado formalmente en el sistema municipal.',
            estadoNuevo: 'abierto',
          },
        ],
      };

      ticketsDb.unshift(newTicket);

      return res.status(201).json({
        success: true,
        data: newTicket,
        message: `Ticket ${formattedNum} radicado exitosamente.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Traceability: Add Event / Note to a Ticket (Protected: Requires Administrador, Agente, or Supervisor)
  app.post(
    '/api/tickets/:id/trace',
    authenticateToken,
    requireRole(['administrador', 'agente', 'supervisor']),
    (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      // Zod Validation for trace note
      const validation = addTraceEventSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación en los datos de trazabilidad.',
          errors: formatZodErrors(validation.error),
        });
      }

      const { tipoEvento, responsable, rolResponsable, nota, estadoNuevo } = validation.data;

      const ticketIndex = ticketsDb.findIndex(
        (t) =>
          t.id.toLowerCase() === id.toLowerCase() ||
          t.numeroRegistro.toLowerCase() === id.toLowerCase()
      );

      if (ticketIndex === -1) {
        return res.status(404).json({
          success: false,
          message: `El ticket "${id}" no existe en el registro.`,
        });
      }

      const ticket = ticketsDb[ticketIndex];
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      const newEvent: TrazabilidadEvento = {
        id: `tr-${Date.now()}`,
        ticketId: ticket.id,
        tipoEvento,
        fechaHora: nowStr,
        responsable: req.user?.nombre || responsable,
        rolResponsable: req.user?.rol || rolResponsable || 'Funcionario',
        nota: nota.trim(),
        estadoAnterior: ticket.estado,
        estadoNuevo: estadoNuevo || ticket.estado,
      };

      ticket.trazabilidad.push(newEvent);

      if (estadoNuevo && estadoNuevo !== ticket.estado) {
        ticket.estado = estadoNuevo;
      }
      ticket.fechaActualizacion = nowStr;

      return res.json({
        success: true,
        data: ticket,
        message: 'Evento y actualización de estado registrados en bitácora.',
      });
    }
  );

  // Tickets: Update Properties (Protected: Requires Administrador or Agente)
  app.patch(
    '/api/tickets/:id',
    authenticateToken,
    requireRole(['administrador', 'agente', 'supervisor']),
    (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const validation = updateTicketSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: 'Datos de actualización inválidos.',
          errors: formatZodErrors(validation.error),
        });
      }

      const ticketIndex = ticketsDb.findIndex(
        (t) =>
          t.id.toLowerCase() === id.toLowerCase() ||
          t.numeroRegistro.toLowerCase() === id.toLowerCase()
      );

      if (ticketIndex === -1) {
        return res.status(404).json({ success: false, message: 'Ticket no encontrado' });
      }

      const ticket = ticketsDb[ticketIndex];
      const updates = validation.data;
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      // Apply updates
      Object.assign(ticket, updates);
      ticket.fechaActualizacion = nowStr;

      // Add trace event for edit
      ticket.trazabilidad.push({
        id: `tr-${Date.now()}`,
        ticketId: ticket.id,
        tipoEvento: 'comentario',
        fechaHora: nowStr,
        responsable: req.user?.nombre || 'Administrador',
        rolResponsable: req.user?.rol || 'Administración',
        nota: 'Información del ticket actualizada por funcionario.',
        estadoAnterior: ticket.estado,
        estadoNuevo: ticket.estado,
      });

      return res.json({
        success: true,
        data: ticket,
        message: 'Ticket actualizado correctamente.',
      });
    }
  );

  // Stats / Dashboard Aggregations (Centralized calculations)
  app.get('/api/stats', (req: Request, res: Response) => {
    const total = ticketsDb.length;
    const abiertos = ticketsDb.filter((t) => t.estado === 'abierto').length;
    const enProgreso = ticketsDb.filter((t) => t.estado === 'en_progreso').length;
    const resueltos = ticketsDb.filter((t) => t.estado === 'resuelto').length;
    const cerrados = ticketsDb.filter((t) => t.estado === 'cerrado').length;

    // By Category from centralized catalog
    const porCategoria = systemCategories.map((c) => ({
      categoriaId: c.id,
      nombre: c.nombre,
      color: c.color,
      cantidad: ticketsDb.filter((t) => t.categoriaId === c.id).length,
    }));

    // By Top Sectors from centralized catalog
    const sectorCounts: { [key: string]: number } = {};
    ticketsDb.forEach((t) => {
      sectorCounts[t.sectorNombre] = (sectorCounts[t.sectorNombre] || 0) + 1;
    });

    const porSector = Object.entries(sectorCounts)
      .map(([sector, cantidad]) => ({ sector, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 8);

    // By Gender
    const porGenero = {
      femenino: ticketsDb.filter((t) => t.reportante.genero === 'femenino').length,
      masculino: ticketsDb.filter((t) => t.reportante.genero === 'masculino').length,
      otro: ticketsDb.filter((t) => t.reportante.genero === 'otro').length,
    };

    // By Age Range
    const porRangoEdad = {
      '18-29': ticketsDb.filter((t) => t.reportante.edad >= 18 && t.reportante.edad <= 29).length,
      '30-49': ticketsDb.filter((t) => t.reportante.edad >= 30 && t.reportante.edad <= 49).length,
      '50-64': ticketsDb.filter((t) => t.reportante.edad >= 50 && t.reportante.edad <= 64).length,
      '65+': ticketsDb.filter((t) => t.reportante.edad >= 65).length,
    };

    res.json({
      success: true,
      data: {
        kpis: {
          total,
          abiertos,
          enProgreso,
          resueltos,
          cerrados,
          tasaResolucion: total > 0 ? Math.round(((resueltos + cerrados) / total) * 100) : 0,
        },
        porCategoria,
        porSector,
        porGenero,
        porRangoEdad,
      },
    });
  });

  // ==========================================
  // VITE MIDDLEWARE SETUP
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Sistema de Gestión de Tickets running at http://localhost:${PORT}`);
  });
}

startServer();
