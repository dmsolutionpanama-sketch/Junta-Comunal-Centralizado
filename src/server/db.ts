import mysql from 'mysql2/promise';
import { Ticket, TrazabilidadEvento, User } from '../types';

export interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
}

let pool: mysql.Pool | null = null;
let isConnected = false;
let lastConnectionAttempt = 0;
let lastErrorMessage = '';

export function getDbConfig(): DBConfig {
  return {
    host: process.env.DB_HOST || '31.97.208.81',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'u483786231_ticket_db',
    user: process.env.DB_USER || 'user_jc26',
    password: process.env.DB_PASSWORD || 'Eurmotion27$',
    ssl: process.env.DB_SSL === 'true',
  };
}

export async function getDbPool(): Promise<mysql.Pool | null> {
  const config = getDbConfig();

  if (!config.host || !config.password) {
    return null;
  }

  if (pool && isConnected) {
    return pool;
  }

  // Rate limit reconnect attempts to avoid spamming host
  const now = Date.now();
  if (now - lastConnectionAttempt < 10000 && pool === null && lastErrorMessage) {
    return null;
  }
  lastConnectionAttempt = now;

  try {
    const newPool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 7000,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
    });

    // Test connectivity
    const connection = await newPool.getConnection();
    await connection.ping();
    connection.release();

    pool = newPool;
    isConnected = true;
    lastErrorMessage = '';
    console.log(`✅ [MySQL Directo] Conexión establecida con éxito a ${config.database} en ${config.host} (Usuario: ${config.user})`);
    return pool;
  } catch (err: any) {
    lastErrorMessage = err?.message || 'Error desconocido';
    console.warn(`⚠️ [MySQL Directo] Intento de conexión a ${config.host} falló:`, lastErrorMessage);
    pool = null;
    isConnected = false;
    return null;
  }
}

export function getDbStatus() {
  const config = getDbConfig();
  return {
    connected: isConnected,
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    lastError: lastErrorMessage,
    provider: 'Hostinger Remote MySQL',
  };
}

// Fallback coordinate centers for sectors in Ernesto Córdoba Campos / Panamá Norte
export const SECTOR_COORDS_MAP: Record<string, { lat: number; lng: number }> = {
  'Altos de Las Cumbres': { lat: 9.0834, lng: -79.5312 },
  'Nueva Libia': { lat: 9.0945, lng: -79.5241 },
  'Villa Zaita': { lat: 9.0712, lng: -79.5188 },
  'Gonzalillo': { lat: 9.0882, lng: -79.5153 },
  'Ciudad San Lorenzo': { lat: 9.0991, lng: -79.5388 },
  'Colinas del Rocío': { lat: 9.0776, lng: -79.5267 },
  'Las Praderas del Rocío': { lat: 9.0744, lng: -79.5291 },
  'Reparto Portofino': { lat: 9.0815, lng: -79.5219 },
  'Villa María': { lat: 9.0911, lng: -79.5304 },
  'Villa Milagros': { lat: 9.0858, lng: -79.5273 },
  'Milla 9': { lat: 9.0683, lng: -79.5142 },
  'Santa Rita': { lat: 9.0934, lng: -79.5192 },
  'Las Lajas': { lat: 9.0905, lng: -79.5340 },
  'Chilibre Centro': { lat: 9.1412, lng: -79.6150 },
  'Villa Grecia': { lat: 9.1020, lng: -79.5390 },
};

/**
 * Ensure table schemas in MySQL have required columns for WhatsApp & Web parity
 */
export async function ensureDatabaseTablesSchema(): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    // Ensure columns exist on tickets and reportantes tables without crashing if they already do
    const alterQueries = [
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ubicacion_lat DECIMAL(10, 7) NULL;",
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ubicacion_lng DECIMAL(10, 7) NULL;",
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS canal_intake VARCHAR(100) DEFAULT 'Portal Web Ciudadano';",
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS canal_radicacion VARCHAR(50) DEFAULT 'web_portal';",
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS lugar_registro VARCHAR(100) DEFAULT 'Plataforma Web';",
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS consecutivo_seguridad VARCHAR(100) NULL;",
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tipo_reporte VARCHAR(100) NULL;",
      "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS datos_especificos_reporte JSON NULL;",
      "ALTER TABLE reportantes ADD COLUMN IF NOT EXISTS apellido VARCHAR(150) NULL;",
      "ALTER TABLE reportantes ADD COLUMN IF NOT EXISTS registrado_padron TINYINT(1) DEFAULT 0;"
    ];

    for (const q of alterQueries) {
      try {
        await db.query(q);
      } catch {
        // Ignored if syntax is unsupported in specific MySQL versions or already exists
      }
    }
    return true;
  } catch (err: any) {
    console.warn('[MySQL Schema] Warning checking tickets table schema:', err.message);
    return false;
  }
}

