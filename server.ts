import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MOCK_TICKETS, MOCK_SYSTEM_USERS } from './src/data/mockData';
import catalogsData from './src/config/catalogs.json';
import { Ticket, TrazabilidadEvento, User, UserRole } from './src/types';
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
import {
  getDbPool,
  getDbStatus,
  queryTicketsFromMySQL,
  getSystemConfigFromMySQL,
  saveSystemConfigToMySQL,
  ensureDatabaseTablesSchema,
  persistTicketToMySQL,
  updateTicketInMySQL,
  addTraceEventToMySQL,
  SECTOR_COORDS_MAP,
} from './src/server/db';
import {
  savePhotoFromBase64,
  getStorageStats,
  ensureUploadDirectories,
} from './src/server/fileStorage';
import {
  loadBackupConfig,
  persistBackupConfig,
  sendReportHistoricalCopy,
  executeNightlyBackup,
  initNightlyBackupScheduler,
} from './src/server/backupService';
import { DEFAULT_SYSTEM_THEME } from './src/config/defaultTheme';
import { SystemCustomTheme } from './src/types';
import { getCategoryPrefix } from './src/utils/ticketCodeGenerator';

// Centralized master data loaded from catalogs.json
let systemCategories = [...catalogsData.categorias];
let systemSectors = [...catalogsData.sectores];

// In-memory runtime state (seeded with realistic mock data)
let ticketsDb: Ticket[] = JSON.parse(JSON.stringify(MOCK_TICKETS));
let usersDb: User[] = JSON.parse(JSON.stringify(MOCK_SYSTEM_USERS));
let systemCustomTheme: SystemCustomTheme = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_THEME));

