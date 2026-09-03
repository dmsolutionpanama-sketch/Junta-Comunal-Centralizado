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

/**
 * Fetch all tickets from MySQL tables with fallback to in-memory/mock
 */
export async function queryTicketsFromMySQL(): Promise<Ticket[] | null> {
  try {
    const db = await getDbPool();
    if (!db) return null;

    // Check if tickets table exists
    const [rows]: any = await db.query(`
      SELECT 
        t.id, 
        t.numero_registro as numeroRegistro, 
        t.asunto, 
        t.categoria_id as categoriaId, 
        t.descripcion, 
        t.estado, 
        t.prioridad, 
        t.sector_id as sectorId, 
        t.ubicacion_lat as ubicacionLat, 
        t.ubicacion_lng as ubicacionLng, 
        t.direccion_detallada as direccionDetallada, 
        t.fecha_creacion as fechaCreacion, 
        t.hora_creacion as horaCreacion, 
        t.fecha_actualizacion as fechaActualizacion,
        t.asignado_a as asignadoA,
        r.nombre as rep_nombre,
        r.cedula as rep_cedula,
        r.telefono as rep_telefono,
        r.email as rep_email,
        r.genero as rep_genero,
        r.edad as rep_edad,
        r.sector as rep_sector
      FROM tickets t
      LEFT JOIN reportantes r ON t.id = r.ticket_id
      ORDER BY t.fecha_actualizacion DESC
      LIMIT 1000
    `);

    if (!Array.isArray(rows)) return null;

    // Map rows to Ticket interface
    const tickets: Ticket[] = rows.map((row: any) => ({
      id: String(row.id || row.numeroRegistro),
      numeroRegistro: row.numeroRegistro || `TK-${row.id}`,
      asunto: row.asunto || 'Incidencia sin asunto',
      categoriaId: row.categoriaId || 'general',
      categoriaNombre: row.categoriaId || 'General',
      descripcion: row.descripcion || '',
      estado: row.estado || 'abierto',
      prioridad: row.prioridad || 'media',
      sectorId: row.sectorId || 'Sector General',
      sectorNombre: row.sectorId || 'Sector General',
      ubicacionLat: Number(row.ubicacionLat) || 9.08,
      ubicacionLng: Number(row.ubicacionLng) || -79.53,
      direccionDetallada: row.direccionDetallada || '',
      lugarRegistro: 'Base de Datos Central',
      canalIntake: 'Base de Datos MySQL',
      canalRadicacion: 'web_portal',
      fechaCreacion: row.fechaCreacion ? String(row.fechaCreacion).slice(0, 10) : '2026-08-29',
      horaCreacion: row.horaCreacion ? String(row.horaCreacion).slice(0, 8) : '12:00:00',
      fechaActualizacion: row.fechaActualizacion ? String(row.fechaActualizacion) : '2026-08-29 12:00:00',
      reportante: {
        nombre: row.rep_nombre || 'Ciudadano',
        cedula: row.rep_cedula || 'N/A',
        telefono: row.rep_telefono || '',
        email: row.rep_email || '',
        genero: row.rep_genero || 'otro',
        edad: Number(row.rep_edad) || 30,
        sector: row.rep_sector || row.sectorId || '',
      },
      adjuntos: [],
      trazabilidad: [
        {
          id: `tr-${row.id}-1`,
          ticketId: String(row.id),
          tipoEvento: 'creacion',
          fechaHora: row.fechaCreacion ? String(row.fechaCreacion) : '2026-08-29 12:00:00',
          responsable: 'Sistema MySQL',
          rolResponsable: 'Hostinger DB',
          nota: 'Ticket cargado desde la base de datos u483786231_ticket_db',
          estadoNuevo: row.estado || 'abierto',
        },
      ],
    }));

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