/**
 * Fetch all tickets from MySQL tables with fallback to in-memory/mock
 */
export async function queryTicketsFromMySQL(): Promise<Ticket[] | null> {
  try {
    const db = await getDbPool();
    if (!db) return null;

    // Check if tickets table exists and query all fields
    const [rows]: any = await db.query(`
      SELECT 
        t.id, 
        t.numero_registro as numeroRegistro, 
        t.consecutivo_seguridad as consecutivoSeguridad,
        t.tipo_reporte as tipoReporte,
        t.asunto, 
        t.categoria_id as categoriaId, 
        t.descripcion, 
        t.estado, 
        t.prioridad, 
        t.sector_id as sectorId, 
        t.ubicacion_lat as ubicacionLat, 
        t.ubicacion_lng as ubicacionLng, 
        t.direccion_detallada as direccionDetallada, 
        t.lugar_registro as lugarRegistro,
        t.canal_intake as canalIntake,
        t.canal_radicacion as canalRadicacion,
        t.fecha_creacion as fechaCreacion, 
        t.hora_creacion as horaCreacion, 
        t.fecha_actualizacion as fechaActualizacion,
        t.asignado_a as asignadoA,
        r.nombre as rep_nombre,
        r.apellido as rep_apellido,
        r.cedula as rep_cedula,
        r.telefono as rep_telefono,
        r.email as rep_email,
        r.genero as rep_genero,
        r.edad as rep_edad,
        r.sector as rep_sector,
        r.registrado_padron as rep_registrado_padron
      FROM tickets t
      LEFT JOIN reportantes r ON t.id = r.ticket_id
      ORDER BY t.fecha_actualizacion DESC
      LIMIT 1000
    `);

    if (!Array.isArray(rows)) return null;

    // Map rows to Ticket interface preserving WhatsApp vs Web channels & coordinates
    const tickets: Ticket[] = rows.map((row: any) => {
      const sectorStr = row.sectorId || row.rep_sector || 'Altos de Las Cumbres';
      const fallbackCoord = SECTOR_COORDS_MAP[sectorStr] || { lat: 9.0834, lng: -79.5312 };

      const latNum = Number(row.ubicacionLat);
      const lngNum = Number(row.ubicacionLng);
      const validLat = !isNaN(latNum) && latNum !== 0 ? latNum : fallbackCoord.lat;
      const validLng = !isNaN(lngNum) && lngNum !== 0 ? lngNum : fallbackCoord.lng;

      // Identify whether this ticket was generated from WhatsApp
      const isWpp = 
        (row.canalRadicacion && String(row.canalRadicacion).toLowerCase().includes('whatsapp')) ||
        (row.canalIntake && String(row.canalIntake).toLowerCase().includes('whatsapp')) ||
        String(row.id || '').startsWith('TK-WPP') ||
        String(row.numeroRegistro || '').includes('WPP');

      const canalRadicacion = isWpp ? 'whatsapp_comunal' : (row.canalRadicacion || 'web_portal');
      const canalIntake = isWpp ? 'WhatsApp Comunitario (n8n)' : (row.canalIntake || 'Portal Web Ciudadano');
      const lugarRegistro = isWpp ? 'WhatsApp Comunitario (n8n)' : (row.lugarRegistro || 'Plataforma Web');

      return {
        id: String(row.id || row.numeroRegistro),
        numeroRegistro: row.numeroRegistro || `TK-${row.id}`,
        consecutivoSeguridad: row.consecutivoSeguridad || undefined,
        tipoReporte: row.tipoReporte || undefined,
        asunto: row.asunto || 'Incidencia comunal registrada',
        categoriaId: row.categoriaId || 'general',
        categoriaNombre: row.categoriaId || 'General',
        descripcion: row.descripcion || '',
        estado: row.estado || 'abierto',
        prioridad: row.prioridad || 'media',
        sectorId: sectorStr,
        sectorNombre: sectorStr,
        ubicacionLat: validLat,
        ubicacionLng: validLng,
        direccionDetallada: row.direccionDetallada || (isWpp ? `Reporte recibido vía WhatsApp - ${sectorStr}` : ''),
        lugarRegistro,
        canalIntake,
        canalRadicacion,
        fechaCreacion: row.fechaCreacion ? String(row.fechaCreacion).slice(0, 10) : '2026-08-29',
        horaCreacion: row.horaCreacion ? String(row.horaCreacion).slice(0, 8) : '12:00:00',
        fechaActualizacion: row.fechaActualizacion ? String(row.fechaActualizacion) : '2026-08-29 12:00:00',
        reportante: {
          nombre: row.rep_nombre || (isWpp ? 'Ciudadano WhatsApp' : 'Ciudadano Residente'),
          apellido: row.rep_apellido || '',
          cedula: row.rep_cedula || (isWpp ? '8-WhatsApp' : 'N/A'),
          telefono: row.rep_telefono || '',
          email: row.rep_email || (isWpp ? 'contacto@whatsapp.comunal' : ''),
          genero: row.rep_genero || 'otro',
          edad: Number(row.rep_edad) || 35,
          sector: sectorStr,
          registradoEnPadron: row.rep_registrado_padron === 1,
        },
        adjuntos: [],
        trazabilidad: [
          {
            id: `tr-${row.id}-1`,
            ticketId: String(row.id),
            tipoEvento: 'creacion',
            fechaHora: row.fechaCreacion ? String(row.fechaCreacion) : '2026-08-29 12:00:00',
            responsable: isWpp ? 'Bot WhatsApp & n8n' : 'Sistema Portal Web',
            rolResponsable: isWpp ? 'Canal Automatizado WhatsApp' : 'Hostinger DB',
            nota: isWpp
              ? 'Incidencia recibida e ingresada automáticamente desde WhatsApp mediante integración n8n.'
              : 'Ticket registrado y persistido en la base de datos central.',
            estadoNuevo: row.estado || 'abierto',
            canalInteraccion: isWpp ? 'whatsapp' : 'web',
            minutosConsumidos: isWpp ? 3 : 2,
          },
        ],
      };
    });

    return tickets;
  } catch (err) {
    console.warn('[MySQL Directo] No se pudieron listar tickets desde MySQL (usando memoria sincronizada):', (err as Error).message);
    return null;
  }
}