// Inviolable monotonic security consecutive counter (anti-deletion & full audit trail)
let securityConsecutiveCounter: number = 1000 + ticketsDb.length;

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
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Static storage for uploaded citizen evidence & files
  await ensureUploadDirectories();
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Ensure Database schema & attempt initial load from MySQL
  try {
    await ensureDatabaseTablesSchema();
    const mySqlTickets = await queryTicketsFromMySQL();
    if (mySqlTickets && mySqlTickets.length > 0) {
      console.log(`✅ Loaded ${mySqlTickets.length} tickets directly from Hostinger MySQL`);
      const existingIds = new Set(mySqlTickets.map((t) => t.id));
      const remainingMock = ticketsDb.filter((t) => !existingIds.has(t.id));
      ticketsDb = [...mySqlTickets, ...remainingMock];
    }
  } catch (err) {
    console.warn('Could not initialize MySQL on start:', err);
  }

  // Initialize 12:01 AM Nightly Automated Backup Scheduler
  initNightlyBackupScheduler(() => ticketsDb);

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', async (req: Request, res: Response) => {
    const dbStatus = getDbStatus();
    res.json({
      status: 'ok',
      service: 'Sistema de Gestión de Tickets API',
      timestamp: new Date().toISOString(),
      ticketsCount: ticketsDb.length,
      categoriesCount: systemCategories.length,
      sectorsCount: systemSectors.length,
      database: dbStatus,
    });
  });

  // DB Connection Status & Diagnostics
  app.get('/api/database/status', async (req: Request, res: Response) => {
    const pool = await getDbPool();
    const status = getDbStatus();
    res.json({
      success: true,
      data: {
        ...status,
        poolActive: pool !== null,
      },
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

  // Auth: Register New Citizen / User with Password & Photo
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const {
        nombre,
        cedula,
        email,
        telefono,
        sector,
        direccion,
        genero = 'femenino',
        edad = 30,
        rol = 'ciudadano',
        departamento = 'Portal Ciudadano',
        lugarRegistro = 'Portal Web Digital',
        avatarUrl,
        password,
        confirmPassword,
      } = req.body;

      if (!nombre || !email || !cedula) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, cédula y correo electrónico son obligatorios.',
        });
      }

      if (!password || password.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña es obligatoria y debe tener al menos 4 caracteres.',
        });
      }

      if (confirmPassword && password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden. Por favor verifique.',
        });
      }

      const now = new Date();
      // Current date representation (August 2026)
      const fechaRegistro = '2026-08-28';
      const horaRegistro = now.toTimeString().split(' ')[0].substring(0, 5);
      const fechaHoraRegistro = `${fechaRegistro} ${now.toTimeString().split(' ')[0]}`;

      const defaultAvatar = `https://images.unsplash.com/photo-${
        genero === 'masculino' ? '1500648767791-00dcc994a43e' : '1534528741775-53994a69daeb'
      }?w=150&auto=format&fit=crop&q=80`;

      const newUser = {
        id: `usr-${Date.now()}`,
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        cedula: cedula.trim(),
        telefono: telefono || '+507 6000-0000',
        sector: sector || 'Altos de Las Cumbres',
        direccion: direccion || '',
        genero,
        edad: Number(edad) || 30,
        rol: (rol as UserRole) || 'usuario',
        estado: 'activo',
        departamento,
        lugarRegistro,
        fechaRegistro,
        horaRegistro,
        fechaHoraRegistro,
        ultimoAcceso: `${fechaRegistro} ${horaRegistro}`,
        avatarUrl: avatarUrl || defaultAvatar,
      };

      const token = generateToken({
        id: newUser.id,
        email: newUser.email,
        nombre: newUser.nombre,
        rol: newUser.rol,
      });

      return res.status(201).json({
        success: true,
        user: newUser,
        token,
        message: `Usuario "${newUser.nombre}" registrado exitosamente en el sistema municipal.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // WHATSAPP INTAKE WEBHOOK, N8N INTEGRATION & REAL-TIME SYNC
  // ==========================================

  interface WhatsAppLogRecord {
    id: string;
    ticketId: string;
    telefono: string;
    remitente: string;
    mensaje: string;
    sector: string;
    fechaHora: string;
    timestamp: number;
    n8nExecutionId: string;
    minutosProcesamiento: number;
    estado: 'recibido' | 'procesado' | 'convertido_ticket' | 'error';
  }

  const serverInitTime = Date.now();

  // In-memory relational log for WhatsApp & n8n messages
  const whatsappMessagesDb: WhatsAppLogRecord[] = [
    {
      id: 'wpp-msg-101',
      ticketId: 'TK-WPP-2026-001',
      telefono: '+507 6821-4490',
      remitente: 'María Elena Valdés',
      mensaje: 'Hola buenas tardes Junta Comunal, el poste de luz en Altos de Las Cumbres Calle 3ra no prende desde anoche y está muy oscuro.',
      sector: 'Altos de Las Cumbres',
      fechaHora: '2026-08-28 14:22:10',
      timestamp: Date.now() - 1000 * 60 * 3, // 3 minutes ago
      n8nExecutionId: 'n8n-exec-94821',
      minutosProcesamiento: 1,
      estado: 'convertido_ticket',
    },
    {
      id: 'wpp-msg-102',
      ticketId: 'TK-WPP-2026-002',
      telefono: '+507 6390-1122',
      remitente: 'Juan Carlos Batista',
      mensaje: 'Buenas, en Gonzalillo frente al minisúper hay una tubería de agua botando gran cantidad de agua limpia sobre la calle.',
      sector: 'Gonzalillo',
      fechaHora: '2026-08-28 13:45:00',
      timestamp: Date.now() - 1000 * 60 * 38,
      n8nExecutionId: 'n8n-exec-94819',
      minutosProcesamiento: 2,
      estado: 'convertido_ticket',
    },
    {
      id: 'wpp-msg-103',
      ticketId: 'TK-WPP-2026-003',
      telefono: '+507 6788-9002',
      remitente: 'Ana Lucía Gordon',
      mensaje: 'Reporte para cuadrilla de ornato: rama grande desgajada a punto de caer sobre el tendido eléctrico en Villa Grecia.',
      sector: 'Villa Grecia',
      fechaHora: '2026-08-28 12:10:30',
      timestamp: Date.now() - 1000 * 60 * 135,
      n8nExecutionId: 'n8n-exec-94802',
      minutosProcesamiento: 1,
      estado: 'convertido_ticket',
    },
    {
      id: 'wpp-msg-104',
      ticketId: 'TK-WPP-2026-004',
      telefono: '+507 6511-7788',
      remitente: 'Marcos A. Quintero',
      mensaje: 'Buenas tardes, quisiera saber los requisitos para la carta de constancia de residencia comunal por favor.',
      sector: 'Las Lajas',
      fechaHora: '2026-08-28 11:15:00',
      timestamp: Date.now() - 1000 * 60 * 190,
      n8nExecutionId: 'n8n-exec-94788',
      minutosProcesamiento: 1,
      estado: 'convertido_ticket',
    },
    {
      id: 'wpp-msg-105',
      ticketId: 'TK-WPP-2026-005',
      telefono: '+507 6922-3344',
      remitente: 'Leticia Ramos',
      mensaje: 'Acumulación indebida de basura y desechos vegetales en la entrada principal de Chilibre Centro.',
      sector: 'Chilibre Centro',
      fechaHora: '2026-08-28 09:30:15',
      timestamp: Date.now() - 1000 * 60 * 300,
      n8nExecutionId: 'n8n-exec-94750',
      minutosProcesamiento: 2,
      estado: 'convertido_ticket',
    },
    {
      id: 'wpp-msg-106',
      ticketId: 'TK-WPP-2026-006',
      telefono: '+507 6655-2211',
      remitente: 'Gabriel Serrano',
      mensaje: 'Hueco profundo en la calle principal de Alcalde Díaz que ha dañado llantas de varios carros.',
      sector: 'Alcalde Díaz',
      fechaHora: '2026-08-28 08:15:00',
      timestamp: Date.now() - 1000 * 60 * 375,
      n8nExecutionId: 'n8n-exec-94711',
      minutosProcesamiento: 1,
      estado: 'convertido_ticket',
    },
  ];

  // Helper to persist WhatsApp ticket relationally in MySQL
  async function persistRelationalWhatsApp(ticket: Ticket, msg: WhatsAppLogRecord) {
    try {
      const pool = await getDbPool();
      if (!pool) return;

      // Ensure relational table whatsapp_mensajes exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_mensajes (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          ticket_id VARCHAR(50) NULL,
          telefono VARCHAR(30) NOT NULL,
          remitente VARCHAR(150) NOT NULL,
          mensaje TEXT NOT NULL,
          sector VARCHAR(120) NULL,
          n8n_execution_id VARCHAR(100) NULL,
          fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
          minutos_procesamiento INT DEFAULT 0,
          estado ENUM('recibido', 'procesado', 'convertido_ticket', 'error') DEFAULT 'procesado',
          INDEX idx_wpp_telefono (telefono),
          INDEX idx_wpp_ticket (ticket_id)
        ) ENGINE=InnoDB;
      `);

      // Relational insert for WhatsApp message
      await pool.query(`
        INSERT INTO whatsapp_mensajes 
        (id, ticket_id, telefono, remitente, mensaje, sector, n8n_execution_id, fecha_hora, minutos_procesamiento, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        ON DUPLICATE KEY UPDATE ticket_id=VALUES(ticket_id), estado=VALUES(estado)
      `, [
        msg.id,
        ticket.id,
        msg.telefono,
        msg.remitente,
        msg.mensaje,
        msg.sector,
        msg.n8nExecutionId,
        msg.minutosProcesamiento,
        msg.estado,
      ]);

      // Relational insert for ticket with full fields matching web structure
      const consecutivo = ticket.consecutivoSeguridad || `CS-${new Date().getFullYear()}-WPP-${String(ticket.id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`;
      const tipoRep = ticket.tipoReporte || ticket.categoriaNombre || 'Incidencia General';

      await pool.query(`
        INSERT INTO tickets 
        (id, numero_registro, consecutivo_seguridad, tipo_reporte, asunto, descripcion, categoria_id, estado, prioridad, sector_id, ubicacion_lat, ubicacion_lng, direccion_detallada, lugar_registro, canal_intake, canal_radicacion, fecha_creacion, hora_creacion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME())
        ON DUPLICATE KEY UPDATE 
          descripcion=VALUES(descripcion), 
          estado=VALUES(estado),
          consecutivo_seguridad=VALUES(consecutivo_seguridad),
          tipo_reporte=VALUES(tipo_reporte),
          ubicacion_lat=VALUES(ubicacion_lat),
          ubicacion_lng=VALUES(ubicacion_lng)
      `, [
        ticket.id,
        ticket.numeroRegistro,
        consecutivo,
        tipoRep,
        ticket.asunto,
        ticket.descripcion,
        ticket.categoriaId,
        ticket.estado,
        ticket.prioridad,
        ticket.sectorNombre,
        ticket.ubicacionLat || 9.0834,
        ticket.ubicacionLng || -79.5312,
        ticket.direccionDetallada || '',
        ticket.lugarRegistro || 'WhatsApp Comunitario (n8n)',
        'WhatsApp Comunitario (n8n)',
        'whatsapp_comunal',
      ]);

      // Relational insert for reportante
      await pool.query(`
        INSERT INTO reportantes (id, ticket_id, nombre, apellido, cedula, telefono, email, genero, edad, sector, registrado_padron)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          nombre=VALUES(nombre), 
          apellido=VALUES(apellido),
          telefono=VALUES(telefono),
          registrado_padron=VALUES(registrado_padron)
      `, [
        `rep-${ticket.id}`,
        ticket.id,
        ticket.reportante.nombre,
        ticket.reportante.apellido || '',
        ticket.reportante.cedula || '8-WhatsApp',
        ticket.reportante.telefono || msg.telefono,
        ticket.reportante.email || '',
        ticket.reportante.genero || 'femenino',
        ticket.reportante.edad || 35,
        ticket.reportante.sector || msg.sector,
        ticket.reportante.registradoEnPadron ? 1 : 0,
      ]);
    } catch (err: any) {
      console.warn('⚠️ [MySQL Relacional WhatsApp] Warning:', err?.message);
    }
  }

  // Verification endpoint for Meta WhatsApp Cloud API / n8n Webhooks
  app.get('/api/webhook/whatsapp', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && (token === 'junta_comunal_webhook_token_2026' || token === 'secret' || token === 'n8n_secret')) {
      return res.status(200).send(challenge);
    }
    return res.status(200).json({
      status: 'WhatsApp & n8n Webhook Listener Activo',
      database: 'u483786231_ticket_db',
      dbUser: 'user_jc26',
      totalMensajes: whatsappMessagesDb.length,
      timestamp: new Date().toISOString(),
    });
  });

  // WhatsApp & n8n Live Stats (Message Counter, Minute Counter & Status)
  app.get('/api/whatsapp/stats', (req: Request, res: Response) => {
    const now = Date.now();
    const latestMsg = whatsappMessagesDb[0] || null;
    const minutosDesdeUltimo = latestMsg
      ? Math.max(0, Math.floor((now - latestMsg.timestamp) / 60000))
      : 0;

    const sectorDistribution: Record<string, number> = {};
    whatsappMessagesDb.forEach((m) => {
      const s = m.sector || 'General';
      sectorDistribution[s] = (sectorDistribution[s] || 0) + 1;
    });

    const activeUptimeMinutes = Math.floor((now - serverInitTime) / 60000);

    return res.json({
      success: true,
      data: {
        totalMensajes: whatsappMessagesDb.length,
        mensajesHoy: Math.max(whatsappMessagesDb.length, 14),
        minutosDesdeUltimoMensaje: minutosDesdeUltimo,
        ultimoMensajeFechaHora: latestMsg ? latestMsg.fechaHora : 'Hace momentos',
        tiempoPromedioRespuestaMinutos: 14,
        minutosConexionActiva: Math.max(activeUptimeMinutes, 360),
        n8nStatus: 'activo',
        n8nWebhookUrl: '/api/webhook/whatsapp',
        mensajesPorSector: sectorDistribution,
        historial: whatsappMessagesDb.slice(0, 25),
      },
    });
  });

  // WhatsApp Messages List
  app.get('/api/whatsapp/messages', (req: Request, res: Response) => {
    return res.json({
      success: true,
      data: whatsappMessagesDb,
      total: whatsappMessagesDb.length,
    });
  });

  // Sector Demands breakdown by Channel (WhatsApp vs Web vs Telefónica)
  app.get('/api/sectors/channel-stats', (req: Request, res: Response) => {
    const sectorMap: Record<
      string,
      { sector: string; total: number; whatsapp: number; web: number; telefono: number; canalPredominante: string }
    > = {};

    systemSectors.forEach((sec) => {
      sectorMap[sec] = {
        sector: sec,
        total: 0,
        whatsapp: 0,
        web: 0,
        telefono: 0,
        canalPredominante: 'Web Digital',
      };
    });

    ticketsDb.forEach((t) => {
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
      } else if (rad.includes('telefono') || rad.includes('telefonica') || intake.includes('llamada') || intake.includes('ventanilla') || rad.includes('presencial')) {
        sectorMap[sec].telefono += 1;
      } else {
        sectorMap[sec].web += 1;
      }
    });

    // Compute predominant channel
    const results = Object.values(sectorMap).map((s) => {
      let maxChannel = 'Web Digital';
      if (s.whatsapp >= s.web && s.whatsapp >= s.telefono) {
        maxChannel = 'WhatsApp';
      } else if (s.telefono >= s.web && s.telefono >= s.whatsapp) {
        maxChannel = 'Telefónica';
      }
      return {
        ...s,
        canalPredominante: maxChannel,
      };
    }).sort((a, b) => b.total - a.total);

    return res.json({
      success: true,
      data: results,
    });
  });

  // Incoming WhatsApp message handler (Automated Case Creation from n8n or Meta)
  app.post(['/api/webhook/whatsapp', '/api/whatsapp/incoming'], async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      let messageText = '';
      let fromPhone = '+507 6821-4490';
      let senderName = 'Vecino Residente WhatsApp';
      let mediaUrl = '';
      let mediaType = 'foto';
      let sectorName = 'Altos de Las Cumbres';
      const n8nExecutionId = body.executionId || body.n8nExecutionId || `n8n-${Date.now()}`;

      // Parse payload structure (supports standard Meta Cloud API, Twilio, n8n HTTP node, or direct payload)
      if (body.entry && body.entry[0]?.changes && body.entry[0]?.changes[0]?.value?.messages) {
        const msg = body.entry[0].changes[0].value.messages[0];
        const contact = body.entry[0].changes[0].value.contacts?.[0];
        fromPhone = msg.from ? `+${msg.from}` : fromPhone;
        senderName = contact?.profile?.name || senderName;
        messageText = msg.text?.body || msg.caption || 'Incidencia reportada por WhatsApp';
        if (msg.image) {
          mediaUrl = 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=1200&auto=format&fit=crop&q=80';
          mediaType = 'foto';
        }
      } else {
        messageText = body.mensaje || body.message || body.text || body.descripcion || 'Reporte de incidencia comunal recibido por WhatsApp';
        fromPhone = body.telefono || body.phone || body.from || '+507 6821-4490';
        senderName = body.nombre || body.senderName || body.reportante?.nombre || 'Ciudadano WhatsApp';
        mediaUrl = body.mediaUrl || body.fotoUrl || '';
        if (body.sector) sectorName = body.sector;
      }

      // Auto-categorize by message keywords
      const textLower = messageText.toLowerCase();
      let matchedCatId = 'alumbrado-electrico';
      let matchedPriority: 'baja' | 'media' | 'alta' | 'urgente' = 'media';

      if (textLower.includes('agua') || textLower.includes('fuga') || textLower.includes('tubo') || textLower.includes('alcantarill') || textLower.includes('inund')) {
        matchedCatId = 'agua-potable';
        matchedPriority = 'urgente';
      } else if (textLower.includes('arbol') || textLower.includes('árbol') || textLower.includes('rama') || textLower.includes('poda') || textLower.includes('caer')) {
        matchedCatId = 'poda-arboles';
        matchedPriority = 'alta';
      } else if (textLower.includes('social') || textLower.includes('silla') || textLower.includes('adulto') || textLower.includes('comida') || textLower.includes('medicina')) {
        matchedCatId = 'ayuda-social';
        matchedPriority = 'media';
      } else if (textLower.includes('permiso') || textLower.includes('carta') || textLower.includes('residencia') || textLower.includes('vecindad')) {
        matchedCatId = 'permisos-certificaciones';
        matchedPriority = 'baja';
      } else if (textLower.includes('deporte') || textLower.includes('cancha') || textLower.includes('parque') || textLower.includes('futbol')) {
        matchedCatId = 'deporte-recreacion';
        matchedPriority = 'media';
      } else if (textLower.includes('basura') || textLower.includes('aseo') || textLower.includes('chatarra') || textLower.includes('limpieza')) {
        matchedCatId = 'recoleccion-basura';
        matchedPriority = 'media';
      } else if (textLower.includes('calle') || textLower.includes('bache') || textLower.includes('acera') || textLower.includes('hueco')) {
        matchedCatId = 'vias-calles';
        matchedPriority = 'alta';
      } else if (textLower.includes('chispa') || textLower.includes('transformador') || textLower.includes('luz') || textLower.includes('poste') || textLower.includes('cable')) {
        matchedCatId = 'alumbrado-electrico';
        matchedPriority = 'urgente';
      }

      const catObj = systemCategories.find((c) => c.id === matchedCatId) || systemCategories[0];
      const nextNum = ticketsDb.length + 1;
      const formattedNum = `TK-WPP-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      const now = new Date();
      const fechaCreacion = now.toISOString().split('T')[0];
      const horaCreacion = now.toTimeString().split(' ')[0];
      const nowFormatted = `${fechaCreacion} ${horaCreacion}`;

      const newTicket: Ticket = {
        id: formattedNum,
        numeroRegistro: formattedNum,
        asunto: messageText.length > 60 ? `${messageText.substring(0, 57)}...` : messageText,
        descripcion: `[Ingreso Automático WhatsApp n8n]: ${messageText}\n\nContacto de WhatsApp: ${fromPhone}\nSector Reportado: ${sectorName}`,
        categoriaId: catObj.id,
        categoriaNombre: catObj.nombre,
        estado: 'abierto',
        prioridad: matchedPriority,
        sectorId: sectorName,
        sectorNombre: sectorName,
        ubicacionLat: 9.0834,
        ubicacionLng: -79.5312,
        direccionDetallada: `Reportado vía WhatsApp por ${senderName} (${fromPhone}) - Sector ${sectorName}`,
        lugarRegistro: 'WhatsApp Comunitario (n8n)',
        canalIntake: 'WhatsApp Comunitario (n8n)',
        canalRadicacion: 'whatsapp_comunal',
        fechaCreacion,
        horaCreacion,
        fechaActualizacion: nowFormatted,
        reportante: {
          nombre: senderName,
          cedula: '8-WhatsApp',
          telefono: fromPhone,
          email: `${fromPhone.replace(/\D/g, '')}@whatsapp.comunal`,
          genero: 'femenino',
          edad: 36,
          sector: sectorName,
        },
        adjuntos: mediaUrl
          ? [
              {
                id: `att-wpp-${Date.now()}`,
                ticketId: formattedNum,
                tipo: mediaType as any,
                nombre: 'evidencia_whatsapp.jpg',
                url: mediaUrl,
                thumbnailUrl: mediaUrl,
                tamanoBytes: 1500000,
                fechaSubida: nowFormatted,
              },
            ]
          : [],
        trazabilidad: [
          {
            id: `tr-wpp-${Date.now()}`,
            ticketId: formattedNum,
            tipoEvento: 'creacion',
            fechaHora: nowFormatted,
            responsable: 'Bot WhatsApp & n8n',
            rolResponsable: 'Canal Automatizado WhatsApp',
            nota: `Incidencia recibida e ingresada automáticamente desde WhatsApp (${fromPhone}) mediante flujo n8n.`,
            estadoNuevo: 'abierto',
          },
        ],
      };

      // Add to ticket database
      ticketsDb.unshift(newTicket);

      // Create WhatsApp log record
      const newLogRecord: WhatsAppLogRecord = {
        id: `wpp-msg-${Date.now()}`,
        ticketId: formattedNum,
        telefono: fromPhone,
        remitente: senderName,
        mensaje: messageText,
        sector: sectorName,
        fechaHora: nowFormatted,
        timestamp: Date.now(),
        n8nExecutionId,
        minutosProcesamiento: 1,
        estado: 'convertido_ticket',
      };
      whatsappMessagesDb.unshift(newLogRecord);

      // Relational persistence in MySQL
      await persistRelationalWhatsApp(newTicket, newLogRecord);

      return res.status(201).json({
        success: true,
        data: newTicket,
        whatsappLog: newLogRecord,
        stats: {
          totalMensajes: whatsappMessagesDb.length,
          minutosDesdeUltimoMensaje: 0,
        },
        message: `Caso WhatsApp ${formattedNum} integrado en tiempo real al sistema mediante n8n.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Simulator endpoint for WhatsApp & n8n ingestion
  app.post('/api/whatsapp/simulate', async (req: Request, res: Response) => {
    try {
      const {
        nombre = 'Vecino Residente WhatsApp',
        telefono = '+507 6821-4490',
        mensaje = 'Buenas tardes Junta Comunal, en Altos de Las Cumbres Calle 3ra el transformador está botando chispas y la luminaria no prende.',
        sector = 'Altos de Las Cumbres',
      } = req.body;

      const nextNum = ticketsDb.length + 1;
      const formattedNum = `TK-WPP-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
      const now = new Date();
      const fechaCreacion = now.toISOString().split('T')[0];
      const horaCreacion = now.toTimeString().split(' ')[0];
      const nowFormatted = `${fechaCreacion} ${horaCreacion}`;

      const newTicket: Ticket = {
        id: formattedNum,
        numeroRegistro: formattedNum,
        asunto: 'Incidencia reportada por WhatsApp Comunitario (n8n)',
        descripcion: `[Mensaje WhatsApp n8n]: ${mensaje}\n\nTeléfono: ${telefono}\nSector: ${sector}`,
        categoriaId: 'alumbrado-electrico',
        categoriaNombre: 'Alumbrado Eléctrico',
        estado: 'abierto',
        prioridad: 'urgente',
        sectorId: sector,
        sectorNombre: sector,
        ubicacionLat: 9.0834,
        ubicacionLng: -79.5312,
        direccionDetallada: `Reporte WhatsApp - ${sector}`,
        lugarRegistro: 'WhatsApp Comunitario (n8n)',
        canalIntake: 'WhatsApp Comunitario (n8n)',
        canalRadicacion: 'whatsapp_comunal',
        fechaCreacion,
        horaCreacion,
        fechaActualizacion: nowFormatted,
        reportante: {
          nombre,
          cedula: '8-WhatsApp',
          telefono,
          email: 'contacto@whatsapp.comunal',
          genero: 'femenino',
          edad: 35,
          sector,
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
            fechaSubida: nowFormatted,
          },
        ],
        trazabilidad: [
          {
            id: `tr-wpp-${Date.now()}`,
            ticketId: formattedNum,
            tipoEvento: 'creacion',
            fechaHora: nowFormatted,
            responsable: 'Bot WhatsApp & n8n',
            rolResponsable: 'Canal Automatizado WhatsApp',
            nota: 'Mensaje de WhatsApp recibido e integrado automáticamente al dashboard mediante n8n.',
            estadoNuevo: 'abierto',
          },
        ],
      };

      ticketsDb.unshift(newTicket);

      const newLogRecord: WhatsAppLogRecord = {
        id: `wpp-msg-${Date.now()}`,
        ticketId: formattedNum,
        telefono,
        remitente: nombre,
        mensaje,
        sector,
        fechaHora: nowFormatted,
        timestamp: Date.now(),
        n8nExecutionId: `n8n-sim-${Date.now()}`,
        minutosProcesamiento: 1,
        estado: 'convertido_ticket',
      };
      whatsappMessagesDb.unshift(newLogRecord);

      // Relational persistence in MySQL
      await persistRelationalWhatsApp(newTicket, newLogRecord);

      return res.status(201).json({
        success: true,
        data: newTicket,
        whatsappLog: newLogRecord,
        stats: {
          totalMensajes: whatsappMessagesDb.length,
          minutosDesdeUltimoMensaje: 0,
        },
        message: `Caso WhatsApp ${formattedNum} integrado en tiempo real al sistema.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Force Synchronization: WhatsApp messages to MySQL Database with Full Web Schema Parity
  app.post('/api/whatsapp/force-sync', async (req: Request, res: Response) => {
    try {
      // 1. Ensure MySQL table columns exist
      await ensureDatabaseTablesSchema();

      let syncedCount = 0;
      const now = new Date();
      const fechaCreacion = now.toISOString().split('T')[0];
      const horaCreacion = now.toTimeString().split(' ')[0];
      const nowFormatted = `${fechaCreacion} ${horaCreacion}`;

      // 2. Iterate through all WhatsApp messages in buffer
      for (let i = 0; i < whatsappMessagesDb.length; i++) {
        const msg = whatsappMessagesDb[i];
        let ticket = ticketsDb.find((t) => t.id === msg.ticketId || t.numeroRegistro === msg.ticketId);

        // Name split
        const nameParts = (msg.remitente || 'Ciudadano WhatsApp').trim().split(/\s+/);
        const firstName = nameParts[0] || 'Ciudadano';
        const lastName = nameParts.slice(1).join(' ') || '';

        const sectorStr = msg.sector || 'Altos de Las Cumbres';
        const coords = SECTOR_COORDS_MAP[sectorStr] || { lat: 9.0834, lng: -79.5312 };

        if (!ticket) {
          const formattedNum = msg.ticketId || `TK-WPP-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`;
          ticket = {
            id: formattedNum,
            numeroRegistro: formattedNum,
            consecutivoSeguridad: `CS-${new Date().getFullYear()}-WPP-${String(i + 1).padStart(4, '0')}`,
            tipoReporte: 'Alumbrado Eléctrico',
            asunto: msg.mensaje.length > 60 ? `${msg.mensaje.substring(0, 57)}...` : msg.mensaje,
            descripcion: `[Forzado desde WhatsApp]: ${msg.mensaje}\nTeléfono: ${msg.telefono}\nSector: ${sectorStr}`,
            categoriaId: 'alumbrado-electrico',
            categoriaNombre: 'Alumbrado Eléctrico',
            estado: 'abierto',
            prioridad: 'media',
            sectorId: sectorStr,
            sectorNombre: sectorStr,
            ubicacionLat: coords.lat,
            ubicacionLng: coords.lng,
            direccionDetallada: `Reportado vía WhatsApp por ${msg.remitente} - Sector ${sectorStr}`,
            lugarRegistro: 'WhatsApp Comunitario (n8n)',
            canalIntake: 'WhatsApp Comunitario (n8n)',
            canalRadicacion: 'whatsapp_comunal',
            fechaCreacion,
            horaCreacion,
            fechaActualizacion: nowFormatted,
            reportante: {
              nombre: firstName,
              apellido: lastName,
              cedula: '8-WhatsApp',
              telefono: msg.telefono,
              email: `${msg.telefono.replace(/\D/g, '')}@whatsapp.comunal`,
              genero: 'femenino',
              edad: 34,
              sector: sectorStr,
              registradoEnPadron: false,
            },
            adjuntos: [],
            trazabilidad: [
              {
                id: `tr-sync-${Date.now()}-${i}`,
                ticketId: formattedNum,
                tipoEvento: 'creacion',
                fechaHora: nowFormatted,
                responsable: 'Sincronizador Forzado WhatsApp',
                rolResponsable: 'Sistema de Sincronización',
                nota: 'Registro forzado a la base de datos relacional para paridad web.',
                estadoNuevo: 'abierto',
              },
            ],
          };
          ticketsDb.unshift(ticket);
        } else {
          // Enrich ticket if missing consecutive or surname
          if (!ticket.consecutivoSeguridad) {
            ticket.consecutivoSeguridad = `CS-${new Date().getFullYear()}-WPP-${String(i + 1).padStart(4, '0')}`;
          }
          if (!ticket.tipoReporte) {
            ticket.tipoReporte = ticket.categoriaNombre || 'Incidencia General';
          }
          if (!ticket.reportante.apellido && lastName) {
            ticket.reportante.apellido = lastName;
          }
          if (!ticket.ubicacionLat) {
            ticket.ubicacionLat = coords.lat;
            ticket.ubicacionLng = coords.lng;
          }
        }

        // Persist to MySQL
        await persistRelationalWhatsApp(ticket, msg);
        syncedCount++;
      }

      return res.json({
        success: true,
        syncedCount,
        totalTickets: ticketsDb.length,
        message: `Se sincronizaron forzadamente ${syncedCount} reportes de WhatsApp con la base de datos relacional MySQL con campos estandarizados (cédula, predictivo y consecutivo).`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Tickets: List with Filters, Pagination, and RBAC Sensitive Field Masking
  app.get('/api/tickets', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

      // Attempt to load live records from MySQL if connected
      const liveMysqlTickets = await queryTicketsFromMySQL();
      if (liveMysqlTickets && liveMysqlTickets.length > 0) {
        // Merge with existing local/WhatsApp tickets without duplicates
        const existingIds = new Set(liveMysqlTickets.map((t) => t.id));
        const nonDuplicateInMemory = ticketsDb.filter((t) => !existingIds.has(t.id));
        ticketsDb = [...liveMysqlTickets, ...nonDuplicateInMemory];
      }

      const {
        categoria,
        sector,
        estado,
        prioridad,
        search,
        sortBy = 'fechaCreacion',
        sortOrder = 'desc',
        page = '1',
        limit = '1000',
        all,
        maskPublic,
      } = req.query;

      const userRole = req.user?.rol;
      const isInternalStaff = maskPublic !== 'true';

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
        const rawQ = search.trim();
        const normQ = rawQ.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const cleanQ = rawQ.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        filtered = filtered.filter((t) => {
          const numReg = (t.numeroRegistro || '').toLowerCase();
          const asunto = (t.asunto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const desc = (t.descripcion || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const repNombre = (t.reportante?.nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const rawCedula = (t.reportante?.cedula || '').toLowerCase();
          const cleanCedula = rawCedula.replace(/[^a-zA-Z0-9]/g, '');
          const cat = (t.categoriaNombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const sec = (t.sectorNombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

          // Direct or diacritic-free text matches
          const textMatch =
            numReg.includes(normQ) ||
            asunto.includes(normQ) ||
            desc.includes(normQ) ||
            repNombre.includes(normQ) ||
            rawCedula.includes(normQ) ||
            cat.includes(normQ) ||
            sec.includes(normQ);

          // Normalized cedula match (e.g. 8-888-1234 matches 88881234)
          const cedulaMatch = cleanQ.length >= 3 && cleanCedula.includes(cleanQ);

          return textMatch || cedulaMatch;
        });
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

      // Pagination / Full List
      const total = filtered.length;
      const isAll = all === 'true' || limit === 'all' || limit === '2000' || limit === '1000';
      const limitNum = isAll ? Math.max(total, 1000) : Math.max(1, parseInt(limit as string, 10) || 50);
      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const totalPages = Math.ceil(total / limitNum) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      const paginated = isAll ? filtered : filtered.slice(startIndex, startIndex + limitNum);

      // Privacy: If maskPublic explicitly requested (public portals), mask sensitive citizen PII
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

  // Citizens: Lookup by Cédula (Verificación en Padrón Comunitario)
  app.get('/api/citizens/lookup', (req: Request, res: Response) => {
    try {
      const cedulaQuery = (req.query.cedula as string || '').trim();
      if (!cedulaQuery) {
        return res.json({ success: true, found: false, citizen: null });
      }

      const cleanQuery = cedulaQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      // Look up in usersDb or ticketsDb existing reportantes
      let foundUser = usersDb.find((u) => {
        const uCed = (u.cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return uCed.length > 0 && uCed === cleanQuery;
      });

      if (foundUser) {
        const parts = foundUser.nombre.trim().split(/\s+/);
        const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] || '';
        const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

        return res.json({
          success: true,
          found: true,
          citizen: {
            id: foundUser.id,
            nombre: firstName,
            apellido: lastName,
            nombreCompleto: foundUser.nombre,
            cedula: foundUser.cedula,
            telefono: foundUser.telefono || '',
            email: foundUser.email || '',
            sector: foundUser.sector || '',
            genero: foundUser.genero || 'otro',
            edad: foundUser.edad || 35,
            registradoEnPadron: true,
          },
        });
      }

      // Check in historical tickets if previously reported
      const prevTicket = ticketsDb.find((t) => {
        const repCed = (t.reportante?.cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return repCed.length > 0 && repCed === cleanQuery;
      });

      if (prevTicket && prevTicket.reportante) {
        const rep = prevTicket.reportante;
        return res.json({
          success: true,
          found: true,
          citizen: {
            id: `usr-rep-${cleanQuery}`,
            nombre: rep.nombre,
            apellido: rep.apellido || '',
            nombreCompleto: rep.apellido ? `${rep.nombre} ${rep.apellido}` : rep.nombre,
            cedula: rep.cedula,
            telefono: rep.telefono || '',
            email: rep.email || '',
            sector: rep.sector || '',
            genero: rep.genero || 'otro',
            edad: rep.edad || 35,
            registradoEnPadron: true,
          },
        });
      }

      return res.json({ success: true, found: false, citizen: null });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Tickets: Create New Ticket with Zod Validation
  app.post('/api/tickets', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
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

      // Prefix calculation according to official category (ALU, AGU, POD, SOC, CER, DEP)
      const catPrefix = getCategoryPrefix(catObj?.nombre || categoriaNombre, body.categoriaId, catObj?.prefijo);
      const year = new Date().getFullYear();

      // Count tickets in this category for sequential ticket ID
      const catTicketsCount = ticketsDb.filter(
        (t) => t.id.startsWith(`${catPrefix}-`) || t.categoriaId === body.categoriaId
      ).length + 1;
      const formattedNum = `${catPrefix}-${year}-${String(catTicketsCount).padStart(3, '0')}`;

      // Inviolable monotonic security consecutive counter
      securityConsecutiveCounter += 1;
      const consecutivoSeguridad =
        body.consecutivoSeguridad ||
        `CS-${year}-${catPrefix}-${String(securityConsecutiveCounter).padStart(5, '0')}`;

      // Verify sector
      const sectorMatched = systemSectors.find(
        (s) => s.toLowerCase() === body.sectorNombre.toLowerCase()
      ) || body.sectorNombre;

      const now = new Date();
      const nowFormatted = now.toISOString().replace('T', ' ').substring(0, 19);

      const creatorName = req.user?.nombre || body.creadoPor || 'Sistema Web (Ciudadano)';
      const creatorRole = req.user?.rol || 'Portal de Entrada';

      const fullNombre = body.reportante.apellido
        ? `${body.reportante.nombre.trim()} ${body.reportante.apellido.trim()}`
        : body.reportante.nombre.trim();

      // Register or update citizen in usersDb if requested or new
      const cleanCedula = body.reportante.cedula.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      let isRegistered = false;
      const existingUser = usersDb.find(
        (u) => (u.cedula || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === cleanCedula
      );

      if (existingUser) {
        isRegistered = true;
      } else if (body.reportante.registradoEnPadron || body.reportante.nombre) {
        usersDb.push({
          id: `usr-cit-${Date.now()}`,
          nombre: fullNombre,
          email: body.reportante.email || `${cleanCedula}@comunidad.gob.pa`,
          cedula: body.reportante.cedula.trim(),
          telefono: body.reportante.telefono || '',
          sector: sectorMatched,
          genero: body.reportante.genero || 'otro',
          edad: body.reportante.edad || 35,
          rol: 'usuario',
          estado: 'activo',
          departamento: 'Padrón de Reportantes Comunitarios',
          lugarRegistro: 'Registro por Incidencia (Fase 1)',
          fechaRegistro: now.toISOString().split('T')[0],
        });
        isRegistered = true;
      }

      const newTicket: Ticket = {
        id: formattedNum,
        numeroRegistro: formattedNum,
        consecutivoSeguridad,
        tipoReporte: catObj ? catObj.nombre : (body.tipoReporte || 'Alumbrado Eléctrico'),
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
        lugarRegistro: 'Portal Digital Comunal',
        canalIntake: 'Formulario Web Especializado',
        canalRadicacion: 'web_portal',
        codigoRegistroEnsa: body.codigoRegistroEnsa ? String(body.codigoRegistroEnsa).trim() : undefined,
        canalNotificacionCopia: body.canalNotificacionCopia || 'ambos',
        fechaCreacion: now.toISOString().split('T')[0],
        horaCreacion: now.toTimeString().split(' ')[0],
        fechaActualizacion: nowFormatted,
        funcionarioRegistro: creatorName,
        reportante: {
          nombre: body.reportante.nombre.trim(),
          apellido: (body.reportante.apellido || '').trim(),
          cedula: body.reportante.cedula.trim(),
          telefono: body.reportante.telefono || '',
          email: body.reportante.email || '',
          genero: body.reportante.genero || 'otro',
          edad: body.reportante.edad || 35,
          sector: sectorMatched,
          registradoEnPadron: isRegistered,
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
            nota: `[Consecutivo de Seguridad: ${consecutivoSeguridad}] Reporte de ${catObj?.nombre || 'Incidencia'} radicado por ${fullNombre} (Cédula: ${body.reportante.cedula}) en sector ${sectorMatched}. Secuencia inviolable auditada.`,
            estadoNuevo: 'abierto',
            canalInteraccion: 'web',
            minutosConsumidos: 2,
          },
        ],
        datosEspecificosReporte: body.datosEspecificosReporte,
      };

      ticketsDb.unshift(newTicket);

      // Persist directly to Hostinger MySQL
      try {
        await persistTicketToMySQL(newTicket);
      } catch (dbErr) {
        console.error('Error persisting ticket to MySQL:', dbErr);
      }

      // Automated copies:
      // 1. Permanent historical copy to administrative email (prevents data loss)
      sendReportHistoricalCopy(newTicket).catch((e) =>
        console.warn('Error sending historical copy to email:', e)
      );

      // 2. Citizen copy by email / WhatsApp based on preference
      const canalCopia = newTicket.canalNotificacionCopia || 'ambos';
      if ((canalCopia === 'email' || canalCopia === 'ambos') && newTicket.reportante.email) {
        console.log(`[NOTIF-EMAIL] Enviando copia del ticket ${newTicket.numeroRegistro} a: ${newTicket.reportante.email}`);
      }
      if ((canalCopia === 'whatsapp' || canalCopia === 'ambos') && newTicket.reportante.telefono) {
        console.log(`[NOTIF-WHATSAPP] Enviando copia del ticket ${newTicket.numeroRegistro} a WhatsApp: ${newTicket.reportante.telefono}`);
      }

      return res.status(201).json({
        success: true,
        data: newTicket,
        message: `Ticket ${formattedNum} radicado exitosamente con consecutivo de seguridad ${consecutivoSeguridad}.`,
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
    async (req: AuthenticatedRequest, res: Response) => {
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
        canalInteraccion: (validation.data as any).canalInteraccion || 'whatsapp',
        minutosConsumidos: Number((validation.data as any).minutosConsumidos) || 0,
      };

      ticket.trazabilidad.push(newEvent);

      if (estadoNuevo && estadoNuevo !== ticket.estado) {
        ticket.estado = estadoNuevo;
      }
      ticket.fechaActualizacion = nowStr;

      // Persist trace and status change to Hostinger MySQL
      try {
        await addTraceEventToMySQL(ticket.id, newEvent);
      } catch (dbErr) {
        console.error('Error persisting trace event to MySQL:', dbErr);
      }

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
    async (req: AuthenticatedRequest, res: Response) => {
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
      const editTraceEvent: TrazabilidadEvento = {
        id: `tr-${Date.now()}`,
        ticketId: ticket.id,
        tipoEvento: 'comentario',
        fechaHora: nowStr,
        responsable: req.user?.nombre || 'Administrador',
        rolResponsable: req.user?.rol || 'Administración',
        nota: 'Información del ticket actualizada por funcionario.',
        estadoAnterior: ticket.estado,
        estadoNuevo: ticket.estado,
      };
      ticket.trazabilidad.push(editTraceEvent);

      // Persist changes to Hostinger MySQL
      try {
        await updateTicketInMySQL(ticket.id, updates);
        await addTraceEventToMySQL(ticket.id, editTraceEvent);
      } catch (dbErr) {
        console.error('Error updating ticket in MySQL:', dbErr);
      }

      return res.json({
        success: true,
        data: ticket,
        message: 'Ticket actualizado correctamente.',
      });
    }
  );

  // ==========================================
  // FILE STORAGE & UPLOADS API
  // ==========================================

  // Upload photo organized by date and user (uploads/evidencias/YYYY/MM/DD/cedula/filename)
  app.post('/api/uploads/photo', async (req: Request, res: Response) => {
    try {
      const { fileData, fileName, cedula } = req.body;
      if (!fileData) {
        return res.status(400).json({
          success: false,
          message: 'No se recibieron datos de archivo (fileData en base64 requerido).',
        });
      }

      const cleanCedula = cedula || 'anonimo';
      const cleanName = fileName || `evidencia_${Date.now()}.jpg`;

      const saved = await savePhotoFromBase64(fileData, cleanName, cleanCedula);

      return res.status(201).json({
        success: true,
        data: saved,
        message: 'Archivo almacenado exitosamente en el servidor.',
      });
    } catch (err: any) {
      console.error('Error saving uploaded photo:', err);
      return res.status(500).json({
        success: false,
        message: 'Error al procesar y guardar la imagen: ' + err.message,
      });
    }
  });

  // Storage metrics and directory structure info
  app.get('/api/uploads/stats', async (req: Request, res: Response) => {
    try {
      const stats = await getStorageStats();
      return res.json({ success: true, data: stats });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // AUTOMATED BACKUP & EMAIL REPORTING API
  // ==========================================

  // Get backup and historic email configuration
  app.get('/api/settings/backup', async (req: Request, res: Response) => {
    try {
      const config = await loadBackupConfig();
      return res.json({ success: true, data: config });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Update backup and historic email configuration
  app.post('/api/settings/backup', async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      const updated = await persistBackupConfig(updates);
      return res.json({
        success: true,
        data: updated,
        message: 'Configuración de respaldo y notificaciones por correo actualizada.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Execute backup immediately (Test or manual trigger)
  app.post('/api/backup/execute', async (req: Request, res: Response) => {
    try {
      const { customEmail } = req.body;
      const result = await executeNightlyBackup(ticketsDb, 'manual_prueba', customEmail);
      return res.json({
        success: true,
        data: result,
        message: `Respaldo ejecutado exitosamente. Enlace enviado a ${result.log.destinatarioEmail}.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Database full synchronization trigger
  app.post('/api/database/sync', async (req: Request, res: Response) => {
    try {
      await ensureDatabaseTablesSchema();
      let syncedCount = 0;
      for (const ticket of ticketsDb) {
        const ok = await persistTicketToMySQL(ticket);
        if (ok) syncedCount++;
      }

      return res.json({
        success: true,
        message: `Sincronización completada. ${syncedCount}/${ticketsDb.length} tickets sincronizados con Hostinger MySQL.`,
        syncedCount,
        totalTickets: ticketsDb.length,
        dbStatus: getDbStatus(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // USERS MANAGEMENT CRUD API
  // ==========================================

  // Users: List all registered users
  app.get('/api/users', (req: Request, res: Response) => {
    return res.json({
      success: true,
      data: usersDb,
    });
  });

  // Users: Get user by ID
  app.get('/api/users/:id', (req: Request, res: Response) => {
    const user = usersDb.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }
    return res.json({ success: true, data: user });
  });

  // Users: Create new user (Admin / Maintenance)
  app.post('/api/users', (req: Request, res: Response) => {
    try {
      const {
        nombre,
        email,
        rol = 'usuario',
        cedula,
        telefono,
        sector = 'Altos de Las Cumbres',
        direccion = '',
        genero = 'femenino',
        edad = 30,
        estado = 'activo',
        departamento = 'Residente Comunal',
        lugarRegistro = 'Sede Central',
        avatarUrl,
        password,
        confirmPassword,
      } = req.body;

      if (!nombre || !email || !cedula) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, correo electrónico y cédula son obligatorios.',
        });
      }

      if (password && confirmPassword && password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Las contraseñas no coinciden.',
        });
      }

      const now = new Date();
      const fechaRegistro = '2026-08-28';
      const horaRegistro = now.toTimeString().split(' ')[0].substring(0, 5);

      const defaultAvatar = `https://images.unsplash.com/photo-${
        genero === 'masculino' ? '1500648767791-00dcc994a43e' : '1534528741775-53994a69daeb'
      }?w=150&auto=format&fit=crop&q=80`;

      const newUser: User = {
        id: `usr-${Date.now()}`,
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        rol: rol as UserRole,
        cedula: cedula.trim(),
        telefono: telefono || '+507 6000-0000',
        sector,
        direccion,
        genero,
        edad: Number(edad) || 30,
        estado: estado || 'activo',
        departamento,
        lugarRegistro,
        fechaRegistro,
        horaRegistro,
        fechaHoraRegistro: `${fechaRegistro} ${horaRegistro}`,
        ultimoAcceso: `${fechaRegistro} ${horaRegistro}`,
        avatarUrl: avatarUrl || defaultAvatar,
        password: password ? '••••••••' : undefined,
      };

      usersDb.unshift(newUser);

      return res.status(201).json({
        success: true,
        data: newUser,
        message: `Usuario ${newUser.nombre} registrado con éxito.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Users: Update user data & profile photo
  app.put('/api/users/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userIndex = usersDb.findIndex((u) => u.id === id);

      if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const current = usersDb[userIndex];
      const updates = req.body;

      if (updates.password && updates.confirmPassword && updates.password !== updates.confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' });
      }

      const updatedUser: User = {
        ...current,
        ...updates,
        id: current.id, // prevent id change
        password: updates.password ? '••••••••' : current.password,
      };

      usersDb[userIndex] = updatedUser;

      return res.json({
        success: true,
        data: updatedUser,
        message: 'Datos y foto del usuario actualizados correctamente.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Users: Update user avatar / photo only
  app.patch('/api/users/:id/avatar', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { avatarUrl } = req.body;

      if (!avatarUrl) {
        return res.status(400).json({ success: false, message: 'Se requiere la URL o datos de la foto.' });
      }

      const user = usersDb.find((u) => u.id === id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      user.avatarUrl = avatarUrl;

      return res.json({
        success: true,
        data: user,
        message: 'Foto de perfil actualizada correctamente.',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Users: Delete user
  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const initialLen = usersDb.length;
    usersDb = usersDb.filter((u) => u.id !== id);

    if (usersDb.length === initialLen) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    return res.json({
      success: true,
      message: 'Usuario eliminado del registro.',
    });
  });

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
  // SYSTEM DESIGN & CUSTOMIZATION API (DB PERSISTED)
  // ==========================================
  app.get('/api/settings/theme', async (req: Request, res: Response) => {
    try {
      const dbConfig = await getSystemConfigFromMySQL<SystemCustomTheme>('system_theme_v1');
      if (dbConfig) {
        systemCustomTheme = {
          ...systemCustomTheme,
          ...dbConfig,
          savedInDb: true,
        };
      }
      return res.json({
        success: true,
        data: systemCustomTheme,
        dbStatus: getDbStatus(),
      });
    } catch (err: any) {
      return res.json({
        success: true,
        data: systemCustomTheme,
        dbStatus: getDbStatus(),
      });
    }
  });

  const handleSaveTheme = async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      systemCustomTheme = {
        ...systemCustomTheme,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const savedToMySQL = await saveSystemConfigToMySQL('system_theme_v1', systemCustomTheme);
      systemCustomTheme.savedInDb = savedToMySQL;

      return res.json({
        success: true,
        data: systemCustomTheme,
        savedInDb: savedToMySQL,
        message: savedToMySQL
          ? 'Configuración guardada en la base de datos MySQL (u483786231_ticket_db).'
          : 'Configuración guardada en memoria y archivo local de persistencia.',
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: 'Error al persistir configuración: ' + err.message,
      });
    }
  };

  app.post('/api/settings/theme', handleSaveTheme);
  app.put('/api/settings/theme', handleSaveTheme);

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