/**
 * Ensure configuracion_sistema table exists in MySQL
 */
export async function ensureConfigTable(): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    await db.query(`
      CREATE TABLE IF NOT EXISTS configuracion_sistema (
        clave VARCHAR(100) NOT NULL PRIMARY KEY,
        valor LONGTEXT NOT NULL,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    return true;
  } catch (err: any) {
    console.warn('[MySQL Config] Error ensuring configuracion_sistema table:', err.message);
    return false;
  }
}

/**
 * Fetch a configuration setting from MySQL
 */
export async function getSystemConfigFromMySQL<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getDbPool();
    if (!db) return null;

    await ensureConfigTable();

    const [rows]: any = await db.query(
      `SELECT valor FROM configuracion_sistema WHERE clave = ? LIMIT 1`,
      [key]
    );

    if (Array.isArray(rows) && rows.length > 0 && rows[0].valor) {
      return JSON.parse(rows[0].valor) as T;
    }
    return null;
  } catch (err: any) {
    console.warn(`[MySQL Config] Error getting config '${key}':`, err.message);
    return null;
  }
}

/**
 * Save a configuration setting into MySQL
 */
export async function saveSystemConfigToMySQL(key: string, value: any): Promise<boolean> {
  try {
    const db = await getDbPool();
    if (!db) return false;

    await ensureConfigTable();

    const jsonStr = JSON.stringify(value);
    await db.query(
      `INSERT INTO configuracion_sistema (clave, valor)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE valor = VALUES(valor), fecha_actualizacion = NOW()`,
      [key, jsonStr]
    );
    console.log(`✅ [MySQL Config] Configuración '${key}' guardada exitosamente en MySQL`);
    return true;
  } catch (err: any) {
    console.warn(`[MySQL Config] Error saving config '${key}':`, err.message);
    return false;
  }
}

